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
const companyRoutes = require('./routes/companies');
const passwordResetRoutes = require('./routes/passwordReset');
const adminRoutes = require('./routes/admin');
const conversationSummaryRoutes = require('./routes/conversationSummaries');
const translationsRoutes = require('./routes/translations');
const dynamicTranslationRoutes = require('./routes/dynamicTranslation');
const speechRoutes = require('./routes/speech');
const leaderboardRoutes = require('./routes/leaderboard');
const feedbackRoutes = require('./routes/feedback-simple');
const { authenticateToken } = require('./middleware/auth');

// Log startup information
console.log('🚀 [SERVER] Starting SalesBuddy server...');
console.log('📊 [SERVER] Environment:', process.env.NODE_ENV || 'development');
console.log('🔧 [SERVER] Port:', process.env.PORT || 5002);
const dailyRefreshService = require('./services/dailyRefreshService');

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

// Add debugging for all requests
app.use((req, res, next) => {
  console.log('🌐 [SERVER] Request:', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']?.substring(0, 50),
    timestamp: new Date().toISOString()
  });
  next();
});

// CORS configuration
const allowedOrigins = [
  'https://salesbuddy.pro',
  'https://www.salesbuddy.pro', 
  'https://app.salesbuddy.pro',
  'https://salesbuddy-client.vercel.app',
  'https://sales-buddy.vercel.app',
  'https://salesbuddy-production.up.railway.app',
  'http://localhost:3000', // For local development
  'http://localhost:3001'  // For local development
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ [CORS] Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Handle preflight OPTIONS requests explicitly
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  res.status(200).end();
});

// Additional CORS middleware to ensure headers are set on all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  next();
});

// Database connection (use short timeouts so startup never hangs)
const mongoUri = (process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== '')
  ? process.env.MONGODB_URI
  : 'mongodb://127.0.0.1:27017/salesbuddy';

mongoose
  .connect(mongoUri, {
    // Fail fast if DB is unreachable (important in Railway containers)
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 10000
  })
  .then(() => console.log(`Connected to MongoDB: ${mongoUri.includes('127.0.0.1') ? 'local' : 'remote'}`))
  .catch(err => console.error('MongoDB connection error:', err.message || err));

// Request logging middleware (disabled in production)
// app.use('/api', (req, res, next) => {
//   console.log('🌐 [SERVER] Incoming request:', {
//     method: req.method,
//     url: req.url,
//     path: req.path,
//     timestamp: new Date().toISOString()
//   });
//   next();
// });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/companies', authenticateToken, companyRoutes);
app.use('/api/password-reset', passwordResetRoutes);

app.use('/api/admin', authenticateToken, adminRoutes);

// Subscription routes - webhook needs to be public, others need auth
app.use('/api/subscriptions', subscriptionRoutes);

app.use('/api/ai', authenticateToken, aiRoutes);
app.use('/api/conversation-summaries', authenticateToken, conversationSummaryRoutes);
app.use('/api/translations', translationsRoutes);
app.use('/api/dynamic-translation', dynamicTranslationRoutes);
app.use('/api/speech', authenticateToken, speechRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/enterprise', enterpriseRoutes);
// Feedback routes with error handling
try {
  console.log('🔍 [ROUTES] Loading feedback routes...');
  console.log('🔍 [ROUTES] feedbackRoutes type:', typeof feedbackRoutes);
  console.log('🔍 [ROUTES] feedbackRoutes:', feedbackRoutes);
  
  app.use('/api/feedback', feedbackRoutes);
  console.log('✅ [ROUTES] Feedback routes loaded successfully');
  
  // Test the feedback route
  app.get('/api/feedback/test', (req, res) => {
    res.json({ message: 'Feedback API is working!', timestamp: new Date().toISOString() });
  });
  console.log('✅ [ROUTES] Feedback test route added');
  
  // List all registered routes for debugging
  console.log('🔍 [ROUTES] Registered feedback routes:');
  if (feedbackRoutes.stack) {
    feedbackRoutes.stack.forEach((route) => {
      console.log(`  ${route.route?.methods || 'unknown'} ${route.route?.path || 'unknown'}`);
    });
  } else {
    console.log('  No routes found in feedbackRoutes.stack');
  }
} catch (error) {
  console.error('❌ [ROUTES] Failed to load feedback routes:', error);
  console.error('❌ [ROUTES] Error details:', error.stack);
}

// Root endpoint - provide API information
app.get('/', (req, res) => {
  res.json({
    message: 'SalesBuddy API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      companies: '/api/companies',
      ai: '/api/ai',
      admin: '/api/admin'
    },
    documentation: 'This is an API-only server. Use the frontend application to interact with the system.'
  });
});

// Health check endpoint (for Railway health checks)
app.get('/health', (req, res) => {
  try {
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    };
    
    // Return 200 if server is running, even if DB is not connected yet
    res.json(healthStatus);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint (for API health checks)
app.get('/api/health', (req, res) => {
  try {
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    };
    
    // Return 200 if server is running, even if DB is not connected yet
    res.json(healthStatus);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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
  console.log('❌ [SERVER] 404 - Route not found:', {
    method: req.method,
    url: req.url,
    path: req.path,
    timestamp: new Date().toISOString()
  });
  res.status(404).json({ error: 'Route not found' });
});

const server = app.listen(PORT, () => {
  console.log(`✅ SalesBuddy server running on port ${PORT}`);
  console.log(`🌐 Health check available at: http://localhost:${PORT}/health`);
  console.log(`🌐 API health check available at: http://localhost:${PORT}/api/health`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ Database: ${mongoose.connection.readyState === 1 ? 'connected' : 'connecting...'}`);
  
  // Start the daily refresh service for enterprise users
  dailyRefreshService.startDailyRefresh();
  console.log('📅 Daily refresh service initialized');
});

// Handle server startup errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please:`);
    console.error(`   1. Kill the process using port ${PORT}`);
    console.error(`   2. Or change the PORT environment variable`);
    console.error(`   3. Or wait for the port to be released`);
    console.error(`\nTo find and kill the process using port ${PORT}, run:`);
    console.error(`   netstat -ano | findstr :${PORT}`);
    console.error(`   taskkill /PID <PID> /F`);
  } else {
    console.error('Server startup error:', err);
  }
  process.exit(1);
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  // Set a very short timeout for development
  const timeout = process.env.NODE_ENV === 'development' ? 100 : 5000;
  
  // Force close immediately in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🚨 [DEV] Force closing server immediately');
    
    // Stop the daily refresh service
    try {
      dailyRefreshService.stopDailyRefresh();
    } catch (err) {
      console.log('Daily refresh service already stopped');
    }
    
    // Close MongoDB connection
    try {
      mongoose.connection.close(false);
    } catch (err) {
      console.log('MongoDB connection already closed');
    }
    
    // Force close the server immediately
    if (server) {
      server.close(() => {
        console.log('Server forcefully closed');
        process.exit(0);
      });
      
      // Force exit after 100ms if server doesn't close
      setTimeout(() => {
        console.log('Force exiting - server close timeout');
        process.exit(0);
      }, 100);
    } else {
      process.exit(0);
    }
  }
  
  // Check if server is actually running before trying to close it
  if (server && server.listening) {
    server.close((err) => {
      if (err) {
        console.error('Error during server shutdown:', err);
      } else {
        console.log('HTTP server closed.');
      }
      
      // Stop the daily refresh service
      dailyRefreshService.stopDailyRefresh();
      
      // Close MongoDB connection
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed.');
        process.exit(0);
      });
    });
  } else {
    console.log('Server was not running, skipping server close.');
    
    // Stop the daily refresh service
    dailyRefreshService.stopDailyRefresh();
    
    // Close MongoDB connection
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  }
  
  // Force close after timeout
  setTimeout(() => {
    console.error('🚨 Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, timeout);
};

// Force exit on multiple signals (for development)
let shutdownCount = 0;
const forceShutdown = (signal) => {
  shutdownCount++;
  if (shutdownCount >= 2) {
    console.log('🚨 [SERVER] Force shutdown after multiple signals');
    process.exit(1);
  } else {
    gracefulShutdown(signal);
  }
};

// Immediate force shutdown for development
const immediateShutdown = () => {
  console.log('🚨 [SERVER] Immediate force shutdown');
  process.exit(1);
};

// Handle different termination signals
process.on('SIGTERM', () => forceShutdown('SIGTERM'));
process.on('SIGINT', () => forceShutdown('SIGINT'));

// Handle Windows termination signals
process.on('SIGBREAK', () => forceShutdown('SIGBREAK'));
process.on('SIGHUP', () => forceShutdown('SIGHUP'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (process.env.NODE_ENV === 'development') {
    console.log('🚨 [DEV] Force exit on uncaught exception');
    process.exit(1);
  } else {
    gracefulShutdown('uncaughtException');
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (process.env.NODE_ENV === 'development') {
    console.log('🚨 [DEV] Force exit on unhandled rejection');
    process.exit(1);
  } else {
    gracefulShutdown('unhandledRejection');
  }
});

// Force exit on process exit (development only)
if (process.env.NODE_ENV === 'development') {
  process.on('exit', (code) => {
    console.log(`🚨 [DEV] Process exiting with code: ${code}`);
  });
}

module.exports = app; 