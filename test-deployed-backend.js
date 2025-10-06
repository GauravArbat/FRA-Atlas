const testDeployedBackend = async () => {
  console.log('🔍 Testing Deployed Backend Forest Data...\n');
  
  const baseUrl = 'https://fra-atlas-backend-ipd3.onrender.com';
  
  const endpoints = [
    '/api/fra/atlas/forest-areas',
    '/data/fra-states-forest-data.geojson',
    '/static-data/fra-states-forest-data.geojson'
  ];
  
  for (const endpoint of endpoints) {
    const url = baseUrl + endpoint;
    console.log(`🔄 Testing: ${url}`);
    
    try {
      const response = await fetch(url);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Success: ${data.features?.length || 0} features`);
        
        if (data.features && data.features.length > 0) {
          console.log(`   🎉 Found forest data! Breaking...`);
          break;
        }
      } else {
        console.log(`   ❌ Failed`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }
};

testDeployedBackend();