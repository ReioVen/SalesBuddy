const mongoose = require('mongoose');
const User = require('../models/User');

// Load environment variables (same as server)
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function fixUserRolesAndDates() {
  console.log('🚀 Starting fixUserRolesAndDates script...');
  try {
    // Connect to MongoDB (use same as server)
    const mongoUri = (process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== '')
      ? process.env.MONGODB_URI
      : 'mongodb://127.0.0.1:27017/salesbuddy';
    console.log('🔗 Connecting to MongoDB:', mongoUri.includes('127.0.0.1') ? 'local' : 'remote');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find the admin users
    const adminUser = await User.findOne({ email: 'admin@salesbuddy.com' });
    const reioUser = await User.findOne({ email: 'reiovendelin3@gmail.com' });

    console.log('👤 Found users:', {
      admin: adminUser ? adminUser.email : 'Not found',
      reio: reioUser ? reioUser.email : 'Not found'
    });

    // Fix admin user
    if (adminUser) {
      console.log('🔧 Fixing admin user...');
      console.log('📊 Current admin user data:', {
        id: adminUser._id,
        email: adminUser.email,
        role: adminUser.role,
        isSuperAdmin: adminUser.isSuperAdmin,
        isAdmin: adminUser.isAdmin,
        isCompanyAdmin: adminUser.isCompanyAdmin,
        createdAt: adminUser.createdAt
      });

      // Set proper super admin role
      adminUser.role = 'super_admin';
      adminUser.isSuperAdmin = true;
      adminUser.isAdmin = true;
      adminUser.isCompanyAdmin = true;
      
      // Set admin permissions
      adminUser.adminPermissions = {
        canManageCompanies: true,
        canManageUsers: true,
        canViewAnalytics: true,
        canManageSubscriptions: true
      };

      // Ensure createdAt is set if missing
      if (!adminUser.createdAt) {
        adminUser.createdAt = new Date();
        console.log('📅 Set createdAt for admin user');
      }

      await adminUser.save();
      console.log('✅ Admin user updated successfully!');
    }

    // Fix Reio user
    if (reioUser) {
      console.log('🔧 Fixing Reio user...');
      console.log('📊 Current Reio user data:', {
        id: reioUser._id,
        email: reioUser.email,
        role: reioUser.role,
        isSuperAdmin: reioUser.isSuperAdmin,
        isAdmin: reioUser.isAdmin,
        isCompanyAdmin: reioUser.isCompanyAdmin,
        createdAt: reioUser.createdAt
      });

      // Set proper admin role (assuming they should be an admin)
      reioUser.role = 'admin';
      reioUser.isAdmin = true;
      reioUser.isCompanyAdmin = true;
      
      // Set admin permissions
      reioUser.adminPermissions = {
        canManageCompanies: true,
        canManageUsers: true,
        canViewAnalytics: true,
        canManageSubscriptions: true
      };

      // Ensure createdAt is set if missing
      if (!reioUser.createdAt) {
        reioUser.createdAt = new Date();
        console.log('📅 Set createdAt for Reio user');
      }

      await reioUser.save();
      console.log('✅ Reio user updated successfully!');
    }

    // Verify the fixes
    console.log('🔍 Verifying fixes...');
    const updatedAdminUser = await User.findOne({ email: 'admin@salesbuddy.com' });
    const updatedReioUser = await User.findOne({ email: 'reiovendelin3@gmail.com' });

    if (updatedAdminUser) {
      console.log('✅ Admin user verification:', {
        email: updatedAdminUser.email,
        role: updatedAdminUser.role,
        isSuperAdmin: updatedAdminUser.isSuperAdmin,
        isAdmin: updatedAdminUser.isAdmin,
        isCompanyAdmin: updatedAdminUser.isCompanyAdmin,
        createdAt: updatedAdminUser.createdAt,
        createdAtFormatted: updatedAdminUser.createdAt ? new Date(updatedAdminUser.createdAt).toLocaleDateString() : 'N/A'
      });
    }

    if (updatedReioUser) {
      console.log('✅ Reio user verification:', {
        email: updatedReioUser.email,
        role: updatedReioUser.role,
        isSuperAdmin: updatedReioUser.isSuperAdmin,
        isAdmin: updatedReioUser.isAdmin,
        isCompanyAdmin: updatedReioUser.isCompanyAdmin,
        createdAt: updatedReioUser.createdAt,
        createdAtFormatted: updatedReioUser.createdAt ? new Date(updatedReioUser.createdAt).toLocaleDateString() : 'N/A'
      });
    }

    console.log('🎉 All fixes completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing user roles and dates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the fix
fixUserRolesAndDates();
