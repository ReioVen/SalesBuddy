// Simple startup script for production
console.log('🚀 [START] Starting SalesBuddy server...');
console.log('📊 [START] Environment:', process.env.NODE_ENV || 'development');
console.log('🌐 [START] Port:', process.env.PORT || 3001);

try {
  require('./index.js');
  console.log('✅ [START] Server startup script completed');
} catch (error) {
  console.error('❌ [START] Server startup failed:', error);
  console.error('❌ [START] Error details:', error.stack);
  process.exit(1);
}
