const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const Feedback = require('../models/Feedback');

const router = express.Router();

// Debug route loading
console.log('🔍 [FEEDBACK] Loading feedback routes...');
console.log('🔍 [FEEDBACK] Router created:', !!router);
console.log('🔍 [FEEDBACK] Router type:', typeof router);

// Test route to verify feedback routes are working
router.get('/test', (req, res) => {
  console.log('🔍 [FEEDBACK] GET /test route hit');
  res.json({ message: 'Feedback routes are working!', timestamp: new Date().toISOString() });
});

// Test POST route without authentication
router.post('/test', (req, res) => {
  console.log('🔍 [FEEDBACK] POST /test route hit');
  res.json({ message: 'Feedback POST route is working!', timestamp: new Date().toISOString() });
});

// Simple POST route without authentication for testing
router.post('/simple', (req, res) => {
  console.log('🔍 [FEEDBACK] Simple POST route hit:', {
    body: req.body,
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
  res.json({ message: 'Simple feedback route working!', data: req.body, timestamp: new Date().toISOString() });
});

// Anonymous feedback route (no authentication required)
router.post('/anonymous', (req, res) => {
  console.log('🔍 [FEEDBACK] Anonymous feedback route hit:', {
    body: req.body,
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
  
  const feedback = {
    id: Date.now().toString(),
    ...req.body,
    timestamp: new Date().toISOString(),
    status: 'open',
    adminNotes: '',
    userId: null,
    userEmail: req.body.userEmail || 'anonymous@example.com',
    userName: req.body.userName || 'Anonymous'
  };
  
  // Log feedback for monitoring
  console.log('🔍 [BETA FEEDBACK] Anonymous feedback submitted:', {
    id: feedback.id,
    type: feedback.type,
    priority: feedback.priority,
    title: feedback.title,
    user: feedback.userName,
    timestamp: feedback.timestamp
  });
  
  // TODO: Save to database and send email for high priority
  if (feedback.priority === 'high') {
    console.log('📧 [BETA FEEDBACK] High priority feedback - would send email to revotechSB@gmail.com');
  }
  
  res.json({
    success: true,
    message: 'Anonymous feedback submitted successfully',
    feedbackId: feedback.id
  });
});

// Simple feedback submission (with database storage)
router.post('/', (req, res, next) => {
  console.log('🔍 [FEEDBACK] POST / route hit:', {
    method: req.method,
    url: req.url,
    path: req.path,
    body: req.body,
    headers: req.headers,
    authHeader: req.headers.authorization
  });
  next();
}, [
  body('type').isIn(['bug', 'issue', 'feature', 'other']),
  body('priority').isIn(['low', 'medium', 'high']),
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').trim().isLength({ min: 1, max: 2000 })
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
      console.log('❌ [FEEDBACK] Request body:', req.body);
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Create feedback document (handle both authenticated and anonymous users)
    const feedbackData = {
      ...req.body,
      userId: req.body.userId || null,
      userEmail: req.body.userEmail || 'anonymous@example.com',
      userName: req.body.userName || 'Anonymous'
    };
    
    // If user is authenticated, use their information
    if (req.user) {
      feedbackData.userId = req.user._id;
      feedbackData.userEmail = req.user.email;
      feedbackData.userName = `${req.user.firstName} ${req.user.lastName}`;
    }
    
    const feedback = new Feedback(feedbackData);

    // Save to database
    const savedFeedback = await feedback.save();

    // Log feedback for monitoring
    console.log('🔍 [BETA FEEDBACK] New feedback submitted:', {
      id: savedFeedback._id,
      type: savedFeedback.type,
      priority: savedFeedback.priority,
      title: savedFeedback.title,
      user: savedFeedback.userName || 'Anonymous',
      timestamp: savedFeedback.createdAt,
      savedToDatabase: true
    });

    // TODO: Send email for high priority (email service not included to avoid startup issues)
    if (savedFeedback.priority === 'high') {
      console.log('📧 [BETA FEEDBACK] High priority feedback - would send email to revotechSB@gmail.com');
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: savedFeedback._id,
      savedToDatabase: true
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to submit feedback'
    });
  }
});

console.log('🔍 [FEEDBACK] Routes defined, exporting router...');
console.log('🔍 [FEEDBACK] Router stack length:', router.stack?.length || 0);

module.exports = router;
