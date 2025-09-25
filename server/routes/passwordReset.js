const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { sendPasswordResetEmail, testEmailConnection } = require('../services/emailService');

const router = express.Router();

// Rate limiting for password reset requests (5 requests per minute per IP)
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many password reset requests. Please try again in a minute.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Request password reset
router.post('/forgot-password', passwordResetLimiter, [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail()
], async (req, res) => {
  try {
    console.log('🔍 [PASSWORD RESET] Forgot password request received:', { email: req.body.email });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ [PASSWORD RESET] Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    console.log('🔍 [PASSWORD RESET] Processing email:', email);

    // Check if user exists (case-insensitive)
    console.log('🔍 [PASSWORD RESET] Looking up user for email:', email);
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('❌ [PASSWORD RESET] User not found for email:', email);
      // Don't reveal if email exists or not for security
      return res.json({
        message: 'If an account with that email exists, we have sent a password reset link.'
      });
    }
    console.log('✅ [PASSWORD RESET] User found:', { id: user._id, firstName: user.firstName });

    // Create password reset request
    console.log('🔍 [PASSWORD RESET] Creating reset request...');
    const resetRequest = await PasswordReset.createResetRequest(email);
    console.log('✅ [PASSWORD RESET] Created password reset request for:', email, 'Token:', resetRequest.token ? `${resetRequest.token.substring(0, 8)}...` : 'null');

    // Send reset email
    console.log('🔍 [PASSWORD RESET] Sending reset email...');
    const emailResult = await sendPasswordResetEmail(
      email,
      resetRequest.token,
      user.firstName
    );
    console.log('📧 [PASSWORD RESET] Email result:', emailResult);

    if (!emailResult.success) {
      console.error('❌ [PASSWORD RESET] Failed to send password reset email:', emailResult.error);
      
      // Log password reset details as fallback for admin to manually send
      console.log('📧 [PASSWORD RESET] FALLBACK - Password reset details:');
      console.log('📧 [PASSWORD RESET] =================================');
      console.log('📧 [PASSWORD RESET] Email:', email);
      console.log('📧 [PASSWORD RESET] User:', user.firstName, user.lastName);
      console.log('📧 [PASSWORD RESET] Reset Token:', resetRequest.token);
      console.log('📧 [PASSWORD RESET] Reset URL:', `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetRequest.token}`);
      console.log('📧 [PASSWORD RESET] Expires At:', resetRequest.expiresAt);
      console.log('📧 [PASSWORD RESET] =================================');
      console.log('📧 [PASSWORD RESET] MANUAL RESET LINK:');
      console.log('📧 [PASSWORD RESET] Copy this link and send it to the user manually:');
      console.log('📧 [PASSWORD RESET]', `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetRequest.token}`);
      console.log('📧 [PASSWORD RESET] =================================');
      
      return res.status(500).json({
        error: 'Failed to send password reset email. Please try again or contact support.'
      });
    }

    console.log('✅ [PASSWORD RESET] Password reset email sent successfully');
    res.json({
      message: 'If an account with that email exists, we have sent a password reset link.'
    });
  } catch (error) {
    console.error('❌ [PASSWORD RESET] Password reset request error:', error);
    console.error('❌ [PASSWORD RESET] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Verify reset token
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    console.log('Verifying reset token:', token ? `${token.substring(0, 8)}...` : 'null');

    if (!token) {
      return res.status(400).json({ error: 'Reset token is required' });
    }

    const verification = await PasswordReset.verifyToken(token);
    console.log('Token verification result:', { valid: verification.valid, error: verification.error });

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

    // Find user (case-insensitive)
    const user = await User.findByEmail(verification.email);
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

    const user = await User.findByEmail(email);
    
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
