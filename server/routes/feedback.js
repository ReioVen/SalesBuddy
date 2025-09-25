const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const feedbackEmailService = require('../services/feedbackEmailService');

const router = express.Router();

// Submit feedback (with optional authentication)
router.post('/', [
  body('type').isIn(['bug', 'issue', 'feature', 'other']),
  body('priority').isIn(['low', 'medium', 'high']),
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').trim().isLength({ min: 10, max: 2000 }),
  body('userAgent').optional().isString(),
  body('url').optional().isURL(),
  body('userId').optional().isMongoId(),
  body('userEmail').optional().isEmail(),
  body('userName').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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

    // Send email notification for high priority feedback
    if (savedFeedback.isHighPriority()) {
      try {
        const emailSent = await feedbackEmailService.sendHighPriorityFeedbackNotification(savedFeedback);
        if (emailSent) {
          // Update feedback to mark email as sent
          await Feedback.findByIdAndUpdate(savedFeedback._id, {
            emailSent: true,
            emailSentAt: new Date()
          });
          console.log('📧 [BETA FEEDBACK] High priority email notification sent');
        }
      } catch (error) {
        console.error('❌ [BETA FEEDBACK] Failed to send email notification:', error);
        // Don't fail the request if email fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: savedFeedback._id,
      emailSent: savedFeedback.isHighPriority()
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to submit feedback'
    });
  }
});

// Get feedback (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admins can view feedback'
      });
    }

    // Get query parameters for filtering and pagination
    const { status, priority, type, page = 1, limit = 50 } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (type) filter.type = type;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch feedback with pagination and sorting
    const feedback = await Feedback.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Feedback.countDocuments(filter);

    res.json({
      success: true,
      feedback,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch feedback'
    });
  }
});

// Update feedback status (admin only)
router.patch('/:id', authenticateToken, [
  body('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']),
  body('adminNotes').optional().isString()
], async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admins can update feedback'
      });
    }

    const { id } = req.params;
    const { status, adminNotes } = req.body;

    // Find and update feedback
    const updateData = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedFeedback) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Feedback not found'
      });
    }

    console.log('🔍 [BETA FEEDBACK] Feedback updated:', {
      id,
      status,
      updatedBy: req.user.email
    });

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      feedback: updatedFeedback
    });

  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update feedback'
    });
  }
});

// Get feedback statistics (admin only)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admins can view feedback statistics'
      });
    }

    // Get statistics using the model's static method
    const stats = await Feedback.getStats();

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch feedback statistics'
    });
  }
});

module.exports = router;
