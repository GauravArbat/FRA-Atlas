import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Paper,
  Divider
} from '@mui/material';
import {
  Map as MapIcon,
  Upload,
  Download
} from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// GeoJSON Data Interface
interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    Name?: string;
    Khasra?: string;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

interface GeoJSONData {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

interface PlotLayer {
  id: string;
  name: string;
  data: GeoJSONData;
  visible: boolean;
  opacity: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  fillOpacity: number;
  strokeOpacity: number;
  style: 'fill' | 'line' | 'circle' | 'symbol';
}

interface GeoJSONPlotterProps {
  mapRef: React.RefObject<L.Map | null>;
  onDataLoaded?: (data: GeoJSONData) => void;
  onLayerAdded?: (layer: PlotLayer) => void;
}

const GeoJSONPlotter: React.FC<GeoJSONPlotterProps> = ({
  mapRef,
  onDataLoaded,
  onLayerAdded
}) => {
  const [layers, setLayers] = useState<PlotLayer[]>([]);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const leafletLayersRef = useRef<Map<string, L.GeoJSON>>(new Map());

  // Add layer to Leaflet map
  const addLayerToMap = (layer: PlotLayer) => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    
    // Remove existing layer if it exists
    const existingLayer = leafletLayersRef.current.get(layer.id);
    if (existingLayer) {
      map.removeLayer(existingLayer);
    }

    // Create new Leaflet GeoJSON layer
    const geoJsonLayer = L.geoJSON(layer.data, {
      style: {
        fillColor: layer.fillColor,
        color: layer.strokeColor,
        weight: layer.strokeWidth,
        opacity: layer.strokeOpacity,
        fillOpacity: layer.fillOpacity
      },
      onEachFeature: (feature, leafletLayer) => {
        if (feature.properties) {
          const popupContent = Object.entries(feature.properties)
            .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
            .join('<br>');
          leafletLayer.bindPopup(popupContent);
        }
      }
    });

    // Add to map if visible
    if (layer.visible) {
      geoJsonLayer.addTo(map);
    }

    // Store reference
    leafletLayersRef.current.set(layer.id, geoJsonLayer);
  };

  // Load default CFR boundary
  const loadDefaultCFRBoundary = () => {
    const defaultGeoJSON: GeoJSONData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            Name: 'Central Forest Reserve',
            Area: '1000 hectares'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [78.1, 23.0],
              [78.2, 23.0],
              [78.2, 23.1],
              [78.1, 23.1],
              [78.1, 23.0]
            ]]
          }
        }
      ]
    };

    const defaultLayer: PlotLayer = {
      id: 'default-cfr',
      name: 'CFR Boundary',
      data: defaultGeoJSON,
      visible: true,
      opacity: 1,
      fillColor: '#228B22',
      strokeColor: '#006400',
      strokeWidth: 2,
      fillOpacity: 0.3,
      strokeOpacity: 0.8,
      style: 'fill'
    };

    setLayers([defaultLayer]);
    addLayerToMap(defaultLayer);
    
    if (onDataLoaded) {
      onDataLoaded(defaultGeoJSON);
    }
    
    if (onLayerAdded) {
      onLayerAdded(defaultLayer);
    }
    
    setInfo('Default CFR boundary loaded successfully');
  };

  // Toggle layer visibility
  const toggleLayerVisibility = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !mapRef.current) return;

    const updatedLayer = { ...layer, visible: !layer.visible };
    const updatedLayers = layers.map(l => l.id === layerId ? updatedLayer : l);
    setLayers(updatedLayers);

    const leafletLayer = leafletLayersRef.current.get(layerId);
    if (leafletLayer) {
      if (updatedLayer.visible) {
        leafletLayer.addTo(mapRef.current);
      } else {
        mapRef.current.removeLayer(leafletLayer);
      }
    }
  };

  // Remove layer
  const removeLayer = (layerId: string) => {
    if (!mapRef.current) return;

    const leafletLayer = leafletLayersRef.current.get(layerId);
    if (leafletLayer) {
      mapRef.current.removeLayer(leafletLayer);
      leafletLayersRef.current.delete(layerId);
    }

    setLayers(prev => prev.filter(l => l.id !== layerId));
    setInfo('Layer removed successfully');
  };

  // Fit to bounds
  const fitToBounds = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !mapRef.current) return;

    const leafletLayer = leafletLayersRef.current.get(layerId);
    if (leafletLayer) {
      mapRef.current.fitBounds(leafletLayer.getBounds(), { padding: [20, 20] });
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        <MapIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        GeoJSON Data Plotter (Leaflet)
      </Typography>

      {info && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setInfo(null)}>
          {info}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Quick Actions
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<MapIcon />}
            onClick={loadDefaultCFRBoundary}
            size="small"
          >
            Load CFR Boundary
          </Button>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            disabled
            size="small"
          >
            Upload GeoJSON
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            disabled
            size="small"
          >
            Export Data
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Layers ({layers.length})
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {layers.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No layers loaded. Click "Load CFR Boundary" to get started.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {layers.map((layer) => (
              <Card key={layer.id} variant="outlined" sx={{ p: 1 }}>
                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {layer.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Button
                        size="small"
                        onClick={() => toggleLayerVisibility(layer.id)}
                        variant={layer.visible ? 'contained' : 'outlined'}
                      >
                        {layer.visible ? 'Hide' : 'Show'}
                      </Button>
                      <Button
                        size="small"
                        onClick={() => fitToBounds(layer.id)}
                        variant="outlined"
                      >
                        Zoom
                      </Button>
                      <Button
                        size="small"
                        onClick={() => removeLayer(layer.id)}
                        variant="outlined"
                        color="error"
                      >
                        Remove
                      </Button>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Features: {layer.data.features.length} | Style: {layer.style}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          This is a simplified Leaflet-based GeoJSON plotter. Full functionality including 
          file upload, advanced styling, and backend integration is being developed.
        </Typography>
      </Alert>
    </Box>
  );
};

export default GeoJSONPlotter;
