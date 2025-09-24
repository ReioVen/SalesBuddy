const mongoose = require('mongoose');
const User = require('../models/User');

// Load environment variables
require('dotenv').config();

const normalizeAllGmailEmails = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/salesbuddy');
    console.log('Connected to MongoDB');

    // Find all users with Gmail addresses
    const gmailUsers = await User.find({ 
      email: { $regex: '@gmail\\.com$', $options: 'i' } 
    });

    console.log(`Found ${gmailUsers.length} Gmail users`);

    let updatedCount = 0;

    for (const user of gmailUsers) {
      const originalEmail = user.email;
      const normalizedEmail = User.normalizeEmail(originalEmail);
      
      if (originalEmail !== normalizedEmail) {
        console.log(`Updating ${user.firstName} ${user.lastName}:`);
        console.log(`  From: ${originalEmail}`);
        console.log(`  To:   ${normalizedEmail}`);
        
        user.email = normalizedEmail;
        await user.save();
        updatedCount++;
      }
    }

    console.log(`\n✅ Normalization complete!`);
    console.log(`Updated ${updatedCount} users out of ${gmailUsers.length} Gmail users`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
normalizeAllGmailEmails();
