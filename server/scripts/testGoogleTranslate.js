const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function testGoogleTranslateAPI() {
  console.log('🔍 Testing Google Translate API Setup...\n');
  
  // Check environment variables
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  console.log('Environment Check:');
  console.log(`- GOOGLE_TRANSLATE_API_KEY: ${apiKey ? 'Set (' + apiKey.length + ' chars)' : 'NOT SET'}`);
  console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
  console.log('');
  
  if (!apiKey) {
    console.error('❌ Google Translate API key is not set!');
    console.log('Please add GOOGLE_TRANSLATE_API_KEY to your .env file');
    console.log('Get your API key from: https://console.cloud.google.com/apis/credentials');
    return;
  }
  
  // Test API call
  const baseUrl = 'https://translation.googleapis.com/language/translate/v2';
  const testText = 'Good opening approach. Consider personalizing your introductions more.';
  const targetLanguage = 'et';
  
  console.log('🧪 Testing API Call:');
  console.log(`- Text: "${testText}"`);
  console.log(`- Target Language: ${targetLanguage}`);
  console.log(`- API URL: ${baseUrl}`);
  console.log('');
  
  try {
    const response = await axios.post(baseUrl, {
      q: testText,
      target: targetLanguage,
      source: 'en',
      format: 'text',
      model: 'nmt'
    }, {
      params: {
        key: apiKey
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Call Successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.data && response.data.data.translations) {
      const translation = response.data.data.translations[0].translatedText;
      console.log(`\n🎯 Translation Result:`);
      console.log(`Original: "${testText}"`);
      console.log(`Translated: "${translation}"`);
    }
    
  } catch (error) {
    console.error('❌ API Call Failed!');
    console.error('Error Details:');
    console.error(`- Status: ${error.response?.status}`);
    console.error(`- Status Text: ${error.response?.statusText}`);
    console.error(`- Error Message: ${error.message}`);
    
    if (error.response?.data) {
      console.error('- Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Common error solutions
    console.log('\n🔧 Common Solutions:');
    if (error.response?.status === 401) {
      console.log('1. Check if your API key is correct');
      console.log('2. Ensure the Google Translate API is enabled in your Google Cloud project');
      console.log('3. Verify billing is set up for your Google Cloud project');
    } else if (error.response?.status === 403) {
      console.log('1. Check if the Google Translate API is enabled');
      console.log('2. Verify your API key has the correct permissions');
      console.log('3. Check if there are any quota limits');
    }
  }
}

// Run the test
testGoogleTranslateAPI().catch(console.error);
