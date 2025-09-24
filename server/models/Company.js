const mongoose = require('mongoose');
const User = require('./User');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  teamLeader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  companyId: {
    type: String,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
    default: '1-10'
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  teams: [teamSchema],
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
    },
    maxUsers: {
      type: Number,
      default: 5 // Free tier limit
    },
    monthlyConversationLimit: {
      type: Number,
      default: 50 // Default monthly conversation limit for company users
    }
  },
  settings: {
    allowUserRegistration: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    defaultRole: {
      type: String,
      enum: ['company_user', 'company_team_leader'],
      default: 'company_user'
    }
  },
  isActive: {
    type: Boolean,
    default: true
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

// Generate unique company ID
companySchema.pre('save', async function(next) {
  if (!this.companyId) {
    // Generate a unique company ID based on name and timestamp
    const baseId = this.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.random().toString(36).substring(2, 5);
    this.companyId = `${baseId}${timestamp}${randomSuffix}`;
    
    // Ensure uniqueness by checking if this companyId already exists
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      const existingCompany = await this.constructor.findOne({ companyId: this.companyId });
      if (!existingCompany) {
        isUnique = true;
      } else {
        // If not unique, generate a new one
        this.companyId = `${baseId}${timestamp}${Math.random().toString(36).substring(2, 5)}`;
        attempts++;
      }
    }
  }
  next();
});

// Add user to company
companySchema.methods.addUser = function(userId) {
  if (!this.users.includes(userId)) {
    this.users.push(userId);
  }
  return this.save();
};

// Remove user from company
companySchema.methods.removeUser = function(userId) {
  this.users = this.users.filter(id => !id.equals(userId));
  // Remove user from all teams
  this.teams.forEach(team => {
    team.members = team.members.filter(id => !id.equals(userId));
    if (team.teamLeader && team.teamLeader.equals(userId)) {
      team.teamLeader = null;
    }
  });
  return this.save();
};

// Create team
companySchema.methods.createTeam = function(teamData) {
  const team = {
    name: teamData.name,
    description: teamData.description,
    members: teamData.members || [],
    teamLeader: teamData.teamLeader || null
  };
  this.teams.push(team);
  return this.save();
};

// Add user to team
companySchema.methods.addUserToTeam = function(userId, teamName) {
  const team = this.teams.find(t => t.name === teamName);
  if (team && !team.members.includes(userId)) {
    team.members.push(userId);
  }
  return this.save();
};

// Remove user from team
companySchema.methods.removeUserFromTeam = function(userId, teamName) {
  const team = this.teams.find(t => t.name === teamName);
  if (team) {
    team.members = team.members.filter(id => !id.equals(userId));
    if (team.teamLeader && team.teamLeader.equals(userId)) {
      team.teamLeader = null;
    }
  }
  return this.save();
};

// Set team leader
companySchema.methods.setTeamLeader = function(userId, teamName) {
  const team = this.teams.find(t => t.name === teamName);
  if (team) {
    team.teamLeader = userId;
    // Add user to team if not already a member
    if (!team.members.includes(userId)) {
      team.members.push(userId);
    }
  }
  return this.save();
};

// Check if company can add more users (excluding super admins from count)
companySchema.methods.canAddUser = async function() {
  // Count only non-super-admin users
  const nonSuperAdminCount = await User.countDocuments({
    companyId: this._id,
    role: { $ne: 'super_admin' },
    isSuperAdmin: { $ne: true }
  });
  return nonSuperAdminCount < this.subscription.maxUsers;
};

// Get subscription limits
companySchema.methods.getSubscriptionLimits = function() {
  const limits = {
    free: { maxUsers: 5, aiTips: 0, features: ['basic_ai'] },
    basic: { maxUsers: 25, aiTips: 10, features: ['basic_ai', 'tips_lessons'] },
    pro: { maxUsers: 100, aiTips: 25, features: ['basic_ai', 'tips_lessons', 'summary', 'client_customization', 'summary_feedback'] },
    unlimited: { maxUsers: 500, aiTips: 50, features: ['basic_ai', 'tips_lessons', 'summary', 'client_customization', 'summary_feedback'] },
    enterprise: { maxUsers: -1, aiTips: 50, features: ['basic_ai', 'tips_lessons', 'summary', 'client_customization', 'summary_feedback', 'team_management', 'leaderboard', 'sso_integration', 'custom_branding', 'advanced_analytics', 'api_access', 'dedicated_support'] }
  };
  
  return limits[this.subscription.plan] || limits.free;
};

module.exports = mongoose.model('Company', companySchema);
