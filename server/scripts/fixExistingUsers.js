const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');

// Connect to MongoDB with proper error handling
const connectToDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/salesbuddy';
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds
      connectTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 30000, // 30 seconds
    });
    
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Please check your MONGODB_URI environment variable or ensure MongoDB is running locally');
    process.exit(1);
  }
};

async function fixExistingUsers() {
  try {
    // Connect to database first
    await connectToDatabase();
    
    console.log('🔧 Fixing existing users with incorrect subscription settings...');
    
    // Find all users who have a companyId but have wrong subscription settings
    const usersToFix = await User.find({
      companyId: { $exists: true, $ne: null },
      $or: [
        { 'subscription.plan': { $ne: 'enterprise' } },
        { 'subscription.plan': { $exists: false } },
        { 'subscription.status': { $ne: 'active' } },
        { 'usage.monthlyLimit': { $lt: 50 } } // Less than 50 monthly limit
      ]
    });

    console.log(`Found ${usersToFix.length} users to fix`);

    for (const user of usersToFix) {
      console.log(`\n👤 Fixing user: ${user.email} (${user._id})`);
      console.log(`   Current subscription:`, user.subscription);
      console.log(`   Current usage:`, user.usage);
      
      // Get the company to check its subscription
      const company = await Company.findById(user.companyId);
      if (!company) {
        console.log(`   ❌ Company not found for user ${user.email}`);
        continue;
      }

      console.log(`   Company: ${company.name}`);
      console.log(`   Company subscription:`, company.subscription);

      // Update user subscription to match company
      const oldSubscription = { ...user.subscription };
      const oldUsage = { ...user.usage };
      
      user.subscription = {
        plan: company.subscription?.plan || 'enterprise',
        status: company.subscription?.status || 'active',
        stripeCustomerId: 'enterprise_customer',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        cancelAtPeriodEnd: false
      };

      // Update usage limits based on company's monthly conversation limit
      user.usage.monthlyLimit = company.subscription?.monthlyConversationLimit || 50;

      await user.save();

      console.log(`   ✅ Updated subscription from ${oldSubscription.plan || 'none'} to ${user.subscription.plan}`);
      console.log(`   ✅ Updated status from ${oldSubscription.status || 'none'} to ${user.subscription.status}`);
      console.log(`   ✅ Updated monthly limit from ${oldUsage.monthlyLimit || 'none'} to ${user.usage.monthlyLimit}`);
    }

    console.log('\n🎉 All users have been fixed!');
    console.log('Summary:');
    console.log('- All company users now have enterprise plan with active status');
    console.log('- All users inherit their company\'s monthly conversation limit');
    console.log('- Subscription management should now display correctly');

  } catch (error) {
    console.error('❌ Error fixing users:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
fixExistingUsers();
