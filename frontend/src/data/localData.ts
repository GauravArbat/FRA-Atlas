// Local static data to avoid external API calls
export const LOCAL_FRA_DATA = {
  fraGranted: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          id: 'FRA_G_001',
          claimantName: 'Ramsingh Gond',
          area: 2.5,
          status: 'granted',
          village: 'Khairlanji',
          district: 'Bhopal',
          state: 'Madhya Pradesh',
          dateGranted: '2024-01-15'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[80.1847, 21.8047], [80.1857, 21.8047], [80.1857, 21.8057], [80.1847, 21.8057], [80.1847, 21.8047]]]
        }
      },
      {
        type: 'Feature',
        properties: {
          id: 'FRA_G_002',
          claimantName: 'Arjun Santal',
          area: 3.2,
          status: 'granted',
          village: 'Baripada',
          district: 'Cuttack',
          state: 'Odisha',
          dateGranted: '2024-01-10'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[86.7350, 21.9287], [86.7360, 21.9287], [86.7360, 21.9297], [86.7350, 21.9297], [86.7350, 21.9287]]]
        }
      }
    ]
  },
  fraPotential: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          id: 'FRA_P_001',
          claimantName: 'Kokborok Debbarma',
          area: 1.8,
          status: 'potential',
          village: 'Gandacherra',
          district: 'West Tripura',
          state: 'Tripura',
          dateSubmitted: '2024-01-20'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[91.8624, 23.8372], [91.8634, 23.8372], [91.8634, 23.8382], [91.8624, 23.8382], [91.8624, 23.8372]]]
        }
      }
    ]
  },
  boundaries: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Madhya Pradesh', type: 'state' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[74.0, 21.0], [82.0, 21.0], [82.0, 26.0], [74.0, 26.0], [74.0, 21.0]]]
        }
      },
      {
        type: 'Feature',
        properties: { name: 'Tripura', type: 'state' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[91.1, 23.0], [92.3, 23.0], [92.3, 24.4], [91.1, 24.4], [91.1, 23.0]]]
        }
      }
    ]
  },
  forestAreas: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Kanha National Park', type: 'national_park', area: 940, state: 'Madhya Pradesh' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[80.6, 22.2], [80.8, 22.2], [80.8, 22.4], [80.6, 22.4], [80.6, 22.2]]]
        }
      }
    ]
  }
};

// Cache management
const CACHE_KEY = 'fra_data_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const getCachedData = () => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_EXPIRY) {
      return data;
    }
  }
  return null;
};

export const setCachedData = (data: any) => {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
};

export const loadLocalFRAData = () => {
  const cached = getCachedData();
  return cached || LOCAL_FRA_DATA;
};