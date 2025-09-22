const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    try {
      // Verify user still exists and is active
      const user = await pool.query(
        'SELECT id, username, email, role, state, district, block, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (user.rows.length === 0) {
        return res.status(403).json({ error: 'User not found' });
      }

      if (!user.rows[0].is_active) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      req.user = {
        userId: decoded.userId,
        role: decoded.role,
        ...user.rows[0]
      };
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Authentication error' });
    }
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

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', async (err, decoded) => {
    if (err) {
      req.user = null;
      return next();
    }

    try {
      const user = await pool.query(
        'SELECT id, username, email, role, state, district, block, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (user.rows.length > 0 && user.rows[0].is_active) {
        req.user = {
          userId: decoded.userId,
          role: decoded.role,
          ...user.rows[0]
        };
      } else {
        req.user = null;
      }
    } catch (error) {
      req.user = null;
    }

    next();
  });
};

module.exports = { authenticateToken, authorize, optionalAuth };



