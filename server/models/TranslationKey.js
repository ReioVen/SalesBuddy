const mongoose = require('mongoose');

const translationKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['ui', 'summary', 'feedback', 'analysis', 'common']
  },
  description: {
    type: String,
    required: false
  },
  context: {
    type: String,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
translationKeySchema.index({ key: 1 });
translationKeySchema.index({ category: 1 });
translationKeySchema.index({ isActive: 1 });

module.exports = mongoose.model('TranslationKey', translationKeySchema);
