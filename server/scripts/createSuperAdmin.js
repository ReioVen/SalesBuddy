const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = (process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== '')
      ? process.env.MONGODB_URI
      : 'mongodb://127.0.0.1:27017/salesbuddy';

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      console.log('Super admin already exists:', existingSuperAdmin.email);
      process.exit(0);
    }

    // Get super admin details from command line arguments or use defaults
    const email = process.argv[2] || 'yadmin@salesbuddy.com';
    const password = process.argv[3] || 'Admin123!@#';
    const firstName = process.argv[4] || 'Super';
    const lastName = process.argv[5] || 'Admin';

    // Create super admin
    const superAdmin = new User({
      email,
      password,
      firstName,
      lastName,
      role: 'super_admin',
      isSuperAdmin: true,
      adminPermissions: {
        canManageCompanies: true,
        canManageUsers: true,
        canViewAnalytics: true,
        canManageSubscriptions: true
      },
      subscription: {
        plan: 'enterprise',
        status: 'active'
      }
    });

    await superAdmin.save();

    console.log('✅ Super admin created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Name:', firstName, lastName);
    console.log('🔐 Role: super_admin');
    console.log('');
    console.log('You can now login with these credentials to access the admin dashboard.');

  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Run the script
createSuperAdmin();
