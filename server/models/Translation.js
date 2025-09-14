const mongoose = require('mongoose');

const translationSchema = new mongoose.Schema({
  translationKey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TranslationKey',
    required: true
  },
  language: {
    type: String,
    required: true,
    enum: ['en', 'et', 'lv', 'lt', 'fi', 'sv', 'no', 'da']
  },
  text: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
translationSchema.index({ translationKey: 1, language: 1 }, { unique: true });
translationSchema.index({ language: 1, isActive: 1 });

module.exports = mongoose.model('Translation', translationSchema);
