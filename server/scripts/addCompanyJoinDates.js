const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');

// Load environment variables (same as server)
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function addCompanyJoinDates() {
  console.log('🚀 Starting addCompanyJoinDates script...');
  try {
    // Connect to MongoDB (use same as server)
    const mongoUri = (process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== '')
      ? process.env.MONGODB_URI
      : 'mongodb://127.0.0.1:27017/salesbuddy';
    console.log('🔗 Connecting to MongoDB:', mongoUri.includes('127.0.0.1') ? 'local' : 'remote');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Update Company model to include join dates for users
    // We'll add a companyJoinedAt field to the User model instead of modifying Company
    
    console.log('🔧 Adding companyJoinedAt field to users...');
    
    // Find all users that belong to companies
    const usersWithCompanies = await User.find({ 
      companyId: { $exists: true, $ne: null } 
    });

    console.log(`👥 Found ${usersWithCompanies.length} users with companies`);

    let updatedCount = 0;
    for (const user of usersWithCompanies) {
      // If user doesn't have companyJoinedAt, set it to their createdAt date
      if (!user.companyJoinedAt) {
        user.companyJoinedAt = user.createdAt || new Date();
        await user.save();
        updatedCount++;
        console.log(`✅ Updated ${user.email} with company join date: ${user.companyJoinedAt.toLocaleDateString()}`);
      }
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} users with company join dates!`);

    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    const adminUser = await User.findOne({ email: 'admin@salesbuddy.com' });
    const reioUser = await User.findOne({ email: 'reiovendelin3@gmail.com' });

    if (adminUser) {
      console.log(`👤 Admin User: ${adminUser.email}`);
      console.log(`   - Account Created: ${adminUser.createdAt ? new Date(adminUser.createdAt).toLocaleDateString() : 'N/A'}`);
      console.log(`   - Company Joined: ${adminUser.companyJoinedAt ? new Date(adminUser.companyJoinedAt).toLocaleDateString() : 'N/A'}`);
      console.log(`   - Role: ${adminUser.role}`);
    }

    if (reioUser) {
      console.log(`👤 Reio User: ${reioUser.email}`);
      console.log(`   - Account Created: ${reioUser.createdAt ? new Date(reioUser.createdAt).toLocaleDateString() : 'N/A'}`);
      console.log(`   - Company Joined: ${reioUser.companyJoinedAt ? new Date(reioUser.companyJoinedAt).toLocaleDateString() : 'N/A'}`);
      console.log(`   - Role: ${reioUser.role}`);
    }

  } catch (error) {
    console.error('❌ Error adding company join dates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
addCompanyJoinDates();
