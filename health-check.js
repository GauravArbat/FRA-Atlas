#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:3000';

console.log('🏥 FRA Atlas Health Check');
console.log('========================');

// Test configuration
const tests = [
  {
    name: 'Backend Health Check',
    url: `${BASE_URL}/health`,
    method: 'GET'
  },
  {
    name: 'Authentication - Login',
    url: `${BASE_URL}/api/auth/login`,
    method: 'POST',
    data: {
      email: 'admin@fraatlas.gov.in',
      password: 'admin123'
    }
  },
  {
    name: 'FRA Claims API',
    url: `${BASE_URL}/api/fra/claims`,
    method: 'GET'
  },
  {
    name: 'FRA Atlas GeoJSON',
    url: `${BASE_URL}/api/fra/atlas/geojson`,
    method: 'GET'
  },
  {
    name: 'FRA Atlas Filters',
    url: `${BASE_URL}/api/fra/atlas/filters`,
    method: 'GET'
  },
  {
    name: 'Decision Support - Eligibility',
    url: `${BASE_URL}/api/fra/dss/eligibility`,
    method: 'GET'
  },
  {
    name: 'Decision Support - Prioritization',
    url: `${BASE_URL}/api/fra/dss/prioritize`,
    method: 'GET'
  },
  {
    name: 'Decision Support - Metrics',
    url: `${BASE_URL}/api/fra/dss/metrics`,
    method: 'GET'
  },
  {
    name: 'Reports Summary',
    url: `${BASE_URL}/api/fra/reports/summary`,
    method: 'GET'
  },
  {
    name: 'Translation Service',
    url: `${BASE_URL}/api/translate`,
    method: 'POST',
    data: {
      text: 'Hello World',
      targetLanguage: 'hi'
    }
  },
  {
    name: 'Proxy Tiles Service',
    url: `${BASE_URL}/api/proxy/tiles/worldcover/0/0/0.png`,
    method: 'GET'
  }
];

// Function to test an endpoint
async function testEndpoint(test) {
  try {
    const config = {
      method: test.method,
      url: test.url,
      timeout: 10000,
      validateStatus: (status) => status < 500 // Accept 4xx as valid responses
    };
    
    if (test.data) {
      config.data = test.data;
      config.headers = { 'Content-Type': 'application/json' };
    }
    
    const response = await axios(config);
    
    if (response.status >= 200 && response.status < 400) {
      console.log(`✅ ${test.name}: OK (${response.status})`);
      return { success: true, status: response.status, data: response.data };
    } else {
      console.log(`⚠️ ${test.name}: Warning (${response.status})`);
      return { success: false, status: response.status, error: 'Non-2xx status' };
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`❌ ${test.name}: Service not running`);
    } else if (error.code === 'ETIMEDOUT') {
      console.log(`❌ ${test.name}: Timeout`);
    } else {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
    return { success: false, error: error.message };
  }
}

// Function to check frontend
async function checkFrontend() {
  try {
    const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
    if (response.status === 200) {
      console.log(`✅ Frontend: OK (${response.status})`);
      return true;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`❌ Frontend: Service not running`);
    } else {
      console.log(`❌ Frontend: ${error.message}`);
    }
    return false;
  }
}

// Function to check file system
function checkFileSystem() {
  console.log('\n📁 File System Check:');
  
  const requiredFiles = [
    'package.json',
    'backend/package.json',
    'backend/src/server.js',
    'frontend/package.json',
    'frontend/src/App.tsx',
    '.env'
  ];
  
  const requiredDirs = [
    'backend',
    'frontend',
    'uploads',
    'logs'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}: Exists`);
    } else {
      console.log(`❌ ${file}: Missing`);
      allFilesExist = false;
    }
  });
  
  requiredDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`✅ ${dir}/: Exists`);
    } else {
      console.log(`❌ ${dir}/: Missing`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

// Main health check function
async function runHealthCheck() {
  console.log('Starting comprehensive health check...\n');
  
  // Check file system first
  const filesOk = checkFileSystem();
  
  console.log('\n🌐 Network Services Check:');
  
  // Check frontend
  const frontendOk = await checkFrontend();
  
  // Test all backend endpoints
  const results = [];
  for (const test of tests) {
    const result = await testEndpoint(test);
    results.push({ ...test, ...result });
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Summary
  console.log('\n📊 Health Check Summary:');
  console.log('========================');
  
  const successfulTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log(`✅ Successful: ${successfulTests}/${totalTests} backend endpoints`);
  console.log(`🎨 Frontend: ${frontendOk ? 'OK' : 'Failed'}`);
  console.log(`📁 File System: ${filesOk ? 'OK' : 'Issues detected'}`);
  
  if (successfulTests === totalTests && frontendOk && filesOk) {
    console.log('\n🎉 All systems operational!');
    console.log('🌐 Access the application at: http://localhost:3000');
    console.log('🔧 API documentation at: http://localhost:8000/health');
  } else {
    console.log('\n⚠️ Some issues detected. Please check the logs above.');
    
    if (!frontendOk) {
      console.log('💡 To start frontend: cd frontend && npm start');
    }
    
    if (successfulTests < totalTests) {
      console.log('💡 To start backend: cd backend && npm run dev');
    }
  }
  
  return {
    backend: successfulTests === totalTests,
    frontend: frontendOk,
    fileSystem: filesOk,
    overall: successfulTests === totalTests && frontendOk && filesOk
  };
}

// Export for use in other scripts
module.exports = { runHealthCheck, testEndpoint, checkFrontend, checkFileSystem };

// Run if this file is executed directly
if (require.main === module) {
  runHealthCheck().then(results => {
    process.exit(results.overall ? 0 : 1);
  }).catch(error => {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  });
}