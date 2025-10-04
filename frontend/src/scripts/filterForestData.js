// Filter forest data for only 4 FRA states
const fs = require('fs');
const path = require('path');

const filterForestData = () => {
  console.log('🔄 Filtering forest data for FRA states...');
  
  // State boundaries (approximate)
  const stateBounds = {
    'Madhya Pradesh': { minLat: 21.2, maxLat: 25.8, minLng: 74.5, maxLng: 81.5 },
    'Tripura': { minLat: 23.0, maxLat: 24.4, minLng: 91.1, maxLng: 92.3 },
    'Odisha': { minLat: 17.8, maxLat: 22.3, minLng: 81.3, maxLng: 87.2 },
    'Telangana': { minLat: 16.1, maxLat: 19.8, minLng: 77.3, maxLng: 80.8 }
  };

  // Load combined data
  const inputPath = path.join(__dirname, '../../public/data/combined-forest-data.geojson');
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  console.log(`📊 Total features: ${data.features.length}`);
  
  // Filter features within FRA states
  const filteredFeatures = data.features.filter(feature => {
    if (!feature.geometry || !feature.geometry.coordinates) return false;
    
    let coords = [];
    if (feature.geometry.type === 'Polygon') {
      coords = feature.geometry.coordinates[0];
    } else if (feature.geometry.type === 'Point') {
      coords = [feature.geometry.coordinates];
    } else {
      return false;
    }
    
    // Check if any coordinate is within FRA states
    return coords.some(coord => {
      const [lng, lat] = coord;
      return Object.values(stateBounds).some(bounds => 
        lat >= bounds.minLat && lat <= bounds.maxLat && 
        lng >= bounds.minLng && lng <= bounds.maxLng
      );
    });
  });
  
  // Add state information
  const enhancedFeatures = filteredFeatures.map(feature => {
    let coords = [];
    if (feature.geometry.type === 'Polygon') {
      coords = feature.geometry.coordinates[0];
    } else if (feature.geometry.type === 'Point') {
      coords = [feature.geometry.coordinates];
    }
    
    // Determine which state
    let state = 'Unknown';
    for (const coord of coords) {
      const [lng, lat] = coord;
      for (const [stateName, bounds] of Object.entries(stateBounds)) {
        if (lat >= bounds.minLat && lat <= bounds.maxLat && 
            lng >= bounds.minLng && lng <= bounds.maxLng) {
          state = stateName;
          break;
        }
      }
      if (state !== 'Unknown') break;
    }
    
    return {
      ...feature,
      properties: {
        ...feature.properties,
        state: state
      }
    };
  });
  
  const filteredData = {
    type: 'FeatureCollection',
    features: enhancedFeatures
  };
  
  // Save filtered data
  const outputPath = path.join(__dirname, '../../public/data/fra-states-forest-data.geojson');
  fs.writeFileSync(outputPath, JSON.stringify(filteredData, null, 2));
  
  console.log(`✅ Filtered to ${filteredData.features.length} features in FRA states`);
  console.log('📁 Saved as fra-states-forest-data.geojson');
  
  // Show breakdown by state
  const breakdown = {};
  filteredData.features.forEach(f => {
    const state = f.properties.state;
    breakdown[state] = (breakdown[state] || 0) + 1;
  });
  
  console.log('\n📊 Breakdown by state:');
  Object.entries(breakdown).forEach(([state, count]) => {
    console.log(`   ${state}: ${count} features`);
  });
};

filterForestData();