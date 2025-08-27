# SalesBuddy - AI-Powered Sales Training Platform

SalesBuddy is a modern web application that helps sales professionals improve their skills through AI-powered conversations. The platform uses ChatGPT API to create realistic customer scenarios for practice and training.

## 🚀 Features

- **AI-Powered Training**: Practice with intelligent AI that adapts to your industry and experience level
- **Realistic Scenarios**: Experience authentic customer interactions with common objections
- **Subscription Management**: Multiple pricing tiers with Stripe integration
- **Performance Analytics**: Track your progress with detailed insights
- **User Management**: Secure authentication and user profiles
- **Responsive Design**: Modern UI that works on all devices

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB Atlas** for database
- **JWT** for authentication
- **Stripe** for payment processing
- **OpenAI API** for AI conversations

### Frontend
- **React.js** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **React Hot Toast** for notifications

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account
- OpenAI API key
- Stripe account (for payments)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd SalesBuddy
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Setup

Copy the example environment file and configure your variables:

```bash
cp env.example .env
```

Update the `.env` file with your actual values:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/salesbuddy?retryWrites=true&w=majority

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key-here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret

# Stripe Price IDs
STRIPE_BASIC_PRICE_ID=price_basic_monthly_id
STRIPE_PRO_PRICE_ID=price_pro_monthly_id
STRIPE_ENTERPRISE_PRICE_ID=price_enterprise_monthly_id
```

### 4. Database Setup

1. Create a MongoDB Atlas cluster
2. Get your connection string
3. Update the `MONGODB_URI` in your `.env` file

### 5. Stripe Setup

1. Create a Stripe account
2. Get your API keys from the dashboard
3. Create three products in Stripe:
   - Basic Plan ($49.99/month)
   - Pro Plan ($89.99/month)
   - Unlimited Plan ($349/month)
4. Copy the price IDs to your `.env` file

### 6. OpenAI Setup

1. Get an API key from [OpenAI](https://platform.openai.com/)
2. Add it to your `.env` file

### 7. Run the Application

```bash
# From the root directory
npm run dev
```

This will start both the server (port 5000) and client (port 3000).

## 📁 Project Structure

```
SalesBuddy/
├── server/                 # Backend API
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   └── index.js           # Server entry point
├── client/                # Frontend React app
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── App.tsx        # Main app component
│   └── public/            # Static files
├── package.json           # Root package.json
└── README.md             # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### AI Conversations
- `POST /api/ai/conversation` - Start new conversation
- `POST /api/ai/message` - Send message to AI
- `GET /api/ai/conversations` - Get conversation history
- `GET /api/ai/usage` - Get usage statistics

### Subscriptions
- `GET /api/subscriptions/plans` - Get available plans
- `POST /api/subscriptions/create-checkout-session` - Create Stripe checkout
- `POST /api/subscriptions/webhook` - Stripe webhook handler

### User Management
- `GET /api/users/dashboard` - Get dashboard data
- `GET /api/users/analytics` - Get user analytics
- `PUT /api/users/settings` - Update user settings

## 🚀 Deployment

### Backend Deployment (Railway/Render)

1. Push your code to GitHub
2. Connect your repository to Railway or Render
3. Set environment variables in the deployment platform
4. Deploy

### Frontend Deployment (Vercel/Netlify)

1. Build the React app: `npm run build`
2. Deploy the `build` folder to Vercel or Netlify
3. Set environment variables for production

### Environment Variables for Production

Make sure to update these for production:

```env
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.com
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
STRIPE_SECRET_KEY=sk_live_your-stripe-live-key
```

## 🔒 Security Features

- JWT authentication with secure token storage
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Input validation and sanitization
- Helmet.js for security headers

## 📊 Subscription Plans

- **Free**: 10 AI conversations per month
- **Basic ($49.99/month)**: 200 AI conversations, Tips and Lessons
- **Pro ($89.99/month)**: 500 AI conversations, Tips and Lessons, More Client Customization, Personal Summary Feedback
- **Unlimited ($349/month)**: Unlimited conversations, Tips and Lessons, Summary, More Client Customization, Personal Summary Feedback
- **Enterprise**: Custom pricing, Unlimited conversations, Tips and Lessons, Summary, More Client Customization, Personal Summary Feedback, Team management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@salesbuddy.com or create an issue in the repository.

## 🔮 Future Features

- Team collaboration tools
- Advanced analytics dashboard
- Custom scenario builder
- Integration with CRM systems
- Mobile app
- Multi-language support 