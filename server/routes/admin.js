const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Company = require('../models/Company');
const { authenticateToken } = require('../middleware/auth');
const { 
  requireSuperAdmin, 
  requireAdmin, 
  canManageCompanies, 
  canManageAllUsers,
  canViewAnalytics,
  canManageSubscriptions,
  getAdminPermissions 
} = require('../middleware/adminAuth');
const dailyRefreshService = require('../services/dailyRefreshService');

const router = express.Router();

// Request logging middleware (disabled in production)
// router.use((req, res, next) => {
//   console.log('🔍 [ADMIN ROUTES] Request received:', {
//     url: req.url,
//     method: req.method,
//     path: req.path,
//     user: req.user ? {
//       id: req.user._id,
//       email: req.user.email,
//       role: req.user.role,
//       hasAdminAccess: req.user.hasAdminAccess()
//     } : 'No user object',
//     timestamp: new Date().toISOString()
//   });
//   next();
// });

// Add error handling middleware for all admin routes
router.use((error, req, res, next) => {
  console.error('❌ [ADMIN ROUTES] Unhandled error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    user: req.user ? {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    } : 'No user object'
  });
  
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate a secure temporary password
const generateTempPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Get admin dashboard data
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCompanies = await Company.countDocuments();
    const activeUsers = await User.countDocuments({ 'subscription.status': 'active' });
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('firstName lastName email role createdAt subscription.plan');

    const recentCompanies = await Company.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('admin', 'firstName lastName email')
      .select('name companyId admin createdAt subscription.plan');

    const subscriptionStats = await User.aggregate([
      {
        $group: {
          _id: '$subscription.plan',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      stats: {
        totalUsers,
        totalCompanies,
        activeUsers,
        subscriptionStats
      },
      recentUsers,
      recentCompanies
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get all companies (admin view)
router.get('/companies', authenticateToken, canManageCompanies, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { companyId: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const companies = await Company.find(query)
      .populate('admin', 'firstName lastName email')
      .populate('users', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Company.countDocuments(query);

    res.json({
      companies,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Create a new company (admin)
router.post('/companies', authenticateToken, canManageCompanies, [
  body('name').trim().notEmpty().withMessage('Company name is required'),
  body('adminEmail').isEmail().withMessage('Valid admin email is required'),
  body('adminPassword')
    .isLength({ min: 8, max: 64 }).withMessage('Password must be 8-64 characters long')
    .matches(/[a-z]/).withMessage('Password must include a lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must include an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must include a number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must include a special character')
    .not().matches(/\s/).withMessage('Password cannot contain spaces'),
  body('adminFirstName').trim().notEmpty().withMessage('Admin first name is required'),
  body('adminLastName').trim().notEmpty().withMessage('Admin last name is required'),
  body('description').optional().trim(),
  body('industry').optional().trim(),
  body('size').optional().isIn(['1-10', '11-50', '51-200', '201-500', '500+']),
  body('monthlyConversationLimit').optional().isInt({ min: 1, max: 10000 }).withMessage('Monthly conversation limit must be between 1 and 10000')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      name, 
      adminEmail, 
      adminPassword, 
      adminFirstName, 
      adminLastName, 
      description, 
      industry, 
      size,
      monthlyConversationLimit 
    } = req.body;

    // Check if admin email already exists (case-insensitive)
    const existingUser = await User.findByEmail(adminEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'Admin email already exists' });
    }

    // Create company with enterprise plan (admin-created companies)
    const company = new Company({
      name,
      description,
      industry,
      size,
      subscription: {
        plan: 'enterprise',
        status: 'active',
        maxUsers: -1, // Unlimited for enterprise
        monthlyConversationLimit: monthlyConversationLimit || 50 // Default to 50 if not specified
      }
    });

    await company.save();

    // Create admin user with company's monthly conversation limit
    const adminUser = new User({
      email: adminEmail,
      password: adminPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      companyId: company._id,
      role: 'company_admin',
      isCompanyAdmin: true,
      subscription: {
        plan: 'enterprise',
        status: 'active',
        stripeCustomerId: 'enterprise_customer',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      },
      usage: {
        aiConversations: 0,
        monthlyLimit: company.subscription.monthlyConversationLimit,
        dailyLimit: 50, // Daily limit for enterprise users
        lastResetDate: new Date(),
        lastDailyResetDate: new Date()
      }
    });

    await adminUser.save();

    // Set company admin
    company.admin = adminUser._id;
    await company.addUser(adminUser._id);
    await company.save();

    const populatedCompany = await Company.findById(company._id)
      .populate('admin', 'firstName lastName email')
      .populate('users', 'firstName lastName email role');

    res.status(201).json({
      message: 'Company and admin created successfully',
      company: populatedCompany
    });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// Get all users (admin view)
router.get('/users', authenticateToken, canManageAllUsers, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '', company = '' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      query.role = role;
    }
    if (company) {
      const companies = await Company.find({ 
        name: { $regex: company, $options: 'i' } 
      }).select('_id');
      query.companyId = { $in: companies.map(c => c._id) };
    }

    const users = await User.find(query)
      .populate('companyId', 'name companyId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password');

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user (admin only)
router.post('/users/create', authenticateToken, canManageAllUsers, [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password')
    .isLength({ min: 8, max: 64 }).withMessage('Password must be 8-64 characters long')
    .matches(/[a-z]/).withMessage('Password must include a lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must include an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must include a number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must include a special character')
    .not().matches(/\s/).withMessage('Password cannot contain spaces'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('role').isIn(['individual', 'company_user', 'company_team_leader', 'company_admin']).withMessage('Invalid role'),
  body('companyId').optional().isMongoId().withMessage('Invalid company ID'),
  body('teamId').optional().isString().withMessage('Invalid team ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, role, companyId, teamId } = req.body;

    // Normalize email for consistent storage
    const normalizedEmail = User.normalizeEmail(email);

    // Check if user already exists (case-insensitive)
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Validate company if provided
    if (companyId) {
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(400).json({ error: 'Company not found' });
      }
    }

    // Use the provided password for all users (company admins set temporary passwords)
    console.log('Using provided password for', email);
    
    // Get company's monthly conversation limit if user belongs to a company
    let companyMonthlyLimit = 50; // Default limit
    if (companyId) {
      const company = await Company.findById(companyId);
      if (company && company.subscription.monthlyConversationLimit) {
        companyMonthlyLimit = company.subscription.monthlyConversationLimit;
      }
    }
    
    // Create new user - use company subscription if they belong to a company
    let newUser;
    if (companyId) {
      // Get company to use its subscription settings
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }
      
      newUser = await User.createWithCompanySubscription({
        email: normalizedEmail,
        password: password, // Use the password provided by the admin
        firstName,
        lastName,
        role,
        companyId: companyId,
        companyJoinedAt: new Date(), // Set company join date if user belongs to company
        teamId: teamId || null,
        isCompanyAdmin: role === 'company_admin',
        isTeamLeader: role === 'company_team_leader',
        needsPasswordSetup: true, // Flag company users to set up their password on first login
        settings: {
          experienceLevel: 'beginner'
        }
      }, company);
    } else {
      // Create individual user with free plan
      newUser = new User({
        email: normalizedEmail,
        password: password,
        firstName,
        lastName,
        role,
        companyId: null,
        companyJoinedAt: null,
        teamId: null,
        isCompanyAdmin: false,
        isTeamLeader: false,
        needsPasswordSetup: false,
        subscription: {
          plan: 'free',
          status: 'active'
        },
        usage: {
          aiConversations: 0,
          monthlyLimit: 50,
          lastResetDate: new Date(),
          lastDailyResetDate: new Date()
        },
        settings: {
          experienceLevel: 'beginner'
        }
      });
      await newUser.save();
    }

    // Add user to company if specified
    if (companyId) {
      await Company.findByIdAndUpdate(companyId, {
        $addToSet: { users: newUser._id }
      });
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        companyId: newUser.companyId,
        teamId: newUser.teamId,
        isCompanyAdmin: newUser.isCompanyAdmin,
        isTeamLeader: newUser.isTeamLeader,
        subscription: newUser.subscription,
        usage: newUser.usage,
        settings: newUser.settings,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Create admin user (super admin only)
router.post('/admins', authenticateToken, requireSuperAdmin, [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8, max: 64 }).withMessage('Password must be 8-64 characters long')
    .matches(/[a-z]/).withMessage('Password must include a lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must include an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must include a number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must include a special character')
    .not().matches(/\s/).withMessage('Password cannot contain spaces'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('role').isIn(['admin', 'super_admin']).withMessage('Invalid admin role'),
  body('permissions').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, role, permissions = {} } = req.body;

    // Check if user already exists (case-insensitive)
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Create admin user
    const adminUser = new User({
      email,
      password,
      firstName,
      lastName,
      role,
      isSuperAdmin: role === 'super_admin',
      isAdmin: role === 'admin',
      adminPermissions: {
        canManageCompanies: permissions.canManageCompanies || false,
        canManageUsers: permissions.canManageUsers || false,
        canViewAnalytics: permissions.canViewAnalytics || false,
        canManageSubscriptions: permissions.canManageSubscriptions || false
      }
    });

    await adminUser.save();

    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: adminUser._id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: adminUser.role,
        isSuperAdmin: adminUser.isSuperAdmin,
        isAdmin: adminUser.isAdmin,
        adminPermissions: adminUser.adminPermissions
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Failed to create admin user' });
  }
});

// Update user role/permissions
router.put('/users/:userId', authenticateToken, canManageAllUsers, [
  body('role').optional().isIn(['individual', 'company_admin', 'company_team_leader', 'company_user', 'admin', 'super_admin']),
  body('adminPermissions').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { role, adminPermissions } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow non-super-admins to modify super-admins
    if (user.role === 'super_admin' && !req.user.isSuperAdminUser()) {
      return res.status(403).json({ error: 'Cannot modify super admin' });
    }

    const updateData = {};
    if (role) {
      updateData.role = role;
      updateData.isSuperAdmin = role === 'super_admin';
      updateData.isAdmin = role === 'admin';
      updateData.isCompanyAdmin = role === 'company_admin';
      updateData.isTeamLeader = role === 'company_team_leader';
    }
    if (adminPermissions) {
      updateData.adminPermissions = { ...user.adminPermissions, ...adminPermissions };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete company (super admin only)
router.delete('/companies/:companyId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Update all users in this company to individual
    await User.updateMany(
      { companyId: company._id },
      { 
        companyId: null,
        role: 'individual',
        isCompanyAdmin: false,
        isTeamLeader: false,
        teamId: null
      }
    );

    // Delete the company
    await Company.findByIdAndDelete(companyId);

    res.json({
      message: 'Company deleted successfully'
    });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

// Update company subscription plan
router.put('/companies/:companyId/subscription', authenticateToken, canManageCompanies, [
  body('plan').isIn(['free', 'basic', 'pro', 'unlimited', 'enterprise']).withMessage('Invalid plan'),
  body('status').optional().isIn(['active', 'inactive', 'cancelled', 'past_due']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { companyId } = req.params;
    const { plan, status = 'active' } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Update subscription
    company.subscription.plan = plan;
    company.subscription.status = status;
    
    // Set maxUsers based on plan
    if (plan === 'enterprise') {
      company.subscription.maxUsers = -1; // Unlimited
    } else if (plan === 'unlimited') {
      company.subscription.maxUsers = 500;
    } else if (plan === 'pro') {
      company.subscription.maxUsers = 100;
    } else if (plan === 'basic') {
      company.subscription.maxUsers = 25;
    } else {
      company.subscription.maxUsers = 5; // Free
    }

    await company.save();

    res.json({
      message: `Company subscription updated to ${plan}`,
      company: {
        id: company._id,
        name: company.name,
        subscription: company.subscription
      }
    });
  } catch (error) {
    console.error('Update company subscription error:', error);
    res.status(500).json({ error: 'Failed to update company subscription' });
  }
});

// Get admin permissions
router.get('/permissions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const permissions = getAdminPermissions(req.user);
    res.json({ permissions });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Failed to get permissions' });
  }
});

// Daily refresh service management endpoints
// Get daily refresh service status
router.get('/daily-refresh/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const status = dailyRefreshService.getStatus();
    res.json({ 
      success: true, 
      status,
      message: 'Daily refresh service status retrieved successfully'
    });
  } catch (error) {
    console.error('Get daily refresh status error:', error);
    res.status(500).json({ error: 'Failed to get daily refresh status' });
  }
});

// Manually trigger daily reset
router.post('/daily-refresh/reset', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await dailyRefreshService.manualReset();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Daily reset completed successfully',
        resetCount: result.resetCount,
        totalUsers: result.totalUsers
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Daily reset failed',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Manual daily reset error:', error);
    res.status(500).json({ error: 'Failed to trigger daily reset' });
  }
});

module.exports = router;
