const mongoose = require('mongoose');
const User = require('../models/User');

// Load environment variables
require('dotenv').config();

const fixGmailEmail = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/salesbuddy');
    console.log('Connected to MongoDB');

    // Find the specific user
    const userId = '68d476e66031c318d74c1643';
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('Current email:', user.email);
    
    // Normalize the email
    const normalizedEmail = User.normalizeEmail(user.email);
    console.log('Normalized email:', normalizedEmail);
    
    // Update the user's email if it needs normalization
    if (user.email !== normalizedEmail) {
      user.email = normalizedEmail;
      await user.save();
      console.log('✅ User email updated successfully');
    } else {
      console.log('ℹ️ Email was already normalized');
    }

    console.log('Script completed successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
fixGmailEmail();
