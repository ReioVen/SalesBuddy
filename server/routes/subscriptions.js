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
  free: {
    name: 'Free',
    price: 0,
    stripePriceId: null,
    features: ['3 AI conversations per month', 'Basic sales scenarios'],
    limits: { conversations: 3, aiTips: 0 }
  },
  basic: {
    name: 'Basic',
    price: 49.99,
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID,
    features: ['30 AI conversations per month', '10 AI Tips per month', 'Tips and Lessons', 'Basic sales scenarios', 'Email support'],
    limits: { conversations: 30, aiTips: 10 }
  },
  pro: {
    name: 'Pro',
    price: 89.99,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    features: ['50 AI conversations per month', '25 AI Tips per month', 'Tips and Lessons', 'More Client Customization', 'Personal Summary Feedback', 'Priority support'],
    limits: { conversations: 50, aiTips: 25 }
  },
  unlimited: {
    name: 'Unlimited',
    price: 349,
    stripePriceId: process.env.STRIPE_UNLIMITED_PRICE_ID,
    features: ['200 AI conversations per month', '50 AI Tips per month', 'Tips and Lessons', 'Summary', 'More Client Customization', 'Personal Summary Feedback', 'Dedicated support'],
    limits: { conversations: 200, aiTips: 50 }
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom Pricing',
    stripePriceId: null,
    features: ['50 AI conversations per day', '50 AI Tips per month', 'Tips and Lessons', 'Summary', 'More Client Customization', 'Personal Summary Feedback', 'Team management', 'Dedicated support'],
    limits: { conversations: 50, aiTips: 50, period: 'daily' },
    isPaid: true,
    billingType: 'enterprise'
  }
};

// Price ID to plan mapping for webhooks
const PRICE_TO_PLAN = {};
if (process.env.STRIPE_BASIC_PRICE_ID) PRICE_TO_PLAN[process.env.STRIPE_BASIC_PRICE_ID] = 'basic';
if (process.env.STRIPE_PRO_PRICE_ID) PRICE_TO_PLAN[process.env.STRIPE_PRO_PRICE_ID] = 'pro';
if (process.env.STRIPE_UNLIMITED_PRICE_ID) PRICE_TO_PLAN[process.env.STRIPE_UNLIMITED_PRICE_ID] = 'unlimited';

// Log the price mapping for debugging
console.log('Price ID to Plan mapping:', PRICE_TO_PLAN);
console.log('Environment variables check:', {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'Set' : 'Missing',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? 'Set' : 'Missing',
  STRIPE_BASIC_PRICE_ID: process.env.STRIPE_BASIC_PRICE_ID || 'Missing',
  STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID || 'Missing',
  STRIPE_UNLIMITED_PRICE_ID: process.env.STRIPE_UNLIMITED_PRICE_ID || 'Missing'
});

// Helper function to apply plan updates and set limits
async function applyPlanUpdate(userId, planData) {
  try {
    console.log('Applying plan update:', { userId, planData });
    
    const { plan, status, stripeCustomerId, stripeSubscriptionId, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd } = planData;
    
    // Get plan limits
    const planConfig = SUBSCRIPTION_PLANS[plan] || SUBSCRIPTION_PLANS.free;
    const monthlyLimit = planConfig.limits.conversations === -1 ? 1000000 : planConfig.limits.conversations;
    const dailyLimit = planConfig.limits.period === 'daily' ? planConfig.limits.conversations : 50;
    const aiTipsLimit = planConfig.limits.aiTips || 0;
    
    // Prepare update data
    const updateData = {
      'subscription.plan': plan,
      'subscription.status': status,
      'usage.monthlyLimit': monthlyLimit,
      'usage.dailyLimit': dailyLimit,
      'usage.aiTipsLimit': aiTipsLimit
    };
    
    // Add optional fields if provided
    if (stripeCustomerId) updateData['subscription.stripeCustomerId'] = stripeCustomerId;
    if (stripeSubscriptionId) updateData['subscription.stripeSubscriptionId'] = stripeSubscriptionId;
    if (currentPeriodStart) updateData['subscription.currentPeriodStart'] = currentPeriodStart;
    if (currentPeriodEnd) updateData['subscription.currentPeriodEnd'] = currentPeriodEnd;
    if (cancelAtPeriodEnd !== undefined) updateData['subscription.cancelAtPeriodEnd'] = cancelAtPeriodEnd;
    
    // If downgrading to free or inactive, reset usage and ensure free plan perks
    if (status === 'inactive' || status === 'cancelled' || plan === 'free') {
      updateData['usage.aiConversations'] = 0;
      updateData['usage.lastResetDate'] = new Date();
      
      if (plan === 'free') {
        console.log(`User ${userId} is being downgraded to free plan with perks: 50 AI conversations/month, Basic sales scenarios`);
      }
    }
    
    console.log('Update data:', updateData);
    
    // Update user
    const result = await User.findByIdAndUpdate(userId, updateData, { new: true });
    
    if (result) {
      console.log(`Successfully updated user ${userId} to plan ${plan} with status ${status} and limit ${monthlyLimit}`);
      console.log('Updated user data:', {
        plan: result.subscription.plan,
        status: result.subscription.status,
        monthlyLimit: result.usage.monthlyLimit
      });
    } else {
      console.error(`Failed to update user ${userId} - user not found`);
    }
  } catch (error) {
    console.error('Error in applyPlanUpdate:', error);
    throw error;
  }
}

// Get available plans
router.get('/plans', authenticateToken, async (req, res) => {
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

// Diagnostic endpoint to check Stripe configuration
router.get('/diagnostic', (req, res) => {
  const diagnostic = {
    stripeConfigured: !!stripe,
    stripeSecretKey: stripeSecretKey ? 'Set' : 'Missing',
    environmentVariables: {
      STRIPE_BASIC_PRICE_ID: process.env.STRIPE_BASIC_PRICE_ID ? 'Set' : 'Missing',
      STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID ? 'Set' : 'Missing',
      STRIPE_UNLIMITED_PRICE_ID: process.env.STRIPE_UNLIMITED_PRICE_ID ? 'Set' : 'Missing',
    },
    plans: Object.keys(SUBSCRIPTION_PLANS).map(key => ({
      id: key,
      name: SUBSCRIPTION_PLANS[key].name,
      price: SUBSCRIPTION_PLANS[key].price,
      stripePriceId: SUBSCRIPTION_PLANS[key].stripePriceId ? 'Configured' : 'Missing'
    }))
  };
  
  res.json(diagnostic);
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

    console.log('Subscription request:', { plan, planConfig });

    if (!planConfig) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    if (!planConfig.stripePriceId) {
      console.error('Missing Stripe price ID for plan:', plan);
      return res.status(400).json({ 
        error: 'Plan not configured for billing',
        message: `The ${plan} plan is not properly configured for billing. Please contact support.`
      });
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
    console.log('Creating Stripe checkout session with:', {
      customer: customerId,
      price: planConfig.stripePriceId,
      plan: plan,
      userId: req.user._id.toString()
    });

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
        plan: plan,
        priceId: planConfig.stripePriceId
      }
    });

    console.log('Stripe checkout session created successfully:', {
      sessionId: session.id,
      url: session.url
    });

    res.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        error: 'Invalid Stripe configuration',
        message: error.message,
        details: 'Please check your Stripe price IDs and configuration'
      });
    }
    
    if (error.type === 'StripeAPIError') {
      return res.status(503).json({ 
        error: 'Stripe service error',
        message: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message || 'Unknown error occurred'
    });
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
      return res.status(400).json({ 
        error: 'No active subscription found',
        message: 'You need to have an active subscription to manage billing. Please upgrade your plan first.'
      });
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
// This webhook automatically handles plan changes and ensures users are downgraded to the free plan
// with all free plan perks when their subscription ends, is cancelled, or payment fails
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  console.log('Webhook received:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    bodyLength: req.body ? req.body.length : 0,
    hasSignature: !!sig,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? 'Set' : 'Missing'
  });

  try {
    if (!stripe) {
      console.warn('Received Stripe webhook but STRIPE_SECRET_KEY is not set.');
      return res.status(503).send('Billing service not configured');
    }
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not set');
      return res.status(500).send('Webhook secret not configured');
    }
    
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    console.error('Webhook error details:', {
      error: err.message,
      signature: sig ? `${sig.substring(0, 20)}...` : 'Missing',
      bodyType: typeof req.body,
      bodyLength: req.body ? req.body.length : 0
    });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`Received Stripe webhook: ${event.type}`, {
    id: event.id,
    created: event.created,
    object: event.data.object.id,
    objectType: event.data.object.object
  });
  
  // Log the full event for debugging
  console.log('Full webhook event:', JSON.stringify(event, null, 2));

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('Processing checkout.session.completed');
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        console.log('Processing customer.subscription.updated');
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        console.log('Processing customer.subscription.deleted');
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_failed':
        console.log('Processing invoice.payment_failed');
        await handlePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.created':
        console.log('Processing customer.subscription.created');
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        console.log('Processing invoice.payment_succeeded');
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'customer.subscription.trial_will_end':
        console.log('Processing customer.subscription.trial_will_end');
        await handleTrialWillEnd(event.data.object);
        break;
      case 'customer.subscription.trial_ended':
        console.log('Processing customer.subscription.trial_ended');
        await handleTrialEnded(event.data.object);
        break;
      case 'invoice.payment_action_required':
        console.log('Processing invoice.payment_action_required');
        await handlePaymentActionRequired(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    console.log(`Successfully processed webhook: ${event.type}`);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Handle successful checkout
async function handleCheckoutCompleted(session) {
  try {
    console.log('Processing checkout completion for session:', session.id);
    
    const userId = session.metadata.userId;
    const plan = session.metadata.plan;
    const subscriptionId = session.subscription;

    console.log('Checkout session data:', {
      userId,
      plan,
      subscriptionId,
      hasSubscription: !!subscriptionId
    });

    if (!subscriptionId) {
      console.warn('No subscription ID in checkout session, waiting for subscription.created event');
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log('Retrieved subscription:', {
      id: subscription.id,
      status: subscription.status,
      customer: subscription.customer
    });
    
    await applyPlanUpdate(userId, {
      plan: plan,
      status: subscription.status || 'active',
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscriptionId,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false
    });
    
    console.log(`Successfully updated user ${userId} to plan ${plan}`);
  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error);
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription) {
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = customer.metadata.userId;

    // Get plan from price ID
    const priceId = subscription.items.data[0].price.id;
    const plan = PRICE_TO_PLAN[priceId];

    console.log(`Subscription updated for user ${userId}:`, {
      priceId,
      plan,
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end
    });

    // Handle subscription cancellations and expirations
    if (subscription.status === 'cancelled' || subscription.status === 'inactive' || subscription.status === 'past_due') {
      console.log(`Subscription ${subscription.status} for user ${userId}, downgrading to free plan`);
      
      // Downgrade to free plan with all free plan perks
      await applyPlanUpdate(userId, {
        plan: 'free',
        status: 'inactive',
        stripeCustomerId: customer.id,
        stripeSubscriptionId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false
      });
      
      console.log(`Successfully downgraded user ${userId} to free plan`);
    } else if (plan && plan !== 'enterprise') {
      // Handle active subscription updates
      await applyPlanUpdate(userId, {
        plan: plan,
        status: subscription.status,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      });
    } else {
      console.warn(`Unknown plan for price ID ${priceId} or enterprise plan`);
    }
  } catch (error) {
    console.error('Error in handleSubscriptionUpdated:', error);
  }
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription) {
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = customer.metadata.userId;

    console.log(`Subscription deleted for user ${userId}, downgrading to free plan`);

    // Downgrade to free plan with all free plan perks
    await applyPlanUpdate(userId, {
      plan: 'free',
      status: 'cancelled',
      stripeCustomerId: customer.id,
      stripeSubscriptionId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false
    });

    console.log(`Successfully downgraded user ${userId} to free plan after deletion`);
  } catch (error) {
    console.error('Error in handleSubscriptionDeleted:', error);
  }
}

// Handle failed payments
async function handlePaymentFailed(invoice) {
  try {
    const customer = await stripe.customers.retrieve(invoice.customer);
    const userId = customer.metadata.userId;

    console.log(`Payment failed for user ${userId}, checking subscription status`);

    // Get current user to check subscription status
    const user = await User.findById(userId);
    if (user) {
      // If payment fails and subscription is past due, consider downgrading to free
      if (user.subscription.status === 'past_due') {
        console.log(`User ${userId} has multiple failed payments, downgrading to free plan`);
        
        // Downgrade to free plan after multiple payment failures
        await applyPlanUpdate(userId, {
          plan: 'free',
          status: 'inactive',
          stripeCustomerId: user.subscription.stripeCustomerId,
          stripeSubscriptionId: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false
        });
        
        console.log(`Successfully downgraded user ${userId} to free plan due to payment failures`);
      } else {
        // First payment failure, mark as past due
        await applyPlanUpdate(userId, {
          plan: user.subscription.plan, // Keep current plan
          status: 'past_due',
          stripeCustomerId: user.subscription.stripeCustomerId,
          stripeSubscriptionId: user.subscription.stripeSubscriptionId,
          currentPeriodStart: user.subscription.currentPeriodStart,
          currentPeriodEnd: user.subscription.currentPeriodEnd,
          cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd
        });
        
        console.log(`Marked user ${userId} subscription as past due`);
      }
    }
  } catch (error) {
    console.error('Error in handlePaymentFailed:', error);
  }
}

// Handle successful payments
async function handlePaymentSucceeded(invoice) {
  try {
    const customer = await stripe.customers.retrieve(invoice.customer);
    const userId = customer.metadata.userId;

    // Get the subscription to update the user's plan
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const priceId = subscription.items.data[0].price.id;
    const plan = PRICE_TO_PLAN[priceId];

    if (plan && plan !== 'enterprise') {
      await applyPlanUpdate(userId, {
        plan: plan,
        status: subscription.status,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      });
    }
  } catch (error) {
    console.error('Error in handlePaymentSucceeded:', error);
  }
}

// Handle trial will end (warning event)
async function handleTrialWillEnd(subscription) {
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = customer.metadata.userId;

    console.log(`Trial will end for user ${userId} in 3 days`);

    // You could send an email notification here
    // For now, just log it
  } catch (error) {
    console.error('Error in handleTrialWillEnd:', error);
  }
}

// Handle trial ended
async function handleTrialEnded(subscription) {
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = customer.metadata.userId;

    console.log(`Trial ended for user ${userId}, checking if payment method is available`);

    // If no payment method is attached, downgrade to free plan
    if (!subscription.default_payment_method) {
      console.log(`No payment method for user ${userId}, downgrading to free plan`);
      
      await applyPlanUpdate(userId, {
        plan: 'free',
        status: 'inactive',
        stripeCustomerId: customer.id,
        stripeSubscriptionId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false
      });
      
      console.log(`Successfully downgraded user ${userId} to free plan after trial ended`);
    }
  } catch (error) {
    console.error('Error in handleTrialEnded:', error);
  }
}

// Handle payment action required (3D Secure, etc.)
async function handlePaymentActionRequired(invoice) {
  try {
    const customer = await stripe.customers.retrieve(invoice.customer);
    const userId = customer.metadata.userId;

    console.log(`Payment action required for user ${userId}`);

    // Mark subscription as past due until action is taken
    await applyPlanUpdate(userId, {
      plan: 'free', // Temporarily downgrade to free until payment is completed
      status: 'past_due',
      stripeCustomerId: customer.id,
      stripeSubscriptionId: invoice.subscription,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false
    });

    console.log(`Temporarily downgraded user ${userId} to free plan due to payment action required`);
  } catch (error) {
    console.error('Error in handlePaymentActionRequired:', error);
  }
}

// Handle new subscription creation
async function handleSubscriptionCreated(subscription) {
  try {
    console.log('Processing subscription creation:', {
      id: subscription.id,
      status: subscription.status,
      customer: subscription.customer
    });

    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = customer.metadata.userId;

    console.log('Customer data:', {
      id: customer.id,
      userId,
      email: customer.email
    });

    const priceId = subscription.items.data[0].price.id;
    const plan = PRICE_TO_PLAN[priceId];

    console.log('Plan mapping:', {
      priceId,
      plan,
      availablePlans: Object.keys(PRICE_TO_PLAN)
    });

    if (plan && plan !== 'enterprise') {
      await applyPlanUpdate(userId, {
        plan: plan,
        status: subscription.status,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      });
      
      console.log(`Successfully created subscription for user ${userId} with plan ${plan}`);
    } else {
      console.warn(`Unknown plan for price ID ${priceId} or enterprise plan`);
    }
  } catch (error) {
    console.error('Error in handleSubscriptionCreated:', error);
  }
}

// Get current subscription status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Auto-sync company users with their company subscription
    if (user.companyId) {
      await user.syncWithCompanySubscription();
    }
    
    const limits = user.getSubscriptionLimits();
    const usageStatus = user.getUsageStatus();
    
    res.json({
      subscription: user.subscription,
      limits,
      usageStatus,
      canUseAI: user.canUseAI(),
      usage: user.usage
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

// Get detailed subscription information
router.get('/details', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const limits = user.getSubscriptionLimits();
    const usageStatus = user.getUsageStatus();
    
    // Get plan features and pricing
    const currentPlan = SUBSCRIPTION_PLANS[user.subscription.plan] || SUBSCRIPTION_PLANS.free;
    const availablePlans = Object.keys(SUBSCRIPTION_PLANS).filter(plan => 
      plan !== 'enterprise' && SUBSCRIPTION_PLANS[plan].stripePriceId
    ).map(plan => ({
      plan,
      name: SUBSCRIPTION_PLANS[plan].name,
      price: SUBSCRIPTION_PLANS[plan].price,
      features: SUBSCRIPTION_PLANS[plan].features,
      limits: SUBSCRIPTION_PLANS[plan].limits,
      isCurrent: plan === user.subscription.plan
    }));
    
    res.json({
      currentPlan: {
        plan: user.subscription.plan,
        name: currentPlan.name,
        price: currentPlan.price,
        features: currentPlan.features,
        limits: currentPlan.limits
      },
      subscription: user.subscription,
      usage: user.usage,
      usageStatus,
      limits,
      canUseAI: user.canUseAI(),
      availablePlans
    });
  } catch (error) {
    console.error('Get subscription details error:', error);
    res.status(500).json({ error: 'Failed to get subscription details' });
  }
});

// Complete subscription setup for users with incomplete Stripe data
router.post('/complete-setup', authenticateToken, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        error: 'Billing service not configured',
        message: 'STRIPE_SECRET_KEY is missing. Configure it to enable subscriptions.'
      });
    }

    // Test Stripe configuration by making a simple API call
    try {
      await stripe.customers.list({ limit: 1 });
    } catch (stripeTestError) {
      console.error('Stripe configuration test failed:', stripeTestError);
      return res.status(503).json({
        error: 'Billing service configuration error',
        message: 'The billing service is not properly configured. Please contact support.'
      });
    }

    const user = await User.findById(req.user._id);
    
    // Check if user has an active subscription but no Stripe customer ID
    if (user.subscription.status !== 'active' || user.subscription.stripeCustomerId) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'This endpoint is only for users with active subscriptions missing Stripe data.'
      });
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: {
        userId: user._id.toString()
      }
    });

    // Update user with Stripe customer ID
    await User.findByIdAndUpdate(user._id, {
      'subscription.stripeCustomerId': customer.id
    });

    // Create a setup intent for adding payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      usage: 'off_session'
    });

    res.json({
      message: 'Subscription setup completed successfully. You can now add a payment method.',
      stripeCustomerId: customer.id,
      setupIntentClientSecret: setupIntent.client_secret
    });
  } catch (error) {
    console.error('Complete setup error:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeAuthenticationError') {
      return res.status(503).json({ 
        error: 'Billing service configuration error',
        message: 'The billing service is not properly configured. Please contact support.'
      });
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        error: 'Invalid request to billing service',
        message: 'The request to the billing service was invalid. Please try again.'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to complete subscription setup',
      message: 'An unexpected error occurred while setting up your subscription. Please try again or contact support.'
    });
  }
});

// Change plan for existing subscribers
router.post('/change-plan', authenticateToken, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        error: 'Billing service not configured',
        message: 'STRIPE_SECRET_KEY is missing. Configure it to enable subscriptions.'
      });
    }

    const { plan } = req.body;
    const planConfig = SUBSCRIPTION_PLANS[plan];

    if (!planConfig || !planConfig.stripePriceId) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    // Check if user has an active subscription
    if (!req.user.subscription.stripeSubscriptionId) {
      return res.status(400).json({ 
        error: 'No active subscription',
        message: 'You need an active subscription to change plans. Please upgrade first.'
      });
    }

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(req.user.subscription.stripeSubscriptionId);
    
    // Update subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [{
        id: subscription.items.data[0].id,
        price: planConfig.stripePriceId,
      }],
      metadata: {
        userId: req.user._id.toString(),
        plan: plan,
        priceId: planConfig.stripePriceId
      }
    });

    // Apply the plan update immediately
    await applyPlanUpdate(req.user._id, {
      plan: plan,
      status: updatedSubscription.status,
      stripeCustomerId: req.user.subscription.stripeCustomerId,
      stripeSubscriptionId: updatedSubscription.id,
      currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end
    });

    res.json({
      message: `Successfully changed to ${plan} plan`,
      plan: plan,
      status: updatedSubscription.status
    });
  } catch (error) {
    console.error('Change plan error:', error);
    res.status(500).json({ error: 'Failed to change plan' });
  }
});

// Get plan change options for current user
router.get('/change-options', authenticateToken, async (req, res) => {
  try {
    const currentPlan = req.user.subscription.plan;
    const availablePlans = Object.keys(SUBSCRIPTION_PLANS).filter(plan => 
      plan !== currentPlan && plan !== 'enterprise' && SUBSCRIPTION_PLANS[plan].stripePriceId
    );
    
    const options = availablePlans.map(plan => ({
      plan,
      name: SUBSCRIPTION_PLANS[plan].name,
      price: SUBSCRIPTION_PLANS[plan].price,
      features: SUBSCRIPTION_PLANS[plan].features,
      limits: SUBSCRIPTION_PLANS[plan].limits
    }));
    
    res.json({ availablePlans: options });
  } catch (error) {
    console.error('Get change options error:', error);
    res.status(500).json({ error: 'Failed to get plan change options' });
  }
});

// Immediate plan change (for downgrades or plan switches)
router.post('/change-plan-immediate', authenticateToken, async (req, res) => {
  try {
    const { plan } = req.body;
    const planConfig = SUBSCRIPTION_PLANS[plan];

    if (!planConfig) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    // Check if user has an active subscription
    if (!req.user.subscription.stripeSubscriptionId) {
      return res.status(400).json({ 
        error: 'No active subscription',
        message: 'You need an active subscription to change plans. Please upgrade first.'
      });
    }

    // For immediate changes, we'll update the user's plan in our database
    // The actual Stripe subscription will be updated via webhook when the change takes effect
    await applyPlanUpdate(req.user._id, {
      plan: plan,
      status: req.user.subscription.status, // Keep current status
      stripeCustomerId: req.user.subscription.stripeCustomerId,
      stripeSubscriptionId: req.user.subscription.stripeSubscriptionId,
      currentPeriodStart: req.user.subscription.currentPeriodStart,
      currentPeriodEnd: req.user.subscription.currentPeriodEnd,
      cancelAtPeriodEnd: req.user.subscription.cancelAtPeriodEnd
    });

    res.json({
      message: `Successfully changed to ${plan} plan`,
      plan: plan,
      status: req.user.subscription.status
    });
  } catch (error) {
    console.error('Immediate plan change error:', error);
    res.status(500).json({ error: 'Failed to change plan' });
  }
});

// Reset usage (for testing purposes - remove in production)
router.post('/reset-usage', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Reset usage counters
    user.usage.aiConversations = 0;
    user.usage.lastResetDate = new Date();
    await user.save();
    
    res.json({
      message: 'Usage reset successfully',
      usage: user.usage
    });
  } catch (error) {
    console.error('Reset usage error:', error);
    res.status(500).json({ error: 'Failed to reset usage' });
  }
});

// Fix subscription (temporary admin endpoint)
router.post('/fix-subscription', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('Fixing subscription for user:', user.email);
    console.log('Current plan:', user.subscription.plan);
    console.log('Current status:', user.subscription.status);
    console.log('Current monthly limit:', user.usage.monthlyLimit);
    
    // Update to Basic plan based on Stripe data
    const updateData = {
      'subscription.plan': 'basic',
      'subscription.status': 'active',
      'usage.monthlyLimit': 30, // Basic plan: 30 conversations per month
      'usage.dailyLimit': 30,
      'usage.aiTipsLimit': 10, // Basic plan: 10 AI tips per month
      'usage.aiConversations': 0,
      'usage.aiTipsUsed': 0,
      'usage.lastResetDate': new Date(),
      'usage.lastDailyResetDate': new Date(),
      'usage.lastAiTipsResetDate': new Date(),
      // Reset summary counts
      'usage.summariesGeneratedToday': 0,
      'usage.summariesGenerated': 0,
      'usage.lastSummaryResetDate': new Date()
    };
    
    const result = await User.findByIdAndUpdate(req.user._id, updateData, { new: true });
    
    console.log('Subscription fixed successfully!');
    console.log('New plan:', result.subscription.plan);
    console.log('New status:', result.subscription.status);
    console.log('New monthly limit:', result.usage.monthlyLimit);
    console.log('Summaries generated today:', result.usage.summariesGeneratedToday);
    
    res.json({
      message: 'Subscription fixed successfully',
      subscription: result.subscription,
      usage: result.usage
    });
  } catch (error) {
    console.error('Fix subscription error:', error);
    res.status(500).json({ error: 'Failed to fix subscription' });
  }
});

// Reset summary count (temporary admin endpoint)
router.post('/reset-summary-count', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('Resetting summary count for user:', user.email);
    console.log('Current summaries generated today:', user.usage.summariesGeneratedToday);
    
    // Reset summary counts
    const updateData = {
      'usage.summariesGeneratedToday': 0,
      'usage.lastSummaryResetDate': new Date()
    };
    
    const result = await User.findByIdAndUpdate(req.user._id, updateData, { new: true });
    
    console.log('Summary count reset successfully!');
    console.log('New summaries generated today:', result.usage.summariesGeneratedToday);
    
    res.json({
      message: 'Summary count reset successfully',
      summariesGeneratedToday: result.usage.summariesGeneratedToday,
      lastSummaryResetDate: result.usage.lastSummaryResetDate
    });
  } catch (error) {
    console.error('Reset summary count error:', error);
    res.status(500).json({ error: 'Failed to reset summary count' });
  }
});

// Debug endpoint to check all users with test@gmail.com
router.get('/debug-users', async (req, res) => {
  try {
    const users = await User.find({ email: 'test@gmail.com' });
    
    console.log('Found users with test@gmail.com:', users.length);
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`, {
        id: user._id,
        email: user.email,
        plan: user.subscription.plan,
        status: user.subscription.status,
        monthlyLimit: user.usage.monthlyLimit,
        stripeCustomerId: user.subscription.stripeCustomerId,
        createdAt: user.createdAt
      });
    });
    
    res.json({
      count: users.length,
      users: users.map(user => ({
        id: user._id,
        email: user.email,
        plan: user.subscription.plan,
        status: user.subscription.status,
        monthlyLimit: user.usage.monthlyLimit,
        stripeCustomerId: user.subscription.stripeCustomerId,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error('Debug users error:', error);
    res.status(500).json({ error: 'Failed to debug users' });
  }
});

// Get usage alerts and notifications
router.get('/usage-alerts', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const usageStatus = user.getUsageStatus();
    
    const alerts = [];
    
    // Check if approaching limit
    if (usageStatus.monthlyLimit > 0 && usageStatus.usagePercentage >= 80) {
      alerts.push({
        type: 'warning',
        message: `You're approaching your monthly limit (${usageStatus.usagePercentage}% used)`,
        action: 'Consider upgrading your plan to avoid interruptions'
      });
    }
    
    // Check if at limit
    if (usageStatus.monthlyLimit > 0 && usageStatus.usagePercentage >= 100) {
      alerts.push({
        type: 'error',
        message: 'You have reached your monthly limit',
        action: 'Upgrade your plan to continue using AI features'
      });
    }
    
    // Check if subscription is past due
    if (user.subscription.status === 'past_due') {
      alerts.push({
        type: 'error',
        message: 'Your subscription payment is past due',
        action: 'Update your payment method to restore access'
      });
    }
    
    res.json({ alerts });
  } catch (error) {
    console.error('Get usage alerts error:', error);
    res.status(500).json({ error: 'Failed to get usage alerts' });
  }
});



module.exports = router; 