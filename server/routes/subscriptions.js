const express = require('express');
const { body, validationResult } = require('express-validator');
// Initialize Stripe (guard missing key)
let stripe = null;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (stripeSecretKey && stripeSecretKey.trim() !== '') {
  stripe = require('stripe')(stripeSecretKey);
} else {
  console.warn('STRIPE_SECRET_KEY is not set. Subscription endpoints will return 503.');
}
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic',
    price: 49.99,
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID,
    features: ['200 AI conversations per month', 'Tips and Lessons', 'Basic sales scenarios', 'Email support'],
    limits: { conversations: 200 }
  },
  pro: {
    name: 'Pro',
    price: 89.99,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    features: ['500 AI conversations per month', 'Tips and Lessons', 'More Client Customization', 'Personal Summary Feedback', 'Priority support'],
    limits: { conversations: 500 }
  },
  unlimited: {
    name: 'Unlimited',
    price: 349,
    stripePriceId: process.env.STRIPE_UNLIMITED_PRICE_ID,
    features: ['Unlimited AI conversations', 'Tips and Lessons', 'Summary', 'More Client Customization', 'Personal Summary Feedback', 'Dedicated support'],
    limits: { conversations: -1 }
  },
  enterprise: {
    name: 'Enterprise',
    price: null,
    stripePriceId: null,
    features: ['Unlimited AI conversations', 'Tips and Lessons', 'Summary', 'More Client Customization', 'Personal Summary Feedback', 'Team management', 'Dedicated support'],
    limits: { conversations: -1 }
  }
};

// Get available plans
router.get('/plans', async (req, res) => {
  try {
    res.json({
      plans: SUBSCRIPTION_PLANS,
      currentPlan: req.user?.subscription?.plan || 'free'
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to get subscription plans' });
  }
});

// Create checkout session
router.post('/create-checkout-session', authenticateToken, [
  body('plan').isIn(['basic', 'pro', 'unlimited'])
], async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        error: 'Billing service not configured',
        message: 'STRIPE_SECRET_KEY is missing. Configure it to enable subscriptions.'
      });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { plan } = req.body;
    const planConfig = SUBSCRIPTION_PLANS[plan];

    if (!planConfig) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    // Create or get Stripe customer
    let customerId = req.user.subscription.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: `${req.user.firstName} ${req.user.lastName}`,
        metadata: {
          userId: req.user._id.toString()
        }
      });
      
      customerId = customer.id;
      
      // Update user with Stripe customer ID
      await User.findByIdAndUpdate(req.user._id, {
        'subscription.stripeCustomerId': customerId
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/pricing?canceled=true`,
      metadata: {
        userId: req.user._id.toString(),
        plan: plan
      }
    });

    res.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create portal session
router.post('/create-portal-session', authenticateToken, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        error: 'Billing service not configured',
        message: 'STRIPE_SECRET_KEY is missing. Configure it to enable subscriptions.'
      });
    }
    if (!req.user.subscription.stripeCustomerId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: req.user.subscription.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/dashboard`,
    });

    res.json({
      url: session.url
    });
  } catch (error) {
    console.error('Create portal session error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// Webhook to handle Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (!stripe) {
      console.warn('Received Stripe webhook but STRIPE_SECRET_KEY is not set.');
      return res.status(503).send('Billing service not configured');
    }
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Handle successful checkout
async function handleCheckoutCompleted(session) {
  const userId = session.metadata.userId;
  const plan = session.metadata.plan;
  const subscriptionId = session.subscription;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const planConfig = SUBSCRIPTION_PLANS[plan];

  await User.findByIdAndUpdate(userId, {
    'subscription.plan': plan,
    'subscription.status': 'active',
    'subscription.stripeSubscriptionId': subscriptionId,
    'subscription.currentPeriodStart': new Date(subscription.current_period_start * 1000),
    'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
    'usage.monthlyLimit': planConfig.limits.conversations
  });
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer);
  const userId = customer.metadata.userId;

  const plan = Object.keys(SUBSCRIPTION_PLANS).find(key => 
    SUBSCRIPTION_PLANS[key].stripePriceId === subscription.items.data[0].price.id
  );

  if (plan && plan !== 'enterprise') {
    const planConfig = SUBSCRIPTION_PLANS[plan];
    
    await User.findByIdAndUpdate(userId, {
      'subscription.plan': plan,
      'subscription.status': subscription.status,
      'subscription.currentPeriodStart': new Date(subscription.current_period_start * 1000),
      'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
      'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
      'usage.monthlyLimit': planConfig.limits.conversations
    });
  }
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer);
  const userId = customer.metadata.userId;

  await User.findByIdAndUpdate(userId, {
    'subscription.plan': 'free',
    'subscription.status': 'cancelled',
    'subscription.stripeSubscriptionId': null,
    'subscription.currentPeriodStart': null,
    'subscription.currentPeriodEnd': null,
    'subscription.cancelAtPeriodEnd': false,
    'usage.monthlyLimit': 10
  });
}

// Handle failed payments
async function handlePaymentFailed(invoice) {
  const customer = await stripe.customers.retrieve(invoice.customer);
  const userId = customer.metadata.userId;

  await User.findByIdAndUpdate(userId, {
    'subscription.status': 'past_due'
  });
}

// Get current subscription status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const limits = user.getSubscriptionLimits();
    
    res.json({
      subscription: user.subscription,
      limits,
      canUseAI: user.canUseAI(),
      usage: user.usage
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

module.exports = router; 