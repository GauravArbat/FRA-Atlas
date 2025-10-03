// Data fetching utilities for FRA layers from Indian government sources

// Government data source URLs
export const DATA_SOURCES = {
  // Forest Survey of India - Forest boundaries
  FSI_FOREST_DATA: 'https://fsi.nic.in/gis-development/api/forest-boundaries',
  
  // Bhuvan ISRO - Administrative boundaries
  BHUVAN_ADMIN: 'https://bhuvan.nrsc.gov.in/api/administrative-boundaries',
  
  // Data.gov.in - State boundaries
  DATA_GOV_STATES: 'https://data.gov.in/api/datastore/resource.json?resource_id=state-boundaries',
  
  // Ministry of Tribal Affairs - FRA data
  TRIBAL_AFFAIRS_FRA: 'https://tribal.nic.in/api/fra-claims',
  
  // State Forest Departments
  MP_FOREST_DEPT: 'https://forest.mp.gov.in/api/fra-data',
  TRIPURA_FOREST: 'https://forest.tripura.gov.in/api/fra-claims',
  ODISHA_FOREST: 'https://forest.odisha.gov.in/api/fra-boundaries',
  TELANGANA_FOREST: 'https://forest.telangana.gov.in/api/fra-plots'
};

// Fetch administrative boundaries for 4 states
export const fetchAdminBoundaries = async () => {
  try {
    // In production, replace with actual API calls
    const response = await fetch(`${DATA_SOURCES.BHUVAN_ADMIN}?states=MP,TR,OD,TG`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch administrative boundaries');
    }
    
    const data = await response.json();
    return processAdminBoundaries(data);
  } catch (error) {
    console.warn('Using fallback admin boundaries data:', error);
    // Return sample data as fallback
    return import('../data/sampleFRAData').then(module => module.administrativeBoundaries);
  }
};

// Fetch forest boundaries from FSI
export const fetchForestBoundaries = async () => {
  try {
    const response = await fetch(`${DATA_SOURCES.FSI_FOREST_DATA}?states=MP,TR,OD,TG&format=geojson`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch forest boundaries');
    }
    
    const data = await response.json();
    return processForestData(data);
  } catch (error) {
    console.warn('Using fallback forest data:', error);
    return import('../data/sampleFRAData').then(module => module.forestAreas);
  }
};

// Fetch FRA claims from Ministry of Tribal Affairs
export const fetchFRAClaims = async () => {
  try {
    const response = await fetch(`${DATA_SOURCES.TRIBAL_AFFAIRS_FRA}?states=MP,TR,OD,TG`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch FRA claims');
    }
    
    const data = await response.json();
    return processFRAData(data);
  } catch (error) {
    console.warn('Using fallback FRA data:', error);
    const sampleData = await import('../data/sampleFRAData');
    return {
      granted: sampleData.fraGrantedAreas,
      potential: sampleData.fraPotentialAreas
    };
  }
};

// Fetch Patta holders data from CSV/API
export const fetchPattaHolders = async () => {
  try {
    // Try multiple state APIs
    const promises = [
      fetch(`${DATA_SOURCES.MP_FOREST_DEPT}/patta-holders`),
      fetch(`${DATA_SOURCES.TRIPURA_FOREST}/patta-data`),
      fetch(`${DATA_SOURCES.ODISHA_FOREST}/patta-records`),
      fetch(`${DATA_SOURCES.TELANGANA_FOREST}/patta-list`)
    ];
    
    const responses = await Promise.allSettled(promises);
    const validData = [];
    
    for (const response of responses) {
      if (response.status === 'fulfilled' && response.value.ok) {
        const data = await response.value.json();
        validData.push(...data);
      }
    }
    
    return processPattaData(validData);
  } catch (error) {
    console.warn('Using fallback patta holders data:', error);
    return import('../data/sampleFRAData').then(module => module.pattaHoldersData);
  }
};

// Process and standardize administrative boundaries
const processAdminBoundaries = (rawData) => {
  return {
    type: 'FeatureCollection',
    features: rawData.features.map(feature => ({
      type: 'Feature',
      properties: {
        name: feature.properties.STATE_NAME || feature.properties.name,
        type: 'state',
        population: feature.properties.POPULATION || 0,
        area: feature.properties.AREA_SQKM || 0
      },
      geometry: feature.geometry
    }))
  };
};

// Process forest data from FSI
const processForestData = (rawData) => {
  return {
    type: 'FeatureCollection',
    features: rawData.features.map(feature => ({
      type: 'Feature',
      properties: {
        name: feature.properties.FOREST_NAME || feature.properties.name,
        type: feature.properties.FOREST_TYPE || 'reserve_forest',
        area: feature.properties.AREA_HECTARES || 0,
        state: feature.properties.STATE_NAME || 'Unknown'
      },
      geometry: feature.geometry
    }))
  };
};

// Process FRA claims data
const processFRAData = (rawData) => {
  const granted = {
    type: 'FeatureCollection',
    features: rawData.filter(claim => claim.status === 'granted').map(claim => ({
      type: 'Feature',
      properties: {
        id: claim.claim_id,
        claimantName: claim.claimant_name,
        area: claim.area_hectares,
        status: 'granted',
        village: claim.village,
        district: claim.district,
        state: claim.state,
        dateGranted: claim.date_granted,
        fraType: claim.fra_type
      },
      geometry: claim.geometry
    }))
  };
  
  const potential = {
    type: 'FeatureCollection',
    features: rawData.filter(claim => claim.status === 'potential').map(claim => ({
      type: 'Feature',
      properties: {
        id: claim.claim_id,
        claimantName: claim.claimant_name,
        area: claim.area_hectares,
        status: 'potential',
        village: claim.village,
        district: claim.district,
        state: claim.state,
        dateSubmitted: claim.date_submitted,
        fraType: claim.fra_type
      },
      geometry: claim.geometry
    }))
  };
  
  return { granted, potential };
};

// Process Patta holders CSV data
const processPattaData = (rawData) => {
  return rawData.map(record => ({
    id: record.patta_id || record.id,
    ownerName: record.owner_name,
    fatherName: record.father_name,
    coordinates: [parseFloat(record.longitude), parseFloat(record.latitude)],
    village: record.village,
    district: record.district,
    state: record.state,
    area: parseFloat(record.area_hectares),
    status: record.status, // Approved, Pending, Rejected
    fraType: record.fra_type,
    dateApproved: record.date_approved,
    dateSubmitted: record.date_submitted
  }));
};

// Optimize large datasets for web display
export const optimizeGeoJSON = (geojson, maxFeatures = 1000) => {
  if (geojson.features.length <= maxFeatures) {
    return geojson;
  }
  
  // Simplify geometries and reduce features for performance
  const simplified = {
    ...geojson,
    features: geojson.features
      .slice(0, maxFeatures)
      .map(feature => ({
        ...feature,
        geometry: simplifyGeometry(feature.geometry)
      }))
  };
  
  console.warn(`Dataset reduced from ${geojson.features.length} to ${maxFeatures} features for performance`);
  return simplified;
};

// Simplify polygon geometries
const simplifyGeometry = (geometry) => {
  if (geometry.type === 'Polygon') {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map(ring => 
        ring.filter((coord, index) => index % 2 === 0) // Keep every 2nd coordinate
      )
    };
  }
  return geometry;
};

// Batch load all FRA data
export const loadAllFRAData = async () => {
  console.log('Loading FRA data from government sources...');
  
  try {
    const [adminBoundaries, forestBoundaries, fraClaims, pattaHolders] = await Promise.all([
      fetchAdminBoundaries(),
      fetchForestBoundaries(),
      fetchFRAClaims(),
      fetchPattaHolders()
    ]);
    
    return {
      adminBoundaries: optimizeGeoJSON(adminBoundaries),
      forestBoundaries: optimizeGeoJSON(forestBoundaries),
      fraGranted: optimizeGeoJSON(fraClaims.granted),
      fraPotential: optimizeGeoJSON(fraClaims.potential),
      pattaHolders: pattaHolders.slice(0, 500) // Limit points for performance
    };
  } catch (error) {
    console.error('Failed to load FRA data:', error);
    throw error;
  }
};