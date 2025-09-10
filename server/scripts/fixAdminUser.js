const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const fixAdminUser = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/salesbuddy';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find both users
    const dewdyguy = await User.findOne({ email: 'dewdyguy@gmail.com' });
    const originalAdmin = await User.findOne({ email: 'admin@salesbuddy.com' });
    
    console.log('=== Current User Status ===');
    
    if (dewdyguy) {
      console.log('dewdyguy@gmail.com:', {
        email: dewdyguy.email,
        role: dewdyguy.role,
        isSuperAdmin: dewdyguy.isSuperAdmin,
        isAdmin: dewdyguy.isAdmin,
        companyId: dewdyguy.companyId
      });
    } else {
      console.log('dewdyguy@gmail.com: NOT FOUND');
    }
    
    if (originalAdmin) {
      console.log('admin@salesbuddy.com:', {
        email: originalAdmin.email,
        role: originalAdmin.role,
        isSuperAdmin: originalAdmin.isSuperAdmin,
        isAdmin: originalAdmin.isAdmin,
        companyId: originalAdmin.companyId
      });
    } else {
      console.log('admin@salesbuddy.com: NOT FOUND');
    }

    // Fix dewdyguy - decide if they should be super_admin or company_admin
    if (dewdyguy) {
      // Since they have a companyId, they should be company_admin of that company
      dewdyguy.role = 'company_admin';
      dewdyguy.isSuperAdmin = false;
      dewdyguy.isAdmin = false;
      dewdyguy.isCompanyAdmin = true;
      dewdyguy.isTeamLeader = false;
      
      // Remove team association but keep company
      dewdyguy.teamId = null;

      await dewdyguy.save();
      console.log('✅ dewdyguy@gmail.com fixed to company_admin');
    }

    // Ensure original admin is still admin
    if (originalAdmin) {
      originalAdmin.role = 'super_admin';
      originalAdmin.isSuperAdmin = true;
      originalAdmin.isAdmin = false;
      originalAdmin.adminPermissions = {
        canManageCompanies: true,
        canManageUsers: true,
        canViewAnalytics: true,
        canManageSubscriptions: true
      };
      
      // Remove company association if it exists
      originalAdmin.companyId = null;
      originalAdmin.teamId = null;
      originalAdmin.isCompanyAdmin = false;
      originalAdmin.isTeamLeader = false;

      await originalAdmin.save();
      console.log('✅ admin@salesbuddy.com confirmed as super_admin');
    }

    console.log('=== Final Status ===');
    if (dewdyguy) {
      console.log('dewdyguy@gmail.com:', {
        role: dewdyguy.role,
        isAdmin: dewdyguy.isAdmin
      });
    }
    if (originalAdmin) {
      console.log('admin@salesbuddy.com:', {
        role: originalAdmin.role,
        isSuperAdmin: originalAdmin.isSuperAdmin
      });
    }

  } catch (error) {
    console.error('Error fixing admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

fixAdminUser();
