const jwt = require('jsonwebtoken');

// Mock authentication middleware that doesn't require database
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Mock user data for development
    req.user = {
      id: decoded.userId || 'mock-user-id',
      userId: decoded.userId || 'mock-user-id',
      username: decoded.username || 'admin',
      email: decoded.email || 'admin@example.com',
      role: decoded.role || 'admin',
      state: decoded.state || 'Maharashtra',
      district: decoded.district || 'Pune',
      block: decoded.block || 'Ambegaon',
      is_active: true
    };
    
    next();
  });
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, decoded) => {
    if (err) {
      req.user = null;
      return next();
    }

    // Mock user data for development
    req.user = {
      id: decoded.userId || 'mock-user-id',
      userId: decoded.userId || 'mock-user-id',
      username: decoded.username || 'admin',
      email: decoded.email || 'admin@example.com',
      role: decoded.role || 'admin',
      state: decoded.state || 'Maharashtra',
      district: decoded.district || 'Pune',
      block: decoded.block || 'Ambegaon',
      is_active: true
    };
    
    next();
  });
};

module.exports = { authenticateToken, authorize, optionalAuth };

