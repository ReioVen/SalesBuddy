const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');

// Load environment variables (same as server)
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function fixUserCompanyId() {
  console.log('🚀 Starting fixUserCompanyId script...');
  try {
    // Connect to MongoDB (use same as server)
    const mongoUri = (process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== '')
      ? process.env.MONGODB_URI
      : 'mongodb://127.0.0.1:27017/salesbuddy';
    console.log('🔗 Connecting to MongoDB:', mongoUri.includes('127.0.0.1') ? 'local' : 'remote');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find the user with the wrong companyId
    const user = await User.findOne({ email: 'admin@salesbuddy.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 Current user data:', {
      id: user._id,
      email: user.email,
      currentCompanyId: user.companyId,
      role: user.role
    });

    // Find all companies to see what's available
    const companies = await Company.find({});
    console.log('🏢 Available companies:');
    companies.forEach(company => {
      console.log(`  - ID: ${company._id}, Name: ${company.name}, CompanyId: ${company.companyId}`);
    });

    // Find the correct company (ReioCo)
    const correctCompany = await Company.findOne({ name: 'ReioCo' });
    if (!correctCompany) {
      console.log('❌ ReioCo company not found');
      return;
    }

    console.log('✅ Found correct company:', {
      id: correctCompany._id,
      name: correctCompany.name,
      companyId: correctCompany.companyId
    });

    // Update the user's companyId
    user.companyId = correctCompany._id;
    await user.save();

    console.log('✅ User companyId updated successfully!');
    console.log('👤 Updated user data:', {
      id: user._id,
      email: user.email,
      newCompanyId: user.companyId,
      role: user.role
    });

  } catch (error) {
    console.error('❌ Error fixing user companyId:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the fix
fixUserCompanyId();
