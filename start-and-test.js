const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

function testEndpoint(path, port = 8000) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ success: true, features: jsonData.features?.length || 0 });
        } catch {
          resolve({ success: false, error: 'Invalid JSON' });
        }
      });
    });

    req.on('error', () => resolve({ success: false, error: 'Connection failed' }));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
    req.end();
  });
}

async function waitForServer(maxAttempts = 30) {
  console.log('⏳ Waiting for server to start...');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const result = await testEndpoint('/health');
      if (result.success !== false) {
        console.log('✅ Server is ready!');
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    process.stdout.write('.');
  }
  
  console.log('\n❌ Server failed to start within timeout');
  return false;
}

async function testForestEndpoints() {
  console.log('\n🧪 Testing forest data endpoints...');
  
  const endpoints = [
    '/data/fra-states-forest-data.geojson',
    '/static-data/fra-states-forest-data.geojson'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`📡 Testing: ${endpoint}`);
    const result = await testEndpoint(endpoint);
    
    if (result.success) {
      console.log(`✅ Success! Features: ${result.features}`);
    } else {
      console.log(`❌ Failed: ${result.error}`);
    }
  }
}

async function main() {
  console.log('🚀 Starting FRA Atlas backend server...\n');
  
  // Start the server
  const serverProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'pipe',
    shell: true
  });
  
  serverProcess.stdout.on('data', (data) => {
    process.stdout.write(data);
  });
  
  serverProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
  });
  
  // Wait for server to be ready
  const serverReady = await waitForServer();
  
  if (serverReady) {
    // Test forest endpoints
    await testForestEndpoints();
    
    console.log('\n🎉 Server is running and forest data endpoints are ready!');
    console.log('📍 You can now access:');
    console.log('   - Frontend: http://localhost:3000');
    console.log('   - Backend: http://localhost:8000');
    console.log('   - Forest Data: http://localhost:8000/data/fra-states-forest-data.geojson');
    console.log('\n💡 Press Ctrl+C to stop the server');
  }
  
  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping server...');
    serverProcess.kill();
    process.exit(0);
  });
}

main().catch(console.error);