# Subscription Fix Guide

## Current Issues

1. **Multiple User Accounts**: You're creating new accounts each time instead of using the same one
2. **Stripe Webhook Not Processing**: Users pay through Stripe but don't get their subscription updated in the database
3. **Wrong Subscription Limits**: Users still see old limits (50 conversations) instead of new limits (10 for free, 30 for basic)

## Immediate Fix

### Step 1: Fix Current User Subscriptions

Run this script to fix all test user subscriptions:

```bash
node comprehensive_subscription_fix.js
```

This will:
- Find all users with `test@gmail.com` or `test1@gmail.com`
- Check if they have a Stripe customer ID (indicating they paid)
- Update their subscription to Basic plan (30 conversations, 10 AI tips) if they paid
- Update their subscription to Free plan (10 conversations, 0 AI tips) if they didn't pay

### Step 2: Test Webhook Endpoint

Run this to test if the webhook endpoint is accessible:

```bash
node test_webhook_endpoint.js
```

## Root Cause Analysis

### The Subscription Flow Should Be:

1. **User visits pricing page** → chooses a plan
2. **User creates account** → with intended plan stored in localStorage
3. **User pays through Stripe** → Stripe sends webhook to update database
4. **User gets the plan** → subscription is active with correct limits

### What's Happening Now:

1. ✅ User visits pricing page → chooses a plan
2. ✅ User creates account → intended plan stored
3. ✅ User pays through Stripe → payment successful
4. ❌ **Stripe webhook not processing** → database not updated
5. ❌ User still shows free plan → with wrong limits

## Stripe Webhook Configuration

The webhook endpoint is at: `http://localhost:5002/api/subscriptions/webhook`

### Required Stripe Webhook Events:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### Environment Variables Required:
- `STRIPE_SECRET_KEY` ✅ (Set)
- `STRIPE_WEBHOOK_SECRET` ❓ (Check if set)
- `STRIPE_BASIC_PRICE_ID` ✅ (Set)
- `STRIPE_PRO_PRICE_ID` ✅ (Set)
- `STRIPE_UNLIMITED_PRICE_ID` ✅ (Set)

## Testing Steps

### 1. Check Environment Variables
```bash
echo $STRIPE_WEBHOOK_SECRET
```

### 2. Test Webhook Endpoint
```bash
node test_webhook_endpoint.js
```

### 3. Check Server Logs
Look for these logs in your server console:
- `Webhook received:`
- `Received Stripe webhook: checkout.session.completed`
- `Processing checkout.session.completed`

### 4. Fix User Subscriptions
```bash
node comprehensive_subscription_fix.js
```

## Prevention

### For Future Testing:
1. **Use the same account** - Don't create new accounts each time
2. **Check webhook logs** - Ensure webhooks are processing
3. **Verify subscription data** - Check that limits match the plan

### For Production:
1. **Configure Stripe webhook** in Stripe dashboard
2. **Use production webhook URL** (not localhost)
3. **Monitor webhook processing** in server logs
4. **Set up webhook retry logic** for failed webhooks

## Current Subscription Plans

| Plan | Price | Conversations | AI Tips | Features |
|------|-------|---------------|---------|----------|
| Free | $0 | 10/month | 0 | Basic scenarios |
| Basic | $49.99 | 30/month | 10 | Tips, lessons, email support |
| Pro | $89.99 | 50/month | 25 | Customization, feedback, priority support |
| Unlimited | $349 | 200/month | 50 | All features, dedicated support |
| Enterprise | Custom | 50/day | 50 | Team management, all features |

## Next Steps

1. **Run the fix script** to update current users
2. **Configure Stripe webhook** in Stripe dashboard
3. **Test the complete flow** with a new subscription
4. **Monitor webhook processing** in server logs
