const axios = require('axios');

async function testWebhookEndpoint() {
  try {
    console.log('Testing webhook endpoint...');
    
    // Test if the webhook endpoint is accessible
    const response = await axios.post('http://localhost:5002/api/subscriptions/webhook', {
      test: 'data'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test-signature'
      }
    });
    
    console.log('Webhook endpoint response:', response.status, response.data);
  } catch (error) {
    if (error.response) {
      console.log('Webhook endpoint error response:', error.response.status, error.response.data);
    } else {
      console.log('Webhook endpoint error:', error.message);
    }
  }
}

testWebhookEndpoint();
