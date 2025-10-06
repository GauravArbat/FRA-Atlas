const fs = require('fs');
const path = require('path');

function verifyForestData() {
  console.log('🔍 Verifying forest data file...');
  
  const filePath = path.join(__dirname, 'backend', 'data', 'fra-states-forest-data.geojson');
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('❌ File does not exist:', filePath);
      return false;
    }
    
    console.log('✅ File exists:', filePath);
    
    // Check file size
    const stats = fs.statSync(filePath);
    console.log(`📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    // Try to parse JSON
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    console.log('✅ Valid JSON structure');
    console.log(`📍 Type: ${data.type}`);
    console.log(`🌲 Features: ${data.features?.length || 0}`);
    
    if (data.features && data.features.length > 0) {
      const firstFeature = data.features[0];
      console.log('\n🔍 First feature sample:');
      console.log(`   Name: ${firstFeature.properties?.name || 'Unnamed'}`);
      console.log(`   Type: ${firstFeature.properties?.type || 'Unknown'}`);
      console.log(`   State: ${firstFeature.properties?.state || 'Unknown'}`);
      console.log(`   Geometry: ${firstFeature.geometry?.type || 'Unknown'}`);
      
      if (firstFeature.geometry?.coordinates) {
        console.log(`   Coordinates: ${firstFeature.geometry.coordinates.length} rings`);
      }
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error verifying file:', error.message);
    return false;
  }
}

verifyForestData();