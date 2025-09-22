#!/usr/bin/env node
/**
 * Database seeding script for Terms of Service and FAQ translations
 * This script populates the database with comprehensive Terms and FAQ content in all supported languages
 */

const mongoose = require('mongoose');
const TranslationKey = require('../models/TranslationKey');
const Translation = require('../models/Translation');
const termsAndFaqTranslations = require('../../terms_and_faq_translations');

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/salesbuddy';

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function seedTermsAndFaqTranslations() {
  console.log('🌱 Starting Terms of Service and FAQ translation seeding...');
  
  const supportedLanguages = ['en', 'et', 'es', 'ru'];
  let totalKeysCreated = 0;
  let totalTranslationsCreated = 0;
  
  try {
    // Process each language
    for (const language of supportedLanguages) {
      console.log(`\n📝 Processing language: ${language.toUpperCase()}`);
      
      const languageData = termsAndFaqTranslations[language];
      if (!languageData) {
        console.log(`⚠️  No data found for language: ${language}`);
        continue;
      }
      
      // Process Terms of Service
      const termsKeys = [
        'termsOfService',
        'termsTitle', 
        'termsDescription',
        'termsLastUpdated',
        'termsContent'
      ];
      
      for (const key of termsKeys) {
        if (languageData[key]) {
          const result = await createTranslationKeyAndTranslation(
            key, 
            'terms_of_service', 
            languageData[key], 
            language
          );
          if (result.keyCreated) totalKeysCreated++;
          if (result.translationCreated) totalTranslationsCreated++;
        }
      }
      
      // Process FAQ questions and answers
      const faqKeys = [];
      for (let i = 1; i <= 15; i++) {
        faqKeys.push(`faqQuestion${i}`, `faqAnswer${i}`);
      }
      
      for (const key of faqKeys) {
        if (languageData[key]) {
          const result = await createTranslationKeyAndTranslation(
            key, 
            'faq', 
            languageData[key], 
            language
          );
          if (result.keyCreated) totalKeysCreated++;
          if (result.translationCreated) totalTranslationsCreated++;
        }
      }
      
      console.log(`✅ Completed processing ${language.toUpperCase()}`);
    }
    
    console.log('\n🎉 Seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Translation Keys Created: ${totalKeysCreated}`);
    console.log(`   - Translations Created: ${totalTranslationsCreated}`);
    console.log(`   - Languages Processed: ${supportedLanguages.length}`);
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

async function createTranslationKeyAndTranslation(key, category, text, language) {
  let keyCreated = false;
  let translationCreated = false;
  
  try {
    // Check if translation key already exists
    let translationKey = await TranslationKey.findOne({ key, category });
    
    if (!translationKey) {
      // Create new translation key
      translationKey = new TranslationKey({
        key,
        category,
        description: `Translation key for ${category}: ${key}`,
        isActive: true,
        createdAt: new Date()
      });
      
      await translationKey.save();
      keyCreated = true;
      console.log(`   🔑 Created translation key: ${key} (${category})`);
    }
    
    // Check if translation already exists for this language
    let translation = await Translation.findOne({ 
      translationKey: translationKey._id, 
      language 
    });
    
    if (!translation) {
      // Create new translation
      translation = new Translation({
        translationKey: translationKey._id,
        language,
        text,
        isActive: true,
        lastModified: new Date(),
        createdAt: new Date()
      });
      
      await translation.save();
      translationCreated = true;
      console.log(`   🌐 Created translation: ${key} (${language})`);
    } else {
      // Update existing translation if text is different
      if (translation.text !== text) {
        translation.text = text;
        translation.lastModified = new Date();
        await translation.save();
        console.log(`   🔄 Updated translation: ${key} (${language})`);
      }
    }
    
    return { keyCreated, translationCreated };
    
  } catch (error) {
    console.error(`❌ Error creating translation for ${key} (${language}):`, error);
    throw error;
  }
}

async function verifySeeding() {
  console.log('\n🔍 Verifying seeding results...');
  
  try {
    // Count translation keys by category
    const termsKeys = await TranslationKey.countDocuments({ category: 'terms_of_service' });
    const faqKeys = await TranslationKey.countDocuments({ category: 'faq' });
    
    console.log(`📋 Terms of Service keys: ${termsKeys}`);
    console.log(`❓ FAQ keys: ${faqKeys}`);
    
    // Count translations by language
    const languages = ['en', 'et', 'es', 'ru'];
    for (const language of languages) {
      const count = await Translation.countDocuments({ language, isActive: true });
      console.log(`🌐 ${language.toUpperCase()} translations: ${count}`);
    }
    
    // Check for missing translations
    const allKeys = await TranslationKey.find({ isActive: true });
    let missingTranslations = 0;
    
    for (const key of allKeys) {
      const translations = await Translation.countDocuments({ 
        translationKey: key._id, 
        isActive: true 
      });
      if (translations < 4) { // Should have 4 languages
        missingTranslations += (4 - translations);
      }
    }
    
    if (missingTranslations > 0) {
      console.log(`⚠️  Missing translations: ${missingTranslations}`);
    } else {
      console.log('✅ All translations are complete!');
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

async function main() {
  try {
    await connectToDatabase();
    await seedTermsAndFaqTranslations();
    await verifySeeding();
    
    console.log('\n✨ Terms of Service and FAQ translation seeding completed successfully!');
    console.log('🚀 You can now use the translated content in your application.');
    
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Handle script execution
if (require.main === module) {
  main();
}

module.exports = {
  seedTermsAndFaqTranslations,
  createTranslationKeyAndTranslation,
  verifySeeding
};
