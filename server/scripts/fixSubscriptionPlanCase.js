const mongoose = require('mongoose');
const Company = require('../models/Company');
const User = require('../models/User');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const fixSubscriptionPlanCase = async () => {
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

    // Fix companies with incorrect case
    const companies = await Company.find({
      'subscription.plan': { $regex: /^[A-Z]/ }
    });

    console.log(`Found ${companies.length} companies with uppercase subscription plans:`);
    
    for (const company of companies) {
      console.log(`- ${company.name}: ${company.subscription.plan} -> ${company.subscription.plan.toLowerCase()}`);
      company.subscription.plan = company.subscription.plan.toLowerCase();
      await company.save();
    }

    // Fix users with incorrect case
    const users = await User.find({
      'subscription.plan': { $regex: /^[A-Z]/ }
    });

    console.log(`\nFound ${users.length} users with uppercase subscription plans:`);
    
    for (const user of users) {
      console.log(`- ${user.email}: ${user.subscription.plan} -> ${user.subscription.plan.toLowerCase()}`);
      user.subscription.plan = user.subscription.plan.toLowerCase();
      await user.save();
    }

    console.log(`\n🎉 Successfully fixed ${companies.length} companies and ${users.length} users!`);

  } catch (error) {
    console.error('❌ Error fixing subscription plan case:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Run the script
fixSubscriptionPlanCase();
