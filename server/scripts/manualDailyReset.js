const mongoose = require('mongoose');
const User = require('../models/User');

// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function manualDailyReset() {
  try {
    // Connect to MongoDB
    const mongoUri = (process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== '')
      ? process.env.MONGODB_URI
      : 'mongodb://127.0.0.1:27017/salesbuddy';

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('Starting manual daily reset for enterprise users...');
    
    // Find all enterprise users with companies (they are considered paid)
    const enterpriseUsers = await User.find({
      'subscription.plan': 'enterprise',
      companyId: { $exists: true, $ne: null }
    });

    console.log(`Found ${enterpriseUsers.length} enterprise users to reset`);

    let resetCount = 0;
    const now = new Date();

    for (const user of enterpriseUsers) {
      try {
        // Reset daily usage
        await User.findByIdAndUpdate(user._id, {
          $set: {
            'usage.aiConversations': 0,
            'usage.lastDailyResetDate': now
          }
        });
        
        resetCount++;
        console.log(`Reset daily limit for user: ${user.email} (was ${user.usage.aiConversations} conversations)`);
      } catch (error) {
        console.error(`Error resetting user ${user.email}:`, error);
      }
    }

    console.log(`\n=== MANUAL DAILY RESET COMPLETED ===`);
    console.log(`✅ Reset ${resetCount} enterprise users`);
    console.log(`✅ All daily conversation counts set to 0`);
    console.log(`✅ Last daily reset date updated to: ${now.toISOString()}`);
    console.log(`\nUsers can now use their full daily limit of 50 AI conversations.`);

  } catch (error) {
    console.error('Manual reset error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the manual reset
manualDailyReset();
