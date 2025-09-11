const mongoose = require('mongoose');
const User = require('../models/User');
const dailyRefreshService = require('../services/dailyRefreshService');

// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function testDailyRefresh() {
  try {
    // Connect to MongoDB
    const mongoUri = (process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== '')
      ? process.env.MONGODB_URI
      : 'mongodb://127.0.0.1:27017/salesbuddy';

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Test the daily refresh service
    console.log('\n=== Testing Daily Refresh Service ===');
    
    // Get service status
    const status = dailyRefreshService.getStatus();
    console.log('Service Status:', status);

    // Manually trigger a reset
    console.log('\nTriggering manual daily reset...');
    const result = await dailyRefreshService.manualReset();
    console.log('Reset Result:', result);

    // Check enterprise users
    const enterpriseUsers = await User.find({
      'subscription.plan': 'enterprise',
      companyId: { $exists: true, $ne: null }
    }).select('email subscription.plan subscription.status companyId usage.aiConversations usage.lastDailyResetDate');

    console.log('\n=== Enterprise Users ===');
    console.log(`Found ${enterpriseUsers.length} enterprise users:`);
    enterpriseUsers.forEach(user => {
      console.log(`- ${user.email}: ${user.usage.aiConversations} conversations, last reset: ${user.usage.lastDailyResetDate}`);
    });

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the test
testDailyRefresh();
