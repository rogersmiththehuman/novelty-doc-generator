const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'number', 'date', 'select', 'image'],
    required: true
  },
  required: {
    type: Boolean,
    default: false
  },
  options: [String], // For select type fields
  validation: {
    minLength: Number,
    maxLength: Number,
    pattern: String
  },
  position: {
    x: Number,
    y: Number,
    width: Number,
    height: Number
  }
});

const documentTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: ['license', 'bill', 'certificate', 'identification', 'other']
  },
  description: String,
  templateImage: {
    type: String,
    required: true // Path to template background image
  },
  fields: [fieldSchema],
  pricing: {
    btc: {
      type: Number,
      required: true
    },
    xmr: {
      type: Number,
      required: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  popularity: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
documentTemplateSchema.index({ category: 1, isActive: 1 });
documentTemplateSchema.index({ popularity: -1 });

module.exports = mongoose.model('DocumentTemplate', documentTemplateSchema);