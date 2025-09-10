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
  // Legacy company field (keep for backward compatibility)
  company: {
    type: String,
    trim: true
  },
  companyPermissions: {
    type: Boolean,
    default: false
  },
  // New company system
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null
  },
  role: {
    type: String,
    enum: ['individual', 'company_admin', 'company_team_leader', 'company_user', 'super_admin', 'admin'],
    default: 'individual'
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company.teams',
    default: null
  },
  isCompanyAdmin: {
    type: Boolean,
    default: false
  },
  isTeamLeader: {
    type: Boolean,
    default: false
  },
  isSuperAdmin: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  adminPermissions: {
    canManageCompanies: {
      type: Boolean,
      default: false
    },
    canManageUsers: {
      type: Boolean,
      default: false
    },
    canViewAnalytics: {
      type: Boolean,
      default: false
    },
    canManageSubscriptions: {
      type: Boolean,
      default: false
    }
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
      default: 50 // Free tier limit (matches subscription plans)
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
  // Check if within monthly limits
  const now = new Date();
  const lastReset = new Date(this.usage.lastResetDate);
  const isNewMonth = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
  
  // Don't save here - just check the condition
  const needsReset = isNewMonth;
  
  // Check if user has exceeded their limit
  if (this.usage.aiConversations >= this.usage.monthlyLimit) {
    return false;
  }
  
  // Check if subscription is active
  if (this.subscription.status === 'active') {
    return true;
  }
  
  // For free users, check if they're within free tier limits
  if (this.subscription.plan === 'free') {
    return this.usage.aiConversations < this.usage.monthlyLimit;
  }
  
  return false;
};

// Increment AI usage
userSchema.methods.incrementAIUsage = function() {
  // Check if we need to reset monthly usage
  const now = new Date();
  const lastReset = new Date(this.usage.lastResetDate);
  const isNewMonth = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
  
  if (isNewMonth) {
    this.usage.aiConversations = 0;
    this.usage.lastResetDate = now;
  }
  
  this.usage.aiConversations += 1;
  return this.save();
};

// Get subscription limits
userSchema.methods.getSubscriptionLimits = function() {
  const limits = {
    free: { conversations: 50, features: ['basic_ai'] },
    basic: { conversations: 200, features: ['basic_ai', 'tips_lessons'] },
    pro: { conversations: 500, features: ['basic_ai', 'tips_lessons', 'client_customization', 'summary_feedback'] },
    unlimited: { conversations: -1, features: ['basic_ai', 'tips_lessons', 'summary', 'client_customization', 'summary_feedback'] },
    enterprise: { conversations: -1, features: ['basic_ai', 'tips_lessons', 'summary', 'client_customization', 'summary_feedback', 'team_management'] }
  };
  
  return limits[this.subscription.plan] || limits.free;
};

// Get current usage status
userSchema.methods.getUsageStatus = function() {
  const limits = this.getSubscriptionLimits();
  const currentUsage = this.usage.aiConversations;
  const monthlyLimit = this.usage.monthlyLimit;
  
  return {
    currentUsage,
    monthlyLimit,
    remaining: monthlyLimit === -1 ? -1 : Math.max(0, monthlyLimit - currentUsage),
    usagePercentage: monthlyLimit > 0 ? Math.round((currentUsage / monthlyLimit) * 100) : 0,
    canUseAI: this.canUseAI(),
    plan: this.subscription.plan,
    status: this.subscription.status
  };
};

// Company management methods
userSchema.methods.isCompanyAdminUser = function() {
  return this.role === 'company_admin' || this.isCompanyAdmin;
};

userSchema.methods.isTeamLeaderUser = function() {
  return this.role === 'company_team_leader' || this.isTeamLeader;
};

userSchema.methods.canManageUsers = function() {
  return this.role === 'company_admin' || this.role === 'company_team_leader';
};

userSchema.methods.canCreateTeams = function() {
  return this.role === 'company_admin';
};

userSchema.methods.belongsToCompany = function() {
  return this.companyId !== null;
};

userSchema.methods.getCompanyRole = function() {
  if (this.role === 'individual') return 'individual';
  if (this.role === 'company_admin') return 'admin';
  if (this.role === 'company_team_leader') return 'team_leader';
  if (this.role === 'company_user') return 'user';
  return 'unknown';
};

// Admin management methods
userSchema.methods.isSuperAdminUser = function() {
  return this.role === 'super_admin' || this.isSuperAdmin;
};

userSchema.methods.isAdminUser = function() {
  return this.role === 'admin' || this.isAdmin || this.isSuperAdminUser();
};

userSchema.methods.canManageAllCompanies = function() {
  return this.isSuperAdminUser() || (this.isAdminUser() && this.adminPermissions.canManageCompanies);
};

userSchema.methods.canManageAllUsers = function() {
  return this.isSuperAdminUser() || (this.isAdminUser() && this.adminPermissions.canManageUsers);
};

userSchema.methods.canViewAllAnalytics = function() {
  return this.isSuperAdminUser() || (this.isAdminUser() && this.adminPermissions.canViewAnalytics);
};

userSchema.methods.canManageAllSubscriptions = function() {
  return this.isSuperAdminUser() || (this.isAdminUser() && this.adminPermissions.canManageSubscriptions);
};

userSchema.methods.hasAdminAccess = function() {
  return this.isSuperAdminUser() || this.isAdminUser();
};

module.exports = mongoose.model('User', userSchema); 