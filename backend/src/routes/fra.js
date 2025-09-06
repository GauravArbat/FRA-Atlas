const express = require('express');
const router = express.Router();

// Get all FRA claims
router.get('/claims', async (req, res) => {
  try {
    // Mock data for now - in production this would come from database
    const claims = [
      {
        id: '1',
        claimNumber: 'FRA/2024/001',
        claimType: 'IFR',
        status: 'approved',
        applicantName: 'Rajesh Kumar',
        village: 'Village A',
        block: 'Block A',
        district: 'District A',
        state: 'Maharashtra',
        area: 2.5,
        coordinates: { latitude: 19.0760, longitude: 73.8567 },
        submittedDate: '2024-01-15',
        lastUpdated: '2024-01-20',
        documents: ['doc1.pdf', 'doc2.pdf'],
        verificationStatus: 'verified'
      },
      {
        id: '2',
        claimNumber: 'FRA/2024/002',
        claimType: 'CR',
        status: 'pending',
        applicantName: 'Sita Devi',
        village: 'Village B',
        block: 'Block B',
        district: 'District B',
        state: 'Maharashtra',
        area: 1.8,
        coordinates: { latitude: 19.0760, longitude: 73.8567 },
        submittedDate: '2024-01-20',
        lastUpdated: '2024-01-25',
        documents: ['doc3.pdf'],
        verificationStatus: 'pending'
      }
    ];
    
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

// Get claim by ID
router.get('/claims/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Mock data - in production this would query the database
    const claim = {
      id,
      claimNumber: 'FRA/2024/001',
      claimType: 'IFR',
      status: 'approved',
      applicantName: 'Rajesh Kumar',
      village: 'Village A',
      block: 'Block A',
      district: 'District A',
      state: 'Maharashtra',
      area: 2.5,
      coordinates: { latitude: 19.0760, longitude: 73.8567 },
      submittedDate: '2024-01-15',
      lastUpdated: '2024-01-20',
      documents: ['doc1.pdf', 'doc2.pdf'],
      verificationStatus: 'verified'
    };
    
    res.json(claim);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch claim' });
  }
});

module.exports = router;

// --- New endpoints for FRA Atlas ---

// GeoJSON of potential and granted FRA areas (mock data)
router.get('/atlas/geojson', async (req, res) => {
  try {
    const { state, district, block, village, tribal_group, layer } = req.query;
    const featureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { id: 'g1', status: 'granted', claimNumber: 'FRA/2024/001' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [73.85, 19.08],
                [73.86, 19.08],
                [73.86, 19.09],
                [73.85, 19.09],
                [73.85, 19.08]
              ]
            ]
          }
        },
        {
          type: 'Feature',
          properties: { id: 'p1', status: 'potential', claimNumber: 'FRA/2024/099' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [73.855, 19.075],
                [73.865, 19.075],
                [73.865, 19.085],
                [73.855, 19.085],
                [73.855, 19.075]
              ]
            ]
          }
        }
      ]
    };

    // Simple filtering mock (no actual DB): in real implementation, apply filters in SQL
    let filtered = featureCollection;
    if (layer) {
      if (layer === 'granted') {
        filtered = { ...filtered, features: filtered.features.filter(f => f.properties.status === 'granted') };
      } else if (layer === 'potential') {
        filtered = { ...filtered, features: filtered.features.filter(f => f.properties.status === 'potential') };
      }
    }
    res.json(featureCollection);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load atlas data' });
  }
});

// Validate and update claim boundary (mock AI)
router.post('/atlas/validate', async (req, res) => {
  try {
    const { geometry } = req.body || {};
    if (!geometry) {
      return res.status(400).json({ error: 'geometry is required' });
    }

    // Mock: compute a confidence score and adjusted polygon (small buffer)
    const confidence = 0.87;
    const adjusted = geometry; // No-op for now; would be AI/imagery adjusted

    res.json({
      message: 'Boundary validated',
      confidence,
      adjustedGeometry: adjusted
    });
  } catch (e) {
    res.status(500).json({ error: 'Validation failed' });
  }
});

// Decision Support mock endpoints
router.get('/dss/eligibility', async (req, res) => {
  try {
    const { scheme = 'PMKSY', state = 'Maharashtra', district = 'Pune' } = req.query;
    // Mock: 3 beneficiaries eligible for scheme
    res.json({
      scheme,
      state,
      district,
      totalBeneficiaries: 3,
      beneficiaries: [
        { id: 'ben1', name: 'Rajesh Kumar', village: 'Village A', eligibilityScore: 0.86 },
        { id: 'ben2', name: 'Sita Devi', village: 'Village B', eligibilityScore: 0.78 },
        { id: 'ben3', name: 'A. Rahman', village: 'Village C', eligibilityScore: 0.72 }
      ]
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to evaluate eligibility' });
  }
});

router.get('/dss/prioritize', async (req, res) => {
  try {
    const { intervention = 'borewell', state = 'Maharashtra', district = 'Pune' } = req.query;
    // Mock prioritization using groundwater index (lower = higher priority)
    res.json({
      intervention,
      state,
      district,
      recommendations: [
        { block: 'Block A', priorityScore: 0.91, groundwaterIndex: 0.12 },
        { block: 'Block B', priorityScore: 0.76, groundwaterIndex: 0.22 },
        { block: 'Block C', priorityScore: 0.58, groundwaterIndex: 0.35 }
      ]
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to compute prioritization' });
  }
});

router.get('/dss/metrics', async (req, res) => {
  try {
    // Mock policy dashboard metrics
    res.json({
      national: { beneficiaries: 125000, coveragePct: 62, fundedProjects: 8300 },
      states: [
        { name: 'Maharashtra', beneficiaries: 24000, coveragePct: 68 },
        { name: 'Chhattisgarh', beneficiaries: 13000, coveragePct: 59 },
        { name: 'Odisha', beneficiaries: 15000, coveragePct: 64 }
      ]
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load metrics' });
  }
});

// Reports & Analytics (mock): timeseries and breakdowns
router.get('/reports/summary', async (req, res) => {
  try {
    res.json({
      timeseries: [
        { month: 'Apr', beneficiaries: 1200 },
        { month: 'May', beneficiaries: 1450 },
        { month: 'Jun', beneficiaries: 1900 },
        { month: 'Jul', beneficiaries: 2100 },
        { month: 'Aug', beneficiaries: 2400 },
        { month: 'Sep', beneficiaries: 2600 }
      ],
      byType: [
        { type: 'Granted', value: 62 },
        { type: 'Potential', value: 38 }
      ],
      topDistricts: [
        { name: 'Pune', beneficiaries: 4200 },
        { name: 'Gadchiroli', beneficiaries: 2800 },
        { name: 'Dantewada', beneficiaries: 2300 }
      ]
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load report' });
  }
});

// Return available filter options (mock)
router.get('/atlas/filters', async (req, res) => {
  try {
    res.json({
      states: ['Maharashtra', 'Chhattisgarh'],
      districts: ['Pune', 'Gadchiroli', 'Dantewada'],
      blocks: ['Block A', 'Block B', 'Block C'],
      villages: ['Village A', 'Village B', 'Village C'],
      tribal_groups: ['Gond', 'Bhils', 'Santhal']
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load filters' });
  }
});

// AI/ML asset mapping (mock outputs). Types: agriculture, forest, water, homestead, infrastructure
router.get('/atlas/assets', async (req, res) => {
  try {
    const { type, state, district } = req.query;
    const features = [
      {
        type: 'Feature',
        properties: { id: 'ag1', type: 'agriculture', state: 'Maharashtra', district: 'Pune' },
        geometry: { type: 'Polygon', coordinates: [[[73.9, 18.5], [73.91, 18.5], [73.91, 18.51], [73.9, 18.51], [73.9, 18.5]]] }
      },
      {
        type: 'Feature',
        properties: { id: 'fr1', type: 'forest', state: 'Maharashtra', district: 'Pune' },
        geometry: { type: 'Polygon', coordinates: [[[73.92, 18.52], [73.93, 18.52], [73.93, 18.53], [73.92, 18.53], [73.92, 18.52]]] }
      },
      {
        type: 'Feature',
        properties: { id: 'wt1', type: 'water', state: 'Maharashtra', district: 'Pune' },
        geometry: { type: 'Polygon', coordinates: [[[73.94, 18.5], [73.95, 18.5], [73.95, 18.505], [73.94, 18.505], [73.94, 18.5]]] }
      },
      {
        type: 'Feature',
        properties: { id: 'hm1', type: 'homestead', state: 'Maharashtra', district: 'Pune' },
        geometry: { type: 'Point', coordinates: [73.935, 18.515] }
      },
      {
        type: 'Feature',
        properties: { id: 'if1', type: 'infrastructure', state: 'Maharashtra', district: 'Pune' },
        geometry: { type: 'Point', coordinates: [73.945, 18.512] }
      }
    ];

    let filtered = features;
    if (type) filtered = filtered.filter(f => f.properties.type === String(type));
    if (state) filtered = filtered.filter(f => f.properties.state === String(state));
    if (district) filtered = filtered.filter(f => f.properties.district === String(district));

    res.json({ type: 'FeatureCollection', features: filtered });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load assets' });
  }
});



