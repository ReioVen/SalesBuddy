const mongoose = require('mongoose');
const User = require('./server/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salesbuddy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixUserSubscriptionFromStripe() {
  try {
    // Find the user by email
    const user = await User.findOne({ email: 'test@gmail.com' });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('Current user subscription:', user.subscription);
    console.log('Current user usage:', user.usage);
    
    // Based on your Stripe dashboard, you have a Basic plan subscription
    // Let's update the user to have the correct Basic plan configuration
    const updateData = {
      'subscription.plan': 'basic',
      'subscription.status': 'active',
      'subscription.stripeCustomerId': user.subscription.stripeCustomerId || 'cus_T6M20jUrlPeakT', // From server logs
      'subscription.stripeSubscriptionId': user.subscription.stripeSubscriptionId, // Keep existing if any
      'subscription.currentPeriodStart': new Date('2024-09-22'), // Based on your Stripe invoice date
      'subscription.currentPeriodEnd': new Date('2024-10-22'), // Next billing date
      'subscription.cancelAtPeriodEnd': false,
      'usage.aiConversations': 0, // Reset usage
      'usage.monthlyLimit': 200, // Basic plan limit
      'usage.dailyLimit': 200, // Basic plan limit
      'usage.lastResetDate': new Date()
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    console.log('Updating with data:', updateData);
    
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

fixUserSubscriptionFromStripe();
