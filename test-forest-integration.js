const testForestIntegration = async () => {
  console.log('🌲 Testing Forest Data Integration...\n');

  const baseURL = 'http://localhost:8000/api';
  
  try {
    // Test individual forest sources
    console.log('1. Testing OSM Forest Data...');
    const osmResponse = await fetch(`${baseURL}/forest/osm?bbox=20,75,25,85`);
    const osmData = await osmResponse.json();
    console.log(`   ✅ OSM: ${osmData.features?.length || 0} features`);

    console.log('\n2. Testing Global Forest Watch...');
    const gfwResponse = await fetch(`${baseURL}/forest/gfw`);
    const gfwData = await gfwResponse.json();
    console.log(`   ✅ GFW: ${gfwData.features?.length || 0} features`);

    console.log('\n3. Testing World Bank Data...');
    const wbResponse = await fetch(`${baseURL}/forest/worldbank`);
    const wbData = await wbResponse.json();
    console.log(`   ✅ World Bank: ${wbData.features?.length || 0} features`);

    // Test comprehensive endpoint
    console.log('\n4. Testing Comprehensive Forest Data...');
    const compResponse = await fetch(`${baseURL}/forest-comprehensive?bbox=20,75,25,85&limit=500`);
    const compData = await compResponse.json();
    console.log(`   ✅ Comprehensive: ${compData.features?.length || 0} features`);

    // Test forest statistics
    console.log('\n5. Testing Forest Statistics...');
    const statsResponse = await fetch(`${baseURL}/forest-stats`);
    const statsData = await statsResponse.json();
    console.log(`   ✅ Statistics:`, statsData);

    console.log('\n✅ Forest data integration test completed successfully!');
    console.log('🎯 Forest layer should now display data when toggled on in FRA Atlas');

  } catch (error) {
    console.error('❌ Forest integration test failed:', error.message);
  }
};

// Check if running in Node.js environment
if (typeof fetch === 'undefined') {
  console.log('⚠️ This test requires Node.js 18+ with built-in fetch or a browser environment');
  console.log('📝 To test: Start your backend server and open browser console, then run this script');
  process.exit(1);
}

testForestIntegration();