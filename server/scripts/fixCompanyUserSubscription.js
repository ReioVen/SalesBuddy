const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salesbuddy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixCompanyUserSubscription() {
  try {
    console.log('🔧 Fixing company user subscriptions...');
    
    // Find all users who have a companyId but don't have enterprise subscription
    const usersToFix = await User.find({
      companyId: { $exists: true, $ne: null },
      $or: [
        { 'subscription.plan': { $ne: 'enterprise' } },
        { 'subscription.plan': { $exists: false } },
        { 'subscription.status': { $ne: 'active' } }
      ]
    });

    console.log(`Found ${usersToFix.length} users to fix`);

    for (const user of usersToFix) {
      console.log(`\n👤 Fixing user: ${user.email} (${user._id})`);
      console.log(`   Current subscription:`, user.subscription);
      
      // Get the company to check its subscription
      const company = await Company.findById(user.companyId);
      if (!company) {
        console.log(`   ❌ Company not found for user ${user.email}`);
        continue;
      }

      console.log(`   Company: ${company.name} (${company.subscription.plan})`);

      // Update user subscription to enterprise
      const oldSubscription = { ...user.subscription };
      
      user.subscription = {
        plan: 'enterprise',
        status: 'active',
        stripeCustomerId: 'enterprise_customer',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        cancelAtPeriodEnd: false
      };

      // Update usage limits based on company's monthly conversation limit
      if (company.subscription.monthlyConversationLimit) {
        user.usage.monthlyLimit = company.subscription.monthlyConversationLimit;
      }

      await user.save();

      console.log(`   ✅ Updated subscription from ${oldSubscription.plan || 'none'} to enterprise`);
      console.log(`   ✅ Monthly limit set to: ${user.usage.monthlyLimit}`);
    }

    console.log('\n🎉 Company user subscription fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing company user subscriptions:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the fix
fixCompanyUserSubscription();
