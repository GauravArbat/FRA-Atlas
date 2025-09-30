import React, { useEffect, useRef, useState } from 'react';
import { Box, Card, CardContent, Typography, Switch, FormControlLabel, LinearProgress } from '@mui/material';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface RealTimeMapProps {
  villageData: {
    village_name: string;
    coordinates: [number, number];
    classification_map: {
      tiles_url: string;
      map_id: string;
      token: string;
    };
    land_use_stats: {
      water_bodies: number;
      crop_fields: number;
      rich_forest: number;
      urban: number;
      other: number;
    };
  };
}

const RealTimeLandUseMap: React.FC<RealTimeMapProps> = ({ villageData }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [showClassification, setShowClassification] = useState(true);
  const [loading, setLoading] = useState(false);

  const landUseColors = {
    water_bodies: '#0000FF',    // Blue
    crop_fields: '#FFFF00',     // Yellow
    rich_forest: '#00FF00',     // Green
    urban: '#FF00FF',           // Magenta
    secondary_forest: '#808080', // Gray
    other: '#8B4513'            // Brown
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map with satellite base layer
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: '© Esri, Maxar, Earthstar Geographics'
          }
        },
        layers: [
          {
            id: 'satellite-layer',
            type: 'raster',
            source: 'satellite',
            layout: { visibility: 'visible' }
          }
        ]
      },
      center: [villageData.coordinates[1], villageData.coordinates[0]], // [lng, lat]
      zoom: 13,
      pitch: 0,
      bearing: 0
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    map.current.on('load', () => {
      addClassificationLayer();
      addVillageMarker();
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [villageData]);

  const addClassificationLayer = () => {
    if (!map.current) return;

    // Add land use classification overlay
    map.current.addSource('classification', {
      type: 'raster',
      tiles: [villageData.classification_map.tiles_url],
      tileSize: 256
    });

    map.current.addLayer({
      id: 'classification-layer',
      type: 'raster',
      source: 'classification',
      paint: {
        'raster-opacity': 0.7
      },
      layout: {
        visibility: showClassification ? 'visible' : 'none'
      }
    });
  };

  const addVillageMarker = () => {
    if (!map.current) return;

    // Add village center marker
    new maplibregl.Marker({
      color: '#FF0000',
      scale: 1.2
    })
      .setLngLat([villageData.coordinates[1], villageData.coordinates[0]])
      .setPopup(
        new maplibregl.Popup().setHTML(`
          <div style="padding: 8px;">
            <h4 style="margin: 0; color: #1976d2;">${villageData.village_name}</h4>
            <p style="margin: 4px 0 0 0; font-size: 12px;">
              ${villageData.coordinates[0].toFixed(4)}, ${villageData.coordinates[1].toFixed(4)}
            </p>
          </div>
        `)
      )
      .addTo(map.current);
  };

  const toggleClassification = () => {
    if (!map.current) return;

    const newVisibility = !showClassification;
    setShowClassification(newVisibility);

    map.current.setLayoutProperty(
      'classification-layer',
      'visibility',
      newVisibility ? 'visible' : 'none'
    );
  };

  const getLandUsePercentage = (landUseType: string) => {
    return villageData.land_use_stats[landUseType as keyof typeof villageData.land_use_stats] || 0;
  };

  return (
    <Box sx={{ height: '600px', position: 'relative' }}>
      {/* Map Container */}
      <div ref={mapContainer} style={{ width: '100%', height: '100%', borderRadius: '8px' }} />
      
      {/* Land Use Classification Legend */}
      <Card sx={{ 
        position: 'absolute', 
        top: 16, 
        right: 16, 
        minWidth: 220,
        maxWidth: 280,
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(4px)'
      }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Land Use Classification
          </Typography>
          
          {/* Classification Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={showClassification}
                onChange={toggleClassification}
                size="small"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                Show Classification Overlay
              </Typography>
            }
            sx={{ mb: 2, ml: 0 }}
          />

          {/* Land Use Statistics */}
          {Object.entries(villageData.land_use_stats).map(([landUse, percentage]) => {
            if (percentage === 0) return null;
            
            const displayName = landUse.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            const color = landUseColors[landUse as keyof typeof landUseColors] || '#666666';
            
            return (
              <Box key={landUse} sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        bgcolor: color,
                        border: '1px solid #333'
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {displayName}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    {percentage.toFixed(1)}%
                  </Typography>
                </Box>
                
                {/* Progress bar */}
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'rgba(0,0,0,0.1)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: color,
                      borderRadius: 3
                    }
                  }}
                />
              </Box>
            );
          })}

          {/* Scale Reference */}
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
              Real-time satellite classification
            </Typography>
            <Box sx={{ 
              width: '80px', 
              height: '4px', 
              bgcolor: 'white', 
              border: '1px solid black',
              mt: 1,
              position: 'relative'
            }}>
              <Typography variant="caption" sx={{ 
                fontSize: '0.6rem', 
                position: 'absolute',
                top: '6px',
                left: 0
              }}>
                5 km
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Village Info */}
      <Card sx={{ 
        position: 'absolute', 
        bottom: 16, 
        left: 16,
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(4px)'
      }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 1 }}>
            🛰️ {villageData.village_name}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
            Lat: {villageData.coordinates[0].toFixed(4)}, Lng: {villageData.coordinates[1].toFixed(4)}
          </Typography>
          <br />
          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
            Real-time Sentinel-2 Analysis
          </Typography>
        </CardContent>
      </Card>

      {/* Loading Overlay */}
      {loading && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px'
        }}>
          <Card>
            <CardContent>
              <Typography variant="body2" gutterBottom>
                Processing satellite imagery...
              </Typography>
              <LinearProgress />
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default RealTimeLandUseMap;