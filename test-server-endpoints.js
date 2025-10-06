const http = require('http');

function testEndpoint(path, port = 8000) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            success: true,
            status: res.statusCode,
            features: jsonData.features?.length || 0,
            data: jsonData
          });
        } catch (error) {
          resolve({
            success: false,
            status: res.statusCode,
            error: 'Invalid JSON response',
            data: data.substring(0, 200)
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🧪 Testing forest data endpoints...\n');
  
  const endpoints = [
    '/data/fra-states-forest-data.geojson',
    '/api/fra/atlas/forest-areas',
    '/static-data/fra-states-forest-data.geojson'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`📡 Testing: ${endpoint}`);
    const result = await testEndpoint(endpoint);
    
    if (result.success) {
      console.log(`✅ Success! Status: ${result.status}, Features: ${result.features}`);
    } else {
      console.log(`❌ Failed: ${result.error || 'Unknown error'}`);
      if (result.status) {
        console.log(`   Status: ${result.status}`);
      }
      if (result.data) {
        console.log(`   Response: ${result.data}`);
      }
    }
    console.log('');
  }
}

testAllEndpoints();