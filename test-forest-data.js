const { fetchRealForestAreas } = require('./frontend/src/services/realForestData.js');

async function testForestData() {
  console.log('🌲 Testing forest data fetch...');
  
  try {
    const forestData = await fetchRealForestAreas();
    console.log('✅ Forest data loaded:', forestData.features?.length || 0, 'features');
    console.log('📊 Sample feature:', forestData.features?.[0]?.properties);
    return true;
  } catch (error) {
    console.error('❌ Forest data test failed:', error);
    return false;
  }
}

testForestData();