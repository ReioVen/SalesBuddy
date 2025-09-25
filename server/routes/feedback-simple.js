const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const { sendPasswordResetEmail } = require('../services/emailService');
const nodemailer = require('nodemailer');

const router = express.Router();

// Function to send feedback email using the same email service as forgot password
const sendFeedbackEmail = async (feedback) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    const mailOptions = {
      from: {
        name: 'SalesBuddy Feedback System',
        address: process.env.EMAIL_USER
      },
      to: 'revotechSB@gmail.com',
      subject: `🚨 HIGH PRIORITY FEEDBACK: ${feedback.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0;">🚨 High Priority Feedback</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">SalesBuddy Beta Feedback System</p>
          </div>
          
          <div style="background: #fef2f2; border-radius: 8px; padding: 30px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
            <h2 style="color: #dc2626; margin: 0 0 20px 0;">Feedback Details</h2>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">Title:</strong>
              <span style="color: #1f2937; margin-left: 10px;">${feedback.title}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">Description:</strong>
              <p style="color: #1f2937; margin: 5px 0 0 0; background: #f9fafb; padding: 10px; border-radius: 4px;">${feedback.description}</p>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">User:</strong>
              <span style="color: #1f2937; margin-left: 10px;">${feedback.userName} (${feedback.userEmail})</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">Priority:</strong>
              <span style="color: #dc2626; font-weight: bold; margin-left: 10px; background: #fef2f2; padding: 4px 8px; border-radius: 4px;">${feedback.priority.toUpperCase()}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">Type:</strong>
              <span style="color: #1f2937; margin-left: 10px;">${feedback.type}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">URL:</strong>
              <a href="${feedback.url}" style="color: #2563eb; margin-left: 10px;">${feedback.url}</a>
            </div>
          </div>
          
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin: 0 0 15px 0;">Technical Details</h3>
            <div style="margin-bottom: 10px;">
              <strong style="color: #6b7280;">User Agent:</strong>
              <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 12px; word-break: break-all;">${feedback.userAgent}</p>
            </div>
            <div>
              <strong style="color: #6b7280;">Timestamp:</strong>
              <span style="color: #6b7280; margin-left: 10px;">${feedback.createdAt}</span>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">This is an automated notification from SalesBuddy Beta Feedback System.</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('📧 [FEEDBACK EMAIL] Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ [FEEDBACK EMAIL] Error sending email:', error);
    return false;
  }
};

// Debug route loading
console.log('🔍 [FEEDBACK] Loading feedback routes...');
console.log('🔍 [FEEDBACK] Router created:', !!router);
console.log('🔍 [FEEDBACK] Router type:', typeof router);

// Check email service configuration
console.log('📧 [FEEDBACK] Email service configuration:', {
  hasEmailService: !!simpleEmailService,
  emailUser: process.env.EMAIL_USER ? 'Set' : 'Not set',
  emailPassword: (process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS) ? 'Set' : 'Not set'
});

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

// Test email service
router.post('/test-email', async (req, res) => {
  try {
    console.log('📧 [FEEDBACK] Testing email service...');
    const testFeedback = {
      _id: 'test-id',
      type: 'bug',
      priority: 'high',
      title: 'Test High Priority Feedback',
      description: 'This is a test email to verify the email service is working.',
      userName: 'Test User',
      userEmail: 'test@example.com',
      createdAt: new Date()
    };
    
    const emailSent = await simpleEmailService.sendHighPriorityFeedbackNotification(testFeedback);
    res.json({ 
      message: 'Email test completed', 
      emailSent,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('❌ [FEEDBACK] Email test failed:', error);
    res.status(500).json({ 
      error: 'Email test failed', 
      message: error.message 
    });
  }
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

    // Send email notification for high priority feedback using the same email service as forgot password
    if (savedFeedback.priority === 'high') {
      try {
        console.log('📧 [BETA FEEDBACK] Sending high priority email notification...');
        const emailSent = await sendFeedbackEmail(savedFeedback);
        
        if (emailSent) {
          // Update feedback to mark email as sent
          await Feedback.findByIdAndUpdate(savedFeedback._id, {
            emailSent: true,
            emailSentAt: new Date()
          });
          console.log('📧 [BETA FEEDBACK] High priority email notification sent to revotechSB@gmail.com');
        } else {
          console.log('❌ [BETA FEEDBACK] Failed to send email - feedback logged to console');
          // Log feedback details as fallback
          console.log('📧 [BETA FEEDBACK] FALLBACK - High priority feedback details:');
          console.log('📧 [BETA FEEDBACK] Title:', savedFeedback.title);
          console.log('📧 [BETA FEEDBACK] Description:', savedFeedback.description);
          console.log('📧 [BETA FEEDBACK] User:', savedFeedback.userName);
          console.log('📧 [BETA FEEDBACK] Email:', savedFeedback.userEmail);
          console.log('📧 [BETA FEEDBACK] Priority:', savedFeedback.priority);
          console.log('📧 [BETA FEEDBACK] Type:', savedFeedback.type);
          console.log('📧 [BETA FEEDBACK] URL:', savedFeedback.url);
          console.log('📧 [BETA FEEDBACK] User Agent:', savedFeedback.userAgent);
          console.log('📧 [BETA FEEDBACK] Timestamp:', savedFeedback.createdAt);
        }
      } catch (error) {
        console.error('❌ [BETA FEEDBACK] Error sending high priority email:', error);
        // Don't fail the request if email fails
      }
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
