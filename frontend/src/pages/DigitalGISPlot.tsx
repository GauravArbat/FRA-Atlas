import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
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
  FormControlLabel
} from '@mui/material';
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
import { geojsonPlotAPI } from '../services/api';
import { usePageTranslation } from '../hooks/usePageTranslation';
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
  usePageTranslation();
  
  // Map references
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const uploadedLayersRef = useRef<L.LayerGroup | null>(null);

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

  // Control panel dimensions
  const controlsWidth = showSidebar ? 400 : 0;

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    setLoading(true);
    
    try {
      // Create Leaflet map with satellite imagery
      const map = L.map(containerRef.current, {
        center: [12.9716, 77.5946], // Bangalore coordinates
        zoom: 10,
        zoomControl: true,
        minZoom: 3,
        maxZoom: 17
      });

      // Add satellite imagery with labels
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 17
      }).addTo(map);

      // Add labels overlay for place names
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxZoom: 17
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

      // Load uploaded layers so they are permanently visible
      try { loadUploadedLayers(); } catch {}

      // Focus from Data Management if provided
      try {
        const raw = sessionStorage.getItem('mapFocusGeoJSON');
        if (raw) {
          const focus = JSON.parse(raw);
          sessionStorage.removeItem('mapFocusGeoJSON');
          const gj = L.geoJSON(focus);
          const b = (gj as any).getBounds?.();
          if (b && b.isValid()) {
            map.fitBounds(b, { padding: [20, 20] });
          }
          gj.remove();
        }
      } catch {}

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

  const loadUploadedLayers = async () => {
    try {
      if (!mapRef.current) return;
      if (!uploadedLayersRef.current) {
        uploadedLayersRef.current = L.layerGroup().addTo(mapRef.current);
      }
      uploadedLayersRef.current.clearLayers();

      const res = await geojsonPlotAPI.getLayers();
      const layers = res.data.data || [];
      layers.forEach((layer: any) => {
        const style = layer.style || {};
        const gj = L.geoJSON(layer.data, {
          style: {
            color: style.strokeColor || '#ff3d00',
            weight: (style.strokeWidth || 2) + 1,
            opacity: style.strokeOpacity ?? 1,
            fillColor: style.fillColor || '#ff6d00',
            fillOpacity: style.fillOpacity ?? 0.35,
          },
          onEachFeature: (_feature, lyr) => {
            lyr.on('click', () => {
              try {
                const b = (lyr as any).getBounds?.();
                if (b && b.isValid() && mapRef.current) {
                  mapRef.current.fitBounds(b, { padding: [16, 16] });
                }
              } catch {}
            });
          }
        });
        gj.bindPopup(`<strong>${layer.name}</strong>`);
        gj.addTo(uploadedLayersRef.current as L.LayerGroup);
        try { (gj as any).eachLayer?.((l: any) => l.bringToFront && l.bringToFront()); } catch {}
      });

      if (uploadedLayersRef.current.getLayers().length > 0) {
        try {
          const bounds = (uploadedLayersRef.current as any).getBounds();
          if (bounds && bounds.isValid()) {
            mapRef.current.fitBounds(bounds, { padding: [20, 20] });
          }
        } catch {}
      }
    } catch (e) {
      console.warn('Failed to load uploaded layers');
    }
  };

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

  // Resize map when sidebar visibility changes
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current!.invalidateSize();
      }, 300);
    }
  }, [showSidebar]);

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
    <Box 
      sx={{ 
        display: 'flex', 
        height: 'calc(100vh - 104px)', 
        bgcolor: 'background.default',
        position: 'relative',
        left: '260px',
        width: 'calc(100vw - 260px)'
      }}
    >
      {/* GIS Controls Sidebar */}
      {showSidebar && (
        <Box
          sx={{
            width: controlsWidth,
            flexShrink: 0,
            bgcolor: 'background.paper',
            borderRight: (theme) => `1px solid ${theme.palette.divider}`,
            boxShadow: (theme) => theme.palette.mode === 'dark' 
              ? '2px 0 12px rgba(255,255,255,0.05)' 
              : '2px 0 12px rgba(0,0,0,0.05)',
            height: '100%',
            overflow: 'auto',
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
            '&::-webkit-scrollbar-thumb': { 
              bgcolor: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.2)' 
                : 'rgba(0,0,0,0.2)', 
              borderRadius: '3px' 
            }
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom color="text.primary">
              <span data-translate>GIS Plot Controls</span>
            </Typography>
            
            {/* Map Configuration */}
            <Card sx={{ mb: 2, bgcolor: 'background.paper' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom color="text.primary">
                  <span data-translate>Map Configuration</span>
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
                    label={<span data-translate>Satellite imagery with labels</span>}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Drawing Tools */}
            <Card sx={{ mb: 2, bgcolor: 'background.paper' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom color="text.primary">
                  <span data-translate>Drawing Tools</span>
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack direction="row" spacing={1}>
                  <Button
                    variant={drawingMode === 'polygon' ? 'contained' : 'outlined'}
                    size="small"
                    startIcon={<CropFree />}
                    onClick={() => toggleDrawingMode('polygon')}
                  >
                    <span data-translate>Polygon</span>
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Cancel />}
                    onClick={() => toggleDrawingMode(null)}
                  >
                    <span data-translate>Clear</span>
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card sx={{ mb: 2, bgcolor: 'background.paper' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom color="text.primary">
                  <span data-translate>System Status</span>
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Chip 
                      label={<span data-translate>{areaPlots.length} Area Plots</span>}
                      color="primary"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Chip 
                      label={<span data-translate>Ready</span>}
                      color="success"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Main Map Content */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden', bgcolor: 'background.default' }}>
        {/* Map Container */}
        <Box
          ref={containerRef}
          id="map-container"
          sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            bgcolor: 'background.default',
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
                zIndex: 1000,
                textAlign: 'center'
              }}
            >
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 2 }} color="text.primary">
                <span data-translate>Loading map...</span>
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
                <span data-translate>Using satellite imagery with place names. No API key required!</span>
              </Typography>
            </Box>
          )}
        </Box>

        {/* Cursor Info */}
        {cursorInfo && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              bgcolor: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.9)' 
                : 'rgba(0,0,0,0.7)',
              color: (theme) => theme.palette.mode === 'dark' ? 'black' : 'white',
              px: 2,
              py: 1,
              borderRadius: 1,
              fontSize: '0.875rem',
              zIndex: 1001
            }}
          >
            <span data-translate>Lat</span>: {cursorInfo.lat}, <span data-translate>Lng</span>: {cursorInfo.lng}
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
        <DialogTitle><span data-translate>Area Calculation</span></DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            <span data-translate>Calculated Area</span>: {(calculatedArea / 10000).toFixed(2)} <span data-translate>hectares</span>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ({calculatedArea.toFixed(2)} <span data-translate>square meters</span>)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAreaDialog(false)}><span data-translate>Cancel</span></Button>
          <Button onClick={saveAreaPlot} variant="contained"><span data-translate>Save Plot</span></Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DigitalGISPlot;