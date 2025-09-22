const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');

// Mock Bhunaksha-style land records data
const LAND_RECORDS = {
  'Balaghat': [
    {
      khasraNumber: '45/2',
      surveyNumber: 'MP-BAL-001',
      area: '2.25 hectares',
      classification: 'Forest Land (Sarkar)',
      ownerName: 'Ramsingh Gond',
      fatherName: 'Late Bhimsingh Gond',
      village: 'Khairlanji',
      district: 'Balaghat',
      state: 'Madhya Pradesh',
      fraStatus: 'IFR Granted',
      boundaries: {
        type: 'Polygon',
        coordinates: [[[80.1847, 21.8047], [80.1857, 21.8047], [80.1857, 21.8057], [80.1847, 21.8057], [80.1847, 21.8047]]]
      },
      mutationHistory: [
        { date: '2024-03-15', type: 'FRA Grant', details: 'Individual Forest Rights granted under FRA 2006' },
        { date: '2024-01-15', type: 'Application', details: 'FRA claim application submitted' }
      ]
    },
    {
      khasraNumber: '46/1',
      surveyNumber: 'MP-BAL-002',
      area: '1.75 hectares',
      classification: 'Forest Land (Sarkar)',
      ownerName: 'Bhil Singh',
      fatherName: 'Kalu Singh',
      village: 'Khairlanji',
      district: 'Balaghat',
      state: 'Madhya Pradesh',
      fraStatus: 'Pending',
      boundaries: {
        type: 'Polygon',
        coordinates: [[[80.1867, 21.8067], [80.1877, 21.8067], [80.1877, 21.8077], [80.1867, 21.8077], [80.1867, 21.8067]]]
      },
      mutationHistory: [
        { date: '2024-02-10', type: 'Application', details: 'FRA claim application under review' }
      ]
    }
  ],
  'Mayurbhanj': [
    {
      khasraNumber: '67/3',
      surveyNumber: 'OD-MAY-001',
      area: '3.2 hectares',
      classification: 'Forest Land (Government)',
      ownerName: 'Arjun Santal',
      fatherName: 'Mangal Santal',
      village: 'Baripada',
      district: 'Mayurbhanj',
      state: 'Odisha',
      fraStatus: 'IFR Granted',
      boundaries: {
        type: 'Polygon',
        coordinates: [[[86.7350, 21.9287], [86.7360, 21.9287], [86.7360, 21.9297], [86.7350, 21.9297], [86.7350, 21.9287]]]
      },
      mutationHistory: [
        { date: '2024-03-10', type: 'FRA Grant', details: 'Individual Forest Rights granted' },
        { date: '2024-01-10', type: 'Application', details: 'FRA claim submitted with documents' }
      ]
    }
  ],
  'Dhalai': [
    {
      khasraNumber: '23/7',
      surveyNumber: 'TR-DHA-001',
      area: '1.8 hectares',
      classification: 'Forest Land (Reserved)',
      ownerName: 'Kokborok Debbarma',
      fatherName: 'Tripura Debbarma',
      village: 'Gandacherra',
      district: 'Dhalai',
      state: 'Tripura',
      fraStatus: 'Pending',
      boundaries: {
        type: 'Polygon',
        coordinates: [[[91.8624, 23.8372], [91.8634, 23.8372], [91.8634, 23.8382], [91.8624, 23.8382], [91.8624, 23.8372]]]
      },
      mutationHistory: [
        { date: '2024-01-20', type: 'Application', details: 'FRA claim application submitted' }
      ]
    }
  ],
  'Adilabad': [
    {
      khasraNumber: '89/1',
      surveyNumber: 'TG-ADI-001',
      area: '15.0 hectares',
      classification: 'Forest Land (Community)',
      ownerName: 'Gram Sabha Utnoor',
      fatherName: '',
      village: 'Utnoor',
      district: 'Adilabad',
      state: 'Telangana',
      fraStatus: 'CFR Granted',
      boundaries: {
        type: 'Polygon',
        coordinates: [[[78.5311, 19.6677], [78.5321, 19.6677], [78.5321, 19.6687], [78.5311, 19.6687], [78.5311, 19.6677]]]
      },
      mutationHistory: [
        { date: '2024-02-28', type: 'CFR Grant', details: 'Community Forest Rights granted to Gram Sabha' },
        { date: '2024-01-05', type: 'Application', details: 'CFR claim application by Gram Sabha' }
      ]
    }
  ]
};

// Search by Khasra number
router.get('/search/khasra', async (req, res) => {
  try {
    const { district, village, khasraNumber } = req.query;
    
    if (!district || !village || !khasraNumber) {
      return res.status(400).json({
        success: false,
        error: 'District, village, and khasra number are required'
      });
    }
    
    const records = LAND_RECORDS[district] || [];
    const record = records.find(r => 
      r.village === village && r.khasraNumber === khasraNumber
    );
    
    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Land record not found'
      });
    }
    
    logger.info('Khasra search completed', { district, village, khasraNumber });
    
    res.json({
      success: true,
      data: record
    });
    
  } catch (error) {
    logger.error('Error in khasra search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search land records'
    });
  }
});

// Search by owner name
router.get('/search/owner', async (req, res) => {
  try {
    const { district, ownerName } = req.query;
    
    if (!district || !ownerName) {
      return res.status(400).json({
        success: false,
        error: 'District and owner name are required'
      });
    }
    
    const records = LAND_RECORDS[district] || [];
    const matchingRecords = records.filter(r => 
      r.ownerName.toLowerCase().includes(ownerName.toLowerCase())
    );
    
    logger.info('Owner search completed', { district, ownerName, found: matchingRecords.length });
    
    res.json({
      success: true,
      data: matchingRecords
    });
    
  } catch (error) {
    logger.error('Error in owner search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search land records'
    });
  }
});

// Get village records
router.get('/village/:district/:village', async (req, res) => {
  try {
    const { district, village } = req.params;
    
    const records = LAND_RECORDS[district] || [];
    const villageRecords = records.filter(r => r.village === village);
    
    logger.info('Village records retrieved', { district, village, count: villageRecords.length });
    
    res.json({
      success: true,
      data: villageRecords
    });
    
  } catch (error) {
    logger.error('Error retrieving village records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve village records'
    });
  }
});

// Get district summary
router.get('/summary/:district', async (req, res) => {
  try {
    const { district } = req.params;
    
    const records = LAND_RECORDS[district] || [];
    const totalPlots = records.length;
    const fraGranted = records.filter(r => r.fraStatus.includes('Granted')).length;
    const fraPending = records.filter(r => r.fraStatus === 'Pending').length;
    const totalArea = records.reduce((sum, r) => sum + parseFloat(r.area), 0);
    
    const summary = {
      district,
      totalPlots,
      fraGranted,
      fraPending,
      totalArea: totalArea.toFixed(2),
      coveragePercent: totalPlots > 0 ? ((fraGranted / totalPlots) * 100).toFixed(1) : '0'
    };
    
    logger.info('District summary generated', summary);
    
    res.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    logger.error('Error generating district summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate district summary'
    });
  }
});

// Get all land records across districts
router.get('/all-records', async (req, res) => {
  try {
    const allRecords = [];
    Object.values(LAND_RECORDS).forEach(districtRecords => {
      allRecords.push(...districtRecords);
    });
    
    logger.info('All land records retrieved', { count: allRecords.length });
    
    res.json({
      success: true,
      data: allRecords,
      count: allRecords.length
    });
    
  } catch (error) {
    logger.error('Error retrieving all land records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve all land records'
    });
  }
});

// Generate land certificate
router.post('/certificate', async (req, res) => {
  try {
    const { district, village, khasraNumber } = req.body;
    
    if (!district || !village || !khasraNumber) {
      return res.status(400).json({
        success: false,
        error: 'District, village, and khasra number are required'
      });
    }
    
    const records = LAND_RECORDS[district] || [];
    const record = records.find(r => 
      r.village === village && r.khasraNumber === khasraNumber
    );
    
    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Land record not found'
      });
    }
    
    const certificate = `
FOREST RIGHTS ACT - LAND RECORD CERTIFICATE

Khasra Number: ${record.khasraNumber}
Survey Number: ${record.surveyNumber}

Owner Details:
Name: ${record.ownerName}
Father's Name: ${record.fatherName}

Location:
Village: ${record.village}
District: ${record.district}
State: ${record.state}

Land Details:
Area: ${record.area}
Classification: ${record.classification}
FRA Status: ${record.fraStatus}

Generated on: ${new Date().toLocaleDateString()}

This is a computer generated certificate.
    `;
    
    logger.info('Certificate generated', { district, village, khasraNumber });
    
    res.json({
      success: true,
      data: {
        certificate,
        record
      }
    });
    
  } catch (error) {
    logger.error('Error generating certificate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate certificate'
    });
  }
});

module.exports = router;