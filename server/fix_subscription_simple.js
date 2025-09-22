require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB using the same connection string as the server
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/salesbuddy';

async function fixSubscription() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Import User model after connection
    const User = require('./models/User');
    
    console.log('Looking for user with email: test@gmail.com');
    const user = await User.findOne({ email: 'test@gmail.com' });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('Found user:', user.email);
    console.log('Current plan:', user.subscription.plan);
    console.log('Current status:', user.subscription.status);
    console.log('Current monthly limit:', user.usage.monthlyLimit);
    
    // Update to Basic plan
    const updateData = {
      'subscription.plan': 'basic',
      'subscription.status': 'active',
      'usage.monthlyLimit': 200,
      'usage.dailyLimit': 200,
      'usage.aiConversations': 0
    };
    
    const result = await User.findByIdAndUpdate(user._id, updateData, { new: true });
    
    console.log('Updated successfully!');
    console.log('New plan:', result.subscription.plan);
    console.log('New status:', result.subscription.status);
    console.log('New monthly limit:', result.usage.monthlyLimit);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed');
  }
}

fixSubscription();
