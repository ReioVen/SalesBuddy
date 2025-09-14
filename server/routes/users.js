const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const ConversationSummary = require('../models/ConversationSummary');
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
        settings: user.settings,
        language: user.language
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
  body('experienceLevel').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('language').optional().isIn(['en', 'et', 'es', 'ru'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { industry, salesRole, experienceLevel, language } = req.body;
    const updateData = {};

    if (industry !== undefined) updateData['settings.industry'] = industry;
    if (salesRole !== undefined) updateData['settings.salesRole'] = salesRole;
    if (experienceLevel !== undefined) updateData['settings.experienceLevel'] = experienceLevel;
    if (language !== undefined) updateData['language'] = language;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Settings updated successfully',
      settings: user.settings,
      language: user.language
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

// Delete user account and all associated data
router.delete('/delete-account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log(`Starting account deletion for user: ${userId}`);

    // Delete all user's conversations
    const deletedConversations = await Conversation.deleteMany({ userId });
    console.log(`Deleted ${deletedConversations.deletedCount} conversations`);

    // Delete all user's conversation summaries
    const deletedSummaries = await ConversationSummary.deleteMany({ userId });
    console.log(`Deleted ${deletedSummaries.deletedCount} conversation summaries`);

    // Delete the user account
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.log(`Deleted user account: ${deletedUser.email}`);

    // Log the deletion for audit purposes
    console.log(`Account deletion completed for user: ${userId} (${deletedUser.email})`);

    res.json({ 
      success: true,
      message: 'Account and all associated data deleted successfully',
      deletedData: {
        conversations: deletedConversations.deletedCount,
        summaries: deletedSummaries.deletedCount,
        user: true
      }
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete account',
      message: 'An error occurred while deleting your account. Please try again or contact support.'
    });
  }
});

module.exports = router; 