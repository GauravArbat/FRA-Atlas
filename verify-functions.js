#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:8000';

console.log('🔍 FRA Atlas Function Verification');
console.log('==================================');

let authToken = null;

// Helper function to make authenticated requests
async function authenticatedRequest(config) {
  if (authToken) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${authToken}`
    };
  }
  return axios(config);
}

// Test 1: Authentication System
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication System...');
  
  try {
    // Test login
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@fraatlas.gov.in',
      password: 'admin123'
    });
    
    if (loginResponse.data.token) {
      authToken = loginResponse.data.token;
      console.log('✅ Login successful');
      console.log(`   User: ${loginResponse.data.user.username}`);
      console.log(`   Role: ${loginResponse.data.user.role}`);
    }
    
    // Test user profile
    const profileResponse = await authenticatedRequest({
      method: 'GET',
      url: `${BASE_URL}/api/auth/me`
    });
    
    if (profileResponse.data.user) {
      console.log('✅ Profile retrieval successful');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Authentication failed:', error.message);
    return false;
  }
}

// Test 2: FRA Atlas Mapping
async function testFRAAtlas() {
  console.log('\n🗺️ Testing FRA Atlas Mapping...');
  
  try {
    // Test GeoJSON data
    const geojsonResponse = await axios.get(`${BASE_URL}/api/fra/atlas/geojson`);
    if (geojsonResponse.data.features) {
      console.log(`✅ GeoJSON data loaded (${geojsonResponse.data.features.length} features)`);
    }
    
    // Test filters
    const filtersResponse = await axios.get(`${BASE_URL}/api/fra/atlas/filters`);
    if (filtersResponse.data.states) {
      console.log(`✅ Filters loaded (${filtersResponse.data.states.length} states)`);
    }
    
    // Test asset mapping
    const assetsResponse = await axios.get(`${BASE_URL}/api/fra/atlas/assets?type=agriculture`);
    if (assetsResponse.data.features) {
      console.log(`✅ Asset mapping working (${assetsResponse.data.features.length} assets)`);
    }
    
    // Test boundary validation
    const validationResponse = await axios.post(`${BASE_URL}/api/fra/atlas/validate`, {
      geometry: {
        type: 'Polygon',
        coordinates: [[[73.8567, 19.0760], [73.8567, 19.0761], [73.8568, 19.0761], [73.8568, 19.0760], [73.8567, 19.0760]]]
      }
    });
    
    if (validationResponse.data.confidence) {
      console.log(`✅ Boundary validation working (confidence: ${validationResponse.data.confidence})`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ FRA Atlas failed:', error.message);
    return false;
  }
}

// Test 3: Decision Support System
async function testDecisionSupport() {
  console.log('\n🎯 Testing Decision Support System...');
  
  try {
    // Test eligibility evaluation
    const eligibilityResponse = await axios.get(`${BASE_URL}/api/fra/dss/eligibility?scheme=PMKSY`);
    if (eligibilityResponse.data.beneficiaries) {
      console.log(`✅ Eligibility evaluation working (${eligibilityResponse.data.beneficiaries.length} beneficiaries)`);
    }
    
    // Test prioritization
    const prioritizationResponse = await axios.get(`${BASE_URL}/api/fra/dss/prioritize?intervention=borewell`);
    if (prioritizationResponse.data.recommendations) {
      console.log(`✅ Prioritization working (${prioritizationResponse.data.recommendations.length} recommendations)`);
    }
    
    // Test metrics
    const metricsResponse = await axios.get(`${BASE_URL}/api/fra/dss/metrics`);
    if (metricsResponse.data.national) {
      console.log(`✅ Metrics dashboard working (${metricsResponse.data.national.beneficiaries} beneficiaries)`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Decision Support failed:', error.message);
    return false;
  }
}

// Test 4: Reports and Analytics
async function testReportsAnalytics() {
  console.log('\n📊 Testing Reports and Analytics...');
  
  try {
    // Test reports summary
    const reportsResponse = await axios.get(`${BASE_URL}/api/fra/reports/summary`);
    if (reportsResponse.data.timeseries) {
      console.log(`✅ Reports working (${reportsResponse.data.timeseries.length} data points)`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Reports and Analytics failed:', error.message);
    return false;
  }
}

// Test 5: Document Processing
async function testDocumentProcessing() {
  console.log('\n📄 Testing Document Processing...');
  
  try {
    // Test OCR endpoint
    const ocrResponse = await axios.post(`${BASE_URL}/api/ocr/process`, {
      text: 'Sample text for OCR processing',
      language: 'eng'
    });
    
    console.log('✅ OCR processing endpoint accessible');
    
    // Test NER endpoint
    const nerResponse = await axios.post(`${BASE_URL}/api/ner/extract`, {
      text: 'Ramesh Kumar from Village Khairlanji, District Balaghat'
    });
    
    console.log('✅ NER processing endpoint accessible');
    
    return true;
  } catch (error) {
    console.log('❌ Document Processing failed:', error.message);
    return false;
  }
}

// Test 6: Translation System
async function testTranslation() {
  console.log('\n🌐 Testing Translation System...');
  
  try {
    const translationResponse = await axios.post(`${BASE_URL}/api/translate`, {
      text: 'Forest Rights Act',
      targetLanguage: 'hi'
    });
    
    if (translationResponse.data.translatedText || translationResponse.status === 200) {
      console.log('✅ Translation system working');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Translation system failed:', error.message);
    return false;
  }
}

// Test 7: Proxy Services
async function testProxyServices() {
  console.log('\n🔗 Testing Proxy Services...');
  
  try {
    // Test tile proxy
    const tileResponse = await axios.get(`${BASE_URL}/api/proxy/tiles/worldcover/0/0/0.png`, {
      timeout: 10000,
      validateStatus: (status) => status < 500
    });
    
    if (tileResponse.status < 400) {
      console.log('✅ Tile proxy working');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Proxy services failed:', error.message);
    return false;
  }
}

// Test 8: GIS Plot System
async function testGISPlot() {
  console.log('\n🎯 Testing Digital GIS Plot System...');
  
  try {
    // Test patta records
    const pattaResponse = await axios.get(`${BASE_URL}/api/gis-plot/patta`);
    console.log('✅ GIS Plot patta endpoint accessible');
    
    // Test cadastral layers
    const cadastralResponse = await axios.get(`${BASE_URL}/api/gis-plot/cadastral-layers`);
    console.log('✅ Cadastral layers endpoint accessible');
    
    return true;
  } catch (error) {
    console.log('❌ GIS Plot system failed:', error.message);
    return false;
  }
}

// Main verification function
async function runFunctionVerification() {
  console.log('Starting comprehensive function verification...\n');
  
  const tests = [
    { name: 'Authentication System', test: testAuthentication },
    { name: 'FRA Atlas Mapping', test: testFRAAtlas },
    { name: 'Decision Support System', test: testDecisionSupport },
    { name: 'Reports and Analytics', test: testReportsAnalytics },
    { name: 'Document Processing', test: testDocumentProcessing },
    { name: 'Translation System', test: testTranslation },
    { name: 'Proxy Services', test: testProxyServices },
    { name: 'GIS Plot System', test: testGISPlot }
  ];
  
  const results = [];
  
  for (const { name, test } of tests) {
    try {
      const result = await test();
      results.push({ name, success: result });
    } catch (error) {
      console.log(`❌ ${name} verification failed:`, error.message);
      results.push({ name, success: false });
    }
  }
  
  // Summary
  console.log('\n📋 Function Verification Summary:');
  console.log('=================================');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log(`\n🎯 Overall: ${successful}/${total} functions working`);
  
  if (successful === total) {
    console.log('\n🎉 All FRA Atlas functions are operational!');
    console.log('🌐 System ready for use at: http://localhost:3000');
  } else {
    console.log('\n⚠️ Some functions need attention. Check the logs above.');
  }
  
  return {
    successful,
    total,
    results,
    allWorking: successful === total
  };
}

// Export for use in other scripts
module.exports = { runFunctionVerification };

// Run if this file is executed directly
if (require.main === module) {
  runFunctionVerification().then(results => {
    process.exit(results.allWorking ? 0 : 1);
  }).catch(error => {
    console.error('❌ Function verification failed:', error);
    process.exit(1);
  });
}