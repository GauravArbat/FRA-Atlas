import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Drawer,
  Grid,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  Close,
  Settings,
  Layers,
  CropFree,
  Cancel,
  Save,
  Download,
  Upload,
  Fullscreen,
  MyLocation
} from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

// Remove conflicting type declarations - use existing Leaflet Draw types

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface AreaPlot {
  id: string;
  type: string;
  geometry: any;
  area: number;
  pattern: string;
  properties: {
    name: string;
    created: string;
    status: string;
  };
}

const DigitalGISPlot: React.FC = () => {
  // Map references
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  // Theme and responsive
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Redux state for sidebar
  const { sidebarOpen, sidebarCollapsed } = useSelector((state: RootState) => state.ui);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [useOpenStreetMap, setUseOpenStreetMap] = useState(true);
  const [showAreaDialog, setShowAreaDialog] = useState(false);
  const [currentPolygon, setCurrentPolygon] = useState<any>(null);
  const [calculatedArea, setCalculatedArea] = useState<number>(0);
  const [digitizationStep, setDigitizationStep] = useState(0);
  const [drawingMode, setDrawingMode] = useState<'polygon' | null>(null);
  const [cursorInfo, setCursorInfo] = useState<any>(null);
  const [areaPlots, setAreaPlots] = useState<AreaPlot[]>([]);

  // Dynamic dimensions based on sidebar state
  const mainSidebarWidth = isMobile ? 0 : (sidebarCollapsed ? 72 : 300);
  const controlsWidth = showSidebar ? 400 : 0;
  const totalLeftOffset = mainSidebarWidth + controlsWidth;

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    setLoading(true);
    
    try {
      // Create Leaflet map with satellite imagery
      const map = L.map(containerRef.current, {
        center: [12.9716, 77.5946], // Bangalore coordinates
        zoom: 10,
        zoomControl: true
      });

      // Add satellite imagery with labels
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19
      }).addTo(map);

      // Add labels overlay for place names
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxZoom: 19
      }).addTo(map);

      // Create feature group for drawn items
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnItemsRef.current = drawnItems;

      // Add drawing controls
      const drawControl = new (L.Control as any).Draw({
        edit: {
          featureGroup: drawnItems
        },
        draw: {
          polygon: true,
          polyline: false,
          rectangle: true,
          circle: false,
          marker: false,
          circlemarker: false
        }
      });
      map.addControl(drawControl);

      // Handle drawing events
      map.on((L as any).Draw.Event.CREATED, handleDrawingCreate);
      map.on('mousemove', handleMouseMove);

      mapRef.current = map;
      setLoading(false);
      console.log('Map loaded successfully with satellite imagery');

      // Cleanup
      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    } catch (error) {
      console.error('Map initialization failed:', error);
      setError('Failed to initialize map.');
      setLoading(false);
    }
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current!.invalidateSize();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Resize map when sidebar visibility or collapse state changes
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current!.invalidateSize();
      }, 300);
    }
  }, [showSidebar, sidebarCollapsed, sidebarOpen]);

  // Handle drawing creation
  const handleDrawingCreate = (e: any) => {
    const layer = e.layer;
    if (layer && drawnItemsRef.current) {
      drawnItemsRef.current.addLayer(layer);
      
      // Convert to GeoJSON
      const geoJson = layer.toGeoJSON();
      if (geoJson.geometry.type === 'Polygon') {
        setCurrentPolygon(geoJson);
        setDigitizationStep(1);
        
        // Calculate area (simple approximation)
        const coords = geoJson.geometry.coordinates[0];
        let area = 0;
        for (let i = 0; i < coords.length - 1; i++) {
          area += (coords[i][0] * coords[i + 1][1] - coords[i + 1][0] * coords[i][1]);
        }
        area = Math.abs(area) / 2;
        setCalculatedArea(area * 111320 * 111320); // Rough conversion to square meters
        
        setShowAreaDialog(true);
      }
    }
  };

  // Handle mouse move
  const handleMouseMove = (e: L.LeafletMouseEvent) => {
    setCursorInfo({
      lat: e.latlng.lat.toFixed(6),
      lng: e.latlng.lng.toFixed(6)
    });
  };

  // Toggle drawing mode
  const toggleDrawingMode = (mode: 'polygon' | null) => {
    setDrawingMode(mode);
    if (drawnItemsRef.current && mode === null) {
      drawnItemsRef.current.clearLayers();
      setCurrentPolygon(null);
      setDigitizationStep(0);
    }
  };

  // Save area plot
  const saveAreaPlot = () => {
    if (currentPolygon) {
      const newPlot: AreaPlot = {
        id: Date.now().toString(),
        type: 'polygon',
        geometry: currentPolygon.geometry,
        area: calculatedArea,
        pattern: 'solid',
        properties: {
          name: `Plot ${areaPlots.length + 1}`,
          created: new Date().toISOString(),
          status: 'active'
        }
      };
      
      setAreaPlots([...areaPlots, newPlot]);
      setShowAreaDialog(false);
      setInfo(`Area plot saved: ${(calculatedArea / 10000).toFixed(2)} hectares`);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Sidebar */}
      {showSidebar && (
        <Drawer
          variant="persistent"
          anchor="left"
          open={showSidebar}
          sx={{
            width: controlsWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: controlsWidth,
              boxSizing: 'border-box',
              position: 'fixed',
              height: { xs: 'calc(100vh - 64px)', md: 'calc(100vh - 80px)' },
              top: { xs: 64, md: 80 },
              left: mainSidebarWidth,
              zIndex: 1300,
              backgroundColor: 'background.paper',
              borderRight: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '2px 0 12px rgba(0,0,0,0.05)',
              transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }
          }}
        >
          <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              GIS Plot Controls
            </Typography>
            
            {/* Map Configuration */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Map
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={useOpenStreetMap}
                        onChange={(e) => setUseOpenStreetMap(e.target.checked)}
                      />
                    }
                    label="Use satellite imagery with labels"
                  />
                  {!useOpenStreetMap && (
                    <TextField
                      label="Mapbox Token"
                      size="small"
                      fullWidth
                      helperText="Required for drawing/validation and Mapbox basemap"
                      disabled
                    />
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  System Status
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={`${areaPlots.length} Area Plots`}
                        color="primary"
                        size="small"
                      />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        sx={{
          position: 'fixed',
          top: { xs: 64, md: 80 },
          left: isMobile ? (sidebarOpen ? 0 : 0) : `${totalLeftOffset}px`,
          right: 0,
          bottom: 0,
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden'
        }}
      >
        {/* Map Container */}
        <Box
          ref={containerRef}
          id="map-container"
          sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            backgroundColor: '#f5f5f5',
            '& .leaflet-container': {
              width: '100% !important',
              height: '100% !important'
            }
          }}
        >
          {/* Loading indicator */}
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1000
              }}
            >
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 2 }}>
                Loading map...
              </Typography>
            </Box>
          )}

          {/* Error message */}
          {error && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                p: 3,
                zIndex: 1000,
                maxWidth: 400
              }}
            >
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
              <Typography variant="body2" color="text.secondary">
                Using satellite imagery with place names. No API key required!
              </Typography>
            </Box>
          )}
        </Box>

        {/* Map Controls */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1001,
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          {/* Drawing Tools */}
          <Card sx={{ p: 1 }}>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Draw Polygon">
                <IconButton
                  size="small"
                  color={drawingMode === 'polygon' ? 'primary' : 'default'}
                  onClick={() => toggleDrawingMode('polygon')}
                >
                  <CropFree />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cancel Drawing">
                <IconButton
                  size="small"
                  onClick={() => toggleDrawingMode(null)}
                >
                  <Cancel />
                </IconButton>
              </Tooltip>
            </Stack>
          </Card>
        </Box>

        {/* Cursor Info */}
        {cursorInfo && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              px: 2,
              py: 1,
              borderRadius: 1,
              fontSize: '0.875rem',
              zIndex: 1001
            }}
          >
            Lat: {cursorInfo.lat}, Lng: {cursorInfo.lng}
          </Box>
        )}

        {/* Info Messages */}
        {info && (
          <Alert 
            severity="success" 
            sx={{ 
              position: 'absolute', 
              top: 16, 
              left: 16, 
              zIndex: 1001,
              maxWidth: 300
            }}
            onClose={() => setInfo(null)}
          >
            {info}
          </Alert>
        )}
      </Box>

      {/* Area Dialog */}
      <Dialog open={showAreaDialog} onClose={() => setShowAreaDialog(false)}>
        <DialogTitle>Area Calculation</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Calculated Area: {(calculatedArea / 10000).toFixed(2)} hectares
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ({calculatedArea.toFixed(2)} square meters)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAreaDialog(false)}>Cancel</Button>
          <Button onClick={saveAreaPlot} variant="contained">Save Plot</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DigitalGISPlot;
