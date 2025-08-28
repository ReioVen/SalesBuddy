const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
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
  company: {
    type: String,
    trim: true
  },
  companyPermissions: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['individual', 'company_admin', 'company_user'],
    default: 'individual'
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'unlimited', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'past_due'],
      default: 'inactive'
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    }
  },
  usage: {
    aiConversations: {
      type: Number,
      default: 0
    },
    monthlyLimit: {
      type: Number,
      default: 10 // Free tier limit
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  },
  settings: {
    industry: String,
    salesRole: String,
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if user has active subscription
userSchema.methods.hasActiveSubscription = function() {
  return this.subscription.status === 'active';
};

// Check if user can use AI (has active subscription or within free tier limits)
userSchema.methods.canUseAI = function() {
  if (this.hasActiveSubscription()) return true;
  
  // Check if within free tier limits
  const now = new Date();
  const lastReset = new Date(this.usage.lastResetDate);
  const isNewMonth = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
  
  if (isNewMonth) {
    this.usage.aiConversations = 0;
    this.usage.lastResetDate = now;
    this.save();
  }
  
  return this.usage.aiConversations < this.usage.monthlyLimit;
};

// Increment AI usage
userSchema.methods.incrementAIUsage = function() {
  this.usage.aiConversations += 1;
  return this.save();
};

// Get subscription limits
userSchema.methods.getSubscriptionLimits = function() {
  const limits = {
    free: { conversations: 10, features: ['basic_ai'] },
    basic: { conversations: 200, features: ['basic_ai', 'tips_lessons'] },
    pro: { conversations: 500, features: ['basic_ai', 'tips_lessons', 'client_customization', 'summary_feedback'] },
    unlimited: { conversations: -1, features: ['basic_ai', 'tips_lessons', 'summary', 'client_customization', 'summary_feedback'] },
    enterprise: { conversations: -1, features: ['basic_ai', 'tips_lessons', 'summary', 'client_customization', 'summary_feedback', 'team_management'] }
  };
  
  return limits[this.subscription.plan] || limits.free;
};

module.exports = mongoose.model('User', userSchema); 