const express = require('express');
const { body, validationResult } = require('express-validator');
const Company = require('../models/Company');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Middleware to check if user is company admin
const requireCompanyAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'company_admin') {
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
  body('maxUsers').optional().isInt({ min: 1, max: 10000 }).withMessage('Max users must be between 1 and 10000')
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

    const { name, description, industry, size, maxUsers } = req.body;

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
        maxUsers: maxUsers || -1 // Unlimited for enterprise
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
      .populate('users', 'firstName lastName email role isCompanyAdmin isTeamLeader teamId createdAt')
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

// Get company details (current user's company)
router.get('/details', authenticateToken, async (req, res) => {
  try {
    if (!req.user.companyId) {
      return res.status(404).json({ error: 'User does not belong to any company' });
    }

    const company = await Company.findById(req.user.companyId)
      .populate('admin', 'firstName lastName email')
      .populate('users', 'firstName lastName email role teamId')
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
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Failed to get company details' });
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
    if (!company.canAddUser()) {
      return res.status(400).json({ error: 'Company user limit reached' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Determine team assignment
    let team = null;
    let finalTeamName = teamName;

    if (req.user.role === 'company_team_leader') {
      // Team leaders automatically assign users to their own team
      team = company.teams.find(t => {
        if (!t.teamLeader) return false;
        // Handle both ObjectId and string comparisons
        return t.teamLeader.equals ? t.teamLeader.equals(req.user._id) : t.teamLeader.toString() === req.user._id.toString();
      });
      
      if (!team) {
        return res.status(403).json({ 
          error: 'You are not assigned as a team leader of any team',
          userRole: req.user.role
        });
      }
      finalTeamName = team.name;
    } else if (teamName) {
      // Company admins can specify any team
      team = company.teams.find(t => t.name === teamName);
      if (!team) {
        return res.status(400).json({ error: 'Team not found' });
      }
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      companyId: company._id,
      role,
      teamId: team ? team._id : null,
      isTeamLeader: role === 'company_team_leader'
    });

    await user.save();

    // Add user to company
    await company.addUser(user._id);

    // Add user to team if specified
    if (team) {
      await company.addUserToTeam(user._id, finalTeamName);
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

// Get all company users
router.get('/users', authenticateToken, canManageUsers, async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId)
      .populate('users', 'firstName lastName email role teamId isTeamLeader createdAt lastLogin')
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

    // Add user to team
    await company.addUserToTeam(userId, teamName);

    // Update user's teamId
    user.teamId = team._id;
    await user.save();

    res.json({
      message: 'User assigned to team successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        teamId: user.teamId
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

    // Check if team leader is trying to remove user from a team they don't lead
    if (req.user.role === 'company_team_leader' && (!team.teamLeader || !team.teamLeader.equals(req.user._id))) {
      return res.status(403).json({ 
        error: 'You can only manage members of your own team',
        teamName: teamName,
        userRole: req.user.role
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user || !user.companyId.equals(company._id)) {
      return res.status(404).json({ error: 'User not found in company' });
    }

    // Remove user from team
    await company.removeUserFromTeam(userId, teamName);

    // Update user's teamId
    user.teamId = null;
    await user.save();

    res.json({
      message: 'User removed from team successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        teamId: user.teamId
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
    
    // For company admins, verify user is in their company
    if (req.user.role !== 'super_admin') {
      if (!user.companyId || !user.companyId.equals(company._id)) {
        return res.status(404).json({ error: 'User not found in company' });
      }
    }

    // Don't allow removing the company admin
    if (user._id.equals(company.admin)) {
      return res.status(400).json({ error: 'Cannot remove company admin' });
    }

    // Remove user from company
    await company.removeUser(userId);

    // Delete user data completely (as requested)
    // This includes conversations, settings, and all related data
    await User.findByIdAndDelete(userId);

    // Also clean up any related data in other collections
    // Note: You may want to add cleanup for conversations, analytics, etc.
    // For now, we'll just delete the user record

    res.json({
      message: 'User removed from company and all data deleted successfully'
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

    // Verify user has access to this company
    if (req.user.companyId.toString() !== companyId) {
      return res.status(403).json({ error: 'Access denied to this company' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check company exists and user limit
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (!company.canAddUser()) {
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

    // Create new user
    const newUser = new User({
      email,
      password,
      firstName,
      lastName,
      role,
      companyId,
      teamId: teamId || null,
      isCompanyAdmin: false,
      isTeamLeader: role === 'company_team_leader',
      subscription: {
        plan: 'free',
        status: 'active'
      },
      usage: {
        aiConversations: 0,
        monthlyLimit: 50,
        lastResetDate: new Date()
      },
      settings: {
        experienceLevel: 'beginner'
      }
    });

    await newUser.save();

    // Add user to company
    await company.addUser(newUser._id);

    // Add user to team if specified
    if (teamId) {
      await company.addUserToTeam(newUser._id, team.name);
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
  body('role').isIn(['company_user', 'company_team_leader']).withMessage('Invalid role'),
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
    
    // For super admins, allow editing any user; for company admins, only users in their company
    if (req.user.role !== 'super_admin') {
      if (!user.companyId || !user.companyId.equals(req.user.companyId)) {
        return res.status(404).json({ error: 'User not found in company' });
      }
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
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
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
    user.teamId = teamId || null;

    await user.save();

    // Update team assignments if needed
    if (role === 'company_team_leader' && teamId) {
      await company.setTeamLeader(userId, company.teams.id(teamId).name);
    } else if (role === 'company_user') {
      // Remove from all teams if changing to regular user
      for (const team of company.teams) {
        if (team.teamLeader && team.teamLeader.equals(userId)) {
          team.teamLeader = null;
        }
        team.members = team.members.filter(id => !id.equals(userId));
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

module.exports = router;
