const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api';

// Test configuration
const testConfig = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

async function testAllAPIs() {
  console.log('🚀 Testing FRA Atlas API Endpoints...\n');
  console.log(`📡 API Base URL: ${API_BASE_URL}\n`);

  let passedTests = 0;
  let totalTests = 0;

  // Helper function to run test
  async function runTest(testName, testFn) {
    totalTests++;
    try {
      console.log(`🔍 ${testName}`);
      await testFn();
      console.log(`✅ PASSED: ${testName}\n`);
      passedTests++;
    } catch (error) {
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}\n`);
    }
  }

  // Test 1: Health Check
  await runTest('Health Check', async () => {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, testConfig);
    if (response.status !== 200) throw new Error('Health check failed');
  });

  // Test 2: GIS Plot API
  await runTest('GIS Plot - Get Patta Records', async () => {
    const response = await axios.get(`${API_BASE_URL}/gis-plot/patta`, testConfig);
    if (response.status !== 200) throw new Error('Failed to get patta records');
    console.log(`   📊 Found ${response.data.count} patta records`);
  });

  await runTest('GIS Plot - Get Cadastral Layers', async () => {
    const response = await axios.get(`${API_BASE_URL}/gis-plot/cadastral-layers`, testConfig);
    if (response.status !== 200) throw new Error('Failed to get cadastral layers');
    console.log(`   📊 Found ${response.data.count} cadastral layers`);
  });

  await runTest('GIS Plot - Get Statistics', async () => {
    const response = await axios.get(`${API_BASE_URL}/gis-plot/statistics`, testConfig);
    if (response.status !== 200) throw new Error('Failed to get statistics');
    console.log(`   📊 Total Pattas: ${response.data.data.totalPattas}`);
  });

  // Test 3: GeoJSON Plot API
  await runTest('GeoJSON Plot - Get Sample Data', async () => {
    const response = await axios.get(`${API_BASE_URL}/geojson-plot/sample`, testConfig);
    if (response.status !== 200) throw new Error('Failed to get sample data');
    console.log(`   📊 Sample features: ${response.data.data.features.length}`);
  });

  await runTest('GeoJSON Plot - Get Layers', async () => {
    const response = await axios.get(`${API_BASE_URL}/geojson-plot/layers`, testConfig);
    if (response.status !== 200) throw new Error('Failed to get layers');
    console.log(`   📊 Found ${response.data.data.length} layers`);
  });

  // Test 4: Digitization Pipeline API
  await runTest('Digitization Pipeline - Get Status', async () => {
    const response = await axios.get(`${API_BASE_URL}/digitization-pipeline/status/test-doc`, testConfig);
    if (response.status !== 200) throw new Error('Failed to get status');
    console.log(`   📊 Status: ${response.data.status}`);
  });

  await runTest('Digitization Pipeline - Export GeoJSON', async () => {
    const response = await axios.get(`${API_BASE_URL}/digitization-pipeline/export/geojson`, testConfig);
    if (response.status !== 200) throw new Error('Failed to export geojson');
    console.log(`   📊 Export type: ${response.data.type}`);
  });

  // Test 5: PDF Processor API
  await runTest('PDF Processor - Get Processed Data', async () => {
    const response = await axios.get(`${API_BASE_URL}/pdf-processor/processed-data`, testConfig);
    if (response.status !== 200) throw new Error('Failed to get processed data');
    console.log(`   📊 Found ${response.data.data.length} processed records`);
  });

  // Test 6: Validation Tests
  await runTest('GeoJSON Plot - Validate Data', async () => {
    const testData = {
      data: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: { name: 'Test' },
          geometry: { type: 'Point', coordinates: [77.1234, 28.5678] }
        }]
      }
    };
    const response = await axios.post(`${API_BASE_URL}/geojson-plot/validate`, testData, testConfig);
    if (response.status !== 200) throw new Error('Failed to validate data');
    console.log(`   📊 Validation result: ${response.data.data.isValid ? 'Valid' : 'Invalid'}`);
  });

  await runTest('GIS Plot - Validate Geometry', async () => {
    const testGeometry = {
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.1, 28.5], [77.2, 28.5], [77.2, 28.6], [77.1, 28.6], [77.1, 28.5]]]
      }
    };
    const response = await axios.post(`${API_BASE_URL}/gis-plot/validate-geometry`, testGeometry, testConfig);
    if (response.status !== 200) throw new Error('Failed to validate geometry');
    console.log(`   📊 Geometry valid: ${response.data.data.isValid}`);
  });

  // Test 7: Export Tests
  await runTest('GIS Plot - Export GeoJSON', async () => {
    const response = await axios.get(`${API_BASE_URL}/gis-plot/export/geojson`, testConfig);
    if (response.status !== 200) throw new Error('Failed to export geojson');
    console.log(`   📊 Export type: ${response.data.type}`);
  });

  await runTest('GIS Plot - Export CSV', async () => {
    const response = await axios.get(`${API_BASE_URL}/gis-plot/export/csv`, testConfig);
    if (response.status !== 200) throw new Error('Failed to export csv');
    console.log(`   📊 Export format: CSV`);
  });

  await runTest('GIS Plot - Export KML', async () => {
    const response = await axios.get(`${API_BASE_URL}/gis-plot/export/kml`, testConfig);
    if (response.status !== 200) throw new Error('Failed to export kml');
    console.log(`   📊 Export format: KML`);
  });

  // Summary
  console.log('=' .repeat(50));
  console.log(`📊 TEST SUMMARY`);
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! The FRA Atlas API is fully functional.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the API server and endpoints.');
  }
}

// Run the tests
testAllAPIs().catch(error => {
  console.error('❌ Test suite failed:', error.message);
  process.exit(1);
});