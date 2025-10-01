# Deploy to salesbuddy.pro

This guide will help you deploy your latest changes to the salesbuddy.pro domain.

## 🚀 Current Setup

Your app is already configured for salesbuddy.pro:
- ✅ Backend: `https://salesbuddy-production.up.railway.app` (Railway)
- ✅ Frontend: `https://salesbuddy.pro` (Vercel)
- ✅ CORS configured for salesbuddy.pro domains

## 📋 Deployment Steps

### 1. **Commit and Push Your Changes**

```bash
# Add all your changes
git add .

# Commit with a descriptive message
git commit -m "Add Estonian voice support and AI Conversations translation"

# Push to your main branch
git push origin main
```

### 2. **Backend Deployment (Railway)**

Your backend is already deployed on Railway and should auto-deploy when you push to main. To verify:

1. **Check Railway Dashboard:**
   - Go to [Railway.app](https://railway.app)
   - Find your `salesbuddy-production` project
   - Check if the latest deployment is running

2. **Manual Deploy (if needed):**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway link
   railway up
   ```

### 3. **Frontend Deployment (Vercel)**

Your frontend should auto-deploy to salesbuddy.pro when you push to main. To verify:

1. **Check Vercel Dashboard:**
   - Go to [Vercel.com](https://vercel.com)
   - Find your salesbuddy project
   - Check if the latest deployment is running

2. **Manual Deploy (if needed):**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy from client directory
   cd client
   vercel --prod
   ```

### 4. **Verify Deployment**

After deployment, test these URLs:

- **Main App:** https://salesbuddy.pro
- **API Health:** https://salesbuddy-production.up.railway.app/health
- **API Test:** https://salesbuddy-production.up.railway.app/api/auth/me

## 🔧 Environment Variables Check

Make sure these are set in your Railway backend:

```env
NODE_ENV=production
PORT=5002
CLIENT_URL=https://salesbuddy.pro
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
OPENAI_API_KEY=your-openai-api-key
GOOGLE_TRANSLATE_API_KEY=your-google-translate-key
STRIPE_SECRET_KEY=sk_live_your-stripe-live-key
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret
STRIPE_BASIC_PRICE_ID=price_basic_monthly_live_id
STRIPE_PRO_PRICE_ID=price_pro_monthly_live_id
STRIPE_UNLIMITED_PRICE_ID=price_unlimited_monthly_live_id
```

## 🧪 Test Your Changes

After deployment, test these features:

### 1. **Estonian Voice Support**
- Go to https://salesbuddy.pro
- Switch language to Estonian (🇪🇪)
- Create a new conversation
- Check voice selection dropdown for Estonian voices with 🇪🇪 flag

### 2. **AI Conversations Translation**
- Go to Profile page
- Check that "AI Conversations" text is translated
- Verify company name shows correctly

### 3. **Stripe Integration**
- Test subscription flow
- Verify payment processing works

## 🚨 Troubleshooting

### If Frontend Doesn't Update:
```bash
# Force Vercel redeploy
cd client
vercel --prod --force
```

### If Backend Doesn't Update:
```bash
# Force Railway redeploy
railway up --detach
```

### If CORS Issues:
- Check that `https://salesbuddy.pro` is in your CORS allowed origins
- Verify `CLIENT_URL` environment variable is set correctly

### If API Calls Fail:
- Check browser console for errors
- Verify API URL is correct: `https://salesbuddy-production.up.railway.app`
- Test API health endpoint

## 📊 Monitoring

### Railway (Backend):
- **Dashboard:** https://railway.app/dashboard
- **Logs:** Check deployment logs for errors
- **Metrics:** Monitor CPU, memory, and response times

### Vercel (Frontend):
- **Dashboard:** https://vercel.com/dashboard
- **Analytics:** Check deployment status and build logs
- **Functions:** Monitor any serverless functions

## 🔄 Auto-Deployment

Your setup should auto-deploy when you push to the main branch:

1. **GitHub Push** → **Railway** (Backend)
2. **GitHub Push** → **Vercel** (Frontend)

If auto-deployment isn't working:
- Check GitHub Actions
- Verify webhook connections
- Ensure proper permissions

## ✅ Success Checklist

- [ ] Code pushed to main branch
- [ ] Railway deployment successful
- [ ] Vercel deployment successful
- [ ] https://salesbuddy.pro loads correctly
- [ ] Estonian voice selection works
- [ ] AI Conversations text is translated
- [ ] Company name displays correctly
- [ ] Stripe integration works
- [ ] No console errors

## 🆘 Need Help?

If you encounter issues:

1. **Check Logs:**
   - Railway: Project → Deployments → View Logs
   - Vercel: Project → Functions → View Logs

2. **Test Locally:**
   - Make sure it works locally first
   - Check environment variables

3. **Common Issues:**
   - Environment variables not set
   - CORS configuration
   - Build errors
   - Network connectivity

Your app should be live at https://salesbuddy.pro with all your latest changes! 🎉
