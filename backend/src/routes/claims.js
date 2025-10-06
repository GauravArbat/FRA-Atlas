const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

const router = express.Router();

// Submit new FRA claim (Beneficiaries)
router.post('/submit', [
  authenticateToken,
  checkPermission('own_claims', 'create'),
  body('claim_type').isIn(['IFR', 'CFR', 'CR']),
  body('applicant_name').notEmpty().trim(),
  body('village').notEmpty().trim(),
  body('district').notEmpty().trim(),
  body('state').isIn(['Madhya Pradesh', 'Tripura', 'Odisha', 'Telangana']),
  body('area').isFloat({ min: 0 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      claim_type,
      applicant_name,
      applicant_id,
      village,
      block,
      district,
      state,
      area,
      coordinates,
      documents
    } = req.body;

    // Generate claim number
    const claimNumber = `${state.substring(0,2).toUpperCase()}${district.substring(0,3).toUpperCase()}${Date.now()}`;

    const result = await pool.query(
      `INSERT INTO fra_claims (
        claim_number, claim_type, applicant_name, applicant_id, village, block, 
        district, state, area, coordinates, documents, submitted_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [claimNumber, claim_type, applicant_name, applicant_id, village, block, 
       district, state, area, JSON.stringify(coordinates), JSON.stringify(documents), req.user.userId]
    );

    res.status(201).json({
      message: 'Claim submitted successfully',
      claim: result.rows[0]
    });
  } catch (error) {
    console.error('Submit claim error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Track claim status (Beneficiaries)
router.get('/track/:claimNumber', authenticateToken, async (req, res) => {
  try {
    const { claimNumber } = req.params;
    
    let query = 'SELECT * FROM fra_claims WHERE claim_number = $1';
    let params = [claimNumber];
    
    // Beneficiaries can only track their own claims
    if (req.user.role === 'beneficiary') {
      query += ' AND submitted_by = $2';
      params.push(req.user.userId);
    }

    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    res.json({
      claim: result.rows[0],
      statusHistory: [
        { status: 'submitted', date: result.rows[0].submitted_date, description: 'Claim submitted by beneficiary' },
        { status: 'under_review', date: result.rows[0].last_updated, description: 'Under review by district office' },
        // Add more status history based on current status
      ]
    });
  } catch (error) {
    console.error('Track claim error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get claims for review (District/State/Admin)
router.get('/review', authenticateToken, async (req, res) => {
  try {
    let query = 'SELECT * FROM fra_claims';
    let params = [];
    let conditions = [];

    // Apply role-based filtering
    if (req.user.role === 'district_tribal_welfare') {
      conditions.push('district = $' + (params.length + 1));
      params.push(req.user.district);
    } else if (req.user.role === 'state_authority') {
      conditions.push('state = $' + (params.length + 1));
      params.push(req.user.state);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY submitted_date DESC';

    const result = await pool.query(query, params);
    
    res.json({
      claims: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get claims error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update claim status (District/State/Admin)
router.put('/:id/status', [
  authenticateToken,
  body('status').isIn(['submitted', 'under_review', 'digitized', 'approved', 'rejected', 'pending_gis_validation']),
  body('comments').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, comments } = req.body;

    // Check if user has permission to update this claim
    const claim = await pool.query('SELECT * FROM fra_claims WHERE id = $1', [id]);
    if (claim.rows.length === 0) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    const claimData = claim.rows[0];
    
    // Role-based access control
    if (req.user.role === 'district_tribal_welfare' && claimData.district !== req.user.district) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (req.user.role === 'state_authority' && claimData.state !== req.user.state) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `UPDATE fra_claims SET 
        status = $1, 
        last_updated = NOW(),
        reviewed_by = $2,
        ${status === 'approved' ? 'approved_by = $2,' : ''}
        verification_status = $3
      WHERE id = $4 RETURNING *`,
      [status, req.user.userId, comments || 'Updated', id]
    );

    res.json({
      message: 'Claim status updated successfully',
      claim: result.rows[0]
    });
  } catch (error) {
    console.error('Update claim status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;