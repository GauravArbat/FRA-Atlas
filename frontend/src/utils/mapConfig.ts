// Map configuration utility
export const getMapLibrary = () => {
  const token = process.env.REACT_APP_MAPBOX_TOKEN;
  
  // If no token or invalid token, use MapLibre GL JS
  if (!token || token === '' || token.includes('test-placeholder')) {
    return 'maplibre';
  }
  
  return 'mapbox';
};

export const getMapStyle = (library: 'maplibre' | 'mapbox') => {
  if (library === 'maplibre') {
    return {
      version: 8 as const,
      sources: {
        'osm': {
          type: 'raster' as const,
          tiles: [
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        }
      },
      layers: [
        {
          id: 'osm',
          type: 'raster' as const,
          source: 'osm',
          paint: { 'raster-opacity': 1 }
        }
      ]
    } as const;
  }
  
  // Mapbox style (requires valid token)
  return {
    version: 8 as const,
    sources: {
      'satellite': {
        type: 'raster' as const,
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256
      }
    },
    layers: [
      {
        id: 'satellite',
        type: 'raster' as const,
        source: 'satellite',
        paint: { 'raster-opacity': 1 }
      }
    ]
  } as const;
};
