const mongoose = require('mongoose');

const enterpriseRequestSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  jobTitle: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
    required: true
  },
  industry: {
    type: String,
    required: true,
    trim: true
  },
  useCase: {
    type: String,
    required: true,
    trim: true
  },
  expectedUsers: {
    type: Number,
    required: true,
    min: 1
  },
  budget: {
    type: String,
    enum: ['$500-$1000', '$1000-$2500', '$2500-$5000', '$5000+'],
    required: true
  },
  timeline: {
    type: String,
    enum: ['Immediate', '1-2 weeks', '1 month', '2-3 months', '3+ months'],
    required: true
  },
  additionalInfo: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'qualified', 'closed'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
enterpriseRequestSchema.index({ email: 1 });
enterpriseRequestSchema.index({ company: 1 });
enterpriseRequestSchema.index({ status: 1 });
enterpriseRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('EnterpriseRequest', enterpriseRequestSchema); 