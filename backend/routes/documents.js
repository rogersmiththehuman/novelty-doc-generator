const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const DocumentTemplate = require('../models/DocumentTemplate');
const Transaction = require('../models/Transaction');
const GeneratedDocument = require('../models/GeneratedDocument');
const User = require('../models/User');
const documentGenerator = require('../services/documentGenerator');
const path = require('path');

const router = express.Router();

// Generate document
router.post('/generate', [
  auth,
  body('transactionId').isMongoId(),
  body('formData').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { transactionId, formData } = req.body;

    // Verify transaction
    const transaction = await Transaction.findById(transactionId)
      .populate('documentTemplate');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (transaction.status !== 'confirmed') {
      return res.status(400).json({ message: 'Transaction not confirmed' });
    }

    // Check if document already generated
    const existingDoc = await GeneratedDocument.findOne({ transaction: transactionId });
    if (existingDoc) {
      return res.status(400).json({ message: 'Document already generated for this transaction' });
    }

    const template = transaction.documentTemplate;
    const formDataMap = new Map(Object.entries(formData));

    // Validate form data
    const validationErrors = documentGenerator.validateFormData(template, formDataMap);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Form validation failed',
        errors: validationErrors
      });
    }

    // Create generated document record
    const generatedDoc = new GeneratedDocument({
      user: req.user._id,
      template: template._id,
      transaction: transactionId,
      formData: formDataMap,
      status: 'generating'
    });

    await generatedDoc.save();

    // Generate document files
    try {
      const files = await documentGenerator.generateDocument(template, formDataMap, generatedDoc._id);
      
      generatedDoc.generatedFiles = {
        pdf: files.pdf,
        image: files.image
      };
      generatedDoc.status = 'completed';
      await generatedDoc.save();

      // Update template popularity
      template.popularity += 1;
      await template.save();

      // Update user statistics
      const user = await User.findById(req.user._id);
      user.documentsGenerated += 1;
      await user.save();

      res.json({
        message: 'Document generated successfully',
        document: {
          id: generatedDoc._id,
          status: generatedDoc.status,
          createdAt: generatedDoc.createdAt,
          expiresAt: generatedDoc.expiresAt
        }
      });
    } catch (error) {
      generatedDoc.status = 'failed';
      await generatedDoc.save();
      throw error;
    }
  } catch (error) {
    console.error('Generate document error:', error);
    res.status(500).json({ message: 'Document generation failed' });
  }
});

// Download document
router.get('/:documentId/download/:format', auth, async (req, res) => {
  try {
    const { documentId, format } = req.params;
    
    if (!['pdf', 'image'].includes(format)) {
      return res.status(400).json({ message: 'Invalid format. Use pdf or image' });
    }

    const document = await GeneratedDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (document.status !== 'completed') {
      return res.status(400).json({ message: 'Document not ready for download' });
    }

    if (document.isExpired()) {
      return res.status(410).json({ message: 'Document has expired' });
    }

    const filePath = document.generatedFiles[format];
    if (!filePath) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Update download statistics
    document.downloadCount += 1;
    document.lastDownloaded = new Date();
    await document.save();

    const fileName = path.basename(filePath);
    const contentType = format === 'pdf' ? 'application/pdf' : 'image/png';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ message: 'Download failed' });
  }
});

// Get document details
router.get('/:documentId', auth, async (req, res) => {
  try {
    const document = await GeneratedDocument.findById(req.params.documentId)
      .populate('template', 'name category')
      .populate('transaction', 'status amount cryptocurrency');
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ document });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Preview document (returns base64 encoded image)
router.get('/:documentId/preview', auth, async (req, res) => {
  try {
    const document = await GeneratedDocument.findById(req.params.documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (document.status !== 'completed') {
      return res.status(400).json({ message: 'Document not ready for preview' });
    }

    if (document.isExpired()) {
      return res.status(410).json({ message: 'Document has expired' });
    }

    const imagePath = document.generatedFiles.image;
    if (!imagePath) {
      return res.status(404).json({ message: 'Preview not available' });
    }

    res.sendFile(path.resolve(imagePath));
  } catch (error) {
    console.error('Preview document error:', error);
    res.status(500).json({ message: 'Preview failed' });
  }
});

module.exports = router;