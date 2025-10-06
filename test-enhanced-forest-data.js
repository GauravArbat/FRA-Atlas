const forestDataService = require('./backend/src/services/forestDataService');

const testEnhancedForestData = async () => {
  console.log('🌲 Testing Enhanced Forest Data...\n');

  try {
    // Test comprehensive OSM data
    console.log('🗺️ Testing Enhanced OSM Forest Data...');
    const osmData = await forestDataService.fetchForestData('osm', [20, 75, 25, 85]);
    console.log(`✅ OSM Enhanced: ${osmData.features.length} features`);
    
    // Show feature types
    const types = {};
    osmData.features.forEach(f => {
      types[f.properties.type] = (types[f.properties.type] || 0) + 1;
    });
    console.log('   Forest Types:', Object.keys(types).join(', '));
    console.log('   Type Counts:', types);

    // Test India-specific data
    console.log('\n🇮🇳 Testing India Forest Data...');
    const indiaData = await forestDataService.fetchForestData('india_forests');
    console.log(`✅ India Data: ${indiaData.features.length} features`);

    // Test WRI data
    console.log('\n📊 Testing WRI Data...');
    const wriData = await forestDataService.fetchForestData('wri');
    console.log(`✅ WRI Data: ${wriData.features.length} features`);

    // Test combined comprehensive data
    console.log('\n🌍 Testing Combined Comprehensive Data...');
    const combinedData = await forestDataService.fetchForestData('combined', [20, 75, 25, 85]);
    console.log(`✅ Combined: ${combinedData.features.length} total features`);

    // Summary
    const totalFeatures = osmData.features.length + indiaData.features.length + 
                         wriData.features.length;
    
    console.log('\n📈 Summary:');
    console.log(`   Total Available Features: ${totalFeatures}`);
    console.log(`   OSM Features: ${osmData.features.length}`);
    console.log(`   India Gov Features: ${indiaData.features.length}`);
    console.log(`   WRI Features: ${wriData.features.length}`);
    console.log(`   Combined Features: ${combinedData.features.length}`);
    
    console.log('\n✅ Enhanced forest data system ready!');
    console.log('🎯 Use /api/forest-comprehensive for maximum forest coverage');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testEnhancedForestData();