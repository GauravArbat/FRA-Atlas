const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getUserPermissions, hasPermission } = require('../middleware/rbac');

const router = express.Router();

// Get current user permissions
router.get('/me', authenticateToken, (req, res) => {
  try {
    const permissions = getUserPermissions(req.user.role);
    
    res.json({
      user_role: req.user.role,
      permissions: permissions.permissions,
      description: permissions.description,
      can_access: {
        dashboard: hasPermission(req.user.role, 'dashboard', 'read'),
        claims: hasPermission(req.user.role, 'state_claims', 'read') || hasPermission(req.user.role, 'district_claims', 'read'),
        gis_validation: hasPermission(req.user.role, 'gis_validation', 'read'),
        ocr_processing: hasPermission(req.user.role, 'ocr_processing', 'read'),
        reports: hasPermission(req.user.role, 'reports', 'read'),
        admin_panel: req.user.role === 'admin'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get permissions' });
  }
});

// Check specific permission
router.post('/check', authenticateToken, (req, res) => {
  try {
    const { resource, action = 'read' } = req.body;
    
    if (!resource) {
      return res.status(400).json({ error: 'Resource is required' });
    }
    
    const allowed = hasPermission(req.user.role, resource, action);
    
    res.json({
      allowed,
      user_role: req.user.role,
      checked_permission: `${resource}:${action}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Permission check failed' });
  }
});

module.exports = router;