# SalesBuddy Deployment Guide

This guide will walk you through deploying your SalesBuddy application to production.

## 🚀 Quick Deployment Steps

### 1. Domain Purchase

**Recommended Domain Registrars:**
- **Namecheap** (Recommended) - `salesbuddy.ai` or `salesbuddy.app`
- **Cloudflare Registrar** - Best DNS performance
- **Google Domains** - Simple interface

**Domain Structure:**
```
salesbuddy.ai (main domain)
├── app.salesbuddy.ai (frontend)
├── api.salesbuddy.ai (backend)
└── admin.salesbuddy.ai (admin panel)
```

### 2. Backend Deployment (Railway)

1. **Sign up at [Railway.app](https://railway.app)**
2. **Connect your GitHub repository**
3. **Create new project from GitHub repo**
4. **Configure environment variables:**
   ```env
   NODE_ENV=production
   PORT=5002
   MONGODB_URI=your-production-mongodb-uri
   JWT_SECRET=your-production-jwt-secret
   OPENAI_API_KEY=your-openai-api-key
   GOOGLE_TRANSLATE_API_KEY=your-google-translate-key
   STRIPE_SECRET_KEY=sk_live_your-stripe-live-key
   STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret
   STRIPE_BASIC_PRICE_ID=price_basic_monthly_id
   STRIPE_PRO_PRICE_ID=price_pro_monthly_id
   STRIPE_UNLIMITED_PRICE_ID=price_unlimited_monthly_id
   CLIENT_URL=https://app.salesbuddy.ai
   ```
5. **Set build command:** `cd server && npm install && npm start`
6. **Deploy!**

### 3. Frontend Deployment (Vercel)

1. **Sign up at [Vercel.com](https://vercel.com)**
2. **Import your GitHub repository**
3. **Configure build settings:**
   - Framework Preset: `Create React App`
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `build`
4. **Set environment variables:**
   ```env
   REACT_APP_API_URL=https://api.salesbuddy.ai
   ```
5. **Deploy!**

### 4. DNS Configuration

**In your domain registrar's DNS settings:**

```
Type    Name    Value
A       @       [Vercel IP]
CNAME   app     cname.vercel-dns.com
CNAME   api     [Railway domain]
CNAME   admin   cname.vercel-dns.com
```

### 5. SSL Certificates

Both Railway and Vercel provide automatic SSL certificates. No additional setup required!

## 🔧 Environment Variables

### Production Backend (.env)
```env
NODE_ENV=production
PORT=5002
CLIENT_URL=https://app.salesbuddy.ai

# MongoDB Atlas (Production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/salesbuddy-prod?retryWrites=true&w=majority

# JWT Secret (Generate a strong secret)
JWT_SECRET=your-super-secure-production-jwt-secret-here

# OpenAI API (Production)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Google Translate API
GOOGLE_TRANSLATE_API_KEY=your-google-translate-api-key-here

# Stripe (Live Keys)
STRIPE_SECRET_KEY=sk_live_your-stripe-live-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-live-webhook-secret

# Stripe Price IDs (Live)
STRIPE_BASIC_PRICE_ID=price_basic_monthly_live_id
STRIPE_PRO_PRICE_ID=price_pro_monthly_live_id
STRIPE_UNLIMITED_PRICE_ID=price_unlimited_monthly_live_id
```

### Production Frontend
```env
REACT_APP_API_URL=https://api.salesbuddy.ai
```

## 🚀 Deployment Commands

### Manual Deployment

**Backend (Railway):**
```bash
# Railway CLI
npm install -g @railway/cli
railway login
railway link
railway up
```

**Frontend (Vercel):**
```bash
# Vercel CLI
npm install -g vercel
cd client
vercel --prod
```

### Docker Deployment

```bash
# Build and run with Docker
docker-compose up -d

# Or build and push to registry
docker build -t salesbuddy:latest .
docker tag salesbuddy:latest your-registry/salesbuddy:latest
docker push your-registry/salesbuddy:latest
```

## 🔄 CI/CD Setup

The included GitHub Actions workflow will automatically:
1. Run tests on every push
2. Deploy backend to Railway on main branch
3. Deploy frontend to Vercel on main branch

**Required GitHub Secrets:**
- `RAILWAY_TOKEN` - Get from Railway dashboard
- `VERCEL_TOKEN` - Get from Vercel dashboard
- `VERCEL_ORG_ID` - Get from Vercel dashboard
- `VERCEL_PROJECT_ID` - Get from Vercel dashboard

## 📊 Monitoring & Analytics

### Recommended Tools:
1. **Railway Metrics** - Backend monitoring
2. **Vercel Analytics** - Frontend performance
3. **Sentry** - Error tracking
4. **Google Analytics** - User analytics

## 🔒 Security Checklist

- [ ] Use production MongoDB Atlas cluster
- [ ] Generate strong JWT secret
- [ ] Use Stripe live keys
- [ ] Enable CORS for production domains
- [ ] Set up rate limiting
- [ ] Configure security headers
- [ ] Enable HTTPS everywhere
- [ ] Set up monitoring and alerts

## 💰 Cost Estimation

**Monthly Costs:**
- Domain: $10-15/year
- Railway (Backend): $5-20/month
- Vercel (Frontend): Free tier or $20/month
- MongoDB Atlas: $9-25/month
- Total: ~$25-70/month

## 🆘 Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Update `CLIENT_URL` in backend environment
   - Check CORS configuration in server

2. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed

3. **Database Connection Issues**
   - Verify MongoDB Atlas whitelist
   - Check connection string format

4. **Stripe Webhook Issues**
   - Update webhook URL in Stripe dashboard
   - Verify webhook secret

### Support:
- Railway: [docs.railway.app](https://docs.railway.app)
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- MongoDB Atlas: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)

## 🎉 Post-Deployment

After successful deployment:

1. **Test all functionality**
2. **Set up monitoring**
3. **Configure backups**
4. **Update documentation**
5. **Notify users of launch**

---

**Need help?** Check the troubleshooting section or contact support.
