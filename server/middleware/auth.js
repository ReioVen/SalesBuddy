const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  console.log('🔐 [AUTH] Authenticating request:', {
    method: req.method,
    url: req.url,
    hasAuthHeader: !!req.headers['authorization'],
    hasCookie: !!req.cookies?.['sb_token']
  });
  
  try {
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    const cookieToken = req.cookies && req.cookies['sb_token'];
    const token = bearerToken || cookieToken;

    if (!token) {
      console.log('❌ [AUTH] No token found');
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('❌ [AUTH] User not found for token');
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('✅ [AUTH] User authenticated:', {
      id: user._id,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    });

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ [AUTH] Authentication error:', error);
    if (error.name === 'JsonWebTokenError') {
      console.log('❌ [AUTH] Invalid JWT token');
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      console.log('❌ [AUTH] Token expired');
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