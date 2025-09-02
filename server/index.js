const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
// Load env from server/.env first (if present), then fall back to project root .env
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const subscriptionRoutes = require('./routes/subscriptions');
const aiRoutes = require('./routes/ai');
const enterpriseRoutes = require('./routes/enterprise');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5002;

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cookieParser());

// When behind a proxy (e.g. CRA dev server), trust it so rate limiter gets real IP
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware - exclude webhook from JSON parsing
app.use((req, res, next) => {
  if (req.path === '/api/subscriptions/webhook') {
    // Skip JSON parsing for webhook to preserve raw body
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Database connection (guard missing URI)
const mongoUri = (process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== '')
  ? process.env.MONGODB_URI
  : 'mongodb://127.0.0.1:27017/salesbuddy';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log(`Connected to MongoDB: ${mongoUri.includes('127.0.0.1') ? 'local' : 'remote'}`))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);

// Subscription routes - webhook needs to be public, others need auth
app.use('/api/subscriptions', subscriptionRoutes);

app.use('/api/ai', authenticateToken, aiRoutes);
app.use('/api/enterprise', enterpriseRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`SalesBuddy server running on port ${PORT}`);
});

module.exports = app; 