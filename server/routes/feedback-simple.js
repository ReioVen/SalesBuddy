const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Debug route loading
console.log('🔍 [FEEDBACK] Loading feedback routes...');

// Test route to verify feedback routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Feedback routes are working!', timestamp: new Date().toISOString() });
});

// Simple feedback submission (without database for now)
router.post('/', authenticateToken, [
  body('type').isIn(['bug', 'issue', 'feature', 'other']),
  body('priority').isIn(['low', 'medium', 'high']),
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').trim().isLength({ min: 10, max: 2000 })
], async (req, res) => {
  try {
    console.log('🔍 [FEEDBACK] Received feedback submission:', {
      method: req.method,
      url: req.url,
      body: req.body,
      user: req.user ? req.user.email : 'No user'
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ [FEEDBACK] Validation errors:', errors.array());
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const feedback = {
      id: Date.now().toString(),
      ...req.body,
      timestamp: new Date().toISOString(),
      status: 'open',
      adminNotes: '',
      userId: req.user._id,
      userEmail: req.user.email,
      userName: `${req.user.firstName} ${req.user.lastName}`
    };

    // Log feedback for monitoring
    console.log('🔍 [BETA FEEDBACK] New feedback submitted:', {
      id: feedback.id,
      type: feedback.type,
      priority: feedback.priority,
      title: feedback.title,
      user: feedback.userName || 'Anonymous',
      timestamp: feedback.timestamp
    });

    // TODO: Save to database and send email for high priority
    if (feedback.priority === 'high') {
      console.log('📧 [BETA FEEDBACK] High priority feedback - would send email to revotechSB@gmail.com');
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: feedback.id
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to submit feedback'
    });
  }
});

module.exports = router;
