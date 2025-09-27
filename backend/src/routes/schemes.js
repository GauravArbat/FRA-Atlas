const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Cross-link with welfare schemes
router.post('/integrate/:claimId', authenticateToken, async (req, res) => {
  try {
    const { claimId } = req.params;
    const { pm_kisan_id, jal_jeevan_id, mgnrega_id } = req.body;

    // Get claim details
    const claim = await pool.query('SELECT * FROM fra_claims WHERE id = $1', [claimId]);
    if (claim.rows.length === 0) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    const claimData = claim.rows[0];

    // Create or update scheme integration
    const result = await pool.query(
      `INSERT INTO scheme_integration (
        beneficiary_id, claim_id, pm_kisan_id, jal_jeevan_id, mgnrega_id, integration_status
      ) VALUES ($1, $2, $3, $4, $5, 'pending')
      ON CONFLICT (claim_id) DO UPDATE SET
        pm_kisan_id = $3,
        jal_jeevan_id = $4,
        mgnrega_id = $5,
        last_sync = NOW()
      RETURNING *`,
      [claimData.submitted_by, claimId, pm_kisan_id, jal_jeevan_id, mgnrega_id]
    );

    res.json({
      message: 'Scheme integration updated successfully',
      integration: result.rows[0]
    });
  } catch (error) {
    console.error('Scheme integration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get scheme integration status
router.get('/integration/:claimId', authenticateToken, async (req, res) => {
  try {
    const { claimId } = req.params;

    const result = await pool.query(
      'SELECT * FROM scheme_integration WHERE claim_id = $1',
      [claimId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No scheme integration found' });
    }

    res.json({
      integration: result.rows[0]
    });
  } catch (error) {
    console.error('Get scheme integration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get cross-scheme analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const crossSchemeData = await pool.query(`
      SELECT 
        fc.state,
        COUNT(fc.id) as total_fra_claims,
        COUNT(si.pm_kisan_id) as pm_kisan_linked,
        COUNT(si.jal_jeevan_id) as jal_jeevan_linked,
        COUNT(si.mgnrega_id) as mgnrega_linked,
        COUNT(CASE WHEN fc.status = 'approved' AND si.pm_kisan_id IS NOT NULL THEN 1 END) as approved_with_pm_kisan
      FROM fra_claims fc
      LEFT JOIN scheme_integration si ON fc.id = si.claim_id
      GROUP BY fc.state
    `);

    res.json({
      crossSchemeAnalytics: crossSchemeData.rows,
      summary: {
        totalIntegrations: crossSchemeData.rows.reduce((sum, row) => 
          sum + parseInt(row.pm_kisan_linked) + parseInt(row.jal_jeevan_linked) + parseInt(row.mgnrega_linked), 0
        )
      }
    });
  } catch (error) {
    console.error('Scheme analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;