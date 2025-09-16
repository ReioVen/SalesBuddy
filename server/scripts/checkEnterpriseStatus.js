const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');

// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function checkEnterpriseStatus() {
  try {
    // Connect to MongoDB
    const mongoUri = (process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== '')
      ? process.env.MONGODB_URI
      : 'mongodb://127.0.0.1:27017/salesbuddy';

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('=== ENTERPRISE STATUS REPORT ===\n');

    // Check enterprise users
    const enterpriseUsers = await User.find({
      'subscription.plan': 'enterprise',
      companyId: { $exists: true, $ne: null }
    }).populate('companyId', 'name');

    console.log(`📊 ENTERPRISE USERS: ${enterpriseUsers.length} total\n`);

    if (enterpriseUsers.length > 0) {
      console.log('👥 USER DETAILS:');
      console.log('─'.repeat(80));
      
      enterpriseUsers.forEach((user, index) => {
        const billingEnd = user.subscription.currentPeriodEnd 
          ? new Date(user.subscription.currentPeriodEnd).toDateString()
          : 'Not set';
        
        const daysUntilExpiry = user.subscription.currentPeriodEnd 
          ? Math.ceil((new Date(user.subscription.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24))
          : 'Unknown';

        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Company: ${user.companyId ? user.companyId.name : 'Unknown'}`);
        console.log(`   Status: ${user.subscription.status}`);
        console.log(`   Billing End: ${billingEnd} (${daysUntilExpiry} days)`);
        console.log(`   AI Conversations: ${user.usage.aiConversations}/${user.usage.dailyLimit} (daily)`);
        console.log(`   Last Reset: ${new Date(user.usage.lastDailyResetDate).toDateString()}`);
        console.log('');
      });
    }

    // Check enterprise companies
    const enterpriseCompanies = await Company.find({
      'subscription.plan': 'enterprise'
    });

    console.log(`🏢 ENTERPRISE COMPANIES: ${enterpriseCompanies.length} total\n`);

    if (enterpriseCompanies.length > 0) {
      console.log('🏢 COMPANY DETAILS:');
      console.log('─'.repeat(80));
      
      enterpriseCompanies.forEach((company, index) => {
        const billingEnd = company.subscription.currentPeriodEnd 
          ? new Date(company.subscription.currentPeriodEnd).toDateString()
          : 'Not set';
        
        const daysUntilExpiry = company.subscription.currentPeriodEnd 
          ? Math.ceil((new Date(company.subscription.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24))
          : 'Unknown';

        console.log(`${index + 1}. ${company.name}`);
        console.log(`   Status: ${company.subscription.status}`);
        console.log(`   Billing End: ${billingEnd} (${daysUntilExpiry} days)`);
        console.log(`   Max Users: ${company.subscription.maxUsers === -1 ? 'Unlimited' : company.subscription.maxUsers}`);
        console.log(`   Total Users: ${company.users.length}`);
        console.log('');
      });
    }

    // Summary statistics
    const now = new Date();
    const usersWithExpiredBilling = enterpriseUsers.filter(user => 
      user.subscription.currentPeriodEnd && new Date(user.subscription.currentPeriodEnd) < now
    );
    
    const usersWithLowConversations = enterpriseUsers.filter(user => 
      user.usage.aiConversations < 10
    );

    const usersWithHighConversations = enterpriseUsers.filter(user => 
      user.usage.aiConversations >= 40
    );

    console.log('📈 SUMMARY STATISTICS:');
    console.log('─'.repeat(50));
    console.log(`Total Enterprise Users: ${enterpriseUsers.length}`);
    console.log(`Total Enterprise Companies: ${enterpriseCompanies.length}`);
    console.log(`Users with Expired Billing: ${usersWithExpiredBilling.length}`);
    console.log(`Users with Low Usage (<10): ${usersWithLowConversations.length}`);
    console.log(`Users with High Usage (≥40): ${usersWithHighConversations.length}`);
    
    if (usersWithHighConversations.length > 0) {
      console.log('\n⚠️  USERS APPROACHING DAILY LIMIT:');
      usersWithHighConversations.forEach(user => {
        console.log(`   ${user.email}: ${user.usage.aiConversations}/50 conversations`);
      });
    }

  } catch (error) {
    console.error('Status check error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the status check
checkEnterpriseStatus();
