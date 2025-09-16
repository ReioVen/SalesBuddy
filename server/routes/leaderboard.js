const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Cache for leaderboard data (1 hour TTL)
const leaderboardCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

// Helper function to check if cache is valid
const isCacheValid = (cacheEntry) => {
  if (!cacheEntry) return false;
  const now = Date.now();
  return (now - cacheEntry.timestamp) < CACHE_TTL;
};

// Helper function to get cache key
const getCacheKey = (companyId) => `leaderboard_${companyId}`;

// Get leaderboard for company users based on last 5 conversations
router.get('/company/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const requestingUser = req.user;

    // Check if user has permission to view this company's leaderboard
    if (!requestingUser.companyId || !requestingUser.companyId.equals(companyId)) {
      // Allow super admins to view any company's leaderboard
      if (!requestingUser.isSuperAdminUser()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Check cache first
    const cacheKey = getCacheKey(companyId);
    const cachedData = leaderboardCache.get(cacheKey);
    
    if (isCacheValid(cachedData)) {
      console.log(`📊 [LEADERBOARD] Returning cached data for company ${companyId}`);
      return res.json(cachedData.data);
    }

    console.log(`📊 [LEADERBOARD] Fetching fresh data for company ${companyId}`);

    // Get all users in the company
    const companyUsers = await User.find({ 
      companyId: companyId,
      role: { $in: ['company_user', 'company_team_leader', 'company_admin', 'admin'] }
    }).select('_id firstName lastName email role teamId');

    console.log(`📊 [LEADERBOARD] Found ${companyUsers.length} company users`);

    if (companyUsers.length === 0) {
      console.log(`📊 [LEADERBOARD] No company users found for company ${companyId}`);
      return res.json({ 
        leaderboard: [],
        totalUsers: 0,
        usersWithConversations: 0,
        lastUpdated: new Date().toISOString()
      });
    }

    const userIds = companyUsers.map(user => user._id);

    // Get conversations for all company users with AI ratings
    const conversations = await Conversation.find({
      userId: { $in: userIds },
      'aiRatings.totalScore': { $exists: true, $gt: 0 }
    })
    .sort({ createdAt: -1 })
    .select('userId aiRatings createdAt');

    // Debug: Check what conversations exist for these users
    const allUserConversations = await Conversation.find({
      userId: { $in: userIds }
    }).select('userId aiRatings createdAt title');
    console.log(`📊 [LEADERBOARD] All conversations for users:`, allUserConversations.map(c => ({ 
      title: c.title, 
      userId: c.userId, 
      hasAiRatings: !!c.aiRatings,
      totalScore: c.aiRatings?.totalScore,
      aiRatings: c.aiRatings 
    })));

    // If no conversations found, return empty leaderboard
    if (conversations.length === 0) {
      return res.json({ 
        leaderboard: [],
        totalUsers: companyUsers.length,
        usersWithConversations: 0,
        lastUpdated: new Date().toISOString()
      });
    }

    // Group conversations by user and calculate averages
    const userStats = {};
    
    // Initialize user stats
    companyUsers.forEach(user => {
      userStats[user._id.toString()] = {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          teamId: user.teamId
        },
        conversations: [],
        averageScore: 0,
        totalConversations: 0,
        lastConversationDate: null
      };
    });

    // Process conversations and get last 5 for each user
    conversations.forEach(conversation => {
      const userId = conversation.userId.toString();
      if (userStats[userId]) {
        userStats[userId].conversations.push({
          totalScore: conversation.aiRatings.totalScore,
          createdAt: conversation.createdAt
        });
      }
    });

    // Calculate averages for each user (last 5 conversations)
    const leaderboard = [];
    
    Object.values(userStats).forEach(userStat => {
      // Sort conversations by date (newest first) and take last 5
      const recentConversations = userStat.conversations
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      if (recentConversations.length > 0) {
        const totalScore = recentConversations.reduce((sum, conv) => sum + conv.totalScore, 0);
        const averageScore = totalScore / recentConversations.length;
        
        userStat.averageScore = Math.round(averageScore * 100) / 100; // Round to 2 decimal places
        userStat.totalConversations = recentConversations.length;
        userStat.lastConversationDate = recentConversations[0].createdAt;
        
        leaderboard.push(userStat);
      }
    });

    // Sort leaderboard by average score (highest first)
    leaderboard.sort((a, b) => b.averageScore - a.averageScore);

    // Add rank to each entry
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    const responseData = { 
      leaderboard,
      totalUsers: companyUsers.length,
      usersWithConversations: leaderboard.length,
      lastUpdated: new Date().toISOString()
    };

    // Cache the results
    leaderboardCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    console.log(`📊 [LEADERBOARD] Cached fresh data for company ${companyId} (${leaderboard.length} users)`);

    res.json(responseData);

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get leaderboard for current user's company
router.get('/my-company', authenticateToken, async (req, res) => {
  try {
    const requestingUser = req.user;

    if (!requestingUser.companyId) {
      return res.status(400).json({ error: 'User is not associated with a company' });
    }

    // Redirect to company-specific endpoint
    return res.redirect(`/api/leaderboard/company/${requestingUser.companyId}`);
    
  } catch (error) {
    console.error('Error fetching my company leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Clear cache for a specific company (admin only)
router.post('/clear-cache/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const requestingUser = req.user;

    // Only allow company admins or super admins to clear cache
    if (!requestingUser.isSuperAdminUser() && 
        (!requestingUser.companyId || !requestingUser.companyId.equals(companyId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const cacheKey = getCacheKey(companyId);
    leaderboardCache.delete(cacheKey);
    
    console.log(`📊 [LEADERBOARD] Cache cleared for company ${companyId}`);
    
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing leaderboard cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Debug endpoint to check cache status
router.get('/debug/cache/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const requestingUser = req.user;

    // Only allow company admins or super admins to view debug info
    if (!requestingUser.isSuperAdminUser() && 
        (!requestingUser.companyId || !requestingUser.companyId.equals(companyId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const cacheKey = getCacheKey(companyId);
    const cachedData = leaderboardCache.get(cacheKey);
    
    res.json({
      companyId,
      hasCache: !!cachedData,
      cacheValid: isCacheValid(cachedData),
      cacheAge: cachedData ? Date.now() - cachedData.timestamp : null,
      cacheTTL: CACHE_TTL,
      totalCacheEntries: leaderboardCache.size
    });
  } catch (error) {
    console.error('Error getting cache debug info:', error);
    res.status(500).json({ error: 'Failed to get cache debug info' });
  }
});

// Debug endpoint to check user's companyId
router.get('/debug/user-company', authenticateToken, async (req, res) => {
  try {
    const requestingUser = req.user;
    
    res.json({
      userId: requestingUser._id,
      userCompanyId: requestingUser.companyId,
      userRole: requestingUser.role,
      isSuperAdmin: requestingUser.isSuperAdminUser(),
      userEmail: requestingUser.email
    });
  } catch (error) {
    console.error('Error getting user company debug info:', error);
    res.status(500).json({ error: 'Failed to get user company debug info' });
  }
});

// Create test data for leaderboard (for testing purposes)
router.post('/create-test-data/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const requestingUser = req.user;

    // Only allow company admins or super admins to create test data
    if (!requestingUser.isSuperAdminUser() && 
        (!requestingUser.companyId || !requestingUser.companyId.equals(companyId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log(`📊 [LEADERBOARD] Creating test data for company ${companyId}`);

    // Get company users
    const companyUsers = await User.find({ 
      companyId: companyId,
      role: { $in: ['company_user', 'company_team_leader', 'company_admin', 'admin'] }
    }).select('_id firstName lastName email role teamId');

    if (companyUsers.length === 0) {
      return res.status(400).json({ error: 'No users found in company' });
    }

    const testConversations = [];

    // Create test conversations for each user
    for (const user of companyUsers) {
      // Create 5-8 test conversations per user with random scores
      const numConversations = Math.floor(Math.random() * 4) + 5; // 5-8 conversations
      
      for (let i = 0; i < numConversations; i++) {
        const totalScore = Math.floor(Math.random() * 30) + 20; // 20-50 range
        const conversation = new Conversation({
          userId: user._id,
          title: `Test Conversation ${i + 1}`,
          scenario: 'general',
          messages: [
            { role: 'user', content: 'Hello', timestamp: new Date() },
            { role: 'assistant', content: 'Hi there!', timestamp: new Date() }
          ],
          aiRatings: {
            introduction: Math.floor(Math.random() * 10) + 1,
            mapping: Math.floor(Math.random() * 10) + 1,
            productPresentation: Math.floor(Math.random() * 10) + 1,
            objectionHandling: Math.floor(Math.random() * 10) + 1,
            close: Math.floor(Math.random() * 10) + 1,
            totalScore: totalScore,
            maxPossibleScore: 50,
            occurredPhases: {
              introduction: true,
              mapping: true,
              productPresentation: true,
              objectionHandling: true,
              close: true
            }
          },
          isActive: true,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
        });

        testConversations.push(conversation);
      }
    }

    // Save all test conversations
    await Conversation.insertMany(testConversations);

    // Clear cache so fresh data is fetched
    const cacheKey = getCacheKey(companyId);
    leaderboardCache.delete(cacheKey);

    console.log(`📊 [LEADERBOARD] Created ${testConversations.length} test conversations for ${companyUsers.length} users`);

    res.json({ 
      message: `Created ${testConversations.length} test conversations for ${companyUsers.length} users`,
      conversationsCreated: testConversations.length,
      users: companyUsers.length
    });

  } catch (error) {
    console.error('Error creating test data:', error);
    res.status(500).json({ error: 'Failed to create test data' });
  }
});

module.exports = router;
