const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const GeneratedDocument = require('../models/GeneratedDocument');

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', [
  auth,
  body('firstName').optional().trim().escape(),
  body('lastName').optional().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName } = req.body;
    
    const user = await User.findById(req.user._id);
    if (firstName !== undefined) user.profile.firstName = firstName;
    if (lastName !== undefined) user.profile.lastName = lastName;
    
    await user.save();
    
    res.json({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user transaction history
router.get('/transactions', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ user: req.user._id })
      .populate('documentTemplate', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({ user: req.user._id });

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user generated documents
router.get('/documents', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const documents = await GeneratedDocument.find({ user: req.user._id })
      .populate('template', 'name category')
      .populate('transaction', 'status amount cryptocurrency')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await GeneratedDocument.countDocuments({ user: req.user._id });

    res.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get wallet balances
router.get('/wallet/balances', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      bitcoin: {
        address: user.wallets.bitcoin.address,
        balance: user.wallets.bitcoin.balance
      },
      monero: {
        address: user.wallets.monero.address,
        balance: user.wallets.monero.balance
      }
    });
  } catch (error) {
    console.error('Get wallet balances error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;