const forestDataService = require('./backend/src/services/forestDataService');

const testForestPlotting = async () => {
  console.log('🗺️ Testing Forest Data Plotting...\n');

  try {
    // Test with specific coordinates (Maharashtra region)
    const bbox = [18, 72, 21, 80]; // Mumbai to Nagpur region
    console.log(`📍 Testing region: ${bbox.join(', ')}`);

    const osmData = await forestDataService.fetchForestData('osm', bbox);
    
    console.log(`\n📊 Results:`);
    console.log(`   Features found: ${osmData.features.length}`);
    
    if (osmData.features.length > 0) {
      // Test first few features
      console.log('\n🔍 Sample Features:');
      osmData.features.slice(0, 3).forEach((feature, i) => {
        const props = feature.properties;
        const coords = feature.geometry.coordinates[0];
        
        console.log(`\n   Feature ${i + 1}:`);
        console.log(`     Name: ${props.name}`);
        console.log(`     Type: ${props.type}`);
        console.log(`     Source: ${props.source}`);
        console.log(`     Coordinates: ${coords?.length || 0} points`);
        console.log(`     First coord: [${coords?.[0]?.[0]?.toFixed(4)}, ${coords?.[0]?.[1]?.toFixed(4)}]`);
        
        // Validate coordinates are within bbox
        if (coords?.[0]) {
          const [lon, lat] = coords[0];
          const inBounds = lon >= bbox[1] && lon <= bbox[3] && lat >= bbox[0] && lat <= bbox[2];
          console.log(`     In bounds: ${inBounds ? '✅' : '❌'}`);
        }
      });

      // Test geometry validity
      console.log('\n🔧 Geometry Validation:');
      let validGeometries = 0;
      let invalidGeometries = 0;
      
      osmData.features.forEach(feature => {
        const coords = feature.geometry.coordinates;
        if (coords && coords[0] && coords[0].length >= 3) {
          validGeometries++;
        } else {
          invalidGeometries++;
        }
      });
      
      console.log(`   Valid geometries: ${validGeometries}`);
      console.log(`   Invalid geometries: ${invalidGeometries}`);
      console.log(`   Success rate: ${((validGeometries / osmData.features.length) * 100).toFixed(1)}%`);

      // Create test GeoJSON for verification
      const testGeoJSON = {
        type: 'FeatureCollection',
        features: osmData.features.slice(0, 10) // First 10 for testing
      };
      
      console.log('\n📄 Test GeoJSON created with 10 features');
      console.log('✅ Data is ready for plotting on map');
      
    } else {
      console.log('❌ No features found - check API connectivity');
    }

  } catch (error) {
    console.error('❌ Error testing forest plotting:', error.message);
    console.error('Stack:', error.stack);
  }
};

testForestPlotting();