const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api';

const testAPI = async () => {
  console.log('🧪 Testing FRA Atlas API Endpoints...\n');
  
  try {
    // Test 1: Get all land records
    console.log('1️⃣ Testing: GET /api/bhunaksha/all-records');
    const allRecords = await axios.get(`${BASE_URL}/bhunaksha/all-records`);
    console.log(`   ✅ Success: ${allRecords.data.count} records found`);
    
    // Test 2: Search by Khasra number
    console.log('\n2️⃣ Testing: GET /api/bhunaksha/search/khasra');
    const khasraSearch = await axios.get(`${BASE_URL}/bhunaksha/search/khasra`, {
      params: {
        district: 'Balaghat',
        village: 'Khairlanji',
        khasraNumber: '45/2'
      }
    });
    console.log(`   ✅ Success: Found record for ${khasraSearch.data.data.ownerName}`);
    
    // Test 3: Search by owner name
    console.log('\n3️⃣ Testing: GET /api/bhunaksha/search/owner');
    const ownerSearch = await axios.get(`${BASE_URL}/bhunaksha/search/owner`, {
      params: {
        district: 'Balaghat',
        ownerName: 'Ramsingh'
      }
    });
    console.log(`   ✅ Success: Found ${ownerSearch.data.data.length} records`);
    
    // Test 4: Get village records
    console.log('\n4️⃣ Testing: GET /api/bhunaksha/village/:district/:village');
    const villageRecords = await axios.get(`${BASE_URL}/bhunaksha/village/Balaghat/Khairlanji`);
    console.log(`   ✅ Success: Found ${villageRecords.data.data.length} records in Khairlanji`);
    
    // Test 5: Get district summary
    console.log('\n5️⃣ Testing: GET /api/bhunaksha/summary/:district');
    const districtSummary = await axios.get(`${BASE_URL}/bhunaksha/summary/Balaghat`);
    const summary = districtSummary.data.data;
    console.log(`   ✅ Success: Balaghat has ${summary.totalPlots} plots, ${summary.fraGranted} granted`);
    
    // Test 6: Generate certificate
    console.log('\n6️⃣ Testing: POST /api/bhunaksha/certificate');
    const certificate = await axios.post(`${BASE_URL}/bhunaksha/certificate`, {
      district: 'Balaghat',
      village: 'Khairlanji',
      khasraNumber: '45/2'
    });
    console.log(`   ✅ Success: Certificate generated`);
    
    // Test 7: Health check
    console.log('\n7️⃣ Testing: GET /health');
    const health = await axios.get('http://localhost:8000/health');
    console.log(`   ✅ Success: Server healthy at ${health.data.timestamp}`);
    
    console.log('\n🎉 All API tests passed successfully!');
    
    // Display sample data
    console.log('\n📊 Sample Data from Database:');
    allRecords.data.data.slice(0, 3).forEach((record, index) => {
      console.log(`\n${index + 1}. ${record.ownerName} (${record.khasraNumber})`);
      console.log(`   📍 ${record.village}, ${record.district}, ${record.state}`);
      console.log(`   📏 Area: ${record.area}`);
      console.log(`   📋 Status: ${record.fraStatus}`);
      console.log(`   🗺️ Boundaries: ${record.boundaries ? 'Available' : 'Not Available'}`);
    });
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.response?.data || error.message);
  }
};

// Run the test
testAPI();