const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Forest Data Fix...\n');

// Test 1: Check if forest data file exists
const forestDataPath = path.join(__dirname, 'backend', 'data', 'fra-states-forest-data.geojson');
console.log('1. Checking forest data file...');
console.log('   Path:', forestDataPath);

if (fs.existsSync(forestDataPath)) {
  console.log('   ✅ File exists');
  
  try {
    const data = fs.readFileSync(forestDataPath, 'utf8');
    const forestData = JSON.parse(data);
    
    console.log('   ✅ Valid JSON');
    console.log('   📊 Features:', forestData.features?.length || 0);
    console.log('   📏 File size:', (data.length / 1024).toFixed(2), 'KB');
    
    if (forestData.features && forestData.features.length > 0) {
      const sample = forestData.features[0];
      console.log('   📋 Sample feature:');
      console.log('      Type:', sample.geometry?.type);
      console.log('      Properties:', Object.keys(sample.properties || {}));
    }
  } catch (error) {
    console.log('   ❌ Invalid JSON:', error.message);
  }
} else {
  console.log('   ❌ File not found');
}

// Test 2: Test backend server endpoint
console.log('\n2. Testing backend server endpoint...');

const testEndpoint = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/fra/atlas/forest-areas');
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Backend API working');
      console.log('   📊 API returned features:', data.features?.length || 0);
      
      if (data.features && data.features.length > 0) {
        console.log('   ✅ Forest data successfully loaded from backend');
      } else {
        console.log('   ⚠️ Backend returned 0 features');
      }
    } else {
      console.log('   ❌ Backend API failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('   ❌ Backend server not running or unreachable:', error.message);
    console.log('   💡 Make sure to start the backend server first: cd backend && npm run dev');
  }
};

// Test 3: Test frontend endpoint
console.log('\n3. Testing frontend endpoint...');

const testFrontendEndpoint = async () => {
  try {
    const response = await fetch('http://localhost:3000/data/fra-states-forest-data.geojson');
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Frontend endpoint working');
      console.log('   📊 Frontend returned features:', data.features?.length || 0);
    } else {
      console.log('   ❌ Frontend endpoint failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('   ❌ Frontend server not running or unreachable:', error.message);
    console.log('   💡 Make sure to start the frontend server: cd frontend && npm start');
  }
};

// Run tests
(async () => {
  await testEndpoint();
  await testFrontendEndpoint();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Start backend server: cd backend && npm run dev');
  console.log('2. Start frontend server: cd frontend && npm start');
  console.log('3. Open FRA Atlas and check Forest Areas layer');
  console.log('4. Look for console logs showing forest features loaded');
})();