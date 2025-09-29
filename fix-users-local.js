const mongoose = require('mongoose');

// Use your Railway MongoDB connection string
const MONGODB_URI = 'your_railway_mongodb_connection_string_here';

async function fixUsers() {
  try {
    console.log('🔗 Connecting to Railway database...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to Railway database');

    // Import models
    const User = require('./server/models/User');
    const Company = require('./server/models/Company');

    console.log('🔧 Fixing user subscriptions...');
    
    // Find users to fix
    const usersToFix = await User.find({
      companyId: { $exists: true, $ne: null },
      $or: [
        { 'subscription.plan': { $ne: 'enterprise' } },
        { 'subscription.plan': { $exists: false } },
        { 'subscription.status': { $ne: 'active' } }
      ]
    });

    console.log(`Found ${usersToFix.length} users to fix`);

    let fixedCount = 0;
    for (const user of usersToFix) {
      const company = await Company.findById(user.companyId);
      if (!company) continue;

      console.log(`Fixing ${user.email} (${user.subscription?.plan || 'none'} → enterprise)`);
      
      user.subscription = {
        plan: 'enterprise',
        status: 'active',
        stripeCustomerId: 'enterprise_customer',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false
      };

      user.usage.monthlyLimit = company.subscription?.monthlyConversationLimit || 50;
      
      await user.save();
      fixedCount++;
    }

    console.log(`✅ Fixed ${fixedCount} users successfully!`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

fixUsers();
