// Role-Based Access Control Middleware

const rolePermissions = {
  admin: {
    permissions: ['*'], // All permissions
    description: 'Full system access'
  },
  state_admin: {
    permissions: [
      'state_claims:read',
      'state_claims:write', 
      'gis_validation:read',
      'gis_validation:write',
      'compliance_review:read',
      'compliance_review:write',
      'reports:read',
      'dashboard:read'
    ],
    description: 'State-level claims, GIS validation, compliance review'
  },
  district_admin: {
    permissions: [
      'district_claims:read',
      'district_claims:write',
      'legacy_upload:read', 
      'legacy_upload:write',
      'ocr_processing:read',
      'ocr_processing:write',
      'digitization:read',
      'digitization:write',
      'reports:read',
      'dashboard:read'
    ],
    description: 'District-level claims, legacy upload, OCR processing'
  },
  block_admin: {
    permissions: [
      'block_claims:read',
      'block_claims:write',
      'data_entry:read',
      'data_entry:write',
      'reports:read'
    ],
    description: 'Block-level claims and data entry'
  },
  user: {
    permissions: [
      'own_claims:read',
      'claim_tracking:read'
    ],
    description: 'View own claims and track status'
  }
};

// Check if user has permission for resource and action
const hasPermission = (userRole, resource, action = 'read') => {
  if (!userRole || !rolePermissions[userRole]) {
    return false;
  }

  const permissions = rolePermissions[userRole].permissions;
  
  // Admin has all permissions
  if (permissions.includes('*')) {
    return true;
  }

  // Check specific permission
  const requiredPermission = `${resource}:${action}`;
  return permissions.includes(requiredPermission);
};

// Middleware to check permissions
const requirePermission = (resource, action = 'read') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!hasPermission(req.user.role, resource, action)) {
      return res.status(403).json({ 
        error: 'Access denied',
        required_permission: `${resource}:${action}`,
        user_role: req.user.role
      });
    }

    next();
  };
};

// Get user permissions
const getUserPermissions = (userRole) => {
  if (!userRole || !rolePermissions[userRole]) {
    return { permissions: [], description: 'No permissions' };
  }
  
  return rolePermissions[userRole];
};

module.exports = {
  hasPermission,
  requirePermission,
  getUserPermissions,
  rolePermissions
};