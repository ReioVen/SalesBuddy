const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');

// Load environment variables (same as server)
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function fixCompanyJoinDates() {
  console.log('🚀 Starting fixCompanyJoinDates script...');
  try {
    // Connect to MongoDB (use same as server)
    const mongoUri = (process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== '')
      ? process.env.MONGODB_URI
      : 'mongodb://127.0.0.1:27017/salesbuddy';
    console.log('🔗 Connecting to MongoDB:', mongoUri.includes('127.0.0.1') ? 'local' : 'remote');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all companies
    const companies = await Company.find({}).populate('users', 'email firstName lastName createdAt');
    
    console.log(`📊 Found ${companies.length} companies`);

    for (const company of companies) {
      console.log(`\n🏢 Processing company: ${company.name} (${company.companyId})`);
      console.log(`👥 Users in company: ${company.users.length}`);

      for (const user of company.users) {
        console.log(`👤 User: ${user.email} (${user.firstName} ${user.lastName})`);
        console.log(`📅 User account created: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}`);
        
        // For now, we'll use the user's createdAt as their company join date
        // In a proper implementation, we'd add a joinedAt field to track when they joined the company
        console.log(`✅ Using account creation date as company join date`);
      }
    }

    // Let's also check the specific users mentioned in the issue
    const adminUser = await User.findOne({ email: 'admin@salesbuddy.com' });
    const reioUser = await User.findOne({ email: 'reiovendelin3@gmail.com' });

    console.log('\n🔍 Checking specific users:');
    
    if (adminUser) {
      console.log(`👤 Admin User (${adminUser.email}):`);
      console.log(`   - Account Created: ${adminUser.createdAt ? new Date(adminUser.createdAt).toLocaleDateString() : 'N/A'}`);
      console.log(`   - Role: ${adminUser.role}`);
      console.log(`   - Company ID: ${adminUser.companyId}`);
      
      if (adminUser.companyId) {
        const adminCompany = await Company.findById(adminUser.companyId);
        if (adminCompany) {
          console.log(`   - Company: ${adminCompany.name} (${adminCompany.companyId})`);
        }
      }
    }

    if (reioUser) {
      console.log(`👤 Reio User (${reioUser.email}):`);
      console.log(`   - Account Created: ${reioUser.createdAt ? new Date(reioUser.createdAt).toLocaleDateString() : 'N/A'}`);
      console.log(`   - Role: ${reioUser.role}`);
      console.log(`   - Company ID: ${reioUser.companyId}`);
      
      if (reioUser.companyId) {
        const reioCompany = await Company.findById(reioUser.companyId);
        if (reioCompany) {
          console.log(`   - Company: ${reioCompany.name} (${reioCompany.companyId})`);
        }
      }
    }

    console.log('\n🎉 Analysis completed!');
    console.log('\n📝 Notes:');
    console.log('- The "Joined" date currently shows the user account creation date');
    console.log('- This is because the Company model doesn\'t track when users joined the company');
    console.log('- For a proper fix, we need to either:');
    console.log('  1. Add a joinedAt field to track company join dates');
    console.log('  2. Or update the UI to show "Account Created" instead of "Joined"');

  } catch (error) {
    console.error('❌ Error analyzing company join dates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the analysis
fixCompanyJoinDates();
