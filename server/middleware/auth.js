const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔐 [AUTH] Authentication attempt:', {
      url: req.url,
      method: req.method,
      hasAuthHeader: !!req.headers['authorization'],
      authHeaderValue: req.headers['authorization'] ? req.headers['authorization'].substring(0, 30) + '...' : 'none',
      hasCookies: !!req.cookies,
      cookieKeys: req.cookies ? Object.keys(req.cookies) : [],
      userAgent: req.headers['user-agent']?.substring(0, 50),
      timestamp: new Date().toISOString()
    });

    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    const cookieToken = req.cookies && req.cookies['sb_token'];
    const token = bearerToken || cookieToken;

    console.log('🔐 [AUTH] Token check:', {
      hasBearerToken: !!bearerToken,
      bearerTokenStart: bearerToken ? bearerToken.substring(0, 20) + '...' : 'none',
      hasCookieToken: !!cookieToken,
      cookieTokenStart: cookieToken ? cookieToken.substring(0, 20) + '...' : 'none',
      finalToken: token ? token.substring(0, 20) + '...' : 'none',
      tokenLength: token ? token.length : 0
    });

    if (!token) {
      console.log('❌ [AUTH] No token found');
      return res.status(401).json({ error: 'Access token required' });
    }

    console.log('🔐 [AUTH] About to verify token with JWT_SECRET:', {
      hasJwtSecret: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0
    });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔐 [AUTH] Token decoded successfully:', { 
      userId: decoded.userId,
      decodedToken: decoded 
    });
    
    console.log('🔐 [AUTH] Searching for user with ID:', decoded.userId);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('❌ [AUTH] User not found for ID:', decoded.userId);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    console.log('🔐 [AUTH] User found in database:', {
      id: user._id,
      email: user.email,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      isAdmin: user.isAdmin,
      adminPermissions: user.adminPermissions,
      hasAdminAccess: user.hasAdminAccess ? user.hasAdminAccess() : 'method not available'
    });

    console.log('✅ [AUTH] User authenticated:', { 
      id: user._id, 
      email: user.email,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      isAdmin: user.isAdmin,
      adminPermissions: user.adminPermissions
    });

    req.user = user;
    next();
  } catch (error) {
    console.log('❌ [AUTH] Authentication error:', {
      name: error.name,
      message: error.message,
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