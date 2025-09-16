const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');

// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function setBillingDatesAndResetConversations() {
  try {
    // Connect to MongoDB
    const mongoUri = (process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== '')
      ? process.env.MONGODB_URI
      : 'mongodb://127.0.0.1:27017/salesbuddy';

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const now = new Date();
    const tenYearsFromNow = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000); // 10 years from now

    console.log(`Setting billing dates to: ${tenYearsFromNow.toISOString()}`);
    console.log(`Resetting daily conversations for all enterprise users`);

    // Step 1: Update all enterprise users with companies
    console.log('\n=== Step 1: Updating Enterprise Users ===');
    const enterpriseUsers = await User.find({
      'subscription.plan': 'enterprise',
      companyId: { $exists: true, $ne: null }
    });

    console.log(`Found ${enterpriseUsers.length} enterprise users to update`);

    let userUpdateCount = 0;
    for (const user of enterpriseUsers) {
      try {
        await User.findByIdAndUpdate(user._id, {
          $set: {
            'subscription.status': 'active',
            'subscription.stripeCustomerId': 'enterprise_customer',
            'subscription.currentPeriodStart': now,
            'subscription.currentPeriodEnd': tenYearsFromNow,
            'subscription.cancelAtPeriodEnd': false,
            'usage.aiConversations': 0, // Reset daily conversations
            'usage.dailyLimit': 50,
            'usage.lastDailyResetDate': now
          }
        });
        
        userUpdateCount++;
        console.log(`Updated user: ${user.email} - Billing until ${tenYearsFromNow.toDateString()}`);
      } catch (error) {
        console.error(`Error updating user ${user.email}:`, error);
      }
    }

    // Step 2: Update company subscription billing dates
    console.log('\n=== Step 2: Updating Company Subscriptions ===');
    const companies = await Company.find({
      'subscription.plan': 'enterprise'
    });

    console.log(`Found ${companies.length} enterprise companies to update`);

    let companyUpdateCount = 0;
    for (const company of companies) {
      try {
        await Company.findByIdAndUpdate(company._id, {
          $set: {
            'subscription.status': 'active',
            'subscription.currentPeriodStart': now,
            'subscription.currentPeriodEnd': tenYearsFromNow,
            'subscription.cancelAtPeriodEnd': false,
            'subscription.maxUsers': -1 // Unlimited for enterprise
          }
        });
        
        companyUpdateCount++;
        console.log(`Updated company: ${company.name} - Billing until ${tenYearsFromNow.toDateString()}`);
      } catch (error) {
        console.error(`Error updating company ${company.name}:`, error);
      }
    }

    // Step 3: Reset daily conversations for all enterprise users (additional safety check)
    console.log('\n=== Step 3: Final Daily Conversation Reset ===');
    const finalResetResult = await User.updateMany(
      {
        'subscription.plan': 'enterprise',
        companyId: { $exists: true, $ne: null }
      },
      {
        $set: {
          'usage.aiConversations': 0,
          'usage.lastDailyResetDate': now
        }
      }
    );

    console.log(`\n=== SUMMARY ===`);
    console.log(`✅ Updated ${userUpdateCount} enterprise users`);
    console.log(`✅ Updated ${companyUpdateCount} enterprise companies`);
    console.log(`✅ Reset daily conversations for ${finalResetResult.modifiedCount} users`);
    console.log(`✅ All billing dates set to: ${tenYearsFromNow.toDateString()}`);
    console.log(`✅ All daily conversation counts reset to 0`);
    
    console.log('\n=== BILLING INFORMATION ===');
    console.log(`Current Date: ${now.toDateString()}`);
    console.log(`Billing End Date: ${tenYearsFromNow.toDateString()}`);
    console.log(`Duration: 10 years`);
    console.log(`Status: All enterprise subscriptions are now active until ${tenYearsFromNow.getFullYear()}`);

  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the script
setBillingDatesAndResetConversations();
