const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salesbuddy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const multiLanguageTranslationService = require('../services/multiLanguageTranslationService');

async function resetTranslationService() {
  try {
    console.log('🔄 Resetting translation service...');
    
    // Use the singleton instance of the service
    const service = multiLanguageTranslationService;
    
    // Reset circuit breaker
    service.resetCircuitBreaker();
    
    // Enable offline mode to avoid rate limiting
    service.enableOfflineMode();
    
    // Clear caches
    service.clearCache();
    
    console.log('✅ Translation service reset successfully!');
    console.log('📊 Current status:');
    console.log('   - Circuit breaker: RESET');
    console.log('   - Offline mode: ENABLED');
    console.log('   - Caches: CLEARED');
    console.log('');
    console.log('💡 The system will now use comprehensive static translations.');
    console.log('   This includes:');
    console.log('   - Sales feedback phrases');
    console.log('   - Improvement areas');
    console.log('   - Stage ratings feedback');
    console.log('   - AI analysis terms');
    console.log('');
    console.log('🔄 To re-enable AI translations later, you can disable offline mode.');
    console.log('   But the static translations should work well for most content!');
    
  } catch (error) {
    console.error('❌ Error resetting translation service:', error);
  } finally {
    mongoose.connection.close();
  }
}

resetTranslationService();
