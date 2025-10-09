const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    // Only log for cloud-tts to avoid spam
    if (req.path.includes('cloud-tts')) {
      console.log('🔐 [AUTH] Cloud TTS authentication attempt');
    }

    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    const cookieToken = req.cookies && req.cookies['sb_token'];
    const token = bearerToken || cookieToken;

    if (req.path.includes('cloud-tts')) {
      console.log('🔐 [AUTH] Token sources:', {
        authHeaderPresent: !!authHeader,
        bearerTokenExtracted: !!bearerToken,
        cookiePresent: !!cookieToken,
        finalToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
        allCookies: Object.keys(req.cookies || {})
      });
    }

    if (!token) {
      if (req.path.includes('cloud-tts')) {
        console.log(`❌ [AUTH] No token found for ${req.method} ${req.path}`);
        console.log('❌ [AUTH] Auth header:', authHeader || 'Missing');
        console.log('❌ [AUTH] Cookies:', Object.keys(req.cookies || {}));
      } else {
        console.log('❌ [AUTH] No token found');
      }
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('❌ [AUTH] User not found for ID:', decoded.userId);
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    
    if (req.path.includes('cloud-tts')) {
      console.log(`✅ [AUTH] Cloud TTS: User ${user.email} authenticated successfully`);
    }
    
    next();
  } catch (error) {
    console.log('❌ [AUTH] Authentication error:', {
      name: error.name,
      message: error.message,
      path: req.path,
      stack: error.stack?.substring(0, 200)
    });
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('❌ [AUTH] Unexpected auth error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

const requireSubscription = (req, res, next) => {
  if (!req.user.hasActiveSubscription()) {
    return res.status(403).json({ 
      error: 'Active subscription required',
      message: 'Please upgrade your plan to access this feature'
    });
  }
  next();
};

const requirePlan = (requiredPlan) => {
  return (req, res, next) => {
    const planHierarchy = {
      'free': 0,
      'basic': 1,
      'pro': 2,
      'enterprise': 3
    };

    const userPlanLevel = planHierarchy[req.user.subscription.plan] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan] || 0;

    if (userPlanLevel < requiredPlanLevel) {
      return res.status(403).json({
        error: 'Insufficient plan level',
        message: `This feature requires ${requiredPlan} plan or higher`
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  requireSubscription,
  requirePlan
};
