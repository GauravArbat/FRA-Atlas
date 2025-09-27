const express = require('express');
const multer = require('multer');
const path = require('path');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/legacy/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|tiff|tif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload legacy FRA records (District Tribal Welfare)
router.post('/upload', [
  authenticateToken,
  checkPermission('district_claims', 'upload_legacy'),
  upload.single('legacyFile')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await pool.query(
      `INSERT INTO legacy_records (
        file_name, file_path, uploaded_by, district, state, processing_status
      ) VALUES ($1, $2, $3, $4, $5, 'uploaded') RETURNING *`,
      [
        req.file.originalname,
        req.file.path,
        req.user.userId,
        req.user.district,
        req.user.state
      ]
    );

    // Trigger OCR processing (async)
    processLegacyRecord(result.rows[0].id);

    res.status(201).json({
      message: 'Legacy record uploaded successfully',
      record: result.rows[0]
    });
  } catch (error) {
    console.error('Upload legacy record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get legacy records for district
router.get('/records', authenticateToken, async (req, res) => {
  try {
    let query = 'SELECT * FROM legacy_records';
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

    query += ' ORDER BY upload_date DESC';

    const result = await pool.query(query, params);
    
    res.json({
      records: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get legacy records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get OCR/NER results for review
router.get('/records/:id/results', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM legacy_records WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const record = result.rows[0];

    // Check access permissions
    if (req.user.role === 'district_tribal_welfare' && record.district !== req.user.district) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      record: record,
      ocrResult: record.ocr_result,
      nerResult: record.ner_result,
      extractedClaims: record.extracted_claims
    });
  } catch (error) {
    console.error('Get OCR results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve/Reject digitized data
router.put('/records/:id/approve', [
  authenticateToken,
  checkPermission('district_claims', 'digitize')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, extractedClaims } = req.body;

    if (approved && extractedClaims) {
      // Create FRA claims from approved extracted data
      for (const claimData of extractedClaims) {
        const claimNumber = `${req.user.state.substring(0,2).toUpperCase()}${req.user.district.substring(0,3).toUpperCase()}${Date.now()}`;
        
        await pool.query(
          `INSERT INTO fra_claims (
            claim_number, claim_type, applicant_name, village, district, state,
            area, status, submitted_by, ocr_processed, ner_processed
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'digitized', $8, true, true)`,
          [
            claimNumber,
            claimData.claim_type || 'IFR',
            claimData.applicant_name,
            claimData.village,
            req.user.district,
            req.user.state,
            claimData.area,
            req.user.userId
          ]
        );
      }
    }

    // Update legacy record status
    await pool.query(
      'UPDATE legacy_records SET processing_status = $1 WHERE id = $2',
      [approved ? 'completed' : 'failed', id]
    );

    res.json({
      message: approved ? 'Data approved and claims created' : 'Data rejected',
      claimsCreated: approved ? extractedClaims.length : 0
    });
  } catch (error) {
    console.error('Approve digitized data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock OCR/NER processing function
async function processLegacyRecord(recordId) {
  try {
    // Update status to processing
    await pool.query(
      'UPDATE legacy_records SET processing_status = $1 WHERE id = $2',
      ['ocr_processing', recordId]
    );

    // Mock OCR result
    const mockOcrResult = {
      text: "FRA Claim Application\nApplicant: Ram Kumar\nVillage: Berasia\nArea: 2.5 hectares\nClaim Type: IFR",
      confidence: 0.85
    };

    // Mock NER result
    const mockNerResult = {
      entities: [
        { text: "Ram Kumar", label: "PERSON", confidence: 0.9 },
        { text: "Berasia", label: "VILLAGE", confidence: 0.8 },
        { text: "2.5 hectares", label: "AREA", confidence: 0.85 },
        { text: "IFR", label: "CLAIM_TYPE", confidence: 0.9 }
      ]
    };

    // Mock extracted claims
    const mockExtractedClaims = [{
      applicant_name: "Ram Kumar",
      village: "Berasia",
      area: 2.5,
      claim_type: "IFR"
    }];

    // Update with results
    await pool.query(
      `UPDATE legacy_records SET 
        processing_status = 'completed',
        ocr_result = $1,
        ner_result = $2,
        extracted_claims = $3
      WHERE id = $4`,
      [
        JSON.stringify(mockOcrResult),
        JSON.stringify(mockNerResult),
        JSON.stringify(mockExtractedClaims),
        recordId
      ]
    );

    console.log(`Legacy record ${recordId} processed successfully`);
  } catch (error) {
    console.error('Process legacy record error:', error);
    await pool.query(
      'UPDATE legacy_records SET processing_status = $1 WHERE id = $2',
      ['failed', recordId]
    );
  }
}

module.exports = router;