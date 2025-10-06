const fetch = require('node-fetch');

async function testForestEndpoint() {
  console.log('🧪 Testing forest data endpoints...');
  
  const endpoints = [
    'http://localhost:8000/data/fra-states-forest-data.geojson',
    'http://localhost:8000/api/fra/atlas/forest-areas'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testing: ${endpoint}`);
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success! Features: ${data.features?.length || 0}`);
        
        if (data.features && data.features.length > 0) {
          const firstFeature = data.features[0];
          console.log(`   First feature: ${firstFeature.properties?.name || 'Unnamed'}`);
          console.log(`   State: ${firstFeature.properties?.state || 'Unknown'}`);
        }
      } else {
        console.log(`❌ Failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

testForestEndpoint();