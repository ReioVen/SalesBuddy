const mongoose = require('mongoose');
const Company = require('../models/Company');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const updateCompanyToEnterprise = async () => {
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

    // Get company name from command line arguments or update all companies
    const companyName = process.argv[2];

    let companies;
    if (companyName) {
      // Update specific company
      companies = await Company.find({ name: { $regex: companyName, $options: 'i' } });
    } else {
      // Update all companies
      companies = await Company.find({});
    }

    if (companies.length === 0) {
      console.log('No companies found to update.');
      process.exit(0);
    }

    console.log(`Found ${companies.length} company(ies) to update:`);
    companies.forEach(company => {
      console.log(`- ${company.name} (${company.companyId}) - Current plan: ${company.subscription.plan}`);
    });

    // Update each company to enterprise plan
    for (const company of companies) {
      company.subscription.plan = 'enterprise';
      company.subscription.status = 'active';
      company.subscription.maxUsers = -1; // Unlimited for enterprise
      
      await company.save();
      
      console.log(`✅ Updated ${company.name} to Enterprise plan`);
    }

    console.log(`\n🎉 Successfully updated ${companies.length} company(ies) to Enterprise plan!`);

  } catch (error) {
    console.error('❌ Error updating companies:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Run the script
updateCompanyToEnterprise();
