// Fetch real state boundaries from open data sources
export const fetchRealStateBoundaries = async () => {
  const sources = [
    // India state boundaries from various sources
    'https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson',
    'https://raw.githubusercontent.com/datameet/maps/master/States/india_state.geojson',
    'https://raw.githubusercontent.com/HarshCasper/NeoAlgo/master/GeoJSON/India_States.geojson',
    'https://gist.githubusercontent.com/jbrobst/56c13bbbf9d97d187fea01ca62ea5112/raw/e388c4cae20aa53cb5090210a42ebb9b765c0a36/india_states.geojson'
  ];

  for (const url of sources) {
    try {
      console.log(`Trying to fetch boundaries from: ${url}`);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Successfully loaded real boundaries');
        
        // Filter for our 4 FRA states (including all name variations)
        const fraStates = ['Madhya Pradesh', 'Tripura', 'Odisha', 'Orissa', 'Telangana', 'Andhra Pradesh'];
        const filteredFeatures = data.features.filter(feature => {
          const stateName = feature.properties.NAME_1 || 
                           feature.properties.ST_NM || 
                           feature.properties.name || 
                           feature.properties.NAME ||
                           feature.properties.state_name ||
                           feature.properties.State;
          
          // Special handling for Telangana (might be part of old Andhra Pradesh data)
          if (stateName === 'Andhra Pradesh' && feature.properties.DISTRICT) {
            const telanganaDistricts = ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Mahbubnagar', 'Nalgonda', 'Medak', 'Rangareddy', 'Adilabad'];
            return telanganaDistricts.includes(feature.properties.DISTRICT);
          }
          
          return fraStates.includes(stateName);
        });
        
        console.log(`Found ${filteredFeatures.length} FRA states:`, filteredFeatures.map(f => f.properties.name || f.properties.NAME_1 || f.properties.ST_NM));

        return {
          type: 'FeatureCollection',
          features: filteredFeatures.map(feature => ({
            ...feature,
            properties: {
              ...feature.properties,
              name: feature.properties.NAME_1 || 
                    feature.properties.ST_NM || 
                    feature.properties.name || 
                    feature.properties.NAME,
              type: 'state'
            }
          }))
        };
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${url}:`, error);
    }
  }
  
  throw new Error('All boundary sources failed');
};

// Fetch district boundaries
export const fetchRealDistrictBoundaries = async () => {
  const sources = [
    'https://raw.githubusercontent.com/datameet/maps/master/Districts/india_district.geojson',
    'https://raw.githubusercontent.com/geohacker/india/master/district/india_district.geojson'
  ];

  for (const url of sources) {
    try {
      console.log(`Trying to fetch district boundaries from: ${url}`);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Successfully loaded real district boundaries');
        
        // Filter for districts in our 4 FRA states (including Odisha/Orissa variations)
        const fraStates = ['Madhya Pradesh', 'Tripura', 'Odisha', 'Orissa', 'Telangana'];
        const filteredFeatures = data.features.filter(feature => {
          const stateName = feature.properties.ST_NM || 
                           feature.properties.STATE || 
                           feature.properties.state_name;
          return fraStates.includes(stateName);
        });

        return {
          type: 'FeatureCollection',
          features: filteredFeatures.map(feature => ({
            ...feature,
            properties: {
              ...feature.properties,
              name: feature.properties.DISTRICT || 
                    feature.properties.district || 
                    feature.properties.name,
              state: feature.properties.ST_NM || 
                     feature.properties.STATE || 
                     feature.properties.state_name,
              type: 'district'
            }
          }))
        };
      }
    } catch (error) {
      console.warn(`Failed to fetch districts from ${url}:`, error);
    }
  }
  
  throw new Error('All district boundary sources failed');
};