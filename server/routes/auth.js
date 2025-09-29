const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../services/emailService');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Helper to set cookie
const setAuthCookie = (res, token) => {
  res.cookie('sb_token', token, {
    httpOnly: true,
    secure: false, // Set to false to work in all environments
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
    domain: undefined // Let browser handle domain automatically
  });
};

// Register user
router.post('/register', [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password')
    .isLength({ min: 8, max: 64 }).withMessage('Password must be 8-64 characters long')
    .matches(/[a-z]/).withMessage('Password must include a lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must include an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must include a number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must include a special character')
    .not().matches(/\s/).withMessage('Password cannot contain spaces'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, company } = req.body;

    // Normalize email for consistent storage
    const normalizedEmail = User.normalizeEmail(email);

    // Check if user already exists (case-insensitive)
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const user = new User({
      email: normalizedEmail,
      password,
      firstName,
      lastName,
      company
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);
    setAuthCookie(res, token);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Send welcome email (don't wait for it to complete)
    sendWelcomeEmail(user.email, user.firstName).catch(error => {
      console.error('Failed to send welcome email:', error);
    });

    res.status(201).json({
      message: 'User registered successfully',
      token: token, // Include token in response for cross-origin requests
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        companyPermissions: user.companyPermissions,
        role: user.role,
        subscription: user.subscription,
        usage: user.usage
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user using comprehensive lookup
    const user = await User.findUserByEmail(email);
    
    if (!user) {
      console.log('❌ [LOGIN] User not found for email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user needs password setup
    if (user.needsPasswordSetup) {
      // For users who need password setup, allow login with temporary password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Incorrect email or password' });
      }

      // Generate token for password setup flow
      const token = generateToken(user._id);
      setAuthCookie(res, token);

      res.json({
        message: 'Login successful - password setup required',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          company: user.company,
          companyPermissions: user.companyPermissions,
          companyId: user.companyId,
          role: user.role,
          teamId: user.teamId,
          isCompanyAdmin: user.isCompanyAdmin,
          isTeamLeader: user.isTeamLeader,
          isSuperAdmin: user.isSuperAdmin,
          isAdmin: user.isAdmin,
          adminPermissions: user.adminPermissions,
          subscription: user.subscription,
          usage: user.usage,
          settings: user.settings,
          needsPasswordSetup: user.needsPasswordSetup
        },
        token: token
      });
      return;
    }

    // Regular login for users who don't need password setup
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    // Generate token
    const token = generateToken(user._id);
    setAuthCookie(res, token);

    // Update last login
    user.lastLogin = new Date();
    await user.save();
    res.json({
      message: 'Login successful',
      token: token, // Include token in response for cross-origin requests
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        companyPermissions: user.companyPermissions,
        companyId: user.companyId,
        role: user.role,
        teamId: user.teamId,
        isCompanyAdmin: user.isCompanyAdmin,
        isTeamLeader: user.isTeamLeader,
        isSuperAdmin: user.isSuperAdmin,
        isAdmin: user.isAdmin,
        adminPermissions: user.adminPermissions,
        subscription: user.subscription,
        usage: user.usage,
        settings: user.settings,
        needsPasswordSetup: user.needsPasswordSetup
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Debug endpoint to check cookies
router.get('/debug-cookies', (req, res) => {
  console.log('🍪 [DEBUG] Cookie debug request:', {
    cookies: req.cookies,
    headers: req.headers,
    hasSbToken: !!req.cookies?.sb_token
  });
  
  res.json({
    cookies: req.cookies,
    hasSbToken: !!req.cookies?.sb_token,
    allHeaders: req.headers
  });
});

// Debug endpoint to check user by email
router.post('/debug-user', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    console.log('🔍 [DEBUG] Looking up user for email:', email);
    
    // Test email normalization
    const normalizedEmail = User.normalizeEmail(email);
    console.log('🔍 [DEBUG] Normalized email:', normalizedEmail);
    
    // Try to find user
    const user = await User.findByEmail(email);
    
    if (!user) {
      console.log('❌ [DEBUG] User not found');
      return res.json({
        found: false,
        originalEmail: email,
        normalizedEmail: normalizedEmail,
        message: 'User not found'
      });
    }
    
    console.log('✅ [DEBUG] User found:', {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      needsPasswordSetup: user.needsPasswordSetup,
      role: user.role
    });
    
    res.json({
      found: true,
      originalEmail: email,
      normalizedEmail: normalizedEmail,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        needsPasswordSetup: user.needsPasswordSetup,
        role: user.role,
        subscription: user.subscription
      }
    });
    
  } catch (error) {
    console.error('❌ [DEBUG] Error:', error);
    res.status(500).json({ error: 'Debug failed', details: error.message });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        company: req.user.company,
        companyPermissions: req.user.companyPermissions,
        companyId: req.user.companyId,
        role: req.user.role,
        teamId: req.user.teamId,
        isCompanyAdmin: req.user.isCompanyAdmin,
        isTeamLeader: req.user.isTeamLeader,
        isSuperAdmin: req.user.isSuperAdmin,
        isAdmin: req.user.isAdmin,
        adminPermissions: req.user.adminPermissions,
        subscription: req.user.subscription,
        usage: req.user.usage,
        settings: req.user.settings,
        isEmailVerified: req.user.isEmailVerified,
        needsPasswordSetup: req.user.needsPasswordSetup,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  try {
    res.clearCookie('sb_token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      domain: undefined
    });
    res.json({ message: 'Logged out' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('company').optional().trim(),
  body('settings.industry').optional().trim(),
  body('settings.salesRole').optional().trim(),
  body('settings.experienceLevel').optional().isIn(['beginner', 'intermediate', 'advanced'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, company, settings } = req.body;
    const updateData = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (company !== undefined) updateData.company = company;
    if (settings) {
      updateData.settings = { ...req.user.settings, ...settings };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        role: user.role,
        subscription: user.subscription,
        usage: user.usage,
        settings: user.settings
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// Change password
router.put('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8, max: 64 }).withMessage('Password must be 8-64 characters long')
    .matches(/[a-z]/).withMessage('Password must include a lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must include an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must include a number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must include a special character')
    .not().matches(/\s/).withMessage('Password cannot contain spaces')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Password change failed' });
  }
});

// Setup password for new company users
router.post('/setup-password', authenticateToken, [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password } = req.body;

    // Check if user needs password setup
    if (!req.user.needsPasswordSetup) {
      return res.status(400).json({ error: 'Password setup not required' });
    }

    // Update user's password and clear the setup flag
    req.user.password = password;
    req.user.needsPasswordSetup = false;
    await req.user.save();

    res.json({ 
      message: 'Password set up successfully',
      user: {
        id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        companyId: req.user.companyId,
        role: req.user.role,
        needsPasswordSetup: false
      }
    });
  } catch (error) {
    console.error('Password setup error:', error);
    res.status(500).json({ error: 'Password setup failed' });
  }
});

module.exports = router; 