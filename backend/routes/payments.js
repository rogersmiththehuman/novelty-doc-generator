const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const DocumentTemplate = require('../models/DocumentTemplate');
const cryptoService = require('../services/cryptoService');

const router = express.Router();

// Create payment transaction
router.post('/create', [
  auth,
  body('templateId').isMongoId(),
  body('cryptocurrency').isIn(['bitcoin', 'monero'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { templateId, cryptocurrency } = req.body;

    // Get template and verify it exists
    const template = await DocumentTemplate.findById(templateId);
    if (!template || !template.isActive) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const user = await User.findById(req.user._id);
    const amount = template.pricing[cryptocurrency === 'bitcoin' ? 'btc' : 'xmr'];

    // Check if user has sufficient balance
    const userBalance = user.wallets[cryptocurrency].balance;
    if (userBalance < amount) {
      return res.status(400).json({ 
        message: 'Insufficient balance',
        required: amount,
        available: userBalance
      });
    }

    // Create transaction
    const transaction = new Transaction({
      user: user._id,
      documentTemplate: templateId,
      cryptocurrency,
      amount,
      fromAddress: user.wallets[cryptocurrency].address,
      toAddress: process.env[`${cryptocurrency.toUpperCase()}_MASTER_ADDRESS`] || 'master-wallet-address',
      status: 'pending'
    });

    await transaction.save();

    res.status(201).json({
      transaction: {
        id: transaction._id,
        amount,
        cryptocurrency,
        status: transaction.status,
        expiresAt: transaction.expiresAt
      }
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Process payment (simulate payment processing)
router.post('/:transactionId/process', [
  auth,
  body('txHash').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { transactionId } = req.params;
    const { txHash } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Transaction already processed' });
    }

    if (transaction.isExpired()) {
      transaction.status = 'cancelled';
      await transaction.save();
      return res.status(400).json({ message: 'Transaction expired' });
    }

    // Verify transaction based on cryptocurrency
    let verification;
    if (transaction.cryptocurrency === 'bitcoin') {
      verification = await cryptoService.checkBitcoinTransaction(
        transaction.fromAddress,
        transaction.amount,
        txHash
      );
    } else {
      verification = await cryptoService.checkMoneroTransaction(
        transaction.fromAddress,
        transaction.amount,
        txHash
      );
    }

    if (!verification.confirmed) {
      return res.status(400).json({ message: 'Transaction not confirmed' });
    }

    // Update transaction
    transaction.txHash = txHash;
    transaction.status = 'confirmed';
    transaction.confirmations = verification.confirmations;
    transaction.blockHeight = verification.blockHeight;
    transaction.confirmedAt = new Date();
    await transaction.save();

    // Update user balance and statistics
    const user = await User.findById(transaction.user);
    user.wallets[transaction.cryptocurrency].balance -= transaction.amount;
    user.totalSpent += transaction.amount;
    await user.save();

    // Send to master wallet
    try {
      if (transaction.cryptocurrency === 'bitcoin') {
        const decryptedKey = cryptoService.decrypt(user.wallets.bitcoin.privateKey);
        await cryptoService.sendBitcoinToMaster(transaction.amount, decryptedKey);
      } else {
        await cryptoService.sendMoneroToMaster(transaction.amount, user.wallets.monero.address);
      }
    } catch (sendError) {
      console.error('Master wallet send error:', sendError);
      // Transaction is still confirmed, but master transfer failed
    }

    res.json({
      message: 'Payment processed successfully',
      transaction: {
        id: transaction._id,
        status: transaction.status,
        txHash: transaction.txHash,
        confirmedAt: transaction.confirmedAt
      }
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get transaction status
router.get('/:transactionId', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId)
      .populate('documentTemplate', 'name category');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get crypto prices
router.get('/prices', async (req, res) => {
  try {
    const prices = await cryptoService.getCryptoPrices();
    res.json({ prices });
  } catch (error) {
    console.error('Get prices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fund wallet (mock endpoint for testing)
router.post('/fund', [
  auth,
  body('cryptocurrency').isIn(['bitcoin', 'monero']),
  body('amount').isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { cryptocurrency, amount } = req.body;
    
    const user = await User.findById(req.user._id);
    user.wallets[cryptocurrency].balance += parseFloat(amount);
    await user.save();

    res.json({
      message: 'Wallet funded successfully',
      newBalance: user.wallets[cryptocurrency].balance
    });
  } catch (error) {
    console.error('Fund wallet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;