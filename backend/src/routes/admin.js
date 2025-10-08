const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

// Get all users with their activity stats
router.get('/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get table structure first
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
    const hasLastLogin = columns.includes('last_login');
    
    const users = await pool.query(`
      SELECT 
        u.id, 
        ${hasUsername ? 'u.username' : 'u.email as username'}, 
        u.email, 
        COALESCE(u.role, 'user') as role,
        ${hasState ? 'COALESCE(u.state, \'\') as state' : '\'\' as state'},
        ${hasDistrict ? 'COALESCE(u.district, \'\') as district' : '\'\' as district'},
        ${hasBlock ? 'COALESCE(u.block, \'\') as block' : '\'\' as block'},
        ${hasIsActive ? 'COALESCE(u.is_active, true) as is_active' : 'true as is_active'},
        u.created_at,
        ${hasLastLogin ? 'u.last_login' : 'NULL as last_login'},
        0 as claims_created,
        0 as documents_uploaded,
        0 as total_activities
      FROM users u
      ORDER BY u.created_at DESC
    `);

    res.json({ users: users.rows });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user activity logs
router.get('/users/:userId/logs', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Mock logs data for demonstration
    const dummyLogs = [
      {
        id: '1',
        table_name: 'fra_claims',
        record_id: 'fc_' + Math.random().toString(36).substr(2, 8),
        action: 'INSERT',
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        ip_address: '192.168.1.' + Math.floor(Math.random() * 255),
        username: 'system'
      },
      {
        id: '2',
        table_name: 'documents',
        record_id: 'doc_' + Math.random().toString(36).substr(2, 8),
        action: 'UPDATE',
        timestamp: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
        ip_address: '192.168.1.' + Math.floor(Math.random() * 255),
        username: 'system'
      },
      {
        id: '3',
        table_name: 'users',
        record_id: 'usr_' + Math.random().toString(36).substr(2, 8),
        action: 'UPDATE',
        timestamp: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
        ip_address: '192.168.1.' + Math.floor(Math.random() * 255),
        username: 'system'
      },
      {
        id: '4',
        table_name: 'patta_holders',
        record_id: 'ph_' + Math.random().toString(36).substr(2, 8),
        action: 'INSERT',
        timestamp: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString(),
        ip_address: '192.168.1.' + Math.floor(Math.random() * 255),
        username: 'system'
      },
      {
        id: '5',
        table_name: 'fra_claims',
        record_id: 'fc_' + Math.random().toString(36).substr(2, 8),
        action: 'DELETE',
        timestamp: new Date(Date.now() - Math.random() * 1 * 24 * 60 * 60 * 1000).toISOString(),
        ip_address: '192.168.1.' + Math.floor(Math.random() * 255),
        username: 'system'
      }
    ];
    
    const logs = { rows: dummyLogs };
    const totalCount = { rows: [{ count: dummyLogs.length.toString() }] };

    res.json({
      logs: logs.rows,
      total: parseInt(totalCount.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    logger.error('Get user logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user detailed report
router.get('/users/:userId/report', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;

    // User basic info
    const userInfo = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (userInfo.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Mock data since related tables may not exist
    const claims = { rows: [] };
    const documents = { rows: [] };
    const activitySummary = { rows: [] };
    const monthlyActivity = { rows: [] };

    res.json({
      user: userInfo.rows[0],
      claims: claims.rows,
      documents: documents.rows,
      activitySummary: activitySummary.rows,
      monthlyActivity: monthlyActivity.rows
    });
  } catch (error) {
    logger.error('Get user report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get combined system report
router.get('/reports/combined', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // System overview - check if is_active column exists
    const userTableInfo = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_active'
    `);
    
    const hasIsActive = userTableInfo.rows.length > 0;
    
    const systemStats = await pool.query(`
      SELECT 
        ${hasIsActive ? 
          '(SELECT COUNT(*) FROM users WHERE COALESCE(is_active, true) = true) as active_users' :
          '(SELECT COUNT(*) FROM users) as active_users'
        },
        (SELECT COUNT(*) FROM users) as total_users,
        0 as total_claims,
        0 as approved_claims,
        0 as total_documents,
        0 as recent_activities
    `);

    // Role distribution
    const roleStats = await pool.query(`
      SELECT COALESCE(role, 'user') as role, COUNT(*) as count
      FROM users 
      ${hasIsActive ? 'WHERE COALESCE(is_active, true) = true' : ''}
      GROUP BY role
      ORDER BY count DESC
    `);

    // State-wise distribution - check if state column exists
    const stateColumnInfo = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'state'
    `);
    
    const hasStateColumn = stateColumnInfo.rows.length > 0;
    
    const stateStats = hasStateColumn ? await pool.query(`
      SELECT COALESCE(state, 'Unknown') as state, COUNT(*) as user_count
      FROM users 
      WHERE ${hasIsActive ? 'COALESCE(is_active, true) = true AND' : ''} state IS NOT NULL AND state != ''
      GROUP BY state
      ORDER BY user_count DESC
    `) : { rows: [{ state: 'Unknown', user_count: 0 }] };

    // Claims by status (mock data since table may not exist)
    const claimStats = { rows: [
      { status: 'pending', count: 0 },
      { status: 'approved', count: 0 },
      { status: 'rejected', count: 0 }
    ] };

    // Daily activity (mock data since table may not exist)
    const dailyActivity = { rows: [] };

    // Top active users (mock data since audit_trail may not exist)
    const topUsers = { rows: [] };

    res.json({
      systemStats: systemStats.rows[0],
      roleStats: roleStats.rows,
      stateStats: stateStats.rows,
      claimStats: claimStats.rows,
      dailyActivity: dailyActivity.rows,
      topUsers: topUsers.rows
    });
  } catch (error) {
    logger.error('Get combined report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;