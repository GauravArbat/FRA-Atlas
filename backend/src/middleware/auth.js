const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    try {
      // Verify user still exists and is active
      // First check what columns exist
      const tableInfo = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'users'
      `);
      
      const columns = tableInfo.rows.map(row => row.column_name);
      const hasUsername = columns.includes('username');
      const hasState = columns.includes('state');
      const hasDistrict = columns.includes('district');
      const hasBlock = columns.includes('block');
      const hasIsActive = columns.includes('is_active');
      
      const selectColumns = [
        'id',
        hasUsername ? 'username' : 'email as username',
        'email',
        'COALESCE(role, \'user\') as role',
        hasState ? 'state' : 'NULL as state',
        hasDistrict ? 'district' : 'NULL as district', 
        hasBlock ? 'block' : 'NULL as block',
        hasIsActive ? 'is_active' : 'true as is_active'
      ].join(', ');
      
      const user = await pool.query(
        `SELECT ${selectColumns} FROM users WHERE id = $1`,
        [decoded.userId]
      );

      if (user.rows.length === 0) {
        // Fallback to hardcoded users for admin access
        const fallbackUsers = [
          { id: '1', username: 'admin', email: 'admin@fraatlas.gov.in', role: 'admin', is_active: true },
          { id: '2', username: 'state_mp', email: 'state@mp.gov.in', role: 'state_admin', is_active: true },
          { id: '3', username: 'district_bhopal', email: 'tribal.bhopal@mp.gov.in', role: 'district_admin', is_active: true }
        ];
        
        const fallbackUser = fallbackUsers.find(u => u.id === decoded.userId);
        if (!fallbackUser) {
          return res.status(403).json({ error: 'User not found' });
        }
        
        req.user = {
          userId: decoded.userId,
          role: decoded.role,
          ...fallbackUser
        };
        return next();
      }

      if (hasIsActive && !user.rows[0].is_active) {
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

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      req.user = null;
      return next();
    }

    try {
      // Check what columns exist
      const tableInfo = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'users'
      `);
      
      const columns = tableInfo.rows.map(row => row.column_name);
      const hasUsername = columns.includes('username');
      const hasState = columns.includes('state');
      const hasDistrict = columns.includes('district');
      const hasBlock = columns.includes('block');
      const hasIsActive = columns.includes('is_active');
      
      const selectColumns = [
        'id',
        hasUsername ? 'username' : 'email as username',
        'email',
        'COALESCE(role, \'user\') as role',
        hasState ? 'state' : 'NULL as state',
        hasDistrict ? 'district' : 'NULL as district', 
        hasBlock ? 'block' : 'NULL as block',
        hasIsActive ? 'is_active' : 'true as is_active'
      ].join(', ');
      
      const user = await pool.query(
        `SELECT ${selectColumns} FROM users WHERE id = $1`,
        [decoded.userId]
      );

      if (user.rows.length > 0 && (!hasIsActive || user.rows[0].is_active)) {
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



