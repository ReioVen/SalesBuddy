const mongoose = require('mongoose');
const User = require('./server/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salesbuddy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkUserSubscription() {
  try {
    // Find the user by email
    const user = await User.findOne({ email: 'test@gmail.com' });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User ID:', user._id);
    console.log('Current subscription:', JSON.stringify(user.subscription, null, 2));
    console.log('Current usage:', JSON.stringify(user.usage, null, 2));
    
    // Check if user has Stripe customer ID
    if (user.subscription.stripeCustomerId) {
      console.log('Stripe Customer ID:', user.subscription.stripeCustomerId);
    }
    
    if (user.subscription.stripeSubscriptionId) {
      console.log('Stripe Subscription ID:', user.subscription.stripeSubscriptionId);
    }
    
  } catch (error) {
    console.error('Error checking user subscription:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkUserSubscription();
