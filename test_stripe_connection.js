#!/usr/bin/env node

/**
 * Test script to check Stripe connection in sandbox mode
 * Run this with: node test_stripe_connection.js
 */

require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testStripeConnection() {
  console.log('🔍 Testing Stripe Connection...\n');
  
  // Check if Stripe key is set
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY is not set in environment variables');
    console.log('Please add your Stripe secret key to your .env file:');
    console.log('STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key');
    return;
  }
  
  console.log('✅ Stripe secret key is set');
  console.log(`Key starts with: ${process.env.STRIPE_SECRET_KEY.substring(0, 7)}...`);
  
  // Check if it's test mode
  if (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    console.log('✅ Using Stripe test mode (sandbox)');
  } else if (process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
    console.log('⚠️  Using Stripe live mode - be careful!');
  } else {
    console.log('❓ Unknown Stripe key format');
  }
  
  try {
    // Test 1: List products
    console.log('\n📦 Testing: List products...');
    const products = await stripe.products.list({ limit: 3 });
    console.log(`✅ Found ${products.data.length} products`);
    
    if (products.data.length > 0) {
      console.log('Sample product:', {
        id: products.data[0].id,
        name: products.data[0].name,
        active: products.data[0].active
      });
    }
    
    // Test 2: List prices
    console.log('\n💰 Testing: List prices...');
    const prices = await stripe.prices.list({ limit: 3 });
    console.log(`✅ Found ${prices.data.length} prices`);
    
    if (prices.data.length > 0) {
      console.log('Sample price:', {
        id: prices.data[0].id,
        amount: prices.data[0].unit_amount,
        currency: prices.data[0].currency,
        active: prices.data[0].active
      });
    }
    
    // Test 3: Check environment variables
    console.log('\n🔧 Environment Variables Check:');
    console.log(`STRIPE_BASIC_PRICE_ID: ${process.env.STRIPE_BASIC_PRICE_ID || 'Not set'}`);
    console.log(`STRIPE_PRO_PRICE_ID: ${process.env.STRIPE_PRO_PRICE_ID || 'Not set'}`);
    console.log(`STRIPE_UNLIMITED_PRICE_ID: ${process.env.STRIPE_UNLIMITED_PRICE_ID || 'Not set'}`);
    console.log(`STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET ? 'Set' : 'Not set'}`);
    
    // Test 4: Create a test customer (won't charge)
    console.log('\n👤 Testing: Create test customer...');
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test Customer',
      description: 'Test customer for SalesBuddy'
    });
    console.log(`✅ Created test customer: ${customer.id}`);
    
    // Test 5: Create a test payment intent (won't charge)
    console.log('\n💳 Testing: Create test payment intent...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000, // $20.00
      currency: 'usd',
      customer: customer.id,
      description: 'Test payment for SalesBuddy'
    });
    console.log(`✅ Created test payment intent: ${paymentIntent.id}`);
    console.log(`Status: ${paymentIntent.status}`);
    
    console.log('\n🎉 All Stripe tests passed! Your Stripe integration is working correctly.');
    console.log('\n📝 Next steps:');
    console.log('1. Make sure your webhook endpoint is configured in Stripe dashboard');
    console.log('2. Test subscription creation in your app');
    console.log('3. Test webhook handling for subscription events');
    
  } catch (error) {
    console.error('\n❌ Stripe test failed:', error.message);
    
    if (error.type === 'StripeInvalidRequestError') {
      console.log('\n💡 Common issues:');
      console.log('- Invalid API key');
      console.log('- Missing required parameters');
      console.log('- Incorrect endpoint URL');
    } else if (error.type === 'StripeAuthenticationError') {
      console.log('\n💡 Authentication error:');
      console.log('- Check your API key');
      console.log('- Make sure you\'re using the correct key for test/live mode');
    }
  }
}

// Run the test
testStripeConnection().catch(console.error);
