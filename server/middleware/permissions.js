const Company = require('../models/Company');
const User = require('../models/User');

// Check if user is company admin
const requireCompanyAdmin = async (req, res, next) => {
  try {
    // Allow super admins and company admins
    const allowedRoles = ['super_admin', 'company_admin'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Company admin access required',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }
    next();
  } catch (error) {
    console.error('Company admin check error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Check if user can manage users (admin or team leader)
const canManageUsers = async (req, res, next) => {
  try {
    if (!req.user.canManageUsers()) {
      return res.status(403).json({ 
        error: 'User management access required',
        requiredRoles: ['company_admin', 'company_team_leader'],
        userRole: req.user.role
      });
    }
    next();
  } catch (error) {
    console.error('User management check error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Check if user can create teams (admin only)
const canCreateTeams = async (req, res, next) => {
  try {
    if (!req.user.canCreateTeams()) {
      return res.status(403).json({ 
        error: 'Team creation access required',
        requiredRole: 'company_admin',
        userRole: req.user.role
      });
    }
    next();
  } catch (error) {
    console.error('Team creation check error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Check if user belongs to a company
const requireCompanyMember = async (req, res, next) => {
  try {
    if (!req.user.belongsToCompany()) {
      return res.status(403).json({ 
        error: 'Company membership required',
        userRole: req.user.role
      });
    }
    next();
  } catch (error) {
    console.error('Company membership check error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Check if user can access company data (must be in same company)
const requireSameCompany = async (req, res, next) => {
  try {
    if (!req.user.companyId) {
      return res.status(403).json({ error: 'Company membership required' });
    }

    // If accessing another user's data, check if they're in the same company
    const targetUserId = req.params.userId || req.body.userId;
    if (targetUserId) {
      const targetUser = await User.findById(targetUserId);
      if (!targetUser || !targetUser.companyId.equals(req.user.companyId)) {
        return res.status(403).json({ error: 'Access denied: Different company' });
      }
    }

    next();
  } catch (error) {
    console.error('Same company check error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Check if user can manage specific team
const canManageTeam = async (req, res, next) => {
  try {
    const teamName = req.params.teamName || req.body.teamName;
    
    if (!teamName) {
      return res.status(400).json({ error: 'Team name required' });
    }

    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const team = company.teams.find(t => t.name === teamName);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Company admin can manage any team
    if (req.user.role === 'company_admin') {
      return next();
    }

    // Team leader can only manage their own team
    if (req.user.role === 'company_team_leader' && team.teamLeader && team.teamLeader.equals(req.user._id)) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Team management access denied',
      requiredRoles: ['company_admin', 'team_leader_of_this_team'],
      userRole: req.user.role
    });
  } catch (error) {
    console.error('Team management check error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Check subscription limits
const checkSubscriptionLimits = async (req, res, next) => {
  try {
    if (!req.user.companyId) {
      return next(); // Individual users handled elsewhere
    }

    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check if company can add more users
    if (req.route.path.includes('/users') && req.method === 'POST') {
      if (!company.canAddUser()) {
        return res.status(400).json({ 
          error: 'Company user limit reached',
          currentUsers: company.users.length,
          maxUsers: company.subscription.maxUsers,
          plan: company.subscription.plan
        });
      }
    }

    next();
  } catch (error) {
    console.error('Subscription limits check error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Get user permissions for frontend
const getUserPermissions = (user) => {
  const permissions = {
    canCreateCompany: user.role === 'individual' && !user.companyId,
    canManageUsers: user.canManageUsers(),
    canCreateTeams: user.canCreateTeams(),
    canManageTeams: user.role === 'company_admin' || user.role === 'company_team_leader',
    canViewAnalytics: user.role === 'company_admin',
    canManageSubscription: user.role === 'company_admin',
    canInviteUsers: user.canManageUsers(),
    canRemoveUsers: user.role === 'company_admin',
    canSetTeamLeaders: user.role === 'company_admin',
    canViewAllTeams: user.role === 'company_admin',
    canViewOwnTeam: user.role === 'company_team_leader' || user.role === 'company_user',
    canAccessAI: true, // All users can access AI
    canViewCompanySettings: user.role === 'company_admin'
  };

  return permissions;
};

module.exports = {
  requireCompanyAdmin,
  canManageUsers,
  canCreateTeams,
  requireCompanyMember,
  requireSameCompany,
  canManageTeam,
  checkSubscriptionLimits,
  getUserPermissions
};
