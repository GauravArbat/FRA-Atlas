const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission, getAccessibleLocations } = require('../middleware/rbac');

const router = express.Router();

// Get user permissions
router.get('/permissions', authenticateToken, async (req, res) => {
  try {
    const permissions = await pool.query(
      'SELECT resource, actions FROM role_permissions WHERE role = $1',
      [req.user.role]
    );

    const accessibleLocations = getAccessibleLocations(req.user.role, {
      state: req.user.state,
      district: req.user.district,
      block: req.user.block
    });

    res.json({
      role: req.user.role,
      permissions: permissions.rows,
      accessibleLocations,
      userLocation: {
        state: req.user.state,
        district: req.user.district,
        block: req.user.block
      }
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get filtered data based on user role and location
router.get('/data/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    let query = '';
    let params = [];

    switch (type) {
      case 'fra_claims':
        query = 'SELECT * FROM fra_claims';
        break;
      case 'land_records':
        query = 'SELECT * FROM land_records';
        break;
      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }

    // Apply geographic filtering based on user role
    if (req.user.role !== 'admin') {
      const conditions = [];
      
      if (req.user.state) {
        conditions.push('state = $' + (params.length + 1));
        params.push(req.user.state);
      }
      
      if (req.user.role === 'district_admin' || req.user.role === 'block_admin' || req.user.role === 'user') {
        if (req.user.district) {
          conditions.push('district = $' + (params.length + 1));
          params.push(req.user.district);
        }
      }
      
      if (req.user.role === 'block_admin' || req.user.role === 'user') {
        if (req.user.block) {
          conditions.push('block = $' + (params.length + 1));
          params.push(req.user.block);
        }
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
    }

    const result = await pool.query(query, params);
    
    res.json({
      data: result.rows,
      count: result.rows.length,
      userRole: req.user.role,
      appliedFilters: {
        state: req.user.state,
        district: req.user.district,
        block: req.user.block
      }
    });
  } catch (error) {
    console.error('Get filtered data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;