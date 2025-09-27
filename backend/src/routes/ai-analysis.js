const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

const router = express.Router();

// Perform AI-based satellite mapping (MoTA Technical Team)
router.post('/satellite-analysis', [
  authenticateToken,
  checkPermission('ai_analysis', 'create'),
  body('claim_id').isInt(),
  body('analysis_type').isIn(['land_use_classification', 'encroachment_detection', 'forest_cover_analysis'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { claim_id, analysis_type, satellite_data } = req.body;

    // Mock AI analysis results
    const mockResults = {
      land_use_classification: {
        forest_cover: 65.2,
        agricultural_land: 20.1,
        settlement: 8.3,
        water_bodies: 6.4,
        classification_model: 'CNN_ResNet50',
        accuracy: 0.89
      },
      encroachment_detection: {
        encroachment_detected: true,
        encroachment_area: 0.3,
        encroachment_type: 'agricultural',
        detection_model: 'Random_Forest',
        confidence: 0.82
      },
      forest_cover_analysis: {
        current_forest_cover: 65.2,
        historical_forest_cover: 72.1,
        deforestation_rate: -9.6,
        analysis_period: '2020-2024',
        model: 'Time_Series_Analysis'
      }
    };

    const analysisResult = mockResults[analysis_type];
    const confidenceScore = analysisResult.accuracy || analysisResult.confidence || 0.85;

    const result = await pool.query(
      `INSERT INTO ai_analysis (
        claim_id, analysis_type, satellite_data, model_results, 
        confidence_score, processed_by
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        claim_id,
        analysis_type,
        JSON.stringify(satellite_data),
        JSON.stringify(analysisResult),
        confidenceScore,
        req.user.userId
      ]
    );

    // Update claim with AI analysis
    await pool.query(
      'UPDATE fra_claims SET ai_analysis = $1 WHERE id = $2',
      [JSON.stringify(analysisResult), claim_id]
    );

    res.status(201).json({
      message: 'AI analysis completed successfully',
      analysis: result.rows[0]
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get AI analysis results
router.get('/results/:claimId', authenticateToken, async (req, res) => {
  try {
    const { claimId } = req.params;

    const result = await pool.query(
      'SELECT * FROM ai_analysis WHERE claim_id = $1 ORDER BY processed_date DESC',
      [claimId]
    );

    res.json({
      analyses: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get AI results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validate AI analysis (State Authorities)
router.put('/validate/:analysisId', [
  authenticateToken,
  checkPermission('state_claims', 'gis_validate'),
  body('validation_status').isIn(['validated', 'rejected']),
  body('comments').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { analysisId } = req.params;
    const { validation_status, comments } = req.body;

    const result = await pool.query(
      'UPDATE ai_analysis SET validation_status = $1 WHERE id = $2 RETURNING *',
      [validation_status, analysisId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    // Update claim GIS validation status
    if (validation_status === 'validated') {
      await pool.query(
        'UPDATE fra_claims SET gis_validated = true, status = $1 WHERE id = $2',
        ['pending_gis_validation', result.rows[0].claim_id]
      );
    }

    res.json({
      message: 'Analysis validation updated successfully',
      analysis: result.rows[0]
    });
  } catch (error) {
    console.error('Validate analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dashboard analytics for decision makers
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // Claims statistics
    const claimsStats = await pool.query(`
      SELECT 
        state,
        COUNT(*) as total_claims,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_claims,
        COUNT(CASE WHEN gis_validated = true THEN 1 END) as gis_validated_claims,
        AVG(area) as avg_area
      FROM fra_claims 
      GROUP BY state
    `);

    // AI analysis statistics
    const aiStats = await pool.query(`
      SELECT 
        analysis_type,
        COUNT(*) as total_analyses,
        AVG(confidence_score) as avg_confidence,
        COUNT(CASE WHEN validation_status = 'validated' THEN 1 END) as validated_analyses
      FROM ai_analysis 
      GROUP BY analysis_type
    `);

    // Recent activities
    const recentActivities = await pool.query(`
      SELECT 
        'claim_submitted' as activity_type,
        applicant_name as description,
        submitted_date as activity_date,
        state
      FROM fra_claims 
      WHERE submitted_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY submitted_date DESC 
      LIMIT 10
    `);

    res.json({
      claimsStatistics: claimsStats.rows,
      aiStatistics: aiStats.rows,
      recentActivities: recentActivities.rows,
      summary: {
        totalClaims: claimsStats.rows.reduce((sum, row) => sum + parseInt(row.total_claims), 0),
        approvedClaims: claimsStats.rows.reduce((sum, row) => sum + parseInt(row.approved_claims), 0),
        gisValidatedClaims: claimsStats.rows.reduce((sum, row) => sum + parseInt(row.gis_validated_claims), 0)
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;