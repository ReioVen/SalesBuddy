const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');

// Load environment variables (same as server)
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function fixUserRolesAndJoinDates() {
  console.log('🚀 Starting fixUserRolesAndJoinDates script...');
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
      console.log('\n🔧 Fixing admin user...');
      console.log('📊 Current admin user data:', {
        id: adminUser._id,
        email: adminUser.email,
        role: adminUser.role,
        isSuperAdmin: adminUser.isSuperAdmin,
        isAdmin: adminUser.isAdmin,
        isCompanyAdmin: adminUser.isCompanyAdmin,
        companyId: adminUser.companyId,
        createdAt: adminUser.createdAt,
        companyJoinedAt: adminUser.companyJoinedAt
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

      // Set company join date if missing (for super admins, use account creation date)
      if (!adminUser.companyJoinedAt) {
        adminUser.companyJoinedAt = adminUser.createdAt || new Date();
        console.log('📅 Set companyJoinedAt for admin user (super admin - using account creation date)');
      }

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
      console.log('\n🔧 Fixing Reio user...');
      console.log('📊 Current Reio user data:', {
        id: reioUser._id,
        email: reioUser.email,
        role: reioUser.role,
        isSuperAdmin: reioUser.isSuperAdmin,
        isAdmin: reioUser.isAdmin,
        isCompanyAdmin: reioUser.isCompanyAdmin,
        companyId: reioUser.companyId,
        createdAt: reioUser.createdAt,
        companyJoinedAt: reioUser.companyJoinedAt
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

      // Set company join date if missing
      if (!reioUser.companyJoinedAt && reioUser.companyId) {
        reioUser.companyJoinedAt = reioUser.createdAt || new Date();
        console.log('📅 Set companyJoinedAt for Reio user');
      }

      // Ensure createdAt is set if missing
      if (!reioUser.createdAt) {
        reioUser.createdAt = new Date();
        console.log('📅 Set createdAt for Reio user');
      }

      await reioUser.save();
      console.log('✅ Reio user updated successfully!');
    }

    // Fix all other users with companies that don't have companyJoinedAt
    console.log('\n🔧 Fixing company join dates for all users...');
    const usersWithCompanies = await User.find({ 
      companyId: { $exists: true, $ne: null },
      companyJoinedAt: { $exists: false }
    });

    console.log(`👥 Found ${usersWithCompanies.length} users without company join dates`);

    let updatedCount = 0;
    for (const user of usersWithCompanies) {
      user.companyJoinedAt = user.createdAt || new Date();
      await user.save();
      updatedCount++;
      console.log(`✅ Updated ${user.email} with company join date: ${user.companyJoinedAt.toLocaleDateString()}`);
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} users with company join dates!`);

    // Verify the fixes
    console.log('\n🔍 Verifying fixes...');
    const updatedAdminUser = await User.findOne({ email: 'admin@salesbuddy.com' });
    const updatedReioUser = await User.findOne({ email: 'reiovendelin3@gmail.com' });

    if (updatedAdminUser) {
      console.log('\n✅ Admin user verification:', {
        email: updatedAdminUser.email,
        role: updatedAdminUser.role,
        isSuperAdmin: updatedAdminUser.isSuperAdmin,
        isAdmin: updatedAdminUser.isAdmin,
        isCompanyAdmin: updatedAdminUser.isCompanyAdmin,
        createdAt: updatedAdminUser.createdAt,
        createdAtFormatted: updatedAdminUser.createdAt ? new Date(updatedAdminUser.createdAt).toLocaleDateString() : 'N/A',
        companyJoinedAt: updatedAdminUser.companyJoinedAt,
        companyJoinedAtFormatted: updatedAdminUser.companyJoinedAt ? new Date(updatedAdminUser.companyJoinedAt).toLocaleDateString() : 'N/A'
      });
    }

    if (updatedReioUser) {
      console.log('\n✅ Reio user verification:', {
        email: updatedReioUser.email,
        role: updatedReioUser.role,
        isSuperAdmin: updatedReioUser.isSuperAdmin,
        isAdmin: updatedReioUser.isAdmin,
        isCompanyAdmin: updatedReioUser.isCompanyAdmin,
        createdAt: updatedReioUser.createdAt,
        createdAtFormatted: updatedReioUser.createdAt ? new Date(updatedReioUser.createdAt).toLocaleDateString() : 'N/A',
        companyJoinedAt: updatedReioUser.companyJoinedAt,
        companyJoinedAtFormatted: updatedReioUser.companyJoinedAt ? new Date(updatedReioUser.companyJoinedAt).toLocaleDateString() : 'N/A'
      });
    }

    console.log('\n🎉 All fixes completed successfully!');
    console.log('\n📝 Summary of changes:');
    console.log('- Fixed user roles (Super Admin and Admin)');
    console.log('- Added companyJoinedAt field to track when users joined companies');
    console.log('- Updated frontend to display company join dates instead of account creation dates');
    console.log('- Updated backend routes to include companyJoinedAt in responses');

  } catch (error) {
    console.error('❌ Error fixing user roles and join dates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the fix
fixUserRolesAndJoinDates();
