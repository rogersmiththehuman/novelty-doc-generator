const mongoose = require('mongoose');

const generatedDocumentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentTemplate',
    required: true
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  formData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true
  },
  generatedFiles: {
    pdf: String, // File path
    image: String // File path
  },
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'generating'
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 30*24*60*60*1000) // 30 days from creation
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
generatedDocumentSchema.index({ user: 1, createdAt: -1 });
generatedDocumentSchema.index({ status: 1 });
generatedDocumentSchema.index({ expiresAt: 1 });

// Method to check if document is expired
generatedDocumentSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

module.exports = mongoose.model('GeneratedDocument', generatedDocumentSchema);