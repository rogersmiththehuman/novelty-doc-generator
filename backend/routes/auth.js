const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, auth } = require('../middleware/auth');
const cryptoService = require('../services/cryptoService');

const router = express.Router();

// Register
router.post('/register', [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    // Generate crypto wallets
    const bitcoinWallet = await cryptoService.generateBitcoinWallet();
    const moneroWallet = await cryptoService.generateMoneroWallet();

    // Create new user
    const user = new User({
      username,
      email,
      password,
      wallets: {
        bitcoin: {
          address: bitcoinWallet.address,
          privateKey: bitcoinWallet.encryptedPrivateKey,
          balance: 0
        },
        monero: {
          address: moneroWallet.address,
          viewKey: moneroWallet.encryptedViewKey,
          balance: 0
        }
      }
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        wallets: {
          bitcoin: { address: user.wallets.bitcoin.address, balance: 0 },
          monero: { address: user.wallets.monero.address, balance: 0 }
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        wallets: {
          bitcoin: { address: user.wallets.bitcoin.address, balance: user.wallets.bitcoin.balance },
          monero: { address: user.wallets.monero.address, balance: user.wallets.monero.balance }
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;