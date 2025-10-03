// Fallback if API fails
const realForestAreas = {
  type: 'FeatureCollection',
  features: [
    // Madhya Pradesh - Large forest coverage
    {
      type: 'Feature',
      properties: {
        name: 'Madhya Pradesh Forest Cover',
        type: 'Dense Forest',
        area: 77414,
        state: 'Madhya Pradesh'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [74.5, 21.5], [76.0, 21.5], [78.0, 22.0], [80.0, 22.5], [81.5, 23.0],
          [82.0, 24.0], [81.5, 25.0], [80.0, 25.5], [78.0, 25.0], [76.0, 24.5],
          [74.5, 23.5], [74.0, 22.5], [74.5, 21.5]
        ]]
      }
    },
    // Odisha - Coastal and inland forests
    {
      type: 'Feature',
      properties: {
        name: 'Odisha Forest Cover',
        type: 'Mixed Forest',
        area: 50354,
        state: 'Odisha'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [81.5, 17.5], [83.0, 17.8], [85.0, 18.5], [86.5, 19.5], [87.0, 20.5],
          [86.8, 21.5], [85.5, 22.0], [84.0, 21.8], [82.5, 21.0], [81.0, 20.0],
          [81.2, 18.5], [81.5, 17.5]
        ]]
      }
    },
    // Telangana - Deccan plateau forests
    {
      type: 'Feature',
      properties: {
        name: 'Telangana Forest Cover',
        type: 'Dry Deciduous Forest',
        area: 24295,
        state: 'Telangana'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [77.5, 16.0], [78.5, 16.2], [79.5, 16.8], [80.5, 17.5], [80.8, 18.5],
          [80.0, 19.2], [79.0, 19.5], [78.0, 19.0], [77.2, 18.0], [77.0, 17.0],
          [77.5, 16.0]
        ]]
      }
    },
    // Tripura - Dense tropical forests
    {
      type: 'Feature',
      properties: {
        name: 'Tripura Forest Cover',
        type: 'Tropical Forest',
        area: 8073,
        state: 'Tripura'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [91.1, 23.0], [91.8, 23.1], [92.2, 23.5], [92.5, 24.0], [92.3, 24.3],
          [91.9, 24.5], [91.4, 24.2], [91.0, 23.8], [91.1, 23.0]
        ]]
      }
    }
  ]
};

// Fetch real forest data from working API
export const fetchRealForestAreas = async () => {
  console.log('🌲 Fetching real forest data from API...');
  
  try {
    // Use Overpass API for actual forest data in India
    const overpassQuery = `
      [out:json][timeout:25];
      (
        way["landuse"="forest"](17,77,26,93);
        relation["landuse"="forest"](17,77,26,93);
      );
      out geom;
    `;
    
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Got real forest data from OpenStreetMap');
      
      const features = data.elements
        .filter(element => element.type === 'way' && element.geometry)
        .filter(way => {
          // Check ALL coordinates of the forest polygon are within FRA states
          return way.geometry.every(coord => {
            const lat = coord.lat;
            const lng = coord.lon;
            
            // Tighter boundaries for FRA states only
            // MP: 21.5-25.5N, 74.5-81.5E
            // Tripura: 23.1-24.4N, 91.1-92.3E  
            // Odisha: 17.8-22.3N, 81.3-87.2E
            // Telangana: 16.1-19.8N, 77.3-80.8E
            return (
              (lat >= 21.5 && lat <= 25.5 && lng >= 74.5 && lng <= 81.5) || // MP
              (lat >= 23.1 && lat <= 24.4 && lng >= 91.1 && lng <= 92.3) || // Tripura
              (lat >= 17.8 && lat <= 22.3 && lng >= 81.3 && lng <= 87.2) || // Odisha
              (lat >= 16.1 && lat <= 19.8 && lng >= 77.3 && lng <= 80.8)    // Telangana
            );
          });
        })
        .map(way => ({
          type: 'Feature',
          properties: {
            name: way.tags?.name || 'Forest Area',
            type: 'Forest',
            area: way.tags?.area || 'Unknown',
            state: 'FRA State'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [way.geometry.map(node => [node.lon, node.lat])]
          }
        }));
      
      console.log(`Found ${features.length} real forest areas`);
      
      return {
        type: 'FeatureCollection',
        features: features
      };
    }
  } catch (error) {
    console.warn('Overpass API failed:', error);
  }
  
  console.log('⚠️ API failed, no forest data available');
  return { type: 'FeatureCollection', features: [] };
};