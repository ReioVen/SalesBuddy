const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salesbuddy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./server/models/User');

async function fixAllSubscriptions() {
  try {
    console.log('Starting comprehensive subscription fix...');
    
    // Find all users with test@gmail.com or test1@gmail.com
    const testUsers = await User.find({
      email: { $in: ['test@gmail.com', 'test1@gmail.com'] }
    });
    
    console.log(`Found ${testUsers.length} test users:`);
    
    for (const user of testUsers) {
      console.log(`\n--- User: ${user.email} ---`);
      console.log(`Current plan: ${user.subscription.plan}`);
      console.log(`Current status: ${user.subscription.status}`);
      console.log(`Current monthly limit: ${user.usage.monthlyLimit}`);
      console.log(`Current daily limit: ${user.usage.dailyLimit}`);
      console.log(`Stripe Customer ID: ${user.subscription.stripeCustomerId}`);
      console.log(`Created: ${user.createdAt}`);
      
      // Check if user has a Stripe customer ID (indicating they paid)
      if (user.subscription.stripeCustomerId) {
        console.log('✅ User has Stripe customer ID - they paid for a plan');
        
        // Update to Basic plan with correct limits
        const updateData = {
          'subscription.plan': 'basic',
          'subscription.status': 'active',
          'usage.monthlyLimit': 30,
          'usage.dailyLimit': 30,
          'usage.aiTipsLimit': 10,
          'usage.aiConversations': 0,
          'usage.aiTipsUsed': 0,
          'usage.lastResetDate': new Date(),
          'usage.lastDailyResetDate': new Date(),
          'usage.lastAiTipsResetDate': new Date()
        };
        
        const result = await User.findByIdAndUpdate(user._id, updateData, { new: true });
        console.log('✅ Updated to Basic plan with correct limits');
        console.log(`New plan: ${result.subscription.plan}`);
        console.log(`New monthly limit: ${result.usage.monthlyLimit}`);
        console.log(`New AI tips limit: ${result.usage.aiTipsLimit}`);
      } else {
        console.log('❌ User has no Stripe customer ID - they are on free plan');
        
        // Update to Free plan with correct limits
        const updateData = {
          'subscription.plan': 'free',
          'subscription.status': 'active',
          'usage.monthlyLimit': 10,
          'usage.dailyLimit': 10,
          'usage.aiTipsLimit': 0,
          'usage.aiConversations': 0,
          'usage.aiTipsUsed': 0,
          'usage.lastResetDate': new Date(),
          'usage.lastDailyResetDate': new Date(),
          'usage.lastAiTipsResetDate': new Date()
        };
        
        const result = await User.findByIdAndUpdate(user._id, updateData, { new: true });
        console.log('✅ Updated to Free plan with correct limits');
        console.log(`New plan: ${result.subscription.plan}`);
        console.log(`New monthly limit: ${result.usage.monthlyLimit}`);
        console.log(`New AI tips limit: ${result.usage.aiTipsLimit}`);
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log('All test users have been updated with correct subscription data.');
    console.log('Users with Stripe customer IDs were set to Basic plan (30 conversations, 10 AI tips).');
    console.log('Users without Stripe customer IDs were set to Free plan (3 conversations, 0 AI tips).');
    
  } catch (error) {
    console.error('Error fixing subscriptions:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixAllSubscriptions();