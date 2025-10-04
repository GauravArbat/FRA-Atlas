// Extract all external data and save to local GeoJSON files
const fs = require('fs');
const path = require('path');

const fetchData = async (url) => {
  try {
    const response = await fetch(url);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn(`Failed to fetch from ${url}:`, error.message);
  }
  return null;
};

const saveGeoJSON = (data, filename) => {
  const filePath = path.join(__dirname, '../../public/data', filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✅ Saved ${filename} (${data.features?.length || 0} features)`);
};

const extractAllData = async () => {
  console.log('🔄 Extracting data from all external sources...');

  // 1. Forest Survey of India
  console.log('\n📍 Fetching FSI Forest Boundaries...');
  const fsiData = await fetchData('https://fsi.nic.in/api/forest-boundaries?states=MP,TR,OD,TG');
  if (fsiData) {
    const fsiGeoJSON = {
      type: 'FeatureCollection',
      features: (fsiData.features || fsiData.data || []).map(item => ({
        type: 'Feature',
        properties: {
          name: item.forest_name || item.name || 'FSI Forest Area',
          type: item.forest_type || 'Forest',
          area: item.area_sqkm || item.area || 0,
          state: item.state || 'Unknown',
          source: 'FSI'
        },
        geometry: item.geometry
      }))
    };
    saveGeoJSON(fsiGeoJSON, 'fsi-forest-boundaries.geojson');
  }

  // 2. ISRO Bhuvan Forest Cover
  console.log('\n🛰️ Fetching ISRO Bhuvan Forest Cover...');
  const bhuvanData = await fetchData('https://bhuvan.nrsc.gov.in/api/forest-cover');
  if (bhuvanData) {
    const bhuvanGeoJSON = {
      type: 'FeatureCollection',
      features: (bhuvanData.features || bhuvanData.data || []).map(item => ({
        type: 'Feature',
        properties: {
          name: item.name || 'Bhuvan Forest Area',
          type: item.forest_type || item.type || 'Forest Cover',
          area: item.area || 0,
          state: item.state || 'Unknown',
          source: 'ISRO Bhuvan'
        },
        geometry: item.geometry
      }))
    };
    saveGeoJSON(bhuvanGeoJSON, 'bhuvan-forest-cover.geojson');
  }

  // 3. Government Open Data Portal
  console.log('\n🏛️ Fetching Government Open Data...');
  const govData = await fetchData('https://data.gov.in/api/datastore/resource.json?resource_id=forest-cover-india');
  if (govData) {
    const govGeoJSON = {
      type: 'FeatureCollection',
      features: (govData.records || govData.data || []).map(item => ({
        type: 'Feature',
        properties: {
          name: item.forest_name || item.name || 'Government Forest Area',
          type: item.forest_type || 'Forest',
          area: item.area_sqkm || item.area || 0,
          state: item.state || item.state_name || 'Unknown',
          source: 'Government Open Data'
        },
        geometry: item.geometry || {
          type: 'Point',
          coordinates: [item.longitude || 0, item.latitude || 0]
        }
      }))
    };
    saveGeoJSON(govGeoJSON, 'government-forest-data.geojson');
  }

  // 4. OpenStreetMap Overpass API
  console.log('\n🗺️ Fetching OSM Forest Data...');
  const overpassQuery = `
    [out:json][timeout:60];
    (
      way["landuse"="forest"](bbox:16,74,26,93);
      way["natural"="wood"](bbox:16,74,26,93);
      relation["landuse"="forest"](bbox:16,74,26,93);
      relation["natural"="wood"](bbox:16,74,26,93);
    );
    out geom;
  `;
  
  const osmData = await fetchData(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`);
  if (osmData) {
    const osmGeoJSON = {
      type: 'FeatureCollection',
      features: osmData.elements
        .filter(e => (e.type === 'way' || e.type === 'relation') && e.geometry)
        .map(element => ({
          type: 'Feature',
          properties: {
            name: element.tags?.name || `${element.tags?.landuse || element.tags?.natural} Area`,
            type: element.tags?.landuse === 'forest' ? 'Forest' : 'Wood',
            area: element.tags?.area || 'Unknown',
            osm_id: element.id,
            source: 'OpenStreetMap'
          },
          geometry: {
            type: 'Polygon',
            coordinates: element.type === 'way' 
              ? [element.geometry.map(node => [node.lon, node.lat])]
              : element.members?.[0]?.geometry ? [element.members[0].geometry.map(node => [node.lon, node.lat])] : []
          }
        }))
        .filter(f => f.geometry.coordinates[0]?.length > 0)
    };
    saveGeoJSON(osmGeoJSON, 'osm-forest-data.geojson');
  }

  // 5. Create Combined Forest Data
  console.log('\n🌲 Creating combined forest dataset...');
  const combinedFeatures = [];
  
  // Load all created files and combine
  const files = ['fsi-forest-boundaries.geojson', 'bhuvan-forest-cover.geojson', 'government-forest-data.geojson', 'osm-forest-data.geojson'];
  
  files.forEach(filename => {
    try {
      const filePath = path.join(__dirname, '../../public/data', filename);
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        combinedFeatures.push(...data.features);
      }
    } catch (e) {
      console.warn(`Failed to read ${filename}`);
    }
  });

  const combinedGeoJSON = {
    type: 'FeatureCollection',
    features: combinedFeatures
  };
  
  saveGeoJSON(combinedGeoJSON, 'combined-forest-data.geojson');

  console.log(`\n✅ Extraction complete! Total features: ${combinedFeatures.length}`);
  console.log('📁 Files saved in /public/data/');
};

// Run extraction
extractAllData().catch(console.error);