const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Store feedback in memory (in production, you'd want to use a database)
let feedbackStore = [];

// Submit feedback
router.post('/', authenticateToken, [
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

    const feedback = {
      id: Date.now().toString(),
      ...req.body,
      timestamp: new Date().toISOString(),
      status: 'open',
      adminNotes: ''
    };

    // Store feedback
    feedbackStore.push(feedback);

    // Log feedback for monitoring
    console.log('🔍 [BETA FEEDBACK] New feedback submitted:', {
      id: feedback.id,
      type: feedback.type,
      priority: feedback.priority,
      title: feedback.title,
      user: feedback.userName || 'Anonymous',
      timestamp: feedback.timestamp
    });

    // In production, you might want to:
    // 1. Save to database
    // 2. Send email notification to admin
    // 3. Create ticket in support system
    // 4. Send to monitoring service

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

    // Sort by timestamp (newest first)
    const sortedFeedback = feedbackStore.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    res.json({
      success: true,
      feedback: sortedFeedback,
      total: sortedFeedback.length
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

    const feedbackIndex = feedbackStore.findIndex(f => f.id === id);
    if (feedbackIndex === -1) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Feedback not found'
      });
    }

    // Update feedback
    if (status) feedbackStore[feedbackIndex].status = status;
    if (adminNotes !== undefined) feedbackStore[feedbackIndex].adminNotes = adminNotes;
    feedbackStore[feedbackIndex].updatedAt = new Date().toISOString();

    console.log('🔍 [BETA FEEDBACK] Feedback updated:', {
      id,
      status,
      updatedBy: req.user.email
    });

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      feedback: feedbackStore[feedbackIndex]
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

    const stats = {
      total: feedbackStore.length,
      byType: {},
      byPriority: {},
      byStatus: {},
      recent: feedbackStore.filter(f => 
        new Date(f.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length
    };

    // Calculate statistics
    feedbackStore.forEach(feedback => {
      // By type
      stats.byType[feedback.type] = (stats.byType[feedback.type] || 0) + 1;
      
      // By priority
      stats.byPriority[feedback.priority] = (stats.byPriority[feedback.priority] || 0) + 1;
      
      // By status
      stats.byStatus[feedback.status] = (stats.byStatus[feedback.status] || 0) + 1;
    });

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
