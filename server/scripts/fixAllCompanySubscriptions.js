const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/salesbuddy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixAllCompanySubscriptions() {
  try {
    console.log('🔧 Fixing all company subscriptions...');
    
    // Find all companies
    const companies = await Company.find({});
    console.log(`Found ${companies.length} companies`);

    for (const company of companies) {
      console.log(`\n🏢 Processing company: ${company.name} (${company._id})`);
      console.log(`   Current subscription:`, company.subscription);

      // Update company subscription to enterprise if not already
      if (company.subscription.plan !== 'enterprise' || company.subscription.status !== 'active') {
        company.subscription = {
          plan: 'enterprise',
          status: 'active',
          maxUsers: -1, // Unlimited for enterprise
          monthlyConversationLimit: company.subscription.monthlyConversationLimit || 50
        };
        
        await company.save();
        console.log(`   ✅ Updated company subscription to enterprise`);
      } else {
        console.log(`   ✅ Company already has enterprise subscription`);
      }

      // Find all users in this company
      const companyUsers = await User.find({ companyId: company._id });
      console.log(`   Found ${companyUsers.length} users in company`);

      // Update each user's subscription
      for (const user of companyUsers) {
        console.log(`   👤 Updating user: ${user.email}`);
        
        // Update user subscription to match company
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
        console.log(`     ✅ Updated subscription to enterprise with limit: ${user.usage.monthlyLimit}`);
      }
    }

    console.log('\n🎉 All company subscriptions have been fixed!');
    console.log('Summary:');
    console.log('- All companies now have enterprise plan with active status');
    console.log('- All company users now have enterprise subscription');
    console.log('- All users inherit their company\'s monthly conversation limit');

  } catch (error) {
    console.error('❌ Error fixing company subscriptions:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
fixAllCompanySubscriptions();
