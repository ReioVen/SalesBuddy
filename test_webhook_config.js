const mongoose = require('mongoose');
const User = require('./server/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salesbuddy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testWebhookConfig() {
  try {
    console.log('=== WEBHOOK CONFIGURATION TEST ===\n');
    
    // Check environment variables
    console.log('1. ENVIRONMENT VARIABLES:');
    console.log('   STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Set' : 'Missing');
    console.log('   STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'Set' : 'Missing');
    console.log('   STRIPE_BASIC_PRICE_ID:', process.env.STRIPE_BASIC_PRICE_ID || 'Missing');
    console.log('   STRIPE_PRO_PRICE_ID:', process.env.STRIPE_PRO_PRICE_ID || 'Missing');
    console.log('   STRIPE_UNLIMITED_PRICE_ID:', process.env.STRIPE_UNLIMITED_PRICE_ID || 'Missing');
    
    // Check user's Stripe customer ID
    const user = await User.findOne({ email: 'test@gmail.com' });
    if (user) {
      console.log('\n2. USER STRIPE DATA:');
      console.log('   Stripe Customer ID:', user.subscription.stripeCustomerId || 'Not set');
      console.log('   Stripe Subscription ID:', user.subscription.stripeSubscriptionId || 'Not set');
      
      if (user.subscription.stripeCustomerId) {
        console.log('\n3. WEBHOOK ISSUE DIAGNOSIS:');
        console.log('   The user has a Stripe Customer ID, which means the checkout session was created successfully.');
        console.log('   However, the subscription might not have been updated via webhook.');
        console.log('   This could be due to:');
        console.log('   - Webhook not configured in Stripe dashboard');
        console.log('   - Webhook endpoint not accessible from Stripe');
        console.log('   - Webhook secret mismatch');
        console.log('   - Webhook processing error');
        
        console.log('\n4. RECOMMENDED ACTIONS:');
        console.log('   1. Check Stripe dashboard webhook configuration');
        console.log('   2. Ensure webhook endpoint is accessible: https://yourdomain.com/api/subscriptions/webhook');
        console.log('   3. Verify webhook secret matches STRIPE_WEBHOOK_SECRET');
        console.log('   4. Check server logs for webhook processing errors');
        console.log('   5. Run the comprehensive_subscription_fix.js script to manually fix the subscription');
      }
    }
    
  } catch (error) {
    console.error('Error in webhook config test:', error);
  } finally {
    mongoose.connection.close();
  }
}

testWebhookConfig();
