const puppeteer = require('puppeteer');
const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

class DocumentGenerator {
  constructor() {
    this.outputDir = process.env.UPLOAD_DIR || './uploads';
    this.templatesDir = path.join(__dirname, '../../templates');
  }

  async ensureDirectories() {
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'generated'), { recursive: true });
  }

  // Generate HTML content from template and data
  generateHTML(template, formData) {
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          background-image: url('${template.templateImage}');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          width: 8.5in;
          height: 11in;
          position: relative;
        }
        .field {
          position: absolute;
          font-size: 14px;
          color: #000;
        }
      </style>
    </head>
    <body>
    `;

    // Add each field to the HTML
    template.fields.forEach(field => {
      const value = formData.get(field.name) || '';
      const { x = 0, y = 0, width = 100, height = 20 } = field.position || {};
      
      html += `
        <div class="field" style="
          left: ${x}px;
          top: ${y}px;
          width: ${width}px;
          height: ${height}px;
          ${field.type === 'image' ? 'background-image: url(' + value + '); background-size: cover;' : ''}
        ">
          ${field.type !== 'image' ? this.escapeHtml(value) : ''}
        </div>
      `;
    });

    html += `
    </body>
    </html>
    `;

    return html;
  }

  // Generate PDF from template and form data
  async generatePDF(template, formData, outputFileName) {
    await this.ensureDirectories();
    
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setViewport({ width: 816, height: 1056 }); // 8.5" x 11" at 96 DPI
      
      const html = this.generateHTML(template, formData);
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfPath = path.join(this.outputDir, 'generated', outputFileName + '.pdf');
      await page.pdf({
        path: pdfPath,
        format: 'Letter',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
      });
      
      return pdfPath;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  // Generate image from template and form data
  async generateImage(template, formData, outputFileName) {
    await this.ensureDirectories();
    
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setViewport({ width: 816, height: 1056 });
      
      const html = this.generateHTML(template, formData);
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const imagePath = path.join(this.outputDir, 'generated', outputFileName + '.png');
      await page.screenshot({
        path: imagePath,
        fullPage: true,
        type: 'png'
      });
      
      return imagePath;
    } catch (error) {
      console.error('Image generation error:', error);
      throw new Error('Failed to generate image');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  // Generate both PDF and image
  async generateDocument(template, formData, documentId) {
    try {
      const fileName = `doc_${documentId}_${Date.now()}`;
      
      const [pdfPath, imagePath] = await Promise.all([
        this.generatePDF(template, formData, fileName),
        this.generateImage(template, formData, fileName)
      ]);

      return {
        pdf: pdfPath,
        image: imagePath
      };
    } catch (error) {
      console.error('Document generation error:', error);
      throw error;
    }
  }

  // Validate form data against template fields
  validateFormData(template, formData) {
    const errors = [];
    
    template.fields.forEach(field => {
      const value = formData.get(field.name);
      
      // Check required fields
      if (field.required && (!value || value.trim() === '')) {
        errors.push(`${field.label} is required`);
        return;
      }
      
      // Validate field types
      if (value && field.validation) {
        const { minLength, maxLength, pattern } = field.validation;
        
        if (minLength && value.length < minLength) {
          errors.push(`${field.label} must be at least ${minLength} characters`);
        }
        
        if (maxLength && value.length > maxLength) {
          errors.push(`${field.label} must not exceed ${maxLength} characters`);
        }
        
        if (pattern && !new RegExp(pattern).test(value)) {
          errors.push(`${field.label} format is invalid`);
        }
      }
      
      // Type-specific validation
      if (value && field.type === 'number' && isNaN(value)) {
        errors.push(`${field.label} must be a valid number`);
      }
      
      if (value && field.type === 'date') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors.push(`${field.label} must be a valid date`);
        }
      }
    });
    
    return errors;
  }

  // Clean up generated files after expiration
  async cleanupExpiredDocuments() {
    try {
      const generatedDir = path.join(this.outputDir, 'generated');
      const files = await fs.readdir(generatedDir);
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      for (const file of files) {
        const filePath = path.join(generatedDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.birthtime.getTime() < thirtyDaysAgo) {
          await fs.unlink(filePath);
          console.log(`Cleaned up expired file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  // Utility function to escape HTML
  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

module.exports = new DocumentGenerator();