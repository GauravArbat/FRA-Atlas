/**
 * DSS API Routes - Integration with Python DSS Engine
 */
const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const DSS_ENGINE_URL = process.env.DSS_ENGINE_URL || 'http://localhost:8001';

// Enhanced DSS analysis with hybrid models
router.post('/hybrid-analyze', authenticateToken, async (req, res) => {
  try {
    const { villages, schemes, analysis_period } = req.body;
    
    if (!villages || !Array.isArray(villages) || villages.length === 0) {
      return res.status(400).json({ error: 'Villages array is required' });
    }
    
    const response = await axios.post(`${DSS_ENGINE_URL}/api/dss/analyze`, {
      villages,
      schemes: schemes || ['PM_KISAN', 'JAL_JEEVAN', 'MGNREGA', 'DAJGUA'],
      analysis_period: analysis_period || '2023-01-01'
    }, {
      timeout: 120000 // 2 minute timeout for hybrid analysis
    });
    
    res.json({
      success: true,
      engine: 'hybrid',
      data: response.data,
      analysis_timestamp: new Date().toISOString(),
      model_info: {
        algorithms: ['Random Forest', 'Gradient Boosting', 'Neural Network', 'Deep Learning', 'Ensemble'],
        features: 12,
        satellite_sources: ['Sentinel-2', 'JRC Water', 'ESA WorldCover', 'VIIRS', 'CHIRPS', 'SRTM']
      }
    });
    
  } catch (error) {
    console.error('Hybrid DSS Analysis Error:', error.message);
    res.status(500).json({ 
      error: 'Hybrid DSS analysis failed',
      details: error.response?.data || error.message 
    });
  }
});

// Get model performance metrics
router.get('/model-performance', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${DSS_ENGINE_URL}/api/dss/model-performance`);
    res.json(response.data);
  } catch (error) {
    console.error('Model performance error:', error.message);
    res.status(500).json({ error: 'Failed to fetch model performance' });
  }
});

// DSS Analysis endpoint
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { villages, schemes, analysis_period } = req.body;
    
    // Validate input
    if (!villages || !Array.isArray(villages) || villages.length === 0) {
      return res.status(400).json({ error: 'Villages array is required' });
    }
    
    // Call Python DSS Engine
    const response = await axios.post(`${DSS_ENGINE_URL}/api/dss/analyze`, {
      villages,
      schemes: schemes || ['PM_KISAN', 'JAL_JEEVAN', 'MGNREGA', 'DAJGUA'],
      analysis_period: analysis_period || '2023-01-01'
    }, {
      timeout: 60000 // 60 second timeout for satellite analysis
    });
    
    res.json({
      success: true,
      data: response.data,
      analysis_timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('DSS Analysis Error:', error.message);
    res.status(500).json({ 
      error: 'DSS analysis failed',
      details: error.response?.data || error.message 
    });
  }
});

// Get available schemes  
router.get('/schemes', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${DSS_ENGINE_URL}/api/dss/schemes`);
    res.json(response.data);
  } catch (error) {
    console.error('Schemes fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch schemes' });
  }
});

// DSS Dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    // Mock dashboard data - replace with actual database queries
    const dashboardData = {
      total_villages_analyzed: 1250,
      high_priority_villages: 340,
      schemes_recommended: {
        'PM_KISAN': 890,
        'JAL_JEEVAN': 720,
        'MGNREGA': 650,
        'DAJGUA': 480
      },
      satellite_coverage: {
        'ndvi_analysis': 98.5,
        'water_mapping': 96.2,
        'forest_cover': 99.1,
        'infrastructure': 87.3
      },
      priority_distribution: {
        'high': 27.2,
        'medium': 45.6,
        'low': 27.2
      },
      recent_analyses: [
        {
          village_name: 'Khargone Village',
          state: 'Madhya Pradesh',
          priority_score: 87.5,
          top_scheme: 'PM_KISAN',
          analyzed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          village_name: 'Tribal Settlement',
          state: 'Odisha',
          priority_score: 82.1,
          top_scheme: 'DAJGUA',
          analyzed_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        }
      ]
    };
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard data error:', error.message);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Analyze assets from ML results
router.post('/analyze-assets', authenticateToken, async (req, res) => {
  try {
    const { village_data, analysis_type, include_recommendations } = req.body;
    
    if (!village_data) {
      return res.status(400).json({ error: 'Village data is required' });
    }
    
    // Comprehensive CSS scheme layering for FRA patta holders
    const waterScore = village_data.assets.water_bodies?.length * 20 || 0;
    const forestScore = village_data.assets.forest_cover?.length * 25 || 0;
    const agriScore = village_data.assets.agricultural_land?.length * 15 || 0;
    const homesteadScore = village_data.assets.homesteads?.length * 10 || 0;
    
    const eligibilityScore = Math.min(100, waterScore + forestScore + agriScore + homesteadScore + 30);
    
    // CSS Scheme Eligibility Matrix for FRA Patta Holders
    const cssSchemes = {
      PM_KISAN: {
        eligible: village_data.assets.agricultural_land?.length > 0,
        ministry: 'Agriculture & Farmers Welfare',
        benefit_amount: '₹6,000/year',
        criteria: 'Agricultural land ownership',
        fra_integration: 'FRA patta holders with agricultural land automatically eligible'
      },
      JAL_JEEVAN_MISSION: {
        eligible: village_data.infrastructure_data?.groundwater?.depth_to_water > 5,
        ministry: 'Jal Shakti',
        benefit_amount: 'Tap water connection',
        criteria: 'Household water security',
        fra_integration: 'Priority for tribal villages with FRA pattas'
      },
      MGNREGA: {
        eligible: village_data.assets.forest_cover?.length > 0 || village_data.assets.homesteads?.length > 0,
        ministry: 'Rural Development',
        benefit_amount: '₹200-300/day',
        criteria: 'Rural employment guarantee',
        fra_integration: 'Forest conservation works under FRA community rights'
      },
      DAJGUA: {
        eligible: village_data.assets.homesteads?.length > 0 && village_data.assets.forest_cover?.length > 0,
        ministry: 'Tribal Affairs, Environment & Rural Development',
        benefit_amount: 'Comprehensive tribal development',
        criteria: 'Tribal area development',
        fra_integration: 'Direct integration with FRA community forest rights'
      },
      PM_AWAS_YOJANA: {
        eligible: village_data.assets.homesteads?.length > 0,
        ministry: 'Rural Development',
        benefit_amount: '₹1.2-1.3 lakh',
        criteria: 'Housing for rural poor',
        fra_integration: 'FRA patta as land ownership proof'
      },
      PRADHAN_MANTRI_FASAL_BIMA: {
        eligible: village_data.assets.agricultural_land?.length > 1,
        ministry: 'Agriculture & Farmers Welfare',
        benefit_amount: 'Crop insurance coverage',
        criteria: 'Agricultural risk mitigation',
        fra_integration: 'FRA agricultural pattas covered'
      }
    };
    
    // Calculate scheme convergence score
    const eligibleSchemes = Object.values(cssSchemes).filter(scheme => scheme.eligible).length;
    const convergenceScore = (eligibleSchemes / Object.keys(cssSchemes).length) * 100;
    
    function calculateTotalBenefit(schemes) {
      let total = 0;
      Object.entries(schemes).forEach(([key, scheme]) => {
        if (scheme.eligible) {
          if (key === 'PM_KISAN') total += 6000;
          if (key === 'PM_AWAS_YOJANA') total += 120000;
          if (key === 'MGNREGA') total += 36500;
        }
      });
      return `₹${total.toLocaleString()}`;
    }
    
    const mockDssResults = {
      eligibility_score: eligibilityScore,
      eligibility_reason: `Village meets FRA criteria with ${forestScore > 25 ? 'excellent' : 'good'} forest cover and tribal settlements`,
      priority_level: eligibilityScore > 80 ? 'High' : eligibilityScore > 60 ? 'Medium' : 'Low',
      priority_score: eligibilityScore,
      
      // Enhanced CSS Scheme Integration
      css_schemes: cssSchemes,
      scheme_convergence: {
        eligible_schemes: eligibleSchemes,
        total_schemes: Object.keys(cssSchemes).length,
        convergence_score: Math.round(convergenceScore),
        multi_ministry_coordination: eligibleSchemes >= 3
      },
      
      // FRA Patta Holder Benefits
      fra_patta_benefits: {
        total_estimated_annual_benefit: calculateTotalBenefit(cssSchemes),
        direct_transfers: ['PM_KISAN', 'PM_AWAS_YOJANA'],
        employment_schemes: ['MGNREGA'],
        infrastructure_schemes: ['JAL_JEEVAN_MISSION'],
        comprehensive_schemes: ['DAJGUA']
      },
      
      // Ministry-wise Coordination
      ministry_coordination: {
        'Agriculture & Farmers Welfare': ['PM_KISAN', 'PRADHAN_MANTRI_FASAL_BIMA'],
        'Jal Shakti': ['JAL_JEEVAN_MISSION'],
        'Rural Development': ['MGNREGA', 'PM_AWAS_YOJANA'],
        'Tribal Affairs': ['DAJGUA'],
        'Environment': ['DAJGUA']
      },
      
      recommendations: [
        waterScore < 20 ? 'Priority for Jal Jeevan Mission - Tap water connections' : null,
        agriScore > 15 ? 'Enroll FRA patta holders in PM-KISAN DBT' : null,
        forestScore > 25 ? 'DAJGUA scheme implementation for forest conservation' : null,
        homesteadScore > 0 ? 'PM Awas Yojana housing for tribal families' : null,
        'MGNREGA employment with forest conservation focus',
        'Crop insurance enrollment for agricultural patta holders',
        'Multi-ministry convergence planning required'
      ].filter(Boolean),
      
      asset_insights: {
        water_bodies: { 
          status: village_data.assets.water_bodies?.length > 2 ? 'Good' : 'Fair',
          intervention: village_data.assets.water_bodies?.length < 2 ? 'Jal Jeevan Mission priority' : 'Water conservation under MGNREGA',
          css_scheme: 'JAL_JEEVAN_MISSION'
        },
        agricultural_land: { 
          status: village_data.assets.agricultural_land?.length > 2 ? 'Good' : 'Poor',
          intervention: 'PM-KISAN enrollment and crop insurance',
          css_scheme: 'PM_KISAN'
        },
        forest_cover: { 
          status: village_data.assets.forest_cover?.length > 0 ? 'Good' : 'Poor',
          intervention: 'Community forest management under DAJGUA',
          css_scheme: 'DAJGUA'
        },
        homesteads: {
          status: village_data.assets.homesteads?.length > 0 ? 'Good' : 'Poor',
          intervention: 'Housing under PM Awas Yojana',
          css_scheme: 'PM_AWAS_YOJANA'
        }
      },
      analysis_timestamp: new Date().toISOString()
    };
    
    res.json(mockDssResults);
    
  } catch (error) {
    console.error('Asset DSS Analysis Error:', error.message);
    res.status(500).json({ 
      error: 'Asset DSS analysis failed',
      details: error.message 
    });
  }
});

// State-wise DSS Analysis
router.get('/state-analysis', authenticateToken, async (req, res) => {
  try {
    const { state, scheme } = req.query;
    
    const mockStateData = {
      state,
      scheme,
      eligibility: {
        beneficiaries: [
          { name: 'District A', village: 'Village 1', eligibilityScore: 0.85 },
          { name: 'District B', village: 'Village 2', eligibilityScore: 0.72 },
          { name: 'District C', village: 'Village 3', eligibilityScore: 0.68 }
        ]
      },
      priorities: {
        recommendations: [
          { block: 'Block A', priorityScore: 0.92, groundwaterIndex: 'High' },
          { block: 'Block B', priorityScore: 0.78, groundwaterIndex: 'Medium' },
          { block: 'Block C', priorityScore: 0.65, groundwaterIndex: 'Low' }
        ]
      },
      metrics: {
        coveragePct: 75,
        beneficiaries: 12500,
        fundedProjects: 340
      }
    };
    
    res.json(mockStateData);
  } catch (error) {
    res.status(500).json({ error: 'State analysis failed' });
  }
});

// District-wise DSS Analysis
router.get('/district-analysis', authenticateToken, async (req, res) => {
  try {
    const { state, district, scheme } = req.query;
    
    const mockDistrictData = {
      state,
      district,
      scheme,
      eligibility: {
        beneficiaries: [
          { name: 'Village A', village: 'Block 1', eligibilityScore: 0.88 },
          { name: 'Village B', village: 'Block 2', eligibilityScore: 0.76 },
          { name: 'Village C', village: 'Block 3', eligibilityScore: 0.71 }
        ]
      },
      priorities: {
        recommendations: [
          { block: 'Village A', priorityScore: 0.89, groundwaterIndex: 'High' },
          { block: 'Village B', priorityScore: 0.74, groundwaterIndex: 'Medium' },
          { block: 'Village C', priorityScore: 0.62, groundwaterIndex: 'Low' }
        ]
      },
      metrics: {
        coveragePct: 68,
        beneficiaries: 3200,
        fundedProjects: 85
      }
    };
    
    res.json(mockDistrictData);
  } catch (error) {
    res.status(500).json({ error: 'District analysis failed' });
  }
});

// Patta Holders DSS Analysis
router.get('/patta-analysis', authenticateToken, async (req, res) => {
  try {
    const { state, district, village } = req.query;
    
    const mockPattaData = {
      state,
      district,
      village,
      eligibility: {
        beneficiaries: [
          { name: 'Ram Singh', village: 'Patta Holder 1', eligibilityScore: 0.92 },
          { name: 'Sita Devi', village: 'Patta Holder 2', eligibilityScore: 0.84 },
          { name: 'Mohan Lal', village: 'Patta Holder 3', eligibilityScore: 0.79 }
        ]
      },
      priorities: {
        recommendations: [
          { block: 'Individual Rights', priorityScore: 0.91, groundwaterIndex: 'High' },
          { block: 'Community Rights', priorityScore: 0.83, groundwaterIndex: 'Medium' },
          { block: 'Development Rights', priorityScore: 0.76, groundwaterIndex: 'Medium' }
        ]
      },
      metrics: {
        coveragePct: 82,
        beneficiaries: 156,
        fundedProjects: 12
      }
    };
    
    res.json(mockPattaData);
  } catch (error) {
    res.status(500).json({ error: 'Patta analysis failed' });
  }
});

// Health check for DSS engine
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${DSS_ENGINE_URL}/health`, { timeout: 5000 });
    res.json({
      dss_engine_status: 'healthy',
      gee_status: response.data.gee_initialized ? 'connected' : 'disconnected',
      last_check: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      dss_engine_status: 'unhealthy',
      error: error.message,
      last_check: new Date().toISOString()
    });
  }
});

module.exports = router;