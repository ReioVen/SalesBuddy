const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const limits = user.getSubscriptionLimits();
    
    // Get recent conversations
    const recentConversations = await Conversation.getUserHistory(req.user._id, 5, 0);
    
    // Get usage statistics
    const totalConversations = await Conversation.countDocuments({ 
      userId: req.user._id, 
      isActive: true 
    });
    
    const thisMonthConversations = await Conversation.countDocuments({
      userId: req.user._id,
      isActive: true,
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        company: user.company,
        role: user.role,
        subscription: user.subscription,
        usage: user.usage,
        settings: user.settings
      },
      limits,
      stats: {
        totalConversations,
        thisMonthConversations,
        usagePercentage: limits.conversations > 0 
          ? Math.round((user.usage.aiConversations / limits.conversations) * 100)
          : 0
      },
      recentConversations: recentConversations.map(conv => conv.getSummary())
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Update user settings
router.put('/settings', authenticateToken, [
  body('industry').optional().trim(),
  body('salesRole').optional().trim(),
  body('experienceLevel').optional().isIn(['beginner', 'intermediate', 'advanced'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { industry, salesRole, experienceLevel } = req.body;
    const updateData = {};

    if (industry !== undefined) updateData['settings.industry'] = industry;
    if (salesRole !== undefined) updateData['settings.salesRole'] = salesRole;
    if (experienceLevel !== undefined) updateData['settings.experienceLevel'] = experienceLevel;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Settings updated successfully',
      settings: user.settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get user analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get conversations in the period
    const conversations = await Conversation.find({
      userId: req.user._id,
      isActive: true,
      createdAt: { $gte: startDate }
    });

    // Calculate analytics
    const totalConversations = conversations.length;
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
    const totalTokens = conversations.reduce((sum, conv) => sum + conv.totalTokens, 0);
    const averageRating = conversations.length > 0 
      ? conversations.reduce((sum, conv) => sum + (conv.rating || 0), 0) / conversations.length
      : 0;

    // Group by scenario
    const scenarioStats = conversations.reduce((acc, conv) => {
      const scenario = conv.scenario;
      acc[scenario] = (acc[scenario] || 0) + 1;
      return acc;
    }, {});

    // Daily activity
    const dailyActivity = {};
    conversations.forEach(conv => {
      const date = conv.createdAt.toISOString().split('T')[0];
      dailyActivity[date] = (dailyActivity[date] || 0) + 1;
    });

    res.json({
      period: days,
      stats: {
        totalConversations,
        totalMessages,
        totalTokens,
        averageRating: Math.round(averageRating * 10) / 10,
        averageMessagesPerConversation: totalConversations > 0 
          ? Math.round((totalMessages / totalConversations) * 10) / 10
          : 0
      },
      scenarioStats,
      dailyActivity
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// Export user data
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const conversations = await Conversation.find({
      userId: req.user._id,
      isActive: true
    }).sort({ createdAt: -1 });

    const exportData = {
      user: {
        profile: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          company: user.company,
          role: user.role,
          settings: user.settings,
          createdAt: user.createdAt
        },
        subscription: user.subscription,
        usage: user.usage
      },
      conversations: conversations.map(conv => ({
        id: conv._id,
        title: conv.title,
        scenario: conv.scenario,
        messages: conv.messages,
        totalTokens: conv.totalTokens,
        duration: conv.duration,
        rating: conv.rating,
        feedback: conv.feedback,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      })),
      exportDate: new Date().toISOString()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="salesbuddy-export-${Date.now()}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Delete user account
router.delete('/account', authenticateToken, [
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password } = req.body;

    // Verify password
    const isPasswordValid = await req.user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Password is incorrect' });
    }

    // Soft delete user and conversations
    await User.findByIdAndUpdate(req.user._id, { isActive: false });
    await Conversation.updateMany(
      { userId: req.user._id },
      { isActive: false }
    );

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router; 