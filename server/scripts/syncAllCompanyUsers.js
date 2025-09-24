const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salesbuddy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function syncAllCompanyUsers() {
  try {
    console.log('🔄 Syncing all company users with their company subscriptions...');
    
    const syncedCount = await User.syncAllCompanyUsers();
    
    console.log(`✅ Successfully synced ${syncedCount} company users`);
    
    // Show some examples of what was synced
    const companyUsers = await User.find({
      companyId: { $exists: true, $ne: null },
      'subscription.plan': 'enterprise'
    }).limit(5);
    
    console.log('\n📋 Sample synced users:');
    companyUsers.forEach(user => {
      console.log(`   ${user.email} - ${user.subscription.plan} - Monthly limit: ${user.usage.monthlyLimit}`);
    });
    
  } catch (error) {
    console.error('❌ Error syncing company users:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the sync
syncAllCompanyUsers();
