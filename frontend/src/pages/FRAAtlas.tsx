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
  Tab
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
  Info,
  Close,
  CheckCircle,
  Warning,
  Error,
  Visibility,
  VisibilityOff,
  Map,
  PhotoCamera,
  TextFields,
  Analytics,
  LocationOn,
  Forest,
  Agriculture,
  Water,
  Home,
  Build,
  CloudUpload,
  CloudDownload,
  Refresh,
  ZoomIn,
  ZoomOut,
  Fullscreen,
  FullscreenExit,
  FilterList,
  Tune,
  Dashboard,
  Assessment
} from '@mui/icons-material';
import mapboxgl from 'mapbox-gl';
import * as maplibregl from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { api } from '../services/api';

const token = process.env.REACT_APP_MAPBOX_TOKEN || '';
mapboxgl.accessToken = token;

// Professional 3D Satellite Styles
const PROFESSIONAL_SATELLITE_STYLE: any = {
  version: 8,
  sources: {
    'satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution: '© Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community'
    },
    'terrain': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution: '© Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
    },
    'osm': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [
    { id: 'satellite', type: 'raster', source: 'satellite' }
  ]
};

const TERRAIN_STYLE: any = {
  ...PROFESSIONAL_SATELLITE_STYLE,
  layers: [
    { id: 'terrain', type: 'raster', source: 'terrain' }
  ]
};

const OSM_STYLE: any = {
  ...PROFESSIONAL_SATELLITE_STYLE,
  layers: [
    { id: 'osm', type: 'raster', source: 'osm' }
  ]
};

const FRAAtlas: React.FC = () => {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [statusChips, setStatusChips] = useState({ granted: true, potential: true });
  const [filters, setFilters] = useState({ state: '', district: '', block: '', village: '', tribal_group: '' });
  const [assetToggles, setAssetToggles] = useState({ agriculture: false, forest: false, water: false, homestead: false, infrastructure: false });
  const [overlayToggles, setOverlayToggles] = useState({ cropland: false, forestcover: false, waterbodies: false });
  const [filterOptions, setFilterOptions] = useState<{ states: string[]; districts: string[]; blocks: string[]; villages: string[]; tribal_groups: string[] } | null>(null);
  
  // Enhanced UI State
  const [currentMapStyle, setCurrentMapStyle] = useState<'satellite' | 'terrain' | 'osm'>('satellite');
  const [showControls, setShowControls] = useState(true);
  const [showOCRDialog, setShowOCRDialog] = useState(false);
  const [showNERDialog, setShowNERDialog] = useState(false);
  const [ocrResults, setOcrResults] = useState<any>(null);
  const [nerResults, setNerResults] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processingOCR, setProcessingOCR] = useState(false);
  const [processingNER, setProcessingNER] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const addGeoJsonSource = async () => {
    try {
      setLoading(true);
      const res = await api.get('/fra/atlas/geojson', { params: { ...filters } });
      const data = res.data;
      const map = mapRef.current!;

      if (map.getSource('fra-areas')) {
        (map.getSource('fra-areas') as mapboxgl.GeoJSONSource).setData(data);
        return;
      }

      map.addSource('fra-areas', { type: 'geojson', data });
      map.addLayer({
        id: 'fra-granted-fill',
        type: 'fill',
        source: 'fra-areas',
        paint: {
          'fill-color': '#2e7d32',
          'fill-opacity': 0.35,
        },
        filter: ['==', ['get', 'status'], 'granted']
      });
      map.addLayer({
        id: 'fra-potential-fill',
        type: 'fill',
        source: 'fra-areas',
        paint: {
          'fill-color': '#ff9800',
          'fill-opacity': 0.25,
        },
        filter: ['==', ['get', 'status'], 'potential']
      });
      map.addLayer({
        id: 'fra-outline',
        type: 'line',
        source: 'fra-areas',
        paint: {
          'line-color': '#1b5e20',
          'line-width': 2
        }
      });

      // Fit to data bounds
      const coords = (data.features || []).flatMap((f: any) =>
        f.geometry?.coordinates?.flat?.(2) || []
      );
      if (coords.length >= 2) {
        const lons = coords.filter((_: any, i: number) => i % 2 === 0);
        const lats = coords.filter((_: any, i: number) => i % 2 === 1);
        const minLng = Math.min(...lons);
        const maxLng = Math.max(...lons);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 40, duration: 500 });
      }
      setTimeout(() => map.resize(), 0);
    } catch (e: any) {
      setError('Failed to load atlas data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (containerRef.current && !mapRef.current) {
      const hasValidToken = Boolean(token && token.length > 20 && !token.includes('placeholder'));
      const usingMapbox = hasValidToken;
      const map = usingMapbox
        ? new mapboxgl.Map({
            container: containerRef.current,
            style: 'mapbox://styles/mapbox/satellite-streets-v12', // Professional satellite style
            center: [73.86, 19.08],
            zoom: 11,
            pitch: 45, // 3D perspective
            bearing: 0,
            antialias: true
          })
        : new maplibregl.Map({
            container: containerRef.current,
            style: PROFESSIONAL_SATELLITE_STYLE, // Professional satellite fallback
            center: [73.86, 19.08],
            zoom: 11,
            pitch: 45, // 3D perspective
            bearing: 0
          }) as unknown as mapboxgl.Map;
      mapRef.current = map;

      map.on('load', () => {
        addGeoJsonSource();
        setMapLoaded(true);
      });

      // If Mapbox style fails to load, fall back to MapLibre dynamically
      map.on('error', (ev: any) => {
        const err = ev?.error?.message || '';
        if (!hasValidToken || err.includes('Unauthorized') || err.includes('401')) {
          if (mapRef.current) {
            mapRef.current.remove();
          }
          const ml = new maplibregl.Map({
            container: containerRef.current as HTMLDivElement,
            style: PROFESSIONAL_SATELLITE_STYLE,
            center: [73.86, 19.08],
            zoom: 11
          }) as unknown as mapboxgl.Map;
          mapRef.current = ml;
          ml.on('load', () => {
            addGeoJsonSource();
            setMapLoaded(true);
          });
          // Use MapLibre's NavigationControl for MapLibre maps
          (ml as unknown as maplibregl.Map).addControl(new (maplibregl as any).NavigationControl(), 'top-right');
        }
      });

      if (hasValidToken) {
        const draw = new MapboxDraw({
          displayControlsDefault: false,
          controls: { polygon: true, trash: true }
        });
        drawRef.current = draw;
        map.addControl(draw, 'top-left');
      }
      if (usingMapbox) {
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      } else {
        (map as unknown as maplibregl.Map).addControl(new (maplibregl as any).NavigationControl(), 'top-right');
      }
    }
  }, []);

  // Keep map sized correctly on window resizes and layout shifts
  useEffect(() => {
    const onResize = () => {
      if (mapRef.current) {
        try { mapRef.current.resize(); } catch (_) { /* ignore */ }
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Debounced ResizeObserver to keep Map GL happy and avoid loop errors
  useEffect(() => {
    if (!containerRef.current) return;
    let frame = 0 as any;
    const ResizeObserverCtor = (window as any).ResizeObserver;
    if (!ResizeObserverCtor) return;
    const ro = new ResizeObserverCtor(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (mapRef.current) {
          try { mapRef.current.resize(); } catch (_) { /* ignore */ }
        }
      });
    });
    ro.observe(containerRef.current);
    return () => { ro.disconnect(); cancelAnimationFrame(frame); };
  }, []);

  // Suppress benign ResizeObserver loop errors
  useEffect(() => {
    const handler = (ev: any) => {
      const msg = ev?.message || ev?.reason?.message || '';
      if (msg.includes('ResizeObserver loop completed') || msg.includes('ResizeObserver loop limit exceeded')) {
        try { ev?.preventDefault?.(); ev?.stopImmediatePropagation?.(); ev?.stopPropagation?.(); } catch (_) {}
        return true;
      }
      return undefined;
    };
    window.addEventListener('error', handler, true);
    window.addEventListener('unhandledrejection', handler, true);
    return () => {
      window.removeEventListener('error', handler, true);
      window.removeEventListener('unhandledrejection', handler, true);
    };
  }, []);

  // periodic refresh
  useEffect(() => {
    const id = setInterval(() => {
      if (mapRef.current?.isStyleLoaded()) {
        addGeoJsonSource();
      }
    }, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/fra/atlas/filters');
        setFilterOptions(res.data);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const toggleLayer = (layer: 'granted' | 'potential') => {
    const map = mapRef.current!;
    if (!mapLoaded || !map.isStyleLoaded()) return;
    const current = !statusChips[layer];
    setStatusChips((s) => ({ ...s, [layer]: current }));
    const id = layer === 'granted' ? 'fra-granted-fill' : 'fra-potential-fill';
    map.setLayoutProperty(id, 'visibility', current ? 'visible' : 'none');
  };

  const syncAssetLayers = async () => {
    const map = mapRef.current!;
    const types = Object.entries(assetToggles).filter(([, on]) => on).map(([t]) => t);
    // Remove existing layers/sources first
    ['assets-fill', 'assets-outline', 'assets-point'].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource('assets')) map.removeSource('assets');
    if (!types.length) return;

    // Fetch all selected types and merge
    const responses = await Promise.all(types.map((t) => api.get('/fra/atlas/assets', { params: { type: t, state: filters.state, district: filters.district } })));
    const features = responses.flatMap((r) => r.data.features || []);
    const data = { type: 'FeatureCollection', features } as any;
    map.addSource('assets', { type: 'geojson', data });
    map.addLayer({ id: 'assets-fill', type: 'fill', source: 'assets', filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': ['match', ['get', 'type'], 'agriculture', '#a5d6a7', 'forest', '#66bb6a', 'water', '#64b5f6', '#bdbdbd'], 'fill-opacity': 0.4 } });
    map.addLayer({ id: 'assets-outline', type: 'line', source: 'assets', filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'line-color': '#1b5e20', 'line-width': 1 } });
    map.addLayer({ id: 'assets-point', type: 'circle', source: 'assets', filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-radius': 4, 'circle-color': ['match', ['get', 'type'], 'homestead', '#ffb74d', 'infrastructure', '#8d6e63', '#757575'] } });
    setTimeout(() => map.resize(), 0);
  };

  const syncOverlays = async () => {
    const map = mapRef.current!;
    // Remove existing overlays
    ['ov-worldcover', 'ov-gsw'].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    ['src-worldcover', 'src-gsw'].forEach((id) => {
      if (map.getSource(id)) map.removeSource(id as any);
    });

    // ESA WorldCover raster (cropland/forest classes). Public tiles by EOX
    if (overlayToggles.cropland || overlayToggles.forestcover) {
      if (!map.getSource('src-worldcover')) {
        map.addSource('src-worldcover', {
          type: 'raster',
          tiles: [`${window.location.origin.replace(/:\\d+$/, '')}/api/proxy/tiles/worldcover/{z}/{x}/{y}.png`],
          tileSize: 256,
          attribution: 'ESA WorldCover 2021'
        } as any);
      }
      map.addLayer({ id: 'ov-worldcover', type: 'raster', source: 'src-worldcover', paint: { 'raster-opacity': 0.55 } });
    }

    // JRC Global Surface Water occurrence
    if (overlayToggles.waterbodies) {
      if (!map.getSource('src-gsw')) {
        map.addSource('src-gsw', {
          type: 'raster',
          tiles: [`${window.location.origin.replace(/:\\d+$/, '')}/api/proxy/tiles/gsw/{z}/{x}/{y}.png`],
          tileSize: 256,
          attribution: 'JRC Global Surface Water'
        } as any);
      }
      map.addLayer({ id: 'ov-gsw', type: 'raster', source: 'src-gsw', paint: { 'raster-opacity': 0.5 } });
    }
    setTimeout(() => map.resize(), 0);
  };

  const validateSelection = async () => {
    try {
      setError(null);
      setInfo(null);
      if (!process.env.REACT_APP_MAPBOX_TOKEN) {
        setInfo('Drawing and validation require a Mapbox token. You can still use layers and filters.');
        return;
      }
      const draw = drawRef.current!;
      const selected = draw.getAll();
      if (!selected.features.length) {
        setError('Draw a polygon first');
        return;
      }
      const geometry = selected.features[0].geometry;
      const res = await api.post('/fra/atlas/validate', { geometry });
      const { confidence } = res.data;
      alert(`Boundary validated. Confidence: ${(confidence * 100).toFixed(1)}%`);
    } catch (e: any) {
      setError('Validation failed');
    }
  };

  // OCR Processing Function
  const processOCR = async (file: File) => {
    setProcessingOCR(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/api/ocr/process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setOcrResults(response.data);
      setShowOCRDialog(true);
    } catch (error) {
      setError('OCR processing failed. Please try again.');
    } finally {
      setProcessingOCR(false);
    }
  };

  // NER Processing Function
  const processNER = async (text: string) => {
    setProcessingNER(true);
    try {
      const response = await api.post('/api/ner/process', { text });
      setNerResults(response.data);
      setShowNERDialog(true);
    } catch (error) {
      setError('NER processing failed. Please try again.');
    } finally {
      setProcessingNER(false);
    }
  };

  // Map Style Changer
  const changeMapStyle = (style: 'satellite' | 'terrain' | 'osm') => {
    if (!mapRef.current) return;
    
    setCurrentMapStyle(style);
    let newStyle;
    
    switch (style) {
      case 'satellite':
        newStyle = PROFESSIONAL_SATELLITE_STYLE;
        break;
      case 'terrain':
        newStyle = TERRAIN_STYLE;
        break;
      case 'osm':
        newStyle = OSM_STYLE;
        break;
    }
    
    mapRef.current.setStyle(newStyle);
    mapRef.current.on('style.load', () => {
      addGeoJsonSource();
    });
  };

  // File Upload Handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      processOCR(file);
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    }, 100);
  };

  return (
    <Box sx={{ 
      height: fullscreen ? '100vh' : 'calc(100vh - 64px)', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Professional Header */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'background.paper', 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Satellite sx={{ color: 'primary.main', fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
              FRA Atlas - Professional 3D
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Forest Rights Act Digital Platform with AI/ML Integration
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Analytics Dashboard">
            <IconButton onClick={() => setShowAnalytics(!showAnalytics)}>
              <Analytics />
            </IconButton>
          </Tooltip>
          <Tooltip title="Toggle Controls">
            <IconButton onClick={() => setShowControls(!showControls)}>
              <Settings />
            </IconButton>
          </Tooltip>
          <Tooltip title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            <IconButton onClick={toggleFullscreen}>
              {fullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Error/Info Alerts */}
      {error && (
        <Alert severity="error" sx={{ m: 2, flexShrink: 0 }}>
          {error}
        </Alert>
      )}
      {info && (
        <Alert severity="info" sx={{ m: 2, flexShrink: 0 }}>
          {info}
        </Alert>
      )}

      {/* Main Content Area */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Control Panel */}
        {showControls && (
          <Card sx={{ 
            width: 350, 
            m: 2, 
            height: 'fit-content',
            maxHeight: 'calc(100vh - 200px)',
            overflow: 'auto',
            flexShrink: 0
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Layers />
                Map Controls
              </Typography>

              {/* Map Style Selector */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Map Style</Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant={currentMapStyle === 'satellite' ? 'contained' : 'outlined'}
                    size="small"
                    startIcon={<Satellite />}
                    onClick={() => changeMapStyle('satellite')}
                  >
                    Satellite
                  </Button>
                  <Button
                    variant={currentMapStyle === 'terrain' ? 'contained' : 'outlined'}
                    size="small"
                    startIcon={<Terrain />}
                    onClick={() => changeMapStyle('terrain')}
                  >
                    Terrain
                  </Button>
                  <Button
                    variant={currentMapStyle === 'osm' ? 'contained' : 'outlined'}
                    size="small"
                    startIcon={<Map />}
                    onClick={() => changeMapStyle('osm')}
                  >
                    OSM
                  </Button>
                </Stack>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* FRA Status Toggles */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>FRA Status</Typography>
                <Stack direction="row" spacing={1}>
                  <Chip 
                    icon={<CheckCircle />}
                    label="Granted" 
                    color={statusChips.granted ? 'success' : 'default'} 
                    onClick={() => toggleLayer('granted')} 
                    clickable 
                    disabled={!mapLoaded}
                  />
                  <Chip 
                    icon={<Warning />}
                    label="Potential" 
                    color={statusChips.potential ? 'warning' : 'default'} 
                    onClick={() => toggleLayer('potential')} 
                    clickable 
                    disabled={!mapLoaded}
                  />
                </Stack>
              </Box>

              {/* AI/ML Assets */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>AI/ML Assets</Typography>
                <Grid container spacing={1}>
                  {[
                    { key: 'agriculture', icon: <Agriculture />, label: 'Agriculture' },
                    { key: 'forest', icon: <Forest />, label: 'Forest' },
                    { key: 'water', icon: <Water />, label: 'Water' },
                    { key: 'homestead', icon: <Home />, label: 'Homestead' },
                    { key: 'infrastructure', icon: <Build />, label: 'Infrastructure' }
                  ].map(({ key, icon, label }) => (
                    <Grid item xs={6} key={key}>
                      <Chip
                        icon={icon}
                        label={label}
                        color={assetToggles[key as keyof typeof assetToggles] ? 'primary' : 'default'}
                        onClick={() => {
                          setAssetToggles((prev) => {
                            const next = { ...prev, [key]: !prev[key as keyof typeof assetToggles] };
                            setTimeout(syncAssetLayers, 0);
                            return next;
                          });
                        }}
                        clickable
                        size="small"
                        sx={{ width: '100%' }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Remote Sensing Overlays */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Remote Sensing</Typography>
                <Stack spacing={1}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={overlayToggles.cropland}
                        onChange={() => {
                          setOverlayToggles((p) => {
                            const n = { ...p, cropland: !p.cropland };
                            setTimeout(syncOverlays, 0);
                            return n;
                          });
                        }}
                      />
                    }
                    label="Cropland (WorldCover)"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={overlayToggles.forestcover}
                        onChange={() => {
                          setOverlayToggles((p) => {
                            const n = { ...p, forestcover: !p.forestcover };
                            setTimeout(syncOverlays, 0);
                            return n;
                          });
                        }}
                      />
                    }
                    label="Forest Cover (WorldCover)"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={overlayToggles.waterbodies}
                        onChange={() => {
                          setOverlayToggles((p) => {
                            const n = { ...p, waterbodies: !p.waterbodies };
                            setTimeout(syncOverlays, 0);
                            return n;
                          });
                        }}
                      />
                    }
                    label="Water Bodies (JRC)"
                  />
                </Stack>
              </Box>

              {/* Filters */}
              {filterOptions && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>Filters</Typography>
                  <Stack spacing={2}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>State</InputLabel>
                      <Select 
                        label="State" 
                        value={filters.state} 
                        onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                      >
                        <MenuItem value=""><em>All States</em></MenuItem>
                        {filterOptions.states.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth>
                      <InputLabel>District</InputLabel>
                      <Select 
                        label="District" 
                        value={filters.district} 
                        onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                      >
                        <MenuItem value=""><em>All Districts</em></MenuItem>
                        {filterOptions.districts.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <Button 
                      variant="contained" 
                      onClick={addGeoJsonSource}
                      startIcon={<Refresh />}
                      fullWidth
                    >
                      Apply Filters
                    </Button>
                  </Stack>
                </Box>
              )}

              {/* Validation */}
              <Box>
                <Button 
                  variant="outlined" 
                  disabled={!mapLoaded || !process.env.REACT_APP_MAPBOX_TOKEN} 
                  onClick={validateSelection}
                  fullWidth
                  startIcon={<CheckCircle />}
                >
                  Validate Selection
                </Button>
                {!process.env.REACT_APP_MAPBOX_TOKEN && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Drawing/validation requires a Mapbox token
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Map Container */}
        <Box sx={{ flex: 1, position: 'relative', m: showControls ? 2 : 0, ml: showControls ? 0 : 2 }}>
          <Box 
            ref={containerRef} 
            sx={{ 
              position: 'relative', 
              height: '100%', 
              borderRadius: 2, 
              overflow: 'hidden',
              boxShadow: 3
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
                  Loading professional 3D map...
                </Typography>
              </Box>
            )}
          </Box>

          {/* Floating Action Buttons */}
          <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
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
        left: showControls ? 382 : 16, 
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
          <Box sx={{ width: 16, height: 16, bgcolor: '#ff9800', opacity: 0.25, border: '2px solid #1b5e20', borderRadius: 1 }} />
          <Typography variant="body2">Potential FRA</Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default FRAAtlas;



