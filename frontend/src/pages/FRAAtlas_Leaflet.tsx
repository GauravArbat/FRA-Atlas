import React, { useEffect, useRef, useState } from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
  Button, 
  Chip, 
  Paper, 
  Alert, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Tooltip,
  Fab,
  Badge,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Tabs,
  Tab,
  Drawer,
  Snackbar,
  AlertTitle
} from '@mui/material';
import {
  Satellite,
  Terrain,
  Layers,
  Search,
  Upload,
  Download,
  Share,
  Settings,
  MyLocation,
  PhotoCamera,
  TextFields,
  LocationOn,
  Close,
  Refresh,
  FilterList,
  Map as MapIcon,
  Timeline,
  Analytics,
  Assessment,
  TrendingUp,
  Info,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface FRAData {
  id: string;
  claimantName: string;
  area: number;
  status: 'granted' | 'potential';
  coordinates: [number, number][];
  village: string;
  district: string;
  state: string;
  dateSubmitted: string;
  surveyNumber?: string;
}

const FRAAtlas: React.FC = () => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [currentMapStyle, setCurrentMapStyle] = useState<'satellite' | 'terrain' | 'osm'>('satellite');
  const [fraData, setFraData] = useState<FRAData[]>([]);
  const [filteredData, setFilteredData] = useState<FRAData[]>([]);
  const [selectedFilters, setSelectedFilters] = useState({
    status: 'all',
    district: 'all',
    state: 'all'
  });
  
  // Layer visibility states
  const [layerVisibility, setLayerVisibility] = useState({
    fraGranted: true,
    fraPotential: true,
    boundaries: false,
    roads: false,
    waterBodies: false,
    forests: true
  });

  // OCR and NER states
  const [showOCRDialog, setShowOCRDialog] = useState(false);
  const [showNERDialog, setShowNERDialog] = useState(false);
  const [ocrResults, setOcrResults] = useState<any>(null);
  const [nerResults, setNerResults] = useState<any>(null);
  const [processingOCR, setProcessingOCR] = useState(false);
  const [processingNER, setProcessingNER] = useState(false);

  // Initialize map
  useEffect(() => {
    if (containerRef.current && !mapRef.current) {
      // Initialize map with satellite imagery
      const map = L.map(containerRef.current, {
        center: [19.08, 73.86], // Mumbai coordinates
        zoom: 11,
        zoomControl: false,
        attributionControl: true
      });

      // Add satellite imagery layer
      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
        maxZoom: 19
      });

      // Add labels overlay
      const labelsLayer = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxZoom: 19
      });

      satelliteLayer.addTo(map);
      labelsLayer.addTo(map);

      // Add zoom control to top-left
      L.control.zoom({ position: 'topleft' }).addTo(map);

      // Initialize drawing controls
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnItemsRef.current = drawnItems;

      const drawControl = new L.Control.Draw({
        position: 'topleft',
        draw: {
          polygon: {
            allowIntersection: false,
            drawError: {
              color: '#e1e100',
              message: '<strong>Error:</strong> Shape edges cannot cross!'
            },
            shapeOptions: {
              color: '#2196f3',
              weight: 3,
              fillOpacity: 0.2
            }
          },
          rectangle: {
            shapeOptions: {
              color: '#2196f3',
              weight: 3,
              fillOpacity: 0.2
            }
          },
          circle: false,
          circlemarker: false,
          marker: {
            icon: L.divIcon({
              className: 'leaflet-div-icon',
              html: '<div style="background-color: #2196f3; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })
          },
          polyline: {
            shapeOptions: {
              color: '#2196f3',
              weight: 3
            }
          }
        },
        edit: {
          featureGroup: drawnItems,
          remove: true
        }
      });

      map.addControl(drawControl);
      drawControlRef.current = drawControl;

      // Handle drawing events
      map.on(L.Draw.Event.CREATED, (event: any) => {
        const layer = event.layer;
        drawnItems.addLayer(layer);
        
        if (event.layerType === 'polygon' || event.layerType === 'rectangle') {
          const area = L.GeometryUtil ? L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]) : 0;
          const areaInHectares = (area / 10000).toFixed(2);
          layer.bindPopup(`Area: ${areaInHectares} hectares`).openPopup();
        }
      });

      mapRef.current = map;
      setMapLoaded(true);
      setLoading(false);

      // Load FRA data
      loadFRAData();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Load FRA data
  const loadFRAData = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API endpoint
      const mockData: FRAData[] = [
        {
          id: '1',
          claimantName: 'Ramesh Kumar',
          area: 2.5,
          status: 'granted',
          coordinates: [[19.0760, 73.8777], [19.0770, 73.8777], [19.0770, 73.8787], [19.0760, 73.8787]],
          village: 'Andheri',
          district: 'Mumbai',
          state: 'Maharashtra',
          dateSubmitted: '2023-01-15',
          surveyNumber: 'MH001'
        },
        {
          id: '2',
          claimantName: 'Sunita Devi',
          area: 1.8,
          status: 'potential',
          coordinates: [[19.0800, 73.8800], [19.0810, 73.8800], [19.0810, 73.8810], [19.0800, 73.8810]],
          village: 'Bandra',
          district: 'Mumbai',
          state: 'Maharashtra',
          dateSubmitted: '2023-02-20',
          surveyNumber: 'MH002'
        }
      ];
      
      setFraData(mockData);
      setFilteredData(mockData);
      addFRALayersToMap(mockData);
    } catch (error) {
      setError('Failed to load FRA data');
      console.error('Error loading FRA data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add FRA layers to map
  const addFRALayersToMap = (data: FRAData[]) => {
    if (!mapRef.current) return;

    data.forEach(item => {
      const coordinates = item.coordinates.map(coord => [coord[0], coord[1]] as [number, number]);
      
      const polygon = L.polygon(coordinates, {
        color: item.status === 'granted' ? '#1b5e20' : '#ff6f00',
        fillColor: item.status === 'granted' ? '#2e7d32' : '#ff9800',
        fillOpacity: item.status === 'granted' ? 0.35 : 0.25,
        weight: 2
      });

      polygon.bindPopup(`
        <div style="min-width: 200px;">
          <h4>${item.claimantName}</h4>
          <p><strong>Status:</strong> ${item.status}</p>
          <p><strong>Area:</strong> ${item.area} hectares</p>
          <p><strong>Village:</strong> ${item.village}</p>
          <p><strong>District:</strong> ${item.district}</p>
          <p><strong>Survey No:</strong> ${item.surveyNumber || 'N/A'}</p>
          <p><strong>Date:</strong> ${new Date(item.dateSubmitted).toLocaleDateString()}</p>
        </div>
      `);

      polygon.addTo(mapRef.current!);
    });
  };

  // Change map style
  const changeMapStyle = (style: 'satellite' | 'terrain' | 'osm') => {
    if (!mapRef.current) return;

    // Remove existing tile layers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapRef.current!.removeLayer(layer);
      }
    });

    let baseLayer: L.TileLayer;
    let labelsLayer: L.TileLayer | null = null;

    switch (style) {
      case 'satellite':
        baseLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
          maxZoom: 19
        });
        labelsLayer = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
          attribution: '',
          maxZoom: 19
        });
        break;
      case 'terrain':
        baseLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}', {
          attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
          maxZoom: 19
        });
        break;
      default: // osm
        baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        });
    }

    baseLayer.addTo(mapRef.current);
    if (labelsLayer) {
      labelsLayer.addTo(mapRef.current);
    }

    setCurrentMapStyle(style);
  };

  // Locate user
  const locateMe = (setView: boolean = true) => {
    if (!mapRef.current) return;

    setLoading(true);
    mapRef.current.locate({ setView, maxZoom: 16 });

    mapRef.current.on('locationfound', (e) => {
      setLoading(false);
      L.marker(e.latlng).addTo(mapRef.current!)
        .bindPopup('You are here!')
        .openPopup();
    });

    mapRef.current.on('locationerror', () => {
      setLoading(false);
      setError('Location access denied or unavailable');
    });
  };

  // Handle file upload for OCR
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessingOCR(true);
    try {
      // Simulate OCR processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      setOcrResults({
        text: 'Sample extracted text from document...',
        confidence: 85
      });
      setShowOCRDialog(true);
    } catch (error) {
      setError('OCR processing failed');
    } finally {
      setProcessingOCR(false);
    }
  };

  // Process NER
  const processNER = async (text: string) => {
    setProcessingNER(true);
    try {
      // Simulate NER processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      setNerResults({
        entities: {
          location: ['Mumbai', 'Andheri', 'Maharashtra'],
          person: ['Ramesh Kumar', 'Sunita Devi'],
          organization: ['Forest Department']
        }
      });
    } catch (error) {
      setError('NER processing failed');
    } finally {
      setProcessingNER(false);
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 0, borderRadius: 0, boxShadow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Satellite color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold" color="primary">
                FRA Atlas - Free Mapping
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Professional satellite mapping with Leaflet & Esri imagery
              </Typography>
            </Box>
          </Box>
          
          <Stack direction="row" spacing={1}>
            <Chip 
              label={`${filteredData.length} Claims`} 
              color="primary" 
              variant="outlined" 
            />
            <Chip 
              label={currentMapStyle.toUpperCase()} 
              color="secondary" 
              size="small" 
            />
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}

        {info && (
          <Alert severity="info" sx={{ mt: 2 }} onClose={() => setInfo(null)}>
            {info}
          </Alert>
        )}
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', position: 'relative' }}>
        {/* Controls Drawer */}
        <Drawer
          anchor="right"
          open={showControls}
          onClose={() => setShowControls(false)}
          variant="temporary"
          sx={{
            '& .MuiDrawer-paper': {
              width: 360,
              bgcolor: 'background.paper',
              borderLeft: '1px solid',
              borderColor: 'divider'
            }
          }}
        >
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">Map Controls</Typography>
              <IconButton onClick={() => setShowControls(false)} size="small">
                <Close />
              </IconButton>
            </Box>

            {/* Map Style Selection */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>Map Style</Typography>
                <Stack spacing={1}>
                  <Button
                    variant={currentMapStyle === 'satellite' ? 'contained' : 'outlined'}
                    startIcon={<Satellite />}
                    onClick={() => changeMapStyle('satellite')}
                    fullWidth
                  >
                    Satellite
                  </Button>
                  <Button
                    variant={currentMapStyle === 'terrain' ? 'contained' : 'outlined'}
                    startIcon={<Terrain />}
                    onClick={() => changeMapStyle('terrain')}
                    fullWidth
                  >
                    Terrain
                  </Button>
                  <Button
                    variant={currentMapStyle === 'osm' ? 'contained' : 'outlined'}
                    startIcon={<MapIcon />}
                    onClick={() => changeMapStyle('osm')}
                    fullWidth
                  >
                    OpenStreetMap
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Layer Controls */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>Layers</Typography>
                <Stack spacing={1}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={layerVisibility.fraGranted}
                        onChange={(e) => setLayerVisibility(prev => ({ ...prev, fraGranted: e.target.checked }))}
                      />
                    }
                    label="FRA Granted"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={layerVisibility.fraPotential}
                        onChange={(e) => setLayerVisibility(prev => ({ ...prev, fraPotential: e.target.checked }))}
                      />
                    }
                    label="FRA Potential"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={layerVisibility.boundaries}
                        onChange={(e) => setLayerVisibility(prev => ({ ...prev, boundaries: e.target.checked }))}
                      />
                    }
                    label="Boundaries"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={layerVisibility.forests}
                        onChange={(e) => setLayerVisibility(prev => ({ ...prev, forests: e.target.checked }))}
                      />
                    }
                    label="Forest Areas"
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>Filters</Typography>
                <Stack spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={selectedFilters.status}
                      label="Status"
                      onChange={(e) => setSelectedFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="granted">Granted</MenuItem>
                      <MenuItem value="potential">Potential</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth size="small">
                    <InputLabel>District</InputLabel>
                    <Select
                      value={selectedFilters.district}
                      label="District"
                      onChange={(e) => setSelectedFilters(prev => ({ ...prev, district: e.target.value }))}
                    >
                      <MenuItem value="all">All Districts</MenuItem>
                      <MenuItem value="Mumbai">Mumbai</MenuItem>
                      <MenuItem value="Pune">Pune</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Drawer>

        {/* Map Container */}
        <Box sx={{ flex: 1, position: 'relative', m: 0 }}>
          <Box 
            ref={containerRef} 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%'
            }}
          >
            {loading && (
              <Box sx={{ 
                position: 'absolute', 
                inset: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                bgcolor: 'rgba(255,255,255,0.9)', 
                zIndex: 1000,
                flexDirection: 'column',
                gap: 2
              }}>
                <CircularProgress size={40} />
                <Typography variant="body2" color="text.secondary">
                  Loading free satellite map...
                </Typography>
              </Box>
            )}
          </Box>

          {/* Floating Action Buttons */}
          <Box sx={{ position: 'absolute', top: 16, right: showControls ? 376 : 16, display: 'flex', flexDirection: 'column', gap: 1, zIndex: 1400, transition: 'right 200ms' }}>
            <Tooltip title="Map Controls">
              <Fab size="medium" color="primary" onClick={() => setShowControls(true)}>
                <Layers />
              </Fab>
            </Tooltip>
            <Tooltip title="Go to my location">
              <Fab size="small" color="default" onClick={() => locateMe(false)}>
                <MyLocation />
              </Fab>
            </Tooltip>
            <Tooltip title="OCR Processing">
              <Fab 
                size="small" 
                color="primary" 
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={processingOCR}
              >
                {processingOCR ? <CircularProgress size={24} /> : <PhotoCamera />}
              </Fab>
            </Tooltip>
            
            <Tooltip title="NER Analysis">
              <Fab 
                size="small" 
                color="secondary" 
                onClick={() => setShowNERDialog(true)}
                disabled={processingNER}
              >
                {processingNER ? <CircularProgress size={24} /> : <TextFields />}
              </Fab>
            </Tooltip>

            <Tooltip title="Search Location">
              <Fab size="small" color="default">
                <Search />
              </Fab>
            </Tooltip>
          </Box>

          {/* Hidden File Input */}
          <input
            id="file-upload"
            type="file"
            accept="image/*,.pdf"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </Box>
      </Box>

      {/* OCR Results Dialog */}
      <Dialog open={showOCRDialog} onClose={() => setShowOCRDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhotoCamera />
            OCR Processing Results
          </Box>
        </DialogTitle>
        <DialogContent>
          {ocrResults && (
            <Box>
              <Typography variant="h6" gutterBottom>Extracted Text:</Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {ocrResults.text}
                </Typography>
              </Paper>
              
              {ocrResults.confidence && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Confidence: {ocrResults.confidence}%</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={ocrResults.confidence} 
                    sx={{ mt: 1 }}
                  />
                </Box>
              )}

              <Button 
                variant="contained" 
                onClick={() => {
                  if (ocrResults.text) {
                    processNER(ocrResults.text);
                  }
                }}
                startIcon={<TextFields />}
                disabled={processingNER}
              >
                Analyze with NER
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOCRDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* NER Results Dialog */}
      <Dialog open={showNERDialog} onClose={() => setShowNERDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextFields />
            Named Entity Recognition Results
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Enter text for NER analysis"
            placeholder="Enter text to analyze for named entities..."
            sx={{ mb: 2 }}
            onChange={(e) => {
              if (e.target.value.length > 10) {
                processNER(e.target.value);
              }
            }}
          />
          
          {nerResults && (
            <Box>
              <Typography variant="h6" gutterBottom>Identified Entities:</Typography>
              <Grid container spacing={2}>
                {Object.entries(nerResults.entities || {}).map(([type, entities]: [string, any]) => (
                  <Grid item xs={12} sm={6} key={type}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          {type.toUpperCase()}
                        </Typography>
                        <List dense>
                          {entities.map((entity: string, index: number) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <LocationOn color="primary" />
                              </ListItemIcon>
                              <ListItemText primary={entity} />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNERDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Legend */}
      <Paper sx={{ 
        position: 'absolute', 
        bottom: 16, 
        left: 16, 
        p: 2, 
        display: 'flex', 
        gap: 3,
        bgcolor: 'background.paper',
        boxShadow: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: '#2e7d32', opacity: 0.35, border: '2px solid #1b5e20', borderRadius: 1 }} />
          <Typography variant="body2">Granted FRA</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: '#ff9800', opacity: 0.25, border: '2px solid #ff6f00', borderRadius: 1 }} />
          <Typography variant="body2">Potential FRA</Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default FRAAtlas;
