const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentTemplate',
    required: true
  },
  generatedDocument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GeneratedDocument'
  },
  cryptocurrency: {
    type: String,
    enum: ['bitcoin', 'monero'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  txHash: {
    type: String,
    unique: true,
    sparse: true // Allows null values but enforces uniqueness when present
  },
  fromAddress: {
    type: String,
    required: true
  },
  toAddress: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'cancelled'],
    default: 'pending'
  },
  confirmations: {
    type: Number,
    default: 0
  },
  requiredConfirmations: {
    type: Number,
    default: 1 // Bitcoin: 1, Monero: 1
  },
  blockHeight: Number,
  fee: Number,
  createdAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 30*60*1000) // 30 minutes from creation
  }
}, {
  timestamps: true
});

// Index for efficient querying
transactionSchema.index({ user: 1, status: 1 });
transactionSchema.index({ txHash: 1 });
transactionSchema.index({ status: 1, expiresAt: 1 });
transactionSchema.index({ createdAt: -1 });

// Method to check if transaction is expired
transactionSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt && this.status === 'pending';
};

module.exports = mongoose.model('Transaction', transactionSchema);