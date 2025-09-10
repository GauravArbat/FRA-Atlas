import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Map,
  Upload,
  Download,
  Visibility,
  VisibilityOff,
  Edit,
  Delete,
  Add,
  Save,
  Cancel,
  Info,
  Warning,
  CheckCircle,
  Layers,
  Palette,
  Opacity,
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  FileUpload,
  FileDownload,
  DataObject,
  Map as MapIcon,
  Forest,
  LocationOn,
  ExpandMore,
  PlayArrow,
  Stop,
  Refresh
} from '@mui/icons-material';
import * as maplibregl from 'maplibre-gl';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { geojsonPlotAPI } from '../services/api';

// GeoJSON Data Interface - Compatible with Mapbox types
interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    Name?: string;
    Khasra?: string;
    [key: string]: any;
  };
  geometry: {
    type: 'Polygon' | 'Point' | 'LineString' | 'MultiPolygon';
    coordinates: number[][][] | number[][] | number[][][][];
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
  mapRef: React.RefObject<maplibregl.Map | mapboxgl.Map | null>;
  onDataLoaded?: (data: GeoJSONData) => void;
  onLayerAdded?: (layer: PlotLayer) => void;
}

const GeoJSONPlotter: React.FC<GeoJSONPlotterProps> = ({
  mapRef,
  onDataLoaded,
  onLayerAdded
}) => {
  const [layers, setLayers] = useState<PlotLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');
  const [importName, setImportName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [showStyleDialog, setShowStyleDialog] = useState(false);
  const [editingLayer, setEditingLayer] = useState<PlotLayer | null>(null);

  // Default CFR boundary data from user
  const defaultCFRData: GeoJSONData = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          Name: 'Dharam Tekri Forest CFR',
          Khasra: 'Forest Compartment 12 & 13'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [78.1000, 23.1000],
            [78.1500, 23.1000],
            [78.1500, 23.0500],
            [78.1000, 23.0500],
            [78.1000, 23.1000]
          ]]
        }
      }
    ]
  } as any;

  // Load default CFR data on component mount
  useEffect(() => {
    // Wait for map to be ready before loading data
    const timer = setTimeout(() => {
      loadDefaultData();
      loadUserLayers();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Retry adding layers to map when map becomes ready
  useEffect(() => {
    if (mapRef.current && mapRef.current.getSource && layers.length > 0) {
      layers.forEach(layer => {
        addLayerToMap(layer);
      });
    }
  }, [mapRef.current, layers]);

  // Load user's saved layers from backend
  const loadUserLayers = async () => {
    try {
      const response = await geojsonPlotAPI.getLayers();
      const userLayers = response.data.data;
      
      // Add user layers to map
      userLayers.forEach((layer: any) => {
        const plotLayer: PlotLayer = {
          id: layer.id,
          name: layer.name,
          data: layer.data as any,
          visible: layer.style.visible,
          opacity: layer.style.fillOpacity || 0.8,
          fillColor: layer.style.fillColor || '#2196f3',
          strokeColor: layer.style.strokeColor || '#1976d2',
          strokeWidth: layer.style.strokeWidth || 2,
          fillOpacity: layer.style.fillOpacity || 0.6,
          strokeOpacity: layer.style.strokeOpacity || 1.0,
          style: 'fill'
        };
        
        addLayerToMap(plotLayer);
      });
      
      setLayers(prev => [...prev, ...userLayers.map((layer: any) => ({
        id: layer.id,
        name: layer.name,
        data: layer.data as any,
        visible: layer.style.visible,
        opacity: layer.style.fillOpacity || 0.8,
        fillColor: layer.style.fillColor || '#2196f3',
        strokeColor: layer.style.strokeColor || '#1976d2',
        strokeWidth: layer.style.strokeWidth || 2,
        fillOpacity: layer.style.fillOpacity || 0.6,
        strokeOpacity: layer.style.strokeOpacity || 1.0,
        style: 'fill'
      }))]);
      
    } catch (error) {
      console.error('Error loading user layers:', error);
      setError('Failed to load saved layers');
    }
  };

  const loadDefaultData = () => {
    const defaultLayer: PlotLayer = {
      id: 'cfr-default',
      name: 'Dharam Tekri Forest CFR',
      data: defaultCFRData as any,
      visible: true,
      opacity: 0.8,
      fillColor: '#2e7d32',
      strokeColor: '#1b5e20',
      strokeWidth: 2,
      fillOpacity: 0.6,
      strokeOpacity: 1.0,
      style: 'fill'
    };

    // Add to layers list first
    setLayers([defaultLayer]);
    setInfo('Default CFR boundary loaded successfully');
    
    // Try to add to map if ready
    if (mapRef.current && mapRef.current.getSource) {
      addLayerToMap(defaultLayer);
    } else {
      // Map not ready, layer will be added when map loads
    }
  };

  const addLayerToMap = (layer: PlotLayer) => {
    if (!mapRef.current || !mapRef.current.getSource) {
      // Map not ready for layer addition
      return;
    }

    const map = mapRef.current;
    
    // Check if style is loaded before adding layers
    if (!map.isStyleLoaded()) {
      // Suppress console message for style loading
      map.on('styledata', () => {
        if (map.isStyleLoaded()) {
          addLayerToMap(layer);
        }
      });
      return;
    }

    const sourceId = `plot-${layer.id}`;
    const fillLayerId = `${sourceId}-fill`;
    const strokeLayerId = `${sourceId}-stroke`;

    // Add or update source
    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as any).setData(layer.data as any);
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        data: layer.data as any
      });
    }

    // Remove existing layers
    if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
    if (map.getLayer(strokeLayerId)) map.removeLayer(strokeLayerId);

    // Add fill layer
    if (layer.style === 'fill' || layer.style === 'circle') {
      map.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': layer.fillColor,
          'fill-opacity': layer.fillOpacity * layer.opacity
        },
        layout: {
          visibility: layer.visible ? 'visible' : 'none'
        }
      });
    }

    // Add stroke layer
    if (layer.style === 'fill' || layer.style === 'line') {
      map.addLayer({
        id: strokeLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': layer.strokeColor,
          'line-width': layer.strokeWidth,
          'line-opacity': layer.strokeOpacity * layer.opacity
        },
        layout: {
          visibility: layer.visible ? 'visible' : 'none'
        }
      });
    }

    // Add circle layer for points
    if (layer.style === 'circle') {
      map.addLayer({
        id: `${sourceId}-circle`,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-color': layer.fillColor,
          'circle-radius': 6,
          'circle-opacity': layer.fillOpacity * layer.opacity
        },
        layout: {
          visibility: layer.visible ? 'visible' : 'none'
        }
      });
    }

    onLayerAdded?.(layer);
  };

  const handleImportData = async () => {
    try {
      const data = JSON.parse(importData);
      
      if (!data.type || !data.features) {
        throw new Error('Invalid GeoJSON format');
      }

      // Validate data with backend
      const validationResponse = await geojsonPlotAPI.validateData(data);
      if (!validationResponse.data.data.isValid) {
        setError(`Validation failed: ${validationResponse.data.data.errors.join(', ')}`);
        return;
      }

      // Save layer to backend
      const saveResponse = await geojsonPlotAPI.saveLayer(
        importName || 'Imported Data',
        data,
        {
          fillColor: '#2196f3',
          strokeColor: '#1976d2',
          strokeWidth: 2,
          fillOpacity: 0.6,
          strokeOpacity: 1.0,
          visible: true
        }
      );

      const savedLayer = saveResponse.data.data;
      const newLayer: PlotLayer = {
        id: savedLayer.id,
        name: savedLayer.name,
        data: savedLayer.data as any,
        visible: savedLayer.style.visible,
        opacity: savedLayer.style.fillOpacity,
        fillColor: savedLayer.style.fillColor,
        strokeColor: savedLayer.style.strokeColor,
        strokeWidth: savedLayer.style.strokeWidth,
        fillOpacity: savedLayer.style.fillOpacity,
        strokeOpacity: savedLayer.style.strokeOpacity,
        style: 'fill'
      };

      addLayerToMap(newLayer);
      setLayers(prev => [...prev, newLayer]);
      setShowImportDialog(false);
      setImportData('');
      setImportName('');
      setError(null);
      setInfo('Data imported and saved successfully');
      onDataLoaded?.(data as GeoJSONData);

    } catch (err) {
      console.error('Import error:', err);
      setError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const toggleLayerVisibility = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !mapRef.current || !mapRef.current.getSource) return;

    const updatedLayer = { ...layer, visible: !layer.visible };
    const updatedLayers = layers.map(l => l.id === layerId ? updatedLayer : l);
    
    setLayers(updatedLayers);
    addLayerToMap(updatedLayer);
  };

  const updateLayerStyle = async (layerId: string, updates: Partial<PlotLayer>) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    try {
      // Update style in backend
      await geojsonPlotAPI.updateLayerStyle(layerId, {
        fillColor: updates.fillColor || layer.fillColor,
        strokeColor: updates.strokeColor || layer.strokeColor,
        strokeWidth: updates.strokeWidth || layer.strokeWidth,
        fillOpacity: updates.fillOpacity || layer.fillOpacity,
        strokeOpacity: updates.strokeOpacity || layer.strokeOpacity,
        visible: updates.visible !== undefined ? updates.visible : layer.visible
      });

      const updatedLayer = { ...layer, ...updates };
      const updatedLayers = layers.map(l => l.id === layerId ? updatedLayer : l);
      
      setLayers(updatedLayers);
      addLayerToMap(updatedLayer);
      setInfo('Layer style updated successfully');

    } catch (error) {
      console.error('Error updating layer style:', error);
      setError('Failed to update layer style');
    }
  };

  const removeLayer = async (layerId: string) => {
    if (!mapRef.current) return;

    try {
      // Remove from backend
      await geojsonPlotAPI.deleteLayer(layerId);

      const map = mapRef.current;
      const sourceId = `plot-${layerId}`;
      const fillLayerId = `${sourceId}-fill`;
      const strokeLayerId = `${sourceId}-stroke`;
      const circleLayerId = `${sourceId}-circle`;

      // Remove layers from map
      if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
      if (map.getLayer(strokeLayerId)) map.removeLayer(strokeLayerId);
      if (map.getLayer(circleLayerId)) map.removeLayer(circleLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      setLayers(prev => prev.filter(l => l.id !== layerId));
      setInfo('Layer removed successfully');

    } catch (error) {
      console.error('Error removing layer:', error);
      setError('Failed to remove layer');
    }
  };

  const fitToBounds = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !mapRef.current || !mapRef.current.fitBounds) return;

    const map = mapRef.current;
    const bounds = new (maplibregl.LngLatBounds || mapboxgl.LngLatBounds)();

    layer.data.features.forEach(feature => {
      if (feature.geometry.type === 'Polygon') {
        feature.geometry.coordinates[0].forEach(coord => {
          bounds.extend([coord[0], coord[1]]);
        });
      } else if (feature.geometry.type === 'Point') {
        bounds.extend([feature.geometry.coordinates[0], feature.geometry.coordinates[1]]);
      }
    });

    map.fitBounds(bounds, { padding: 50 });
  };

  const exportLayer = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    const dataStr = JSON.stringify(layer.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${layer.name}.geojson`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const steps = [
    'Import Data',
    'Configure Style',
    'Add to Map',
    'Complete'
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MapIcon color="primary" />
            GeoJSON Data Plotter
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<FileUpload />}
              onClick={() => setShowImportDialog(true)}
            >
              Import Data
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadDefaultData}
            >
              Load Default CFR
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}
      {info && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setInfo(null)}>
          <AlertTitle>Success</AlertTitle>
          {info}
        </Alert>
      )}

      {/* Layers List */}
      <Card sx={{ flex: 1, overflow: 'hidden' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Layers color="primary" />
            Plot Layers ({layers.length})
          </Typography>
          
          {layers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <MapIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No layers loaded. Import data or load default CFR boundary.
              </Typography>
            </Box>
          ) : (
            <List>
              {layers.map((layer) => (
                <ListItem
                  key={layer.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: selectedLayer === layer.id ? 'action.selected' : 'background.paper'
                  }}
                >
                  <ListItemIcon>
                    <Map color={layer.visible ? 'primary' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={layer.name}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip
                          label={`${layer.data.features.length} features`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={layer.style}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Toggle Visibility">
                      <IconButton
                        size="small"
                        onClick={() => toggleLayerVisibility(layer.id)}
                      >
                        {layer.visible ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Fit to Bounds">
                      <IconButton
                        size="small"
                        onClick={() => fitToBounds(layer.id)}
                      >
                        <CenterFocusStrong />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Style">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingLayer(layer);
                          setShowStyleDialog(true);
                        }}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Export">
                      <IconButton
                        size="small"
                        onClick={() => exportLayer(layer.id)}
                      >
                        <FileDownload />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeLayer(layer.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Import GeoJSON Data</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Layer Name"
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                placeholder="Enter a name for this layer"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={10}
                label="GeoJSON Data"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste your GeoJSON data here..."
                helperText="Paste valid GeoJSON data in the text area above"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowImportDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleImportData}
            disabled={!importData.trim()}
          >
            Import Data
          </Button>
        </DialogActions>
      </Dialog>

      {/* Style Dialog */}
      <Dialog
        open={showStyleDialog}
        onClose={() => setShowStyleDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Layer Style</DialogTitle>
        <DialogContent>
          {editingLayer && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Layer Name"
                  value={editingLayer.name}
                  onChange={(e) => setEditingLayer({...editingLayer, name: e.target.value})}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Fill Color"
                  type="color"
                  value={editingLayer.fillColor}
                  onChange={(e) => setEditingLayer({...editingLayer, fillColor: e.target.value})}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Stroke Color"
                  type="color"
                  value={editingLayer.strokeColor}
                  onChange={(e) => setEditingLayer({...editingLayer, strokeColor: e.target.value})}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography gutterBottom>Fill Opacity</Typography>
                <Slider
                  value={editingLayer.fillOpacity}
                  onChange={(_, value) => setEditingLayer({...editingLayer, fillOpacity: value as number})}
                  min={0}
                  max={1}
                  step={0.1}
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid item xs={6}>
                <Typography gutterBottom>Stroke Width</Typography>
                <Slider
                  value={editingLayer.strokeWidth}
                  onChange={(_, value) => setEditingLayer({...editingLayer, strokeWidth: value as number})}
                  min={1}
                  max={10}
                  step={1}
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography gutterBottom>Overall Opacity</Typography>
                <Slider
                  value={editingLayer.opacity}
                  onChange={(_, value) => setEditingLayer({...editingLayer, opacity: value as number})}
                  min={0}
                  max={1}
                  step={0.1}
                  valueLabelDisplay="auto"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStyleDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (editingLayer) {
                updateLayerStyle(editingLayer.id, editingLayer);
                setShowStyleDialog(false);
              }
            }}
          >
            Apply Style
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GeoJSONPlotter;
