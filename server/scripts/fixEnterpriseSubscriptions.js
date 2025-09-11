const mongoose = require('mongoose');
const User = require('../models/User');

// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function fixEnterpriseSubscriptions() {
  try {
    // Connect to MongoDB
    const mongoUri = (process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== '')
      ? process.env.MONGODB_URI
      : 'mongodb://127.0.0.1:27017/salesbuddy';

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find all enterprise users with companies
    const enterpriseUsers = await User.find({
      'subscription.plan': 'enterprise',
      companyId: { $exists: true, $ne: null }
    });

    console.log(`Found ${enterpriseUsers.length} enterprise users to fix`);

    let fixedCount = 0;
    const now = new Date();
    const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    for (const user of enterpriseUsers) {
      try {
        // Update subscription to have proper setup
        await User.findByIdAndUpdate(user._id, {
          $set: {
            'subscription.status': 'active',
            'subscription.stripeCustomerId': 'enterprise_customer',
            'subscription.currentPeriodStart': now,
            'subscription.currentPeriodEnd': oneYearFromNow,
            'subscription.cancelAtPeriodEnd': false,
            'usage.dailyLimit': 50,
            'usage.lastDailyResetDate': now
          }
        });
        
        fixedCount++;
        console.log(`Fixed subscription for user: ${user.email}`);
      } catch (error) {
        console.error(`Error fixing user ${user.email}:`, error);
      }
    }

    console.log(`\nFixed ${fixedCount} enterprise user subscriptions`);
    console.log('All enterprise users now have proper subscription setup with:');
    console.log('- Active status');
    console.log('- Enterprise customer ID');
    console.log('- 1-year billing period');
    console.log('- 50 daily chat limit');
    console.log('- Daily reset tracking');

  } catch (error) {
    console.error('Fix error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the fix
fixEnterpriseSubscriptions();
