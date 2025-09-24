const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salesbuddy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function removeDailyLimitFromUsers() {
  try {
    console.log('🔧 Removing dailyLimit from all users...');
    
    // Find all users who have dailyLimit in their usage
    const usersWithDailyLimit = await User.find({
      'usage.dailyLimit': { $exists: true }
    });

    console.log(`Found ${usersWithDailyLimit.length} users with dailyLimit`);

    let updatedCount = 0;
    for (const user of usersWithDailyLimit) {
      console.log(`\n👤 Updating user: ${user.email} (${user._id})`);
      console.log(`   Current dailyLimit: ${user.usage.dailyLimit}`);
      
      // Remove dailyLimit from usage
      delete user.usage.dailyLimit;
      
      await user.save();
      updatedCount++;
      
      console.log(`   ✅ Removed dailyLimit`);
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} users!`);
    
    // Also update the sync method to ensure company users get proper monthly limits
    console.log('\n🔄 Syncing company users with proper monthly limits...');
    const syncedCount = await User.syncAllCompanyUsers();
    console.log(`✅ Synced ${syncedCount} company users`);
    
  } catch (error) {
    console.error('❌ Error removing dailyLimit from users:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the fix
removeDailyLimitFromUsers();
