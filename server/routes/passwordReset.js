const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { sendPasswordResetEmail, testEmailConnection } = require('../services/emailService');

const router = express.Router();

// Request password reset
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        message: 'If an account with that email exists, we have sent a password reset link.'
      });
    }

    // Create password reset request
    const resetRequest = await PasswordReset.createResetRequest(email);

    // Send reset email
    const emailResult = await sendPasswordResetEmail(
      email,
      resetRequest.token,
      user.firstName
    );

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return res.status(500).json({
        error: 'Failed to send password reset email. Please try again.'
      });
    }

    res.json({
      message: 'If an account with that email exists, we have sent a password reset link.'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Verify reset token
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Reset token is required' });
    }

    const verification = await PasswordReset.verifyAndConsumeToken(token);

    if (!verification.valid) {
      return res.status(400).json({ error: verification.error });
    }

    res.json({
      message: 'Token is valid',
      email: verification.email
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Failed to verify reset token' });
  }
});

// Reset password with token
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
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

    const { token, newPassword } = req.body;

    // Verify token
    const verification = await PasswordReset.verifyAndConsumeToken(token);

    if (!verification.valid) {
      return res.status(400).json({ error: verification.error });
    }

    // Find user
    const user = await User.findOne({ email: verification.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Clean up any remaining reset tokens for this user
    await PasswordReset.updateMany(
      { email: verification.email, used: false },
      { used: true }
    );

    res.json({
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Check if email exists (for frontend validation)
router.post('/check-email', [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const user = await User.findOne({ email });
    
    // Don't reveal if email exists for security
    res.json({
      exists: !!user,
      message: user ? 'Email found' : 'Email not found'
    });
  } catch (error) {
    console.error('Email check error:', error);
    res.status(500).json({ error: 'Failed to check email' });
  }
});

// Test email configuration (for development/admin use)
router.get('/test-email', async (req, res) => {
  try {
    const result = await testEmailConnection();
    res.json(result);
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({ error: 'Failed to test email configuration' });
  }
});

module.exports = router;
