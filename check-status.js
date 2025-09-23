#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');

console.log('🔍 FRA Atlas - Quick Status Check');
console.log('=================================\n');

async function quickStatusCheck() {
  const checks = [
    {
      name: 'Backend Health',
      url: 'http://localhost:8000/health',
      critical: true
    },
    {
      name: 'Frontend Availability',
      url: 'http://localhost:3000',
      critical: true
    },
    {
      name: 'Authentication API',
      url: 'http://localhost:8000/api/auth/login',
      method: 'POST',
      data: { email: 'admin@fraatlas.gov.in', password: 'admin123' },
      critical: true
    },
    {
      name: 'FRA Atlas Data',
      url: 'http://localhost:8000/api/fra/atlas/geojson',
      critical: false
    },
    {
      name: 'Decision Support',
      url: 'http://localhost:8000/api/fra/dss/metrics',
      critical: false
    }
  ];

  let allCriticalPassed = true;
  let totalPassed = 0;

  for (const check of checks) {
    try {
      const config = {
        method: check.method || 'GET',
        url: check.url,
        timeout: 5000,
        validateStatus: (status) => status < 500
      };

      if (check.data) {
        config.data = check.data;
        config.headers = { 'Content-Type': 'application/json' };
      }

      const response = await axios(config);
      
      if (response.status >= 200 && response.status < 400) {
        console.log(`✅ ${check.name}: OK`);
        totalPassed++;
      } else {
        console.log(`⚠️ ${check.name}: Warning (${response.status})`);
        if (check.critical) allCriticalPassed = false;
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${check.name}: Service not running`);
      } else {
        console.log(`❌ ${check.name}: ${error.message}`);
      }
      if (check.critical) allCriticalPassed = false;
    }
  }

  console.log('\n📊 Status Summary:');
  console.log(`✅ Passed: ${totalPassed}/${checks.length} checks`);
  
  if (allCriticalPassed && totalPassed >= 3) {
    console.log('🎉 FRA Atlas is operational!');
    console.log('🌐 Access at: http://localhost:3000');
    console.log('🔑 Login: admin@fraatlas.gov.in / admin123');
  } else if (allCriticalPassed) {
    console.log('⚠️ Core services running, some features may be limited');
    console.log('🌐 Access at: http://localhost:3000');
  } else {
    console.log('❌ Critical services not running');
    console.log('💡 Try running: MAKE-ALL-WORK.bat');
  }

  return allCriticalPassed;
}

// File system check
function checkFiles() {
  const criticalFiles = [
    'backend/src/server.js',
    'frontend/src/App.tsx',
    'make-all-functions-work.js',
    'MAKE-ALL-WORK.bat'
  ];

  console.log('\n📁 File System Check:');
  let allFilesExist = true;

  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - Missing`);
      allFilesExist = false;
    }
  });

  return allFilesExist;
}

async function main() {
  const filesOk = checkFiles();
  
  if (!filesOk) {
    console.log('\n❌ Critical files missing. Please check your installation.');
    return false;
  }

  const servicesOk = await quickStatusCheck();
  
  console.log('\n🚀 Quick Actions:');
  console.log('- Start everything: MAKE-ALL-WORK.bat');
  console.log('- Fix issues: node fix-all-functions.js');
  console.log('- Full health check: node health-check.js');
  console.log('- Verify functions: node verify-functions.js');

  return servicesOk && filesOk;
}

if (require.main === module) {
  main().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Status check failed:', error);
    process.exit(1);
  });
}

module.exports = { quickStatusCheck, checkFiles };