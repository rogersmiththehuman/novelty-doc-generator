const express = require('express');
const { body, validationResult } = require('express-validator');
const DocumentTemplate = require('../models/DocumentTemplate');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all active templates
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const filter = { isActive: true };
    if (category) {
      filter.category = category;
    }

    const templates = await DocumentTemplate.find(filter)
      .select('-fields') // Don't include fields in list view for performance
      .sort({ popularity: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await DocumentTemplate.countDocuments(filter);

    res.json({
      templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get template by ID
router.get('/:id', async (req, res) => {
  try {
    const template = await DocumentTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    if (!template.isActive) {
      return res.status(404).json({ message: 'Template not available' });
    }

    res.json({ template });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get template categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await DocumentTemplate.distinct('category', { isActive: true });
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new template (admin only - for now, simplified)
router.post('/', [
  auth,
  body('name').notEmpty().trim().escape(),
  body('category').isIn(['license', 'bill', 'certificate', 'identification', 'other']),
  body('templateImage').notEmpty(),
  body('fields').isArray(),
  body('pricing.btc').isNumeric(),
  body('pricing.xmr').isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const template = new DocumentTemplate({
      ...req.body,
      createdBy: req.user._id
    });

    await template.save();

    res.status(201).json({ template });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update template popularity (when document is generated)
router.patch('/:id/popularity', async (req, res) => {
  try {
    const template = await DocumentTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    template.popularity += 1;
    await template.save();

    res.json({ message: 'Popularity updated' });
  } catch (error) {
    console.error('Update popularity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;