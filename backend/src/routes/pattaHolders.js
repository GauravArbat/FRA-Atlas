const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Get all patta holders as GeoJSON
router.get('/geojson', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        owner_name,
        father_name,
        village,
        district,
        state,
        survey_no,
        khasra,
        area,
        classification,
        fra_status,
        pdf_source,
        ocr_confidence,
        created_at,
        ST_AsGeoJSON(geometry) as geometry
      FROM patta_holders
      ORDER BY created_at DESC
    `);

    const geojson = {
      type: 'FeatureCollection',
      features: result.rows.map(row => ({
        type: 'Feature',
        properties: {
          id: row.id,
          ownerName: row.owner_name,
          fatherName: row.father_name,
          village: row.village,
          district: row.district,
          state: row.state,
          surveyNo: row.survey_no,
          khasra: row.khasra,
          area: row.area,
          classification: row.classification,
          fraStatus: row.fra_status,
          pdfSource: row.pdf_source,
          ocrConfidence: row.ocr_confidence,
          created: row.created_at
        },
        geometry: JSON.parse(row.geometry)
      }))
    };

    res.json({ success: true, data: geojson });
  } catch (error) {
    console.error('Error fetching patta holders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save patta holder data from PDF processing
router.post('/', async (req, res) => {
  try {
    const {
      ownerName,
      fatherName,
      village,
      district,
      state,
      surveyNo,
      khasra,
      area,
      classification,
      fraStatus,
      coordinates,
      pdfSource,
      ocrConfidence
    } = req.body;

    // Convert coordinates to PostGIS polygon
    const polygonWKT = `POLYGON((${coordinates.map(coord => `${coord[1]} ${coord[0]}`).join(', ')}))`;

    const result = await pool.query(`
      INSERT INTO patta_holders (
        owner_name, father_name, village, district, state,
        survey_no, khasra, area, classification, fra_status,
        geometry, pdf_source, ocr_confidence
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, ST_GeomFromText($11, 4326), $12, $13)
      RETURNING id
    `, [
      ownerName, fatherName, village, district, state,
      surveyNo, khasra, area, classification, fraStatus,
      polygonWKT, pdfSource, ocrConfidence
    ]);

    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Error saving patta holder:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;