import React, { useEffect, useRef, useState } from 'react';
import { Box, Card, CardContent, Typography, Switch, FormControlLabel, Chip } from '@mui/material';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface AssetMapProps {
  villageData: {
    village_name: string;
    coordinates: [number, number];
    assets: {
      water_bodies: Array<{ type: string; area?: number; coordinates: [number, number]; confidence: number }>;
      agricultural_land: Array<{ type: string; area?: number; coordinates: [number, number]; confidence: number }>;
      forest_cover: Array<{ type: string; area?: number; coordinates: [number, number]; confidence: number }>;
      built_up: Array<{ type: string; coordinates: [number, number]; confidence: number }>;
    };
  };
}

const AssetVisualizationMap: React.FC<AssetMapProps> = ({ villageData }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [layerVisibility, setLayerVisibility] = useState({
    water_bodies: true,
    agricultural_land: true,
    forest_cover: true,
    built_up: true,
    satellite: true
  });

  const assetColors = {
    water_bodies: '#0000FF',       // Blue
    agricultural_land: '#FFFF00',  // Yellow
    forest_cover: '#00FF00',       // Bright Green
    built_up: '#FF00FF',           // Magenta/Pink
    secondary_forest: '#808080'    // Gray
  };

  const assetLabels = {
    water_bodies: 'Water Bodies',
    agricultural_land: 'Crop Fields',
    forest_cover: 'Rich Forest',
    built_up: 'Urban',
    secondary_forest: 'Secondary Forest'
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          },
          'satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: '© Esri'
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
      zoom: 12,
      pitch: 0,
      bearing: 0
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Add scale control
    map.current.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    map.current.on('load', () => {
      addAssetLayers();
      addVillageMarker();
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [villageData]);

  const addAssetLayers = () => {
    if (!map.current) return;

    Object.entries(villageData.assets).forEach(([assetType, assets]) => {
      if (assets.length === 0) return;

      // Create attractive visual features for each asset type
      const features = assets.map((asset, index) => {
        const [lat, lng] = asset.coordinates;
        
        return {
          type: 'Feature' as const,
          properties: {
            type: asset.type,
            area: asset.area || 0,
            confidence: asset.confidence,
            assetType: assetType,
            index: index
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [lng, lat]
          }
        };
      });

      // Add source
      map.current!.addSource(`${assetType}-source`, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: features
        }
      });

      // Add attractive circle layer with size based on area
      map.current!.addLayer({
        id: `${assetType}-circles`,
        type: 'circle',
        source: `${assetType}-source`,
        paint: {
          'circle-color': assetColors[assetType as keyof typeof assetColors],
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'area'],
            0, 15,
            5, 25,
            15, 35,
            30, 45
          ],
          'circle-opacity': 0.8,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 3
        },
        layout: {
          visibility: layerVisibility[assetType as keyof typeof layerVisibility] ? 'visible' : 'none'
        }
      });

      // Add icon symbols for visual appeal
      const assetIcons = {
        water_bodies: '💧',
        agricultural_land: '🌾',
        forest_cover: '🌲',
        built_up: '🏘️',
        secondary_forest: '🌳'
      };

      map.current!.addLayer({
        id: `${assetType}-icons`,
        type: 'symbol',
        source: `${assetType}-source`,
        layout: {
          'text-field': assetIcons[assetType as keyof typeof assetIcons] || '📍',
          'text-size': 20,
          'text-anchor': 'center',
          visibility: layerVisibility[assetType as keyof typeof layerVisibility] ? 'visible' : 'none'
        },
        paint: {
          'text-color': '#ffffff'
        }
      });



      // Add click popup for circles
      map.current!.on('click', `${assetType}-circles`, (e) => {
        if (!e.features || e.features.length === 0) return;
        
        const feature = e.features[0];
        const props = feature.properties;
        
        const popupContent = `
          <div style="padding: 8px;">
            <h4 style="margin: 0 0 8px 0; color: ${assetColors[assetType as keyof typeof assetColors]};">
              ${props.type.replace('_', ' ').toUpperCase()}
            </h4>
            ${props.area ? `<p><strong>Area:</strong> ${props.area} hectares</p>` : ''}
            <p><strong>Confidence:</strong> ${(props.confidence * 100).toFixed(1)}%</p>
            <p><strong>Type:</strong> ${assetLabels[assetType as keyof typeof assetLabels]}</p>
          </div>
        `;

        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(popupContent)
          .addTo(map.current!);
      });

      // Change cursor on hover
      map.current!.on('mouseenter', `${assetType}-circles`, () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current!.on('mouseleave', `${assetType}-circles`, () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
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

  const toggleLayer = (layerType: string) => {
    if (!map.current) return;

    const newVisibility = !layerVisibility[layerType as keyof typeof layerVisibility];
    
    setLayerVisibility(prev => ({
      ...prev,
      [layerType]: newVisibility
    }));

    const visibility = newVisibility ? 'visible' : 'none';
    
    if (layerType === 'satellite') {
      map.current.setLayoutProperty('satellite-layer', 'visibility', visibility);
    } else {
      map.current.setLayoutProperty(`${layerType}-circles`, 'visibility', visibility);
      map.current.setLayoutProperty(`${layerType}-icons`, 'visibility', visibility);
    }
  };

  const getAssetCount = (assetType: string) => {
    return villageData.assets[assetType as keyof typeof villageData.assets]?.length || 0;
  };

  return (
    <Box sx={{ height: '600px', position: 'relative' }}>
      {/* Map Container */}
      <div ref={mapContainer} style={{ width: '100%', height: '100%', borderRadius: '8px' }} />
      
      {/* Legend */}
      <Card sx={{ 
        position: 'absolute', 
        top: 16, 
        right: 16, 
        minWidth: 200,
        maxWidth: 250,
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(4px)'
      }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Land Use Classification
          </Typography>
          
          {/* Base Layer Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={layerVisibility.satellite}
                onChange={() => toggleLayer('satellite')}
                size="small"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                Satellite Imagery
              </Typography>
            }
            sx={{ mb: 1, ml: 0 }}
          />

          {/* Asset Layer Toggles */}
          {Object.entries(assetLabels).map(([assetType, label]) => (
            <Box key={assetType} sx={{ mb: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={layerVisibility[assetType as keyof typeof layerVisibility]}
                    onChange={() => toggleLayer(assetType)}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        bgcolor: assetColors[assetType as keyof typeof assetColors],
                        border: '3px solid white',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px'
                      }}
                    >
                      {{
                        water_bodies: '💧',
                        agricultural_land: '🌾',
                        forest_cover: '🌲',
                        built_up: '🏘️',
                        secondary_forest: '🌳'
                      }[assetType as keyof typeof assetColors] || '📍'}
                    </Box>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {label}
                    </Typography>
                    <Chip 
                      label={getAssetCount(assetType)} 
                      size="small" 
                      sx={{ 
                        height: 18, 
                        fontSize: '0.7rem',
                        bgcolor: assetColors[assetType as keyof typeof assetColors],
                        color: 'white'
                      }} 
                    />
                  </Box>
                }
                sx={{ ml: 0 }}
              />
            </Box>
          ))}

          {/* Scale Reference */}
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
              Polygon size = Area (hectares)
            </Typography>
            <Box sx={{ 
              width: '60px', 
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
                2 km
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
            📍 {villageData.village_name}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
            Lat: {villageData.coordinates[0].toFixed(4)}, Lng: {villageData.coordinates[1].toFixed(4)}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AssetVisualizationMap;