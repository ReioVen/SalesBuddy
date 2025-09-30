const express = require('express');
const { body, validationResult } = require('express-validator');
const Company = require('../models/Company');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const ConversationSummary = require('../models/ConversationSummary');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate a secure temporary password
const generateTempPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Middleware to check if user is company admin
const requireCompanyAdmin = async (req, res, next) => {
  try {
    if (!(req.user.role === 'company_admin' || req.user.isCompanyAdmin)) {
      return res.status(403).json({ error: 'Company admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Middleware to check if user can manage users (admin or team leader)
const canManageUsers = async (req, res, next) => {
  try {
    if (!req.user.canManageUsers()) {
      return res.status(403).json({ error: 'User management access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Create a new company (admin only)
router.post('/create', authenticateToken, [
  body('name').trim().notEmpty().withMessage('Company name is required'),
  body('description').optional().trim(),
  body('industry').optional().trim(),
  body('size').optional().isIn(['1-10', '11-50', '51-200', '201-500', '500+']),
  body('maxUsers').optional().isInt({ min: 1, max: 10000 }).withMessage('Max users must be between 1 and 10000'),
  body('monthlyConversationLimit').optional().isInt({ min: 1, max: 10000 }).withMessage('Monthly conversation limit must be between 1 and 10000')
], async (req, res) => {
  try {
    // Only allow super admins to create companies
    if (!req.user.isSuperAdminUser()) {
      return res.status(403).json({ 
        error: 'Only admin accounts can create companies',
        requiredRole: 'super_admin',
        userRole: req.user.role
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, industry, size, maxUsers, monthlyConversationLimit } = req.body;

    // Create company (only super admins can reach this point)
    const company = new Company({
      name,
      description,
      industry,
      size,
      admin: req.user._id,
      subscription: {
        plan: 'enterprise',
        status: 'active',
        maxUsers: maxUsers || -1, // Unlimited for enterprise
        monthlyConversationLimit: monthlyConversationLimit || 50 // Default to 50 if not specified
      }
    });

    await company.save();

    // Super admins remain as super admins, just add them to the company users list
    await company.addUser(req.user._id);

    res.status(201).json({
      message: 'Company created successfully',
      company: {
        id: company._id,
        name: company.name,
        companyId: company.companyId,
        description: company.description,
        industry: company.industry,
        size: company.size,
        admin: company.admin,
        users: company.users,
        teams: company.teams,
        subscription: company.subscription,
        settings: company.settings,
        createdAt: company.createdAt
      }
    });
  } catch (error) {
    console.error('Company creation error:', error);
    res.status(500).json({ error: 'Company creation failed' });
  }
});

// Get company details (current user's company or all companies for super admin)
router.get('/details', authenticateToken, async (req, res) => {
  try {
    // If user is super admin, return all companies
    if (req.user.isSuperAdminUser()) {
    const companies = await Company.find({})
      .populate('admin', 'firstName lastName email')
      .populate({
        path: 'users',
        select: 'firstName lastName email role teamId isTeamLeader isCompanyAdmin isAdmin isSuperAdmin createdAt companyJoinedAt',
        match: { role: { $ne: 'super_admin' }, isSuperAdmin: { $ne: true } }
      })
      .populate('teams.members', 'firstName lastName email')
      .populate('teams.teamLeader', 'firstName lastName email')
      .sort({ createdAt: -1 });

      return res.json({
        companies: companies.map(company => ({
          id: company._id,
          name: company.name,
          companyId: company.companyId,
          description: company.description,
          industry: company.industry,
          size: company.size,
          admin: company.admin,
          users: company.users,
          teams: company.teams,
          subscription: company.subscription,
          settings: company.settings,
          isActive: company.isActive,
          createdAt: company.createdAt
        }))
      });
    }

    // Regular users - get their own company
    if (!req.user.companyId) {
      return res.status(404).json({ error: 'User does not belong to any company' });
    }

    const company = await Company.findById(req.user.companyId)
      .populate('admin', 'firstName lastName email')
      .populate({
        path: 'users',
        select: 'firstName lastName email role teamId isTeamLeader isCompanyAdmin isAdmin isSuperAdmin createdAt companyJoinedAt',
        match: { role: { $ne: 'super_admin' }, isSuperAdmin: { $ne: true } }
      })
      .populate('teams.members', 'firstName lastName email')
      .populate('teams.teamLeader', 'firstName lastName email');

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({
      company: {
        id: company._id,
        name: company.name,
        companyId: company.companyId,
        description: company.description,
        industry: company.industry,
        size: company.size,
        admin: company.admin,
        users: company.users,
        teams: company.teams,
        subscription: company.subscription,
        settings: company.settings,
        isActive: company.isActive,
        createdAt: company.createdAt
      }
    });
  } catch (error) {
    console.error('❌ [COMPANIES] Get company error:', error);
    console.error('❌ [COMPANIES] Error details:', {
      message: error.message,
      stack: error.stack,
      userCompanyId: req.user?.companyId
    });
    res.status(500).json({ error: 'Failed to get company details' });
  }
});

// Get company users (must be before /:id route)
router.get('/users', authenticateToken, canManageUsers, async (req, res) => {
  try {
    console.log('🔍 [COMPANIES USERS] Request from user:', req.user._id, 'role:', req.user.role);
    const company = await Company.findById(req.user.companyId)
      .populate({
        path: 'users',
        select: 'firstName lastName email role teamId isTeamLeader isCompanyAdmin isAdmin isSuperAdmin createdAt companyJoinedAt lastLogin',
        match: { role: { $ne: 'super_admin' }, isSuperAdmin: { $ne: true } }
      })
      .populate('teams.members', 'firstName lastName email')
      .populate('teams.teamLeader', 'firstName lastName email');

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({
      users: company.users,
      teams: company.teams
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get company details by ID (for company management)
router.get('/:id', authenticateToken, async (req, res) => {
  
  try {
    const companyId = req.params.id;
    
    // Check if user has access to this company
    if (req.user.companyId?.toString() !== companyId && !req.user.isSuperAdminUser() && !req.user.isAdminUser()) {
      return res.status(403).json({ error: 'Access denied to this company' });
    }

    const company = await Company.findById(companyId)
      .populate('admin', 'firstName lastName email')
      .populate({
        path: 'users',
        select: 'firstName lastName email role isCompanyAdmin isTeamLeader teamId createdAt',
        match: { role: { $ne: 'super_admin' }, isSuperAdmin: { $ne: true } }
      })
      .populate('teams.members', 'firstName lastName email')
      .populate('teams.teamLeader', 'firstName lastName email');

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({
      company: {
        _id: company._id,
        name: company.name,
        companyId: company.companyId,
        description: company.description,
        users: company.users,
        teams: company.teams,
        subscription: company.subscription,
        settings: company.settings,
        createdAt: company.createdAt
      }
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Failed to fetch company data' });
  }
});

// Create a new team (Company Admin only)
router.post('/teams', authenticateToken, requireCompanyAdmin, [
  body('name').trim().notEmpty().withMessage('Team name is required'),
  body('description').optional().trim(),
  body('teamLeader').optional().isMongoId().withMessage('Invalid team leader ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, teamLeader } = req.body;

    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check if team name already exists
    const existingTeam = company.teams.find(team => team.name === name);
    if (existingTeam) {
      return res.status(400).json({ error: 'Team name already exists' });
    }

    // Validate team leader if provided
    if (teamLeader) {
      const leader = await User.findById(teamLeader);
      if (!leader || !leader.companyId.equals(company._id)) {
        return res.status(400).json({ error: 'Invalid team leader' });
      }
    }

    // Create team
    await company.createTeam({
      name,
      description,
      teamLeader: null // Don't set team leader here, use setTeamLeader method instead
    });

    // Update team leader role if specified
    if (teamLeader) {
      const leader = await User.findById(teamLeader);
      leader.role = 'company_team_leader';
      leader.isTeamLeader = true;
      await leader.save();
      
      // Use the setTeamLeader method to properly assign the team leader
      await company.setTeamLeader(teamLeader, name);
    }

    const updatedCompany = await Company.findById(req.user.companyId)
      .populate('teams.members', 'firstName lastName email')
      .populate('teams.teamLeader', 'firstName lastName email');

    res.status(201).json({
      message: 'Team created successfully',
      teams: updatedCompany.teams
    });
  } catch (error) {
    console.error('Team creation error:', error);
    res.status(500).json({ error: 'Team creation failed' });
  }
});

// Add user to company (Company Admin and Team Leaders)
router.post('/users', authenticateToken, canManageUsers, [
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
  body('role').optional().isIn(['company_user', 'company_team_leader']).withMessage('Invalid role'),
  body('teamName').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, role = 'company_user', teamName } = req.body;

    // Normalize email for consistent storage
    const normalizedEmail = User.normalizeEmail(email);

    // Check if user can manage users (admins and team leaders)
    if (!req.user.canManageUsers()) {
      return res.status(403).json({ 
        error: 'User management access required',
        userRole: req.user.role
      });
    }

    // Team leaders can only create regular users, not other team leaders or admins
    if (req.user.role === 'company_team_leader' || req.user.isTeamLeader) {
      if (role !== 'company_user') {
        return res.status(403).json({ 
          error: 'Team leaders can only create regular users',
          attemptedRole: role,
          allowedRole: 'company_user'
        });
      }
    }

    // Check if team leader is trying to create another team leader
    if (role === 'company_team_leader' && !req.user.canCreateTeamLeaders()) {
      return res.status(403).json({ 
        error: 'Only company admins can create team leaders',
        requiredRole: 'company_admin',
        userRole: req.user.role
      });
    }

    const company = await Company.findById(req.user.companyId)
      .populate('teams.teamLeader', '_id');
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check if company can add more users
    if (!(await company.canAddUser())) {
      return res.status(400).json({ error: 'Company user limit reached' });
    }

    // Check if user already exists (case-insensitive)
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Determine team assignment (only company admins can create users)
    let team = null;
    let finalTeamName = teamName;

    if (teamName) {
      // Company admins can specify any team
      team = company.teams.find(t => t.name === teamName);
      if (!team) {
        return res.status(400).json({ error: 'Team not found' });
      }
    }

    // Use the password provided by the admin as the temporary password
    
    // Create new user with company's subscription settings
    const user = await User.createWithCompanySubscription({
      email: normalizedEmail,
      password: password, // Use the password provided by the admin
      firstName,
      lastName,
      companyId: company._id,
      companyJoinedAt: new Date(), // Set the company join date
      role,
      teamId: team ? team._id : null,
      isTeamLeader: role === 'company_team_leader',
      needsPasswordSetup: true // Flag user to set up their password on first login
    }, company);

    // Add user to company
    await company.addUser(user._id);

    // Add user to team if specified
    if (team) {
      await company.addUserToTeam(user._id, finalTeamName);
      
      // If user is a team leader, set them as the team leader
      if (role === 'company_team_leader') {
        await company.setTeamLeader(user._id, finalTeamName);
      }
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        teamId: user.teamId,
        isTeamLeader: user.isTeamLeader
      }
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ error: 'User creation failed' });
  }
});

// Assign user to team
router.put('/users/:userId/team', authenticateToken, canManageUsers, [
  body('teamName').trim().notEmpty().withMessage('Team name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { teamName } = req.body;

    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Find team
    const team = company.teams.find(t => t.name === teamName);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user || !user.companyId.equals(company._id)) {
      return res.status(404).json({ error: 'User not found in company' });
    }

    // Check permissions based on user role
    if (req.user.isCompanyAdmin || req.user.role === 'company_admin') {
      // Company admins can manage all teams
    } else if (req.user.role === 'company_team_leader') {
      // Team leaders can only manage their own team
      if (!team.teamLeader || !team.teamLeader.equals(req.user._id)) {
        return res.status(403).json({ 
          error: 'You can only manage members of your own team',
          teamName: teamName,
          userRole: req.user.role
        });
      }
      
      // Team leaders can only add regular users to their team, not other team leaders or admins
      if (user.role !== 'company_user') {
        return res.status(403).json({ 
          error: 'You can only add regular users to your team',
          userRole: user.role,
          yourRole: req.user.role
        });
      }
    } else {
      return res.status(403).json({ 
        error: 'You do not have permission to manage teams',
        userRole: req.user.role
      });
    }

    // Add user to team
    await company.addUserToTeam(userId, teamName);

    // Update user's teamId
    user.teamId = team._id;
    await user.save();

    // Get updated team information with populated data
    await company.populate('teams.members', 'firstName lastName email');
    await company.populate('teams.teamLeader', 'firstName lastName email');
    const updatedTeam = company.teams.find(t => t.name === teamName);
    
    res.json({
      message: 'User assigned to team successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        teamId: user.teamId
      },
      team: {
        id: updatedTeam._id,
        name: updatedTeam.name,
        members: updatedTeam.members,
        teamLeader: updatedTeam.teamLeader
      }
    });
  } catch (error) {
    console.error('Assign user to team error:', error);
    res.status(500).json({ error: 'Failed to assign user to team' });
  }
});

// Remove user from team
router.delete('/users/:userId/team', authenticateToken, canManageUsers, [
  body('teamName').trim().notEmpty().withMessage('Team name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { teamName } = req.body;

    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Find team
    const team = company.teams.find(t => t.name === teamName);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user || !user.companyId.equals(company._id)) {
      return res.status(404).json({ error: 'User not found in company' });
    }

    // Check permissions based on user role
    if (req.user.isCompanyAdmin || req.user.role === 'company_admin') {
      // Company admins can manage all teams
    } else if (req.user.role === 'company_team_leader') {
      // Team leaders can only remove users from their own team
      if (!team.teamLeader || !team.teamLeader.equals(req.user._id)) {
        return res.status(403).json({ 
          error: 'You can only manage members of your own team',
          teamName: teamName,
          userRole: req.user.role
        });
      }
    } else {
      return res.status(403).json({ 
        error: 'You do not have permission to manage teams',
        userRole: req.user.role
      });
    }

    // Remove user from team
    await company.removeUserFromTeam(userId, teamName);

    // Update user's teamId
    user.teamId = null;
    await user.save();

    // Get updated team information with populated data
    await company.populate('teams.members', 'firstName lastName email');
    await company.populate('teams.teamLeader', 'firstName lastName email');
    const updatedTeam = company.teams.find(t => t.name === teamName);
    
    res.json({
      message: 'User removed from team successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        teamId: user.teamId
      },
      team: {
        id: updatedTeam._id,
        name: updatedTeam.name,
        members: updatedTeam.members,
        teamLeader: updatedTeam.teamLeader
      }
    });
  } catch (error) {
    console.error('Remove user from team error:', error);
    res.status(500).json({ error: 'Failed to remove user from team' });
  }
});

// Set team leader
router.put('/teams/:teamName/leader', authenticateToken, requireCompanyAdmin, [
  body('userId').isMongoId().withMessage('Valid user ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { teamName } = req.params;
    const { userId } = req.body;

    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Find team
    const team = company.teams.find(t => t.name === teamName);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user || !user.companyId.equals(company._id)) {
      return res.status(404).json({ error: 'User not found in company' });
    }

    // Set team leader
    await company.setTeamLeader(userId, teamName);

    // Update user role
    user.role = 'company_team_leader';
    user.isTeamLeader = true;
    await user.save();

    res.json({
      message: 'Team leader set successfully',
      team: {
        name: team.name,
        teamLeader: userId
      }
    });
  } catch (error) {
    console.error('Set team leader error:', error);
    res.status(500).json({ error: 'Failed to set team leader' });
  }
});

// Remove user from company (Company Admin only)
router.delete('/users/:userId', authenticateToken, requireCompanyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // For super admins, find the company that contains this user
    let company;
    if (req.user.role === 'super_admin') {
      // Super admins can delete users from any company
      const user = await User.findById(userId);
      if (!user || !user.companyId) {
        return res.status(404).json({ error: 'User not found or not in a company' });
      }
      company = await Company.findById(user.companyId);
    } else {
      // Company admins can only delete users from their own company
      company = await Company.findById(req.user.companyId);
    }
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if current user can delete this specific user
    if (req.user.role !== 'super_admin' && !req.user.canDeleteUser(user)) {
      return res.status(403).json({ 
        error: 'You do not have permission to delete this user',
        requiredRole: 'company_admin',
        userRole: req.user.role
      });
    }

    // Don't allow removing the company admin
    if (user._id.equals(company.admin)) {
      return res.status(400).json({ error: 'Cannot remove company admin' });
    }

    // Don't allow removing any company admin account
    if (user.isCompanyAdmin || user.role === 'company_admin') {
      return res.status(400).json({ error: 'Cannot remove company admin accounts' });
    }

    // Don't allow users to delete themselves
    if (user._id.equals(req.user._id)) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Remove user from company
    await company.removeUser(userId);

    // Delete all user's conversations
    const deletedConversations = await Conversation.deleteMany({ userId });

    // Delete all user's conversation summaries
    const deletedSummaries = await ConversationSummary.deleteMany({ userId });

    // Delete the user account completely
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User removed from company and all data deleted successfully',
      deletedData: {
        conversations: deletedConversations.deletedCount,
        summaries: deletedSummaries.deletedCount,
        user: true
      }
    });
  } catch (error) {
    console.error('Remove user error:', error);
    res.status(500).json({ error: 'Failed to remove user from company' });
  }
});

// Add user to company (Company Admin only)
router.post('/users/add', authenticateToken, requireCompanyAdmin, [
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
  body('role').isIn(['company_user', 'company_team_leader']).withMessage('Invalid role'),
  body('companyId').isMongoId().withMessage('Invalid company ID'),
  body('teamId').optional().isMongoId().withMessage('Invalid team ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, role, companyId, teamId } = req.body;

    // Normalize email for consistent storage
    const normalizedEmail = User.normalizeEmail(email);

    // Verify user has access to this company
    if (req.user.companyId.toString() !== companyId) {
      return res.status(403).json({ error: 'Access denied to this company' });
    }

    // Check if user already exists (case-insensitive)
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check company exists and user limit
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (!(await company.canAddUser())) {
      return res.status(400).json({ error: 'Company has reached maximum user limit' });
    }

    // Validate team if provided
    let team = null;
    if (teamId) {
      team = company.teams.id(teamId);
      if (!team) {
        return res.status(400).json({ error: 'Team not found' });
      }
    }

    // Use the password provided by the admin as the temporary password
    console.log('Using admin-provided password for', email);
    
    // Create new user with company's subscription settings
    const newUser = await User.createWithCompanySubscription({
      email: normalizedEmail,
      password: password, // Use the password provided by the admin
      firstName,
      lastName,
      role,
      companyId,
      companyJoinedAt: new Date(), // Set the company join date
      teamId: teamId || null,
      isCompanyAdmin: false,
      isTeamLeader: role === 'company_team_leader',
      needsPasswordSetup: true, // Flag user to set up their password on first login
      settings: {
        experienceLevel: 'beginner'
      }
    }, company);

    // Add user to company
    await company.addUser(newUser._id);

    // Add user to team if specified
    if (teamId) {
      await company.addUserToTeam(newUser._id, team.name);
      
      // If user is a team leader, set them as the team leader
      if (role === 'company_team_leader') {
        await company.setTeamLeader(newUser._id, team.name);
      }
    }

    res.status(201).json({
      message: 'User added to company successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        isTeamLeader: newUser.isTeamLeader,
        teamId: newUser.teamId
      }
    });
  } catch (error) {
    console.error('Add user to company error:', error);
    res.status(500).json({ error: 'Failed to add user to company' });
  }
});

// Create team (Company Admin only)
router.post('/teams/create', authenticateToken, requireCompanyAdmin, [
  body('name').trim().notEmpty().withMessage('Team name is required'),
  body('description').optional().trim(),
  body('companyId').isMongoId().withMessage('Invalid company ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, companyId } = req.body;

    // Verify user has access to this company
    if (req.user.companyId.toString() !== companyId) {
      return res.status(403).json({ error: 'Access denied to this company' });
    }

    // Check company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check if team name already exists in company
    const existingTeam = company.teams.find(team => team.name === name);
    if (existingTeam) {
      return res.status(400).json({ error: 'Team name already exists in this company' });
    }

    // Create team
    await company.createTeam({
      name,
      description,
      members: [],
      teamLeader: null
    });

    res.status(201).json({
      message: 'Team created successfully',
      team: {
        name,
        description,
        members: [],
        teamLeader: null
      }
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Update user in company (Company Admin only)
router.put('/users/:userId', authenticateToken, requireCompanyAdmin, [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('role').isIn(['company_user', 'company_team_leader', 'company_admin']).withMessage('Invalid role'),
  body('teamId').optional().custom((value) => {
    if (value === undefined || value === null || value === '') {
      return true; // Allow empty values
    }
    return /^[0-9a-fA-F]{24}$/.test(value); // Check if it's a valid MongoDB ObjectId
  }).withMessage('Invalid team ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { firstName, lastName, email, role, teamId } = req.body;

    // Find user and verify they belong to the company
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if current user can edit this specific user
    if (!req.user.canEditUser(user)) {
      return res.status(403).json({ 
        error: 'You do not have permission to edit this user',
        requiredRole: 'company_admin',
        userRole: req.user.role
      });
    }

    // Prevent downgrading super admin users
    if (user.role === 'super_admin') {
      if (role !== user.role) {
        return res.status(400).json({ 
          error: 'Cannot change role of super admin users',
          message: 'Super admin users cannot have their roles changed'
        });
      }
    }

    // Check if email is being changed and if it's already taken
    if (email !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }

    // Get company to validate team
    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Validate team if provided
    if (teamId) {
      const team = company.teams.id(teamId);
      if (!team) {
        return res.status(400).json({ error: 'Team not found' });
      }
    }

    // Update user
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.role = role;
    user.isTeamLeader = role === 'company_team_leader';
    user.isCompanyAdmin = role === 'company_admin';
    user.teamId = teamId || null;

    await user.save();

    // Update team assignments
    let teamAssignmentChanged = false;
    
    if (role === 'company_team_leader' && teamId) {
      // Set as team leader
      await company.setTeamLeader(userId, company.teams.id(teamId).name);
      teamAssignmentChanged = true;
    } else if (role === 'company_user') {
      // Remove from team leader positions
      for (const team of company.teams) {
        if (team.teamLeader && team.teamLeader.equals(userId)) {
          team.teamLeader = null;
          teamAssignmentChanged = true;
        }
      }
      
      // Handle team membership for regular users
      if (teamId) {
        // Add to specified team
        const targetTeam = company.teams.id(teamId);
        if (targetTeam && !targetTeam.members.includes(userId)) {
          targetTeam.members.push(userId);
          teamAssignmentChanged = true;
        }
        
        // Remove from other teams
        for (const team of company.teams) {
          if (!team._id.equals(teamId) && team.members.includes(userId)) {
            team.members = team.members.filter(id => !id.equals(userId));
            teamAssignmentChanged = true;
          }
        }
      } else {
        // Remove from all teams if no team specified
        for (const team of company.teams) {
          if (team.members.includes(userId)) {
            team.members = team.members.filter(id => !id.equals(userId));
            teamAssignmentChanged = true;
          }
        }
      }
    } else if (role === 'company_admin') {
      // Remove from team leader positions and teams - company admins don't belong to specific teams
      for (const team of company.teams) {
        if (team.teamLeader && team.teamLeader.equals(userId)) {
          team.teamLeader = null;
          teamAssignmentChanged = true;
        }
        if (team.members.includes(userId)) {
          team.members = team.members.filter(id => !id.equals(userId));
          teamAssignmentChanged = true;
        }
      }
    }
    
    // Save company if team assignments changed
    if (teamAssignmentChanged) {
      // Normalize subscription plan to lowercase before saving
      if (company.subscription && company.subscription.plan) {
        company.subscription.plan = company.subscription.plan.toLowerCase();
      }
      
      await company.save();
    }

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isTeamLeader: user.isTeamLeader,
        teamId: user.teamId
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Get team member conversations (Team leads and admins only)
router.get('/users/:userId/conversations', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Check if user has permission to view this user's conversations
    const canView = await checkUserViewPermission(req.user._id, userId);
    if (!canView) {
      return res.status(403).json({ error: 'Not authorized to view this user\'s conversations' });
    }

    const conversations = await Conversation.getUserHistory(userId, parseInt(limit), skip);
    const total = await Conversation.countDocuments({ userId, isActive: true });

    res.json({
      conversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get team member conversations error:', error);
    res.status(500).json({ error: 'Failed to get team member conversations' });
  }
});

// Get team member conversation summaries (Team leads and admins only)
router.get('/users/:userId/summaries', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user has permission to view this user's summaries
    const canView = await checkUserViewPermission(req.user._id, userId);
    if (!canView) {
      return res.status(403).json({ error: 'Not authorized to view this user\'s summaries' });
    }

    const summaries = await ConversationSummary.find({ userId })
      .sort({ summaryNumber: -1 })
      .populate('exampleConversations.conversationId', 'title createdAt')
      .lean();

    res.json({ summaries });
  } catch (error) {
    console.error('Get team member summaries error:', error);
    res.status(500).json({ error: 'Failed to get team member summaries' });
  }
});

// Get full conversation details (Team leads and admins only)
router.get('/users/:userId/conversations/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { userId, conversationId } = req.params;

    // Check if user has permission to view this user's conversations
    const canView = await checkUserViewPermission(req.user._id, userId);
    if (!canView) {
      return res.status(403).json({ error: 'Not authorized to view this user\'s conversations' });
    }

    const conversation = await Conversation.findById(conversationId)
      .populate('userId', 'firstName lastName email')
      .lean();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Verify the conversation belongs to the specified user
    if (conversation.userId._id.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Conversation does not belong to this user' });
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Get conversation details error:', error);
    res.status(500).json({ error: 'Failed to get conversation details' });
  }
});

// Helper function to check if user can view another user's data
async function checkUserViewPermission(viewerId, targetUserId) {
  const viewer = await User.findById(viewerId);
  const targetUser = await User.findById(targetUserId);
  
  if (!viewer || !targetUser) {
    return false;
  }

  // Super admins can view anyone
  if (viewer.role === 'super_admin') {
    return true;
  }

  // Company admins can view anyone in their company
  if (viewer.role === 'company_admin' && viewer.companyId && viewer.companyId.equals(targetUser.companyId)) {
    return true;
  }

  // Team leaders can view their team members
  if (viewer.role === 'company_team_leader' && viewer.companyId && viewer.companyId.equals(targetUser.companyId)) {
    const company = await Company.findById(viewer.companyId);
    if (company) {
      const viewerTeam = company.teams.find(team => team.teamLeader && team.teamLeader.equals(viewerId));
      if (viewerTeam) {
        // Team leader can view themselves and their team members
        if (viewerId.equals(targetUserId) || viewerTeam.members.some(memberId => memberId.equals(targetUserId))) {
          return true;
        }
      }
    }
  }

  // Users can view their own data
  if (viewerId === targetUserId) {
    return true;
  }

  return false;
}

// Fix team leader assignments (Admin only)
router.post('/fix-team-leaders', authenticateToken, requireCompanyAdmin, async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    console.log('🔍 Fixing team leader assignments...');
    let fixedCount = 0;

    // Find all team leaders in the company
    const teamLeaders = await User.find({ 
      companyId: company._id,
      role: 'company_team_leader',
      isTeamLeader: true,
      teamId: { $exists: true, $ne: null }
    });

    for (const leader of teamLeaders) {
      const team = company.teams.id(leader.teamId);
      if (team && (!team.teamLeader || !team.teamLeader.equals(leader._id))) {
        console.log(`Fixing team leader for team: ${team.name}`);
        team.teamLeader = leader._id;
        
        // Make sure the user is also a member of the team
        if (!team.members.includes(leader._id)) {
          team.members.push(leader._id);
        }
        
        fixedCount++;
      }
    }

    if (fixedCount > 0) {
      await company.save();
    }

    res.json({
      message: `Fixed ${fixedCount} team leader assignments`,
      fixedCount,
      teamLeaders: teamLeaders.map(leader => ({
        id: leader._id,
        name: `${leader.firstName} ${leader.lastName}`,
        email: leader.email,
        teamId: leader.teamId
      }))
    });
  } catch (error) {
    console.error('Fix team leaders error:', error);
    res.status(500).json({ error: 'Failed to fix team leaders' });
  }
});

// Update team (Company Admin only)
router.put('/teams/:teamId', authenticateToken, requireCompanyAdmin, [
  body('name').trim().notEmpty().withMessage('Team name is required'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { teamId } = req.params;
    const { name, description } = req.body;

    // For super admins, find the company that contains this team
    let company;
    if (req.user.role === 'super_admin') {
      // Super admins can edit teams from any company
      company = await Company.findOne({ 'teams._id': teamId });
    } else {
      // Company admins can only edit teams from their own company
      company = await Company.findById(req.user.companyId);
    }
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const team = company.teams.id(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check if team name is being changed and if it already exists
    if (name !== team.name) {
      const existingTeam = company.teams.find(t => t.name === name && !t._id.equals(teamId));
      if (existingTeam) {
        return res.status(400).json({ error: 'Team name already exists in this company' });
      }
    }

    // Update team
    team.name = name;
    team.description = description;

    await company.save();

    res.json({
      message: 'Team updated successfully',
      team: {
        _id: team._id,
        name: team.name,
        description: team.description,
        members: team.members,
        teamLeader: team.teamLeader
      }
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// Delete team (Company Admin only)
router.delete('/teams/:teamId', authenticateToken, requireCompanyAdmin, async (req, res) => {
  try {
    const { teamId } = req.params;

    // For super admins, find the company that contains this team
    let company;
    if (req.user.role === 'super_admin') {
      // Super admins can delete teams from any company
      company = await Company.findOne({ 'teams._id': teamId });
    } else {
      // Company admins can only delete teams from their own company
      company = await Company.findById(req.user.companyId);
    }
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const team = company.teams.id(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Remove team from all users who were in this team
    await User.updateMany(
      { teamId: teamId },
      { 
        $unset: { teamId: 1 },
        $set: { isTeamLeader: false }
      }
    );

    // Remove team from company
    company.teams.pull(teamId);
    await company.save();

    res.json({
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

// Get company leaderboard (Company users only)
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    // Check if user belongs to a company
    if (!req.user.companyId) {
      return res.status(404).json({ error: 'User does not belong to any company' });
    }

    const company = await Company.findById(req.user.companyId)
      .populate({
        path: 'users',
        select: 'firstName lastName email role teamId isTeamLeader isCompanyAdmin',
        match: { role: { $ne: 'super_admin' }, isSuperAdmin: { $ne: true } }
      });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get all users in the company (excluding super admins and admins)
    const companyUsers = company.users.filter(user => 
      user.role !== 'super_admin' && 
      user.role !== 'admin' && 
      user.role !== 'company_admin'
    );

    const leaderboardData = [];

    // Calculate average scores for each user based on their last 5 conversations
    for (const user of companyUsers) {
      // Get user's last 5 conversations with AI ratings
      const conversations = await Conversation.find({
        userId: user._id,
        isActive: true,
        'aiRatings.totalScore': { $exists: true, $gt: 0 }
      })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('aiRatings updatedAt');

      if (conversations.length > 0) {
        // Calculate average total score
        const totalScore = conversations.reduce((sum, conv) => sum + (conv.aiRatings.totalScore || 0), 0);
        const averageScore = totalScore / conversations.length;

        // Calculate average scores for each phase
        const phaseAverages = {
          introduction: conversations.reduce((sum, conv) => sum + (conv.aiRatings.introduction || 0), 0) / conversations.length,
          mapping: conversations.reduce((sum, conv) => sum + (conv.aiRatings.mapping || 0), 0) / conversations.length,
          productPresentation: conversations.reduce((sum, conv) => sum + (conv.aiRatings.productPresentation || 0), 0) / conversations.length,
          objectionHandling: conversations.reduce((sum, conv) => sum + (conv.aiRatings.objectionHandling || 0), 0) / conversations.length,
          close: conversations.reduce((sum, conv) => sum + (conv.aiRatings.close || 0), 0) / conversations.length
        };

        // Find user's team name
        const userTeam = company.teams.find(team => 
          team.members.some(memberId => memberId.toString() === user._id.toString())
        );

        leaderboardData.push({
          userId: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isTeamLeader: user.isTeamLeader,
          teamName: userTeam ? userTeam.name : null,
          averageScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal place
          phaseAverages: {
            introduction: Math.round(phaseAverages.introduction * 10) / 10,
            mapping: Math.round(phaseAverages.mapping * 10) / 10,
            productPresentation: Math.round(phaseAverages.productPresentation * 10) / 10,
            objectionHandling: Math.round(phaseAverages.objectionHandling * 10) / 10,
            close: Math.round(phaseAverages.close * 10) / 10
          },
          conversationCount: conversations.length,
          lastConversationDate: conversations[0]?.updatedAt
        });
      }
    }

    // Sort by average score (highest first)
    leaderboardData.sort((a, b) => b.averageScore - a.averageScore);

    // Add rank to each entry
    leaderboardData.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    res.json({
      leaderboard: leaderboardData,
      totalUsers: leaderboardData.length,
      companyName: company.name
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard data' });
  }
});

// Delete company and all associated data (Super Admin only)
router.delete('/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;

    // Only super admins can delete companies
    if (!req.user.isSuperAdminUser()) {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    // Find the company
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    console.log(`🗑️ [COMPANY DELETE] Starting deletion of company: ${company.name} (${companyId})`);

    // Get the admin user (don't delete them)
    const adminUser = await User.findById(company.admin);
    console.log(`🗑️ [COMPANY DELETE] Preserving admin user: ${adminUser?.email} (${company.admin})`);

    // Get all users in this company EXCEPT the admin
    const companyUsers = await User.find({ 
      companyId: companyId,
      _id: { $ne: company.admin } // Exclude the admin user
    });
    const userIds = companyUsers.map(user => user._id);

    console.log(`🗑️ [COMPANY DELETE] Found ${companyUsers.length} non-admin users to delete`);

    // Delete all conversations for non-admin users in this company
    const conversationResult = await Conversation.deleteMany({ 
      userId: { $in: userIds } 
    });
    console.log(`🗑️ [COMPANY DELETE] Deleted ${conversationResult.deletedCount} conversations`);

    // Delete all conversation summaries for non-admin users in this company
    const summaryResult = await ConversationSummary.deleteMany({ 
      userId: { $in: userIds } 
    });
    console.log(`🗑️ [COMPANY DELETE] Deleted ${summaryResult.deletedCount} conversation summaries`);

    // Delete all non-admin users in this company
    const userResult = await User.deleteMany({ 
      companyId: companyId,
      _id: { $ne: company.admin } // Exclude the admin user
    });
    console.log(`🗑️ [COMPANY DELETE] Deleted ${userResult.deletedCount} non-admin users`);

    // Handle the admin user - make them a super admin if they aren't already
    if (adminUser) {
      if (!adminUser.isSuperAdmin) {
        console.log(`🗑️ [COMPANY DELETE] Converting admin user to super admin: ${adminUser.email}`);
        await User.findByIdAndUpdate(company.admin, {
          role: 'super_admin',
          isSuperAdmin: true,
          isAdmin: true,
          companyId: null, // Remove company association
          adminPermissions: {
            canManageCompanies: true,
            canManageUsers: true,
            canViewAnalytics: true,
            canManageSubscriptions: true
          }
        });
      } else {
        // If already super admin, just remove company association
        console.log(`🗑️ [COMPANY DELETE] Removing company association from super admin: ${adminUser.email}`);
        await User.findByIdAndUpdate(company.admin, {
          companyId: null
        });
      }
    }

    // Finally, delete the company itself
    await Company.findByIdAndDelete(companyId);
    console.log(`🗑️ [COMPANY DELETE] Deleted company: ${company.name}`);

    res.json({
      message: 'Company and all associated data deleted successfully',
      deletedData: {
        company: company.name,
        users: userResult.deletedCount,
        conversations: conversationResult.deletedCount,
        summaries: summaryResult.deletedCount
      },
      adminUser: {
        email: adminUser?.email,
        action: adminUser?.isSuperAdmin ? 'removed_company_association' : 'converted_to_super_admin'
      }
    });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

module.exports = router;
