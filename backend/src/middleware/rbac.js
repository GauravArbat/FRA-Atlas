const { pool } = require('../config/database');

// Role hierarchy (higher roles can access lower role resources)
const roleHierarchy = {
  'admin': ['admin', 'state_admin', 'district_admin', 'block_admin', 'user'],
  'state_admin': ['state_admin', 'district_admin', 'block_admin', 'user'],
  'district_admin': ['district_admin', 'block_admin', 'user'],
  'block_admin': ['block_admin', 'user'],
  'user': ['user']
};

// Geographic scope validation
const validateGeographicScope = (userRole, userLocation, requestedLocation) => {
  switch (userRole) {
    case 'admin':
      return true; // Admin can access all locations
    case 'state_admin':
      return !requestedLocation.state || userLocation.state === requestedLocation.state;
    case 'district_admin':
      return (!requestedLocation.state || userLocation.state === requestedLocation.state) &&
             (!requestedLocation.district || userLocation.district === requestedLocation.district);
    case 'block_admin':
      return (!requestedLocation.state || userLocation.state === requestedLocation.state) &&
             (!requestedLocation.district || userLocation.district === requestedLocation.district) &&
             (!requestedLocation.block || userLocation.block === requestedLocation.block);
    case 'user':
      return userLocation.state === requestedLocation.state &&
             userLocation.district === requestedLocation.district &&
             userLocation.block === requestedLocation.block;
    default:
      return false;
  }
};

// Check if user has permission for specific action on resource
const hasPermission = async (userId, resource, action) => {
  try {
    const user = await pool.query(
      'SELECT role, state, district, block FROM users WHERE id = $1',
      [userId]
    );
    
    if (user.rows.length === 0) return false;
    
    const userRole = user.rows[0].role;
    
    // Admin has all permissions
    if (userRole === 'admin') return true;
    
    // Check role permissions
    const permissions = await pool.query(
      'SELECT actions FROM role_permissions WHERE role = $1 AND (resource = $2 OR resource = $3)',
      [userRole, resource, 'all']
    );
    
    if (permissions.rows.length === 0) return false;
    
    const allowedActions = permissions.rows[0].actions;
    return allowedActions.includes(action);
    
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
};

// Middleware to check permissions
const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const hasAccess = await hasPermission(req.user.userId, resource, action);
    
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: { resource, action },
        userRole: req.user.role
      });
    }
    
    next();
  };
};

// Filter data based on user's geographic scope
const filterByGeographicScope = (req, data) => {
  if (!req.user || req.user.role === 'admin') {
    return data; // Admin sees all data
  }
  
  const userLocation = {
    state: req.user.state,
    district: req.user.district,
    block: req.user.block
  };
  
  return data.filter(item => {
    const itemLocation = {
      state: item.state,
      district: item.district,
      block: item.block
    };
    
    return validateGeographicScope(req.user.role, userLocation, itemLocation);
  });
};

// Get user's accessible locations
const getAccessibleLocations = (userRole, userLocation) => {
  switch (userRole) {
    case 'admin':
      return { all: true };
    case 'state_admin':
      return { state: userLocation.state };
    case 'district_admin':
      return { state: userLocation.state, district: userLocation.district };
    case 'block_admin':
      return { 
        state: userLocation.state, 
        district: userLocation.district, 
        block: userLocation.block 
      };
    case 'user':
      return { 
        state: userLocation.state, 
        district: userLocation.district, 
        block: userLocation.block 
      };
    default:
      return {};
  }
};

module.exports = {
  hasPermission,
  checkPermission,
  filterByGeographicScope,
  getAccessibleLocations,
  validateGeographicScope,
  roleHierarchy
};