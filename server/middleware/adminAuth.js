const User = require('../models/User');
const Company = require('../models/Company');

// Check if user is super admin
const requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user.isSuperAdminUser()) {
      return res.status(403).json({ 
        error: 'Super admin access required',
        requiredRole: 'super_admin',
        userRole: req.user.role
      });
    }
    next();
  } catch (error) {
    console.error('Super admin check error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Check if user has admin access (admin or super admin)
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user.hasAdminAccess()) {
      console.log('❌ [REQUIRE ADMIN] Access denied:', {
        userRole: req.user.role,
        isSuperAdmin: req.user.isSuperAdmin,
        isAdmin: req.user.isAdmin
      });
      return res.status(403).json({ 
        error: 'Admin access required',
        requiredRoles: ['admin', 'super_admin'],
        userRole: req.user.role
      });
    }
    
    next();
  } catch (error) {
    console.error('❌ [ADMIN] Admin check error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Check if user can manage companies
const canManageCompanies = async (req, res, next) => {
  try {
    if (!req.user.canManageAllCompanies()) {
      return res.status(403).json({ 
        error: 'Company management access required',
        userRole: req.user.role
      });
    }
    next();
  } catch (error) {
    console.error('Company management check error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Check if user can manage all users
const canManageAllUsers = async (req, res, next) => {
  try {
    if (!req.user.canManageAllUsers()) {
      return res.status(403).json({ 
        error: 'User management access required',
        userRole: req.user.role
      });
    }
    next();
  } catch (error) {
    console.error('User management check error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Check if user can view analytics
const canViewAnalytics = async (req, res, next) => {
  try {
    if (!req.user.canViewAllAnalytics()) {
      return res.status(403).json({ 
        error: 'Analytics access required',
        userRole: req.user.role
      });
    }
    next();
  } catch (error) {
    console.error('Analytics check error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Check if user can manage subscriptions
const canManageSubscriptions = async (req, res, next) => {
  try {
    if (!req.user.canManageAllSubscriptions()) {
      return res.status(403).json({ 
        error: 'Subscription management access required',
        userRole: req.user.role
      });
    }
    next();
  } catch (error) {
    console.error('Subscription management check error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Get admin permissions for frontend
const getAdminPermissions = (user) => {
  const permissions = {
    isSuperAdmin: user.isSuperAdminUser(),
    isAdmin: user.isAdminUser(),
    canManageCompanies: user.canManageAllCompanies(),
    canManageUsers: user.canManageAllUsers(),
    canViewAnalytics: user.canViewAllAnalytics(),
    canManageSubscriptions: user.canManageAllSubscriptions(),
    canCreateAdmins: user.isSuperAdminUser(),
    canDeleteCompanies: user.isSuperAdminUser(),
    canDeleteUsers: user.isSuperAdminUser(),
    canViewAllData: user.isSuperAdminUser()
  };

  return permissions;
};

module.exports = {
  requireSuperAdmin,
  requireAdmin,
  canManageCompanies,
  canManageAllUsers,
  canViewAnalytics,
  canManageSubscriptions,
  getAdminPermissions
};
