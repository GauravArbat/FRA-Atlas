const express = require('express');
const router = express.Router();

// Get all FRA claims
router.get('/claims', async (req, res) => {
  try {
    // Mock data for now - in production this would come from database
    const claims = [
      {
        id: '1',
        claimNumber: 'FRA/MP/2024/001',
        claimType: 'IFR',
        status: 'approved',
        applicantName: 'Ramsingh Gond',
        village: 'Khairlanji',
        block: 'Balaghat',
        district: 'Balaghat',
        state: 'Madhya Pradesh',
        area: 2.5,
        coordinates: { latitude: 21.8047, longitude: 80.1847 },
        submittedDate: '2024-01-15',
        lastUpdated: '2024-01-20',
        documents: ['doc1.pdf', 'doc2.pdf'],
        verificationStatus: 'verified'
      },
      {
        id: '2',
        claimNumber: 'FRA/TR/2024/002',
        claimType: 'CR',
        status: 'pending',
        applicantName: 'Kokborok Debbarma',
        village: 'Gandacherra',
        block: 'Dhalai',
        district: 'Dhalai',
        state: 'Tripura',
        area: 1.8,
        coordinates: { latitude: 23.8372, longitude: 91.8624 },
        submittedDate: '2024-01-20',
        lastUpdated: '2024-01-25',
        documents: ['doc3.pdf'],
        verificationStatus: 'pending'
      },
      {
        id: '3',
        claimNumber: 'FRA/OD/2024/003',
        claimType: 'IFR',
        status: 'approved',
        applicantName: 'Arjun Santal',
        village: 'Baripada',
        block: 'Mayurbhanj',
        district: 'Mayurbhanj',
        state: 'Odisha',
        area: 3.2,
        coordinates: { latitude: 21.9287, longitude: 86.7350 },
        submittedDate: '2024-01-10',
        lastUpdated: '2024-01-18',
        documents: ['doc4.pdf', 'doc5.pdf'],
        verificationStatus: 'verified'
      },
      {
        id: '4',
        claimNumber: 'FRA/TG/2024/004',
        claimType: 'CFR',
        status: 'approved',
        applicantName: 'Gram Sabha Utnoor',
        village: 'Utnoor',
        block: 'Adilabad',
        district: 'Adilabad',
        state: 'Telangana',
        area: 15.0,
        coordinates: { latitude: 19.6677, longitude: 78.5311 },
        submittedDate: '2024-01-05',
        lastUpdated: '2024-01-22',
        documents: ['doc6.pdf'],
        verificationStatus: 'verified'
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
      claimNumber: 'FRA/MP/2024/001',
      claimType: 'IFR',
      status: 'approved',
      applicantName: 'Ramsingh Gond',
      village: 'Khairlanji',
      block: 'Balaghat',
      district: 'Balaghat',
      state: 'Madhya Pradesh',
      area: 2.5,
      coordinates: { latitude: 21.8047, longitude: 80.1847 },
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
          properties: { id: 'g1', status: 'granted', claimNumber: 'FRA/MP/2024/001', state: 'Madhya Pradesh', district: 'Balaghat' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [80.18, 21.80],
                [80.19, 21.80],
                [80.19, 21.81],
                [80.18, 21.81],
                [80.18, 21.80]
              ]
            ]
          }
        },
        {
          type: 'Feature',
          properties: { id: 'p1', status: 'potential', claimNumber: 'FRA/TR/2024/099', state: 'Tripura', district: 'Dhalai' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [91.86, 23.83],
                [91.87, 23.83],
                [91.87, 23.84],
                [91.86, 23.84],
                [91.86, 23.83]
              ]
            ]
          }
        },
        {
          type: 'Feature',
          properties: { id: 'g2', status: 'granted', claimNumber: 'FRA/OD/2024/002', state: 'Odisha', district: 'Mayurbhanj' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [86.73, 21.92],
                [86.74, 21.92],
                [86.74, 21.93],
                [86.73, 21.93],
                [86.73, 21.92]
              ]
            ]
          }
        },
        {
          type: 'Feature',
          properties: { id: 'g3', status: 'granted', claimNumber: 'FRA/TG/2024/003', state: 'Telangana', district: 'Adilabad' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [78.53, 19.66],
                [78.54, 19.66],
                [78.54, 19.67],
                [78.53, 19.67],
                [78.53, 19.66]
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
    const { scheme = 'PMKSY', state = 'Madhya Pradesh', district = 'Balaghat' } = req.query;
    // Mock: beneficiaries eligible for scheme from target states
    res.json({
      scheme,
      state,
      district,
      totalBeneficiaries: 4,
      beneficiaries: [
        { id: 'ben1', name: 'Ramsingh Gond', village: 'Khairlanji', eligibilityScore: 0.86, tribe: 'Gond' },
        { id: 'ben2', name: 'Kokborok Debbarma', village: 'Gandacherra', eligibilityScore: 0.78, tribe: 'Tripuri' },
        { id: 'ben3', name: 'Arjun Santal', village: 'Baripada', eligibilityScore: 0.82, tribe: 'Santal' },
        { id: 'ben4', name: 'Bhil Singh', village: 'Utnoor', eligibilityScore: 0.75, tribe: 'Bhil' }
      ]
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to evaluate eligibility' });
  }
});

router.get('/dss/prioritize', async (req, res) => {
  try {
    const { intervention = 'borewell', state = 'Madhya Pradesh', district = 'Balaghat' } = req.query;
    // Mock prioritization for target states
    res.json({
      intervention,
      state,
      district,
      recommendations: [
        { block: 'Balaghat', priorityScore: 0.91, groundwaterIndex: 0.12, tribalPopulation: 85 },
        { block: 'Dhalai', priorityScore: 0.88, groundwaterIndex: 0.15, tribalPopulation: 92 },
        { block: 'Mayurbhanj', priorityScore: 0.82, groundwaterIndex: 0.18, tribalPopulation: 78 },
        { block: 'Adilabad', priorityScore: 0.76, groundwaterIndex: 0.22, tribalPopulation: 68 }
      ]
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to compute prioritization' });
  }
});

router.get('/dss/metrics', async (req, res) => {
  try {
    // Mock policy dashboard metrics for target states
    res.json({
      national: { beneficiaries: 125000, coveragePct: 62, fundedProjects: 8300 },
      states: [
        { name: 'Madhya Pradesh', beneficiaries: 35000, coveragePct: 72, tribalPopulation: 21.1 },
        { name: 'Odisha', beneficiaries: 28000, coveragePct: 68, tribalPopulation: 22.8 },
        { name: 'Telangana', beneficiaries: 18000, coveragePct: 65, tribalPopulation: 9.3 },
        { name: 'Tripura', beneficiaries: 12000, coveragePct: 78, tribalPopulation: 31.8 }
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
        { name: 'Balaghat (MP)', beneficiaries: 4200 },
        { name: 'Mayurbhanj (OD)', beneficiaries: 3800 },
        { name: 'Adilabad (TG)', beneficiaries: 2800 },
        { name: 'Dhalai (TR)', beneficiaries: 2300 }
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
      states: ['Madhya Pradesh', 'Tripura', 'Odisha', 'Telangana'],
      districts: ['Balaghat', 'Mandla', 'Dhalai', 'West Tripura', 'Mayurbhanj', 'Kandhamal', 'Adilabad', 'Khammam'],
      blocks: ['Balaghat', 'Mandla', 'Dhalai', 'Gandacherra', 'Mayurbhanj', 'Phulbani', 'Adilabad', 'Utnoor'],
      villages: ['Khairlanji', 'Mandla', 'Gandacherra', 'Baripada', 'Phulbani', 'Utnoor'],
      tribal_groups: ['Gond', 'Bhil', 'Tripuri', 'Kokborok', 'Santal', 'Kondh', 'Lambada']
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



