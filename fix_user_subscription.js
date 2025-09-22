const mongoose = require('mongoose');
const User = require('./server/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salesbuddy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixUserSubscription() {
  try {
    // Find the user by email
    const user = await User.findOne({ email: 'test@gmail.com' });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('Current user subscription:', user.subscription);
    
    // Fix the subscription to be free
    const updateData = {
      'subscription.plan': 'free',
      'subscription.status': 'inactive',
      'subscription.stripeCustomerId': undefined,
      'subscription.stripeSubscriptionId': undefined,
      'subscription.currentPeriodStart': undefined,
      'subscription.currentPeriodEnd': undefined,
      'subscription.cancelAtPeriodEnd': false,
      'usage.aiConversations': 0,
      'usage.monthlyLimit': 10, // Free plan limit
      'usage.dailyLimit': 10,
      'usage.lastResetDate': new Date()
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    const result = await User.findByIdAndUpdate(user._id, updateData, { new: true });
    
    console.log('Updated user subscription:', result.subscription);
    console.log('Updated user usage:', result.usage);
    console.log('User subscription fixed successfully!');
    
  } catch (error) {
    console.error('Error fixing user subscription:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixUserSubscription();
