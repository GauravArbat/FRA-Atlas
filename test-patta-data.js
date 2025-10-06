const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000/api';

async function testPattaData() {
  try {
    console.log('🔍 Testing Patta Holders API...\n');

    // Test 1: Get all patta holders
    console.log('1. Testing GET /patta-holders');
    const allResponse = await axios.get(`${API_BASE_URL}/patta-holders`);
    console.log(`✅ Status: ${allResponse.status}`);
    console.log(`📊 Total records: ${allResponse.data.count}`);
    console.log(`📋 Sample record:`, allResponse.data.data[0]?.ownerName || 'No records');
    console.log('');

    // Test 2: Get GeoJSON format
    console.log('2. Testing GET /patta-holders/geojson/all');
    const geojsonResponse = await axios.get(`${API_BASE_URL}/patta-holders/geojson/all`);
    console.log(`✅ Status: ${geojsonResponse.status}`);
    console.log(`📊 GeoJSON features: ${geojsonResponse.data.data.features.length}`);
    console.log(`📋 Sample feature:`, geojsonResponse.data.data.features[0]?.properties?.ownerName || 'No features');
    console.log('');

    // Test 3: Get statistics
    console.log('3. Testing GET /patta-holders/stats/summary');
    const statsResponse = await axios.get(`${API_BASE_URL}/patta-holders/stats/summary`);
    console.log(`✅ Status: ${statsResponse.status}`);
    console.log(`📊 Statistics:`, statsResponse.data.data);
    console.log('');

    console.log('🎉 All tests passed! Patta holders data is accessible.');
    
  } catch (error) {
    console.error('❌ Error testing patta data:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testPattaData();