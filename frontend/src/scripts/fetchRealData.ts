// Fetch exact external data and replace local files
export const fetchAndSaveRealData = async () => {
  console.log('🔄 Fetching real external data...');

  try {
    // Fetch state boundaries
    const boundaryUrls = [
      'https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson',
      'https://raw.githubusercontent.com/datameet/maps/master/States/india_state.geojson'
    ];

    for (const url of boundaryUrls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const fraStates = ['Madhya Pradesh', 'Tripura', 'Odisha', 'Orissa', 'Telangana'];
          const filtered = {
            ...data,
            features: data.features.filter((f: any) => {
              const name = f.properties.NAME_1 || f.properties.ST_NM || f.properties.name;
              return fraStates.includes(name);
            })
          };
          
          // Save to localStorage for immediate use
          localStorage.setItem('real_boundaries', JSON.stringify(filtered));
          console.log('✅ Real boundaries fetched and cached');
          break;
        }
      } catch (e) {
        console.warn(`Failed ${url}`);
      }
    }

    // Fetch exact forest data from multiple sources
    const forestSources = [
      'https://fsi.nic.in/api/forest-boundaries?states=MP,TR,OD,TG',
      'https://bhuvan.nrsc.gov.in/api/forest-cover',
      'https://data.gov.in/api/datastore/resource.json?resource_id=forest-cover-india'
    ];
    
    for (const url of forestSources) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const forestGeoJSON = {
            type: 'FeatureCollection',
            features: (data.features || data.data || []).map((item: any) => ({
              type: 'Feature',
              properties: {
                name: item.forest_name || item.name || 'Forest Area',
                type: item.forest_type || item.type || 'Forest',
                area: item.area_sqkm || item.area || 0,
                state: item.state || 'Unknown'
              },
              geometry: item.geometry
            }))
          };
          
          localStorage.setItem('real_forests', JSON.stringify(forestGeoJSON));
          console.log('✅ Real FSI forest data cached');
          break;
        }
      } catch (e) {
        console.warn(`Failed ${url}`);
      }
    }
    
    // Use exact same fetchRealForestAreas function
    if (!localStorage.getItem('real_forests')) {
      try {
        const { fetchRealForestAreas } = await import('../services/realForestData');
        const forestData = await fetchRealForestAreas();
        
        if (forestData && forestData.features && forestData.features.length > 0) {
          localStorage.setItem('real_forests', JSON.stringify(forestData));
          console.log('✅ Exact external forest data cached');
        }
      } catch (e) {
        console.warn('External forest data fetch failed');
      }
    }

    return true;
  } catch (error) {
    console.error('Failed to fetch real data:', error);
    return false;
  }
};