// Role-Based Access Control (RBAC) middleware
const checkPermission = (resource, action) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    
    if (!userRole) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Define role permissions
    const permissions = {
      admin: ['*'], // Admin has all permissions
      state_admin: ['claims:read', 'claims:update', 'users:read', 'reports:read'],
      district_admin: ['claims:read', 'claims:update', 'own_claims:*'],
      block_admin: ['claims:read', 'own_claims:*'],
      user: ['own_claims:*', 'claims:read']
    };

    const userPermissions = permissions[userRole] || [];
    const requiredPermission = `${resource}:${action}`;

    // Check if user has wildcard permission or specific permission
    const hasPermission = userPermissions.includes('*') || 
                         userPermissions.includes(requiredPermission) ||
                         userPermissions.includes(`${resource}:*`);

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = { checkPermission };