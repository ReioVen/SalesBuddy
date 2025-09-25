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
  companyJoinedAt: {
    type: Date,
    default: null
  },
  // User language preference
  language: {
    type: String,
    enum: ['en', 'et', 'es', 'ru'],
    default: 'en'
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
      default: 'free',
      set: function(value) {
        // Normalize to lowercase
        return value ? value.toLowerCase() : 'free';
      }
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
      default: 3 // Free tier limit (matches subscription plans)
    },
    dailyLimit: {
      type: Number,
      default: 50 // Daily limit for enterprise users
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    },
    lastDailyResetDate: {
      type: Date,
      default: Date.now
    },
    // Summary generation tracking
    summariesGenerated: {
      type: Number,
      default: 0
    },
    summariesGeneratedToday: {
      type: Number,
      default: 0
    },
    lastSummaryResetDate: {
      type: Date,
      default: Date.now
    },
    // AI Tips usage tracking
    aiTipsUsed: {
      type: Number,
      default: 0
    },
    aiTipsUsedThisMonth: {
      type: Number,
      default: 0
    },
    lastAiTipsResetDate: {
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
  needsPasswordSetup: {
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

// Static method to find user by email (case-insensitive)
userSchema.statics.findByEmail = function(email) {
  // Normalize email for Gmail addresses (remove dots and convert to lowercase)
  const normalizedEmail = this.normalizeEmail(email);
  
  // Try the normalized email first
  return this.findOne({ email: normalizedEmail }).then(user => {
    if (user) {
      return user;
    }
    
    // If not found, try case-insensitive search as fallback
    return this.findOne({ email: { $regex: `^${email}$`, $options: 'i' } });
  });
};

// Email normalization helper for Gmail addresses
userSchema.statics.normalizeEmail = function(email) {
  if (!email) return '';
  
  let normalized = email.toLowerCase().trim();
  
  // Check if it's a Gmail address
  if (normalized.endsWith('@gmail.com')) {
    // Remove dots from the local part (before @)
    const [localPart, domain] = normalized.split('@');
    const normalizedLocal = localPart.replace(/\./g, '');
    normalized = `${normalizedLocal}@${domain}`;
  }
  
  return normalized;
};

// Comprehensive user lookup with multiple fallback methods
userSchema.statics.findUserByEmail = async function(email) {
  // Method 1: Normalized email
  const normalizedEmail = this.normalizeEmail(email);
  let user = await this.findOne({ email: normalizedEmail });
  if (user) {
    return user;
  }
  
  // Method 2: Case-insensitive exact match
  user = await this.findOne({ email: { $regex: `^${email}$`, $options: 'i' } });
  if (user) {
    return user;
  }
  
  // Method 3: Case-insensitive normalized match
  user = await this.findOne({ email: { $regex: `^${normalizedEmail}$`, $options: 'i' } });
  if (user) {
    return user;
  }
  
  // Method 4: For Gmail, try without dots
  if (email.toLowerCase().endsWith('@gmail.com')) {
    const [localPart, domain] = email.toLowerCase().split('@');
    const withoutDots = localPart.replace(/\./g, '');
    const gmailNormalized = `${withoutDots}@${domain}`;
    
    user = await this.findOne({ email: gmailNormalized });
    if (user) {
      return user;
    }
  }
  
  return null;
};

// Check if user has active subscription
userSchema.methods.hasActiveSubscription = function() {
  // Enterprise users are always considered to have active subscription if they have a company
  if (this.subscription.plan === 'enterprise' && this.companyId) {
    return true;
  }
  return this.subscription.status === 'active';
};

// Check if user can use AI (has active subscription or within free tier limits)
userSchema.methods.canUseAI = function() {
  const now = new Date();
  
  // For enterprise users, check monthly limits (always active if they have a company)
  if (this.subscription.plan === 'enterprise' && this.companyId) {
    const lastReset = new Date(this.usage.lastResetDate);
    const isNewMonth = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
    
    // If it's a new month, they can use AI (monthly limit will be reset)
    if (isNewMonth) {
      return true;
    }
    
    // Check if within monthly limit
    return this.usage.aiConversations < this.usage.monthlyLimit;
  }
  
  // For non-enterprise users, check monthly limits
  const lastReset = new Date(this.usage.lastResetDate);
  const isNewMonth = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
  
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
  const now = new Date();
  
  // For all users (including enterprise), check monthly reset
  const lastReset = new Date(this.usage.lastResetDate);
  const isNewMonth = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
  
  if (isNewMonth) {
    this.usage.aiConversations = 0;
    this.usage.lastResetDate = now;
  }
  
  this.usage.aiConversations += 1;
  return this.save();
};

// Check if user can generate a summary (based on subscription plan)
userSchema.methods.canGenerateSummary = function() {
  // Free plan users cannot generate summaries
  if (!this.canAccessSummaries()) {
    return false;
  }
  
  const now = new Date();
  const lastSummaryReset = new Date(this.usage.lastSummaryResetDate);
  
  // Check if it's a new day
  const isNewDay = now.getDate() !== lastSummaryReset.getDate() || 
                   now.getMonth() !== lastSummaryReset.getMonth() || 
                   now.getFullYear() !== lastSummaryReset.getFullYear();
  
  // If it's a new day, reset the daily count
  if (isNewDay) {
    this.usage.summariesGeneratedToday = 0;
    this.usage.lastSummaryResetDate = now;
    this.save(); // Save the reset
  }
  
  // Get subscription limits and check if user has reached the daily limit
  const limits = this.getSubscriptionLimits();
  const dailyLimit = limits.summaries || 0;
  
  return this.usage.summariesGeneratedToday < dailyLimit;
};

// Increment summary generation count
userSchema.methods.incrementSummaryUsage = function() {
  const now = new Date();
  const lastSummaryReset = new Date(this.usage.lastSummaryResetDate);
  
  // Check if it's a new day
  const isNewDay = now.getDate() !== lastSummaryReset.getDate() || 
                   now.getMonth() !== lastSummaryReset.getMonth() || 
                   now.getFullYear() !== lastSummaryReset.getFullYear();
  
  // If it's a new day, reset the daily count
  if (isNewDay) {
    this.usage.summariesGeneratedToday = 0;
    this.usage.lastSummaryResetDate = now;
  }
  
  // Increment both total and daily counts
  this.usage.summariesGenerated += 1;
  this.usage.summariesGeneratedToday += 1;
  
  return this.save();
};

// Check if user can use AI Tips
userSchema.methods.canUseAiTips = function() {
  const now = new Date();
  const lastReset = new Date(this.usage.lastAiTipsResetDate);
  
  // Check if it's a new month
  const isNewMonth = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
  
  // If it's a new month, reset the monthly count
  if (isNewMonth) {
    this.usage.aiTipsUsedThisMonth = 0;
    this.usage.lastAiTipsResetDate = now;
    this.save(); // Save the reset
  }
  
  // Get subscription limits
  const limits = this.getSubscriptionLimits();
  const aiTipsLimit = limits.aiTips;
  
  // Check if user has reached the monthly limit
  return this.usage.aiTipsUsedThisMonth < aiTipsLimit;
};

// Increment AI Tips usage
userSchema.methods.incrementAiTipsUsage = function() {
  const now = new Date();
  const lastReset = new Date(this.usage.lastAiTipsResetDate);
  
  // Check if it's a new month
  const isNewMonth = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
  
  // If it's a new month, reset the monthly count
  if (isNewMonth) {
    this.usage.aiTipsUsedThisMonth = 0;
    this.usage.lastAiTipsResetDate = now;
  }
  
  // Increment both total and monthly counts
  this.usage.aiTipsUsed += 1;
  this.usage.aiTipsUsedThisMonth += 1;
  
  return this.save();
};

// Get AI Tips usage status
userSchema.methods.getAiTipsUsageStatus = function() {
  const now = new Date();
  const lastReset = new Date(this.usage.lastAiTipsResetDate);
  
  // Check if it's a new month
  const isNewMonth = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
  
  // If it's a new month, reset the monthly count
  if (isNewMonth) {
    this.usage.aiTipsUsedThisMonth = 0;
    this.usage.lastAiTipsResetDate = now;
    this.save(); // Save the reset
  }
  
  const limits = this.getSubscriptionLimits();
  const aiTipsLimit = limits.aiTips;
  
  return {
    aiTipsUsedThisMonth: this.usage.aiTipsUsedThisMonth,
    totalAiTipsUsed: this.usage.aiTipsUsed,
    monthlyLimit: aiTipsLimit,
    remainingThisMonth: Math.max(0, aiTipsLimit - this.usage.aiTipsUsedThisMonth),
    canUseAiTips: this.canUseAiTips(),
    plan: this.subscription.plan
  };
};

// Check if user can access summaries (not free plan)
userSchema.methods.canAccessSummaries = function() {
  return this.subscription.plan !== 'free';
};

// Get summary generation status
userSchema.methods.getSummaryStatus = function() {
  const now = new Date();
  const lastSummaryReset = new Date(this.usage.lastSummaryResetDate);
  
  // Check if it's a new day
  const isNewDay = now.getDate() !== lastSummaryReset.getDate() || 
                   now.getMonth() !== lastSummaryReset.getMonth() || 
                   now.getFullYear() !== lastSummaryReset.getFullYear();
  
  // If it's a new day, reset the daily count
  if (isNewDay) {
    this.usage.summariesGeneratedToday = 0;
    this.usage.lastSummaryResetDate = now;
    this.save(); // Save the reset
  }
  
  const limits = this.getSubscriptionLimits();
  const dailyLimit = limits.summaries || 5; // Default to 5 if not specified in plan
  
  return {
    summariesGeneratedToday: this.usage.summariesGeneratedToday,
    totalSummariesGenerated: this.usage.summariesGenerated,
    dailyLimit: dailyLimit,
    remainingToday: Math.max(0, dailyLimit - this.usage.summariesGeneratedToday),
    canGenerate: this.canGenerateSummary()
  };
};

// Get subscription limits
userSchema.methods.getSubscriptionLimits = function() {
  const limits = {
    free: { conversations: 3, aiTips: 0, summaries: 0, features: ['basic_ai'], period: 'monthly' },
    basic: { conversations: 30, aiTips: 10, summaries: 0, features: ['basic_ai', 'tips_lessons'], period: 'monthly' },
    pro: { conversations: 50, aiTips: 25, summaries: 5, features: ['basic_ai', 'tips_lessons', 'summary', 'client_customization', 'summary_feedback'], period: 'monthly' },
    unlimited: { conversations: 200, aiTips: 50, summaries: 10, features: ['basic_ai', 'tips_lessons', 'summary', 'client_customization', 'summary_feedback'], period: 'monthly' },
    enterprise: { conversations: 50, aiTips: 50, summaries: 5, features: ['basic_ai', 'tips_lessons', 'summary', 'client_customization', 'summary_feedback', 'team_management', 'leaderboard', 'sso_integration', 'custom_branding', 'advanced_analytics', 'api_access', 'dedicated_support'], period: 'monthly' }
  };
  
  return limits[this.subscription.plan] || limits.free;
};

// Get current usage status
userSchema.methods.getUsageStatus = function() {
  const limits = this.getSubscriptionLimits();
  const currentUsage = this.usage.aiConversations;
  
  // For all users (including enterprise), use monthly limits
  let limit = this.usage.monthlyLimit;
  let period = 'monthly';
  
  return {
    currentUsage,
    limit,
    period,
    remaining: limit === -1 ? -1 : Math.max(0, limit - currentUsage),
    usagePercentage: limit > 0 ? Math.round((currentUsage / limit) * 100) : 0,
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

userSchema.methods.canCreateTeams = function() {
  return this.role === 'company_admin' || this.isCompanyAdmin;
};

userSchema.methods.canManageOwnTeam = function() {
  return this.role === 'company_admin' || this.role === 'company_team_leader';
};

userSchema.methods.canCreateTeamLeaders = function() {
  return this.role === 'company_admin' || this.isCompanyAdmin;
};

// Check if user can manage users in their company
userSchema.methods.canManageUsers = function() {
  return this.role === 'company_admin' || this.isCompanyAdmin || this.role === 'company_team_leader' || this.isTeamLeader;
};

// Check if user can edit/delete a specific user
userSchema.methods.canEditUser = function(targetUser) {
  // Only company admins can edit users
  if (!(this.role === 'company_admin' || this.isCompanyAdmin)) {
    return false;
  }
  
  // Company admins can edit any user in their company
  return targetUser.companyId && targetUser.companyId.equals(this.companyId);
};

// Check if user can delete a specific user
userSchema.methods.canDeleteUser = function(targetUser) {
  // Only company admins can delete users
  if (!(this.role === 'company_admin' || this.isCompanyAdmin)) {
    return false;
  }
  
  // Company admins can delete any user in their company
  return targetUser.companyId && targetUser.companyId.equals(this.companyId);
};

// Check if user can manage team members (only team leaders can manage regular users in their team)
userSchema.methods.canManageTeamMembers = function(targetUser) {
  // Team leaders can only manage regular company users in their own team
  if (this.role === 'company_team_leader') {
    return targetUser.role === 'company_user' && 
           targetUser.teamId && 
           targetUser.teamId.equals(this.teamId);
  }
  
  // Company admins can manage all users in their company
  if (this.role === 'company_admin' || this.isCompanyAdmin) {
    return targetUser.companyId && targetUser.companyId.equals(this.companyId);
  }
  
  return false;
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

// Check if enterprise subscription is properly set up (paid by company)
userSchema.methods.isEnterpriseSubscriptionValid = function() {
  if (this.subscription.plan !== 'enterprise') {
    return false;
  }
  
  // Enterprise users are valid if they belong to a company (company pays for them)
  return this.companyId !== null && this.companyId !== undefined;
};

// Sync subscription with company (for company users)
userSchema.methods.syncWithCompanySubscription = async function() {
  if (!this.companyId) {
    return false; // Not a company user
  }

  const Company = require('./Company');
  const company = await Company.findById(this.companyId);
  
  if (!company) {
    console.warn(`Company not found for user ${this.email}`);
    return false;
  }

  // Update subscription to enterprise if company has enterprise plan
  if (company.subscription.plan === 'enterprise') {
    this.subscription = {
      plan: 'enterprise',
      status: 'active',
      stripeCustomerId: 'enterprise_customer',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      cancelAtPeriodEnd: false
    };

    // Update monthly limit based on company's setting
    if (company.subscription.monthlyConversationLimit) {
      this.usage.monthlyLimit = company.subscription.monthlyConversationLimit;
    }

    await this.save();
    return true;
  }

  return false;
};

// Static method to sync all company users with their company subscriptions
userSchema.statics.syncAllCompanyUsers = async function() {
  const Company = require('./Company');
  
  const companyUsers = await this.find({
    companyId: { $exists: true, $ne: null }
  });

  let syncedCount = 0;
  for (const user of companyUsers) {
    if (await user.syncWithCompanySubscription()) {
      syncedCount++;
    }
  }

  return syncedCount;
};

module.exports = mongoose.model('User', userSchema); 