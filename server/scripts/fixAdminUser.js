const mongoose = require('mongoose');
const User = require('../models/User');

// Load environment variables (same as server)
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function fixAdminUser() {
  console.log('🚀 Starting fixAdminUser script...');
  try {
    // Connect to MongoDB (use same as server)
    const mongoUri = (process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== '')
      ? process.env.MONGODB_URI
      : 'mongodb://127.0.0.1:27017/salesbuddy';
    console.log('🔗 Connecting to MongoDB:', mongoUri.includes('127.0.0.1') ? 'local' : 'remote');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find the admin user
    const user = await User.findOne({ email: 'admin@salesbuddy.com' });
    if (!user) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('👤 Current admin user data:', {
      id: user._id,
      email: user.email,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      isAdmin: user.isAdmin,
      isSuperAdminUser: user.isSuperAdminUser(),
      isAdminUser: user.isAdminUser(),
      hasAdminAccess: user.hasAdminAccess()
    });

    // Fix the user to be a proper super admin
    user.role = 'super_admin';
    user.isSuperAdmin = true;
    user.isAdmin = true;
    
    // Set admin permissions
    user.adminPermissions = {
      canManageCompanies: true,
      canManageUsers: true,
      canViewAnalytics: true,
      canManageSubscriptions: true
    };

    await user.save();

    console.log('✅ Admin user updated successfully!');
    console.log('👤 Updated admin user data:', {
      id: user._id,
      email: user.email,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      isAdmin: user.isAdmin,
      isSuperAdminUser: user.isSuperAdminUser(),
      isAdminUser: user.isAdminUser(),
      hasAdminAccess: user.hasAdminAccess()
    });

  } catch (error) {
    console.error('❌ Error fixing admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the fix
fixAdminUser();