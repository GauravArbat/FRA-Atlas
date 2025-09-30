import React, { useEffect, useRef, useState } from 'react';
import { Box, Card, CardContent, Typography, Switch, FormControlLabel } from '@mui/material';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface SimpleLandUseMapProps {
  villageData: {
    village_name: string;
    coordinates: [number, number];
  };
}

const SimpleLandUseMap: React.FC<SimpleLandUseMapProps> = ({ villageData }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [layers, setLayers] = useState({
    water_bodies: true,
    crop_fields: true,
    rich_forest: true,
    urban: true,
    secondary_forest: true
  });

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'satellite': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256
          }
        },
        layers: [
          {
            id: 'satellite-base',
            type: 'raster',
            source: 'satellite'
          }
        ]
      },
      center: [villageData.coordinates[1], villageData.coordinates[0]],
      zoom: 11,
      pitch: 0
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      addLandUsePolygons();
      addVillageMarker();
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [villageData]);

  const addLandUsePolygons = () => {
    if (!map.current) return;

    const [lat, lng] = villageData.coordinates;

    // Create large polygon areas like in the reference image
    const landUseData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [
        // Rich Forest (Large green circle)
        {
          type: 'Feature',
          properties: { type: 'rich_forest', name: 'Rich Forest' },
          geometry: {
            type: 'Point',
            coordinates: [lng - 0.08, lat - 0.02]
          }
        },
        // Crop Fields (Yellow circle)
        {
          type: 'Feature',
          properties: { type: 'crop_fields', name: 'Crop Fields' },
          geometry: {
            type: 'Point',
            coordinates: [lng + 0.08, lat - 0.01]
          }
        },
        // Water Bodies (Blue circle)
        {
          type: 'Feature',
          properties: { type: 'water_bodies', name: 'Water Bodies' },
          geometry: {
            type: 'Point',
            coordinates: [lng - 0.03, lat - 0.01]
          }
        },
        // Urban Areas (Pink/Magenta circle)
        {
          type: 'Feature',
          properties: { type: 'urban', name: 'Urban' },
          geometry: {
            type: 'Point',
            coordinates: [lng + 0.11, lat + 0.04]
          }
        },
        // Secondary Forest (Gray circle)
        {
          type: 'Feature',
          properties: { type: 'secondary_forest', name: 'Secondary Forest' },
          geometry: {
            type: 'Point',
            coordinates: [lng + 0.01, lat + 0.06]
          }
        }
      ]
    };

    // Add source
    map.current!.addSource('landuse', {
      type: 'geojson',
      data: landUseData
    });

    // Define colors exactly like the reference image
    const colors = {
      rich_forest: '#00FF00',    // Bright Green
      crop_fields: '#FFFF00',    // Yellow
      water_bodies: '#0000FF',   // Blue
      urban: '#FF00FF',          // Magenta
      secondary_forest: '#808080' // Gray
    };

    // Add circle layers for each land use type
    Object.entries(colors).forEach(([type, color]) => {
      map.current!.addLayer({
        id: `${type}-circle`,
        type: 'circle',
        source: 'landuse',
        filter: ['==', ['get', 'type'], type],
        paint: {
          'circle-color': color,
          'circle-radius': 30,
          'circle-opacity': 0.8,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2
        },
        layout: {
          visibility: layers[type as keyof typeof layers] ? 'visible' : 'none'
        }
      });

      // Add click handler
      map.current!.on('click', `${type}-circle`, (e) => {
        if (e.features && e.features[0]) {
          const feature = e.features[0];
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="padding: 8px;">
                <h4 style="margin: 0; color: ${color};">${feature.properties?.name}</h4>
                <p style="margin: 4px 0 0 0;">Land Use Classification</p>
              </div>
            `)
            .addTo(map.current!);
        }
      });

      // Change cursor on hover
      map.current!.on('mouseenter', `${type}-circle`, () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current!.on('mouseleave', `${type}-circle`, () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    });
  };

  const addVillageMarker = () => {
    if (!map.current) return;

    new maplibregl.Marker({ color: '#FF0000', scale: 1.2 })
      .setLngLat([villageData.coordinates[1], villageData.coordinates[0]])
      .setPopup(
        new maplibregl.Popup().setHTML(`
          <div style="padding: 8px;">
            <h4 style="margin: 0;">${villageData.village_name}</h4>
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

    const newVisibility = !layers[layerType as keyof typeof layers];
    setLayers(prev => ({ ...prev, [layerType]: newVisibility }));

    const visibility = newVisibility ? 'visible' : 'none';
    map.current.setLayoutProperty(`${layerType}-circle`, 'visibility', visibility);
  };

  const layerLabels = {
    water_bodies: 'Water Bodies',
    crop_fields: 'Crop Fields', 
    rich_forest: 'Rich Forest',
    urban: 'Urban',
    secondary_forest: 'Secondary Forest'
  };

  const layerColors = {
    water_bodies: '#0000FF',
    crop_fields: '#FFFF00',
    rich_forest: '#00FF00', 
    urban: '#FF00FF',
    secondary_forest: '#808080'
  };

  return (
    <Box sx={{ height: '600px', position: 'relative' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%', borderRadius: '8px' }} />
      
      {/* Legend */}
      <Card sx={{ 
        position: 'absolute', 
        top: 16, 
        right: 16, 
        minWidth: 200,
        bgcolor: 'rgba(255, 255, 255, 0.95)'
      }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Land Use Classification
          </Typography>
          
          {Object.entries(layerLabels).map(([key, label]) => (
            <FormControlLabel
              key={key}
              control={
                <Switch
                  checked={layers[key as keyof typeof layers]}
                  onChange={() => toggleLayer(key)}
                  size="small"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      bgcolor: layerColors[key as keyof typeof layerColors],
                      border: '1px solid #333'
                    }}
                  />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    {label}
                  </Typography>
                </Box>
              }
              sx={{ mb: 1, ml: 0, display: 'block' }}
            />
          ))}

          {/* Scale */}
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <Box sx={{ 
              width: '60px', 
              height: '4px', 
              bgcolor: 'white', 
              border: '1px solid black',
              position: 'relative'
            }}>
              <Typography variant="caption" sx={{ 
                fontSize: '0.6rem', 
                position: 'absolute',
                top: '6px',
                left: 0
              }}>
                40 km
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
        bgcolor: 'rgba(255, 255, 255, 0.95)'
      }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
            📍 {villageData.village_name}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
            Imagery ©2017 TerraMetrics
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SimpleLandUseMap;