import React, { useEffect, useRef, useState } from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
  Button, 
  Chip, 
  Paper, 
  Alert, 
  AlertTitle,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Autocomplete,
  Checkbox,
  FormGroup,
  Drawer
} from '@mui/material';

// TabPanel component for the data plotting tabs
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`plot-tabpanel-${index}`}
      aria-labelledby={`plot-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}
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
  Assessment,
  MyLocation,
  Edit,
  Add,
  Delete,
  Save,
  Cancel,
  Print,
  FileDownload,
  FileUpload,
  GpsFixed,
  Straighten,
  CropFree,
  Timeline,
  AccountTree,
  Description,
  Assignment,
  Business,
  Place,
  Map as MapIcon,
  ExpandMore,
  PlayArrow,
  Stop,
  Pause,
  SkipNext,
  SkipPrevious,
  DataObject,
  Calculate,
  RadioButtonUnchecked,
  Palette,
  Map
} from '@mui/icons-material';
import mapboxgl from 'mapbox-gl';
import * as maplibregl from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { api, gisPlotAPI } from '../services/api';
import GeoJSONPlotter from '../components/GeoJSONPlotter';

const token = process.env.REACT_APP_MAPBOX_TOKEN || '';
mapboxgl.accessToken = token;

// Professional map styles
const PROFESSIONAL_SATELLITE_STYLE: any = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    'satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community'
    },
    'labels': {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© Esri, HERE, Garmin, FAO, NOAA, USGS | Esri Boundaries & Places'
    },
    'terrain': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      maxzoom: 17,
      attribution: '© Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
    },
    'osm': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [
    { id: 'satellite', type: 'raster', source: 'satellite' },
    { id: 'labels', type: 'raster', source: 'labels', paint: { 'raster-opacity': 1 } }
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

// Patta/FRA Title Data Interface
interface PattaData {
  id: string;
  district: string;
  taluka: string;
  village: string;
  surveyNumber: string;
  khasraNumber: string;
  compartmentNumber: string;
  area: number;
  areaUnit: 'hectares' | 'acres';
  boundaryDescription: string;
  northMarker: string;
  eastMarker: string;
  southMarker: string;
  westMarker: string;
  coordinates?: [number, number];
  polygon?: any;
  status: 'draft' | 'digitized' | 'verified' | 'approved';
  createdDate: string;
  lastModified: string;
  documents: string[];
  notes: string;
}

// Cadastral Layer Interface
interface CadastralLayer {
  id: string;
  name: string;
  type: 'survey' | 'khasra' | 'revenue' | 'forest';
  url: string;
  visible: boolean;
  opacity: number;
  color: string;
}

const DigitalGISPlot: React.FC = () => {
  const mapRef = useRef<maplibregl.Map | mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  
  // Map and UI State
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentMapStyle, setCurrentMapStyle] = useState<'satellite' | 'terrain' | 'osm'>('satellite');
  const [showControls, setShowControls] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Patta Data Management
  const [pattaData, setPattaData] = useState<PattaData | null>(null);
  const [showPattaDialog, setShowPattaDialog] = useState(false);
  const [editingPatta, setEditingPatta] = useState(false);
  const [pattaList, setPattaList] = useState<PattaData[]>([]);
  
  // Drawing and Digitization
  const [drawingMode, setDrawingMode] = useState<'point' | 'polygon' | 'line' | 'none'>('none');
  const [digitizationStep, setDigitizationStep] = useState(0);
  const [currentPolygon, setCurrentPolygon] = useState<any>(null);
  
  // Cadastral Layers
  const [cadastralLayers, setCadastralLayers] = useState<CadastralLayer[]>([
    {
      id: 'survey-1',
      name: 'Survey Numbers - Maharashtra',
      type: 'survey',
      url: 'https://example.com/survey.geojson',
      visible: false,
      opacity: 0.7,
      color: '#ff5722'
    },
    {
      id: 'khasra-1',
      name: 'Khasra Numbers - Pune District',
      type: 'khasra',
      url: 'https://example.com/khasra.geojson',
      visible: false,
      opacity: 0.7,
      color: '#2196f3'
    }
  ]);
  
  // Export and Import
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'shapefile' | 'kml' | 'geojson' | 'csv'>('pdf');
  
  // GeoJSON Plotting
  const [showPlotter, setShowPlotter] = useState(false);
  const [plotLayers, setPlotLayers] = useState<any[]>([]);
  const [plotterMode, setPlotterMode] = useState<'basic' | 'advanced' | 'professional'>('professional');
  const [showPlotterPanel, setShowPlotterPanel] = useState(true);
  const [plotterHeight, setPlotterHeight] = useState(400);
  const [activePlotTab, setActivePlotTab] = useState(0);
  
  // Search and Location
  const [searchQuery, setSearchQuery] = useState('');
  const [cursorInfo, setCursorInfo] = useState<{lng:number;lat:number;zoom:number}>({lng:73.86,lat:19.08,zoom:11});

  // Load data on component mount
  useEffect(() => {
    loadPattaRecords();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (containerRef.current && !mapRef.current) {
      const hasValidToken = Boolean(token && token.length > 20 && !token.includes('placeholder'));
      const usingMapbox = hasValidToken;
      
      const map = usingMapbox
        ? new mapboxgl.Map({
            container: containerRef.current,
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            center: [73.86, 19.08],
            zoom: 11,
            pitch: 45,
            bearing: 0,
            antialias: true,
            maxZoom: 19
          })
        : new maplibregl.Map({
            container: containerRef.current,
            style: ((): any => {
              switch (currentMapStyle) {
                case 'satellite':
                  return PROFESSIONAL_SATELLITE_STYLE;
                case 'terrain':
                  return TERRAIN_STYLE;
                default:
                  return OSM_STYLE;
              }
            })(),
            center: [73.86, 19.08],
            zoom: 11,
            pitch: 45,
            bearing: 0,
            maxZoom: 19
          }) as unknown as mapboxgl.Map;
      
      mapRef.current = map;

      map.on('load', () => {
        setMapLoaded(true);
        initializeDrawingTools();
        loadCadastralLayers();
      });

      // Handle map errors and fallback
      map.on('error', (ev: any) => {
        const err = ev?.error?.message || '';
        if (!hasValidToken || err.includes('Unauthorized') || err.includes('401')) {
          if (mapRef.current) {
            mapRef.current.remove();
          }
          const ml = new maplibregl.Map({
            container: containerRef.current as HTMLDivElement,
            style: OSM_STYLE,
            center: [73.86, 19.08],
            zoom: 11,
            maxZoom: 19
          }) as unknown as mapboxgl.Map;
          mapRef.current = ml;
          ml.on('load', () => {
            setMapLoaded(true);
            initializeDrawingTools();
            loadCadastralLayers();
          });
          (ml as unknown as maplibregl.Map).addControl(new (maplibregl as any).NavigationControl(), 'top-right');
        }
      });

      // Add controls
      if (hasValidToken) {
        const draw = new MapboxDraw({
          displayControlsDefault: false,
          controls: { 
            polygon: true, 
            point: true,
            line_string: true,
            trash: true 
          }
        });
        drawRef.current = draw;
        map.addControl(draw, 'top-left');
      }
      
      if (usingMapbox) {
        map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
      } else {
        (map as unknown as maplibregl.Map).addControl(new (maplibregl as any).NavigationControl(), 'bottom-right');
        try { (map as unknown as maplibregl.Map).addControl(new (maplibregl as any).ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left'); } catch (_) {}
      }

      // Mouse move tracking
      map.on('mousemove', (e: any) => {
        setCursorInfo({ 
          lng: Number(e.lngLat.lng.toFixed(5)), 
          lat: Number(e.lngLat.lat.toFixed(5)), 
          zoom: Number(map.getZoom().toFixed(2)) 
        });
      });

      // Drawing events
      if (drawRef.current) {
        map.on('draw.create', handleDrawingCreate);
        map.on('draw.update', handleDrawingUpdate);
        map.on('draw.delete', handleDrawingDelete);
      }
    }
  }, []);

  // Initialize drawing tools
  const initializeDrawingTools = () => {
    if (drawRef.current && mapRef.current) {
      // Add drawing event listeners
      mapRef.current.on('draw.create', handleDrawingCreate);
      mapRef.current.on('draw.update', handleDrawingUpdate);
      mapRef.current.on('draw.delete', handleDrawingDelete);
    }
  };

  // Validate polygon geometry
  const validatePolygon = async (geometry: any) => {
    try {
      const response = await gisPlotAPI.validateGeometry(geometry);
      const { isValid, confidence, issues, area } = response.data.data;
      
      if (isValid) {
        setInfo(`Polygon validated successfully! Confidence: ${(confidence * 100).toFixed(1)}%, Area: ${(area / 10000).toFixed(2)} hectares`);
      } else {
        setError(`Polygon validation failed: ${issues.join(', ')}`);
      }
      
      return { isValid, confidence, issues, area };
    } catch (error) {
      console.error('Error validating polygon:', error);
      setError('Failed to validate polygon');
      return { isValid: false, confidence: 0, issues: ['Validation failed'], area: 0 };
    }
  };

  // Handle drawing creation
  const handleDrawingCreate = async (e: any) => {
    const features = e.features;
    if (features && features.length > 0) {
      const feature = features[0];
      if (feature.geometry.type === 'Polygon') {
        setCurrentPolygon(feature);
        setDigitizationStep(1);
        
        // Validate the polygon
        const validation = await validatePolygon(feature.geometry);
        
        if (validation.isValid) {
          setInfo('Polygon created and validated! Please fill in the Patta details.');
        } else {
          setInfo('Polygon created but has validation issues. Please review and fill in the Patta details.');
        }
      }
    }
  };

  // Handle drawing updates
  const handleDrawingUpdate = (e: any) => {
    const features = e.features;
    if (features && features.length > 0) {
      const feature = features[0];
      if (feature.geometry.type === 'Polygon') {
        setCurrentPolygon(feature);
      }
    }
  };

  // Handle drawing deletion
  const handleDrawingDelete = (e: any) => {
    setCurrentPolygon(null);
    setDigitizationStep(0);
  };

  // GeoJSON Plotting handlers
  const handleDataLoaded = (data: any) => {
    setInfo(`Loaded ${data.features?.length || 0} features from GeoJSON data`);
  };

  const handleLayerAdded = (layer: any) => {
    // Ensure unique ID for the layer
    const uniqueLayer = {
      ...layer,
      id: layer.id || `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setPlotLayers(prev => [...prev, uniqueLayer]);
    setInfo(`Added layer: ${uniqueLayer.name}`);
  };

  // Enhanced data plotting handlers
  const handlePlotterModeChange = (mode: 'basic' | 'advanced' | 'professional') => {
    setPlotterMode(mode);
    setPlotterHeight(mode === 'professional' ? 500 : mode === 'advanced' ? 400 : 300);
  };

  const handlePlotterToggle = () => {
    setShowPlotter(!showPlotter);
    if (!showPlotter) {
      setShowPlotterPanel(true);
    }
  };

  const handlePlotterPanelToggle = () => {
    setShowPlotterPanel(!showPlotterPanel);
  };

  const handlePlotTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActivePlotTab(newValue);
  };

  const handlePlotLayerExport = (layerId: string, format: string) => {
    setInfo(`Exporting layer ${layerId} as ${format.toUpperCase()}`);
    // Implementation for layer export
  };

  const handlePlotLayerDelete = (layerId: string) => {
    setPlotLayers(prev => prev.filter(layer => layer.id !== layerId));
    setInfo('Layer removed from map');
  };

  const handlePlotLayerStyle = (layerId: string, style: any) => {
    setPlotLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, style } : layer
    ));
    setInfo('Layer style updated');
  };

  // Load cadastral layers from backend
  const loadCadastralLayers = async () => {
    if (!mapRef.current) return;
    
    try {
      const response = await gisPlotAPI.getCadastralLayers();
      const layers = response.data.data;
      setCadastralLayers(layers);
      
      for (const layer of layers) {
        if (layer.visible) {
          try {
            // In a real implementation, you would load actual cadastral data from the URL
            // For now, we'll create a mock layer
            const mockData = {
              type: 'FeatureCollection' as const,
              features: [
                {
                  type: 'Feature' as const,
                  properties: { name: layer.name, type: layer.type },
                  geometry: {
                    type: 'Polygon' as const,
                    coordinates: [[[73.8, 19.0], [73.9, 19.0], [73.9, 19.1], [73.8, 19.1], [73.8, 19.0]]]
                  }
                }
              ]
            };

            if (mapRef.current.getSource(`cadastral-${layer.id}`)) {
              (mapRef.current.getSource(`cadastral-${layer.id}`) as mapboxgl.GeoJSONSource).setData(mockData);
            } else {
              mapRef.current.addSource(`cadastral-${layer.id}`, {
                type: 'geojson',
                data: mockData
              });

              mapRef.current.addLayer({
                id: `cadastral-${layer.id}-fill`,
                type: 'fill',
                source: `cadastral-${layer.id}`,
                paint: {
                  'fill-color': layer.color,
                  'fill-opacity': layer.opacity * 0.3
                }
              });

              mapRef.current.addLayer({
                id: `cadastral-${layer.id}-outline`,
                type: 'line',
                source: `cadastral-${layer.id}`,
                paint: {
                  'line-color': layer.color,
                  'line-width': 2,
                  'line-opacity': layer.opacity
                }
              });
            }
          } catch (error) {
            console.error(`Error loading cadastral layer ${layer.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching cadastral layers:', error);
      setError('Failed to load cadastral layers');
    }
  };

  // Change map style
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
    
    mapRef.current.setStyle(newStyle as any, { diff: true } as any);
    try { (mapRef.current as any).setMaxZoom?.(19); } catch (_) {}
    mapRef.current.on('style.load', () => {
      loadCadastralLayers();
    });
  };

  // Toggle drawing mode
  const toggleDrawingMode = (mode: 'point' | 'polygon' | 'line' | 'none') => {
    setDrawingMode(mode);
    if (drawRef.current) {
      if (mode === 'polygon') {
        drawRef.current.changeMode('draw_polygon');
      } else if (mode === 'point') {
        drawRef.current.changeMode('draw_point');
      } else if (mode === 'line') {
        drawRef.current.changeMode('draw_line_string');
      } else {
        drawRef.current.changeMode('simple_select');
      }
    }
  };

  // Create new Patta entry
  const createNewPatta = () => {
    const newPatta: PattaData = {
      id: `PATTA-${Date.now()}`,
      district: '',
      taluka: '',
      village: '',
      surveyNumber: '',
      khasraNumber: '',
      compartmentNumber: '',
      area: 0,
      areaUnit: 'hectares',
      boundaryDescription: '',
      northMarker: '',
      eastMarker: '',
      southMarker: '',
      westMarker: '',
      status: 'draft',
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      documents: [],
      notes: ''
    };
    setPattaData(newPatta);
    setEditingPatta(true);
    setShowPattaDialog(true);
  };

  // Load Patta records from backend
  const loadPattaRecords = async () => {
    try {
      const response = await gisPlotAPI.getPattaRecords();
      setPattaList(response.data.data);
    } catch (error) {
      console.error('Error loading Patta records:', error);
      setError('Failed to load Patta records');
    }
  };

  // Save Patta data to backend
  const savePattaData = async () => {
    if (!pattaData) return;
    
    try {
      setLoading(true);
      const pattaToSave = {
        ...pattaData,
        polygon: currentPolygon,
        status: currentPolygon ? 'digitized' : 'draft'
      };
      
      let response;
      if (pattaData.id.startsWith('PATTA-')) {
        // Update existing record
        response = await gisPlotAPI.updatePattaRecord(pattaData.id, pattaToSave);
      } else {
        // Create new record
        response = await gisPlotAPI.createPattaRecord(pattaToSave);
      }
      
      const savedPatta = response.data.data;
      setPattaList(prev => {
        const existing = prev.find(p => p.id === savedPatta.id);
        if (existing) {
          return prev.map(p => p.id === savedPatta.id ? savedPatta : p);
        } else {
          return [...prev, savedPatta];
        }
      });
      
      setPattaData(savedPatta);
      setEditingPatta(false);
      setShowPattaDialog(false);
      setDigitizationStep(2);
      setInfo('Patta data saved successfully!');
    } catch (error) {
      console.error('Error saving Patta data:', error);
      setError('Failed to save Patta data');
    } finally {
      setLoading(false);
    }
  };

  // Export data using backend API
  const exportData = async (format: 'pdf' | 'shapefile' | 'kml' | 'geojson' | 'csv') => {
    try {
      setLoading(true);
      
      if (format === 'pdf') {
        // Generate PDF with map and data
        const mapCanvas = document.querySelector('.mapboxgl-canvas') as HTMLCanvasElement;
        if (mapCanvas) {
          const link = document.createElement('a');
          link.download = `patta-plot-${Date.now()}.pdf`;
          link.href = mapCanvas.toDataURL();
          link.click();
        }
      } else {
        // Use backend API for other formats
        const response = await gisPlotAPI.exportData(format);
        
        if (format === 'geojson') {
          const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `patta-data-${Date.now()}.geojson`;
          link.click();
          URL.revokeObjectURL(url);
        } else if (format === 'csv') {
          const blob = new Blob([response.data], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `patta-data-${Date.now()}.csv`;
          link.click();
          URL.revokeObjectURL(url);
        } else if (format === 'kml') {
          const blob = new Blob([response.data], { type: 'application/vnd.google-earth.kml+xml' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `patta-data-${Date.now()}.kml`;
          link.click();
          URL.revokeObjectURL(url);
        } else if (format === 'shapefile') {
          // Shapefile export would be handled by backend
          setInfo('Shapefile export is not yet implemented');
        }
      }
      
      setInfo(`Data exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      setError('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Search location
  const searchLocation = async () => {
    const q = searchQuery.trim();
    if (!q || !mapRef.current) return;
    
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=geojson&q=${encodeURIComponent(q)}&limit=1`);
      const data = await res.json();
      const feat = data?.features?.[0];
      if (!feat) return;
      
      const [lng, lat] = feat.geometry.type === 'Point' ? feat.geometry.coordinates : feat.bbox ? [ (feat.bbox[0]+feat.bbox[2])/2, (feat.bbox[1]+feat.bbox[3])/2 ] : [0,0];
      mapRef.current.flyTo({ center: [lng, lat], zoom: 15, pitch: 45, speed: 0.8 });
    } catch (_) {}
  };

  // Toggle fullscreen
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
      {/* Alerts as floating overlays */}
      <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1500, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}
        {info && (
          <Alert severity="info" onClose={() => setInfo(null)}>
            {info}
          </Alert>
        )}
      </Box>

      {/* Main Content Area */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Right-side Controls Drawer */}
        <Drawer anchor="right" open={showControls} onClose={() => setShowControls(false)}>
          <Box sx={{ width: 400, maxWidth: '85vw', p: 2 }} role="presentation" onKeyDown={(e) => { if (e.key === 'Escape') setShowControls(false); }}>
            <CardContent sx={{ p: 0 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Layers />
                GIS Plot Controls
              </Typography>

              {/* Digitization Steps */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Digitization Steps</Typography>
                <Stepper activeStep={digitizationStep} orientation="vertical">
                  <Step>
                    <StepLabel>1. Draw Boundary</StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary">
                        Use drawing tools to create polygon boundary
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant={drawingMode === 'polygon' ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => toggleDrawingMode('polygon')}
                          startIcon={<CropFree />}
                        >
                          Draw Polygon
                        </Button>
                      </Box>
                    </StepContent>
                  </Step>
                  <Step>
                    <StepLabel>2. Enter Patta Details</StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary">
                        Fill in land record information
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={createNewPatta}
                          startIcon={<Add />}
                        >
                          Add Patta Data
                        </Button>
                      </Box>
                    </StepContent>
                  </Step>
                  <Step>
                    <StepLabel>3. Verify & Export</StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary">
                        Review and export final plot
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => setShowExportDialog(true)}
                          startIcon={<Download />}
                        >
                          Export Plot
                        </Button>
                      </Box>
                    </StepContent>
                  </Step>
                </Stepper>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Enhanced GeoJSON Data Plotter */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Professional Data Plotting</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Mode</InputLabel>
                      <Select
                        value={plotterMode}
                        label="Mode"
                        onChange={(e) => handlePlotterModeChange(e.target.value as any)}
                      >
                        <MenuItem value="basic">Basic</MenuItem>
                        <MenuItem value="advanced">Advanced</MenuItem>
                        <MenuItem value="professional">Professional</MenuItem>
                      </Select>
                    </FormControl>
                    <IconButton 
                      size="small" 
                      onClick={handlePlotterPanelToggle}
                      color={showPlotterPanel ? 'primary' : 'default'}
                    >
                      <Visibility />
                    </IconButton>
                  </Box>
                </Box>

                <Button
                  variant={showPlotter ? 'contained' : 'outlined'}
                  fullWidth
                  startIcon={<DataObject />}
                  onClick={handlePlotterToggle}
                  sx={{ mb: 2 }}
                >
                  {showPlotter ? 'Hide' : 'Show'} Professional Data Plotter
                </Button>

                {showPlotter && (
                  <Box sx={{ 
                    height: plotterHeight, 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}>
                    <Tabs 
                      value={activePlotTab} 
                      onChange={handlePlotTabChange}
                      sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
                    >
                      <Tab label="Data Import" />
                      <Tab label="Layer Management" />
                      <Tab label="Styling & Export" />
                      <Tab label="Analysis Tools" />
                    </Tabs>

                    <TabPanel value={activePlotTab} index={0}>
                      <GeoJSONPlotter
                        mapRef={mapRef}
                        onDataLoaded={handleDataLoaded}
                        onLayerAdded={handleLayerAdded}
                      />
                    </TabPanel>

                    <TabPanel value={activePlotTab} index={1}>
                      <Box sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Layer Management</Typography>
                        {plotLayers.length === 0 ? (
                          <Alert severity="info">No layers loaded. Import data to get started.</Alert>
                        ) : (
                          <List>
                            {plotLayers.map((layer, index) => (
                              <ListItem key={`plot-layer-${layer.id || `layer-${index}`}`} divider>
                                <ListItemIcon>
                                  <Map color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={layer.name}
                                  secondary={`${layer.featureCount || 0} features • ${layer.type || 'GeoJSON'}`}
                                />
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handlePlotLayerStyle(layer.id, layer.style)}
                                  >
                                    <Palette />
                                  </IconButton>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handlePlotLayerExport(layer.id, 'geojson')}
                                  >
                                    <Download />
                                  </IconButton>
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => handlePlotLayerDelete(layer.id)}
                                  >
                                    <Delete />
                                  </IconButton>
                                </Box>
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </Box>
                    </TabPanel>

                    <TabPanel value={activePlotTab} index={2}>
                      <Box sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Styling & Export</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Card>
                              <CardContent>
                                <Typography variant="subtitle1" gutterBottom>Layer Styling</Typography>
                                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                  <InputLabel>Select Layer</InputLabel>
                                  <Select value="">
                                    <MenuItem value="">Choose a layer to style</MenuItem>
                                    {plotLayers.map((layer) => (
                                      <MenuItem key={layer.id} value={layer.id}>
                                        {layer.name}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                                <Button fullWidth variant="outlined" startIcon={<Palette />}>
                                  Configure Style
                                </Button>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Card>
                              <CardContent>
                                <Typography variant="subtitle1" gutterBottom>Export Options</Typography>
                                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                  <InputLabel>Export Format</InputLabel>
                                  <Select value="geojson">
                                    <MenuItem value="geojson">GeoJSON</MenuItem>
                                    <MenuItem value="kml">KML</MenuItem>
                                    <MenuItem value="shapefile">Shapefile</MenuItem>
                                    <MenuItem value="pdf">PDF Report</MenuItem>
                                  </Select>
                                </FormControl>
                                <Button fullWidth variant="contained" startIcon={<Download />}>
                                  Export Data
                                </Button>
                              </CardContent>
                            </Card>
                          </Grid>
                        </Grid>
                      </Box>
                    </TabPanel>

                    <TabPanel value={activePlotTab} index={3}>
                      <Box sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Analysis Tools</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Card>
                              <CardContent>
                                <Typography variant="subtitle1" gutterBottom>Area Analysis</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                  Calculate areas and perimeters of plotted features
                                </Typography>
                                <Button fullWidth variant="outlined" startIcon={<Calculate />}>
                                  Calculate Areas
                                </Button>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Card>
                              <CardContent>
                                <Typography variant="subtitle1" gutterBottom>Buffer Analysis</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                  Create buffer zones around features
                                </Typography>
                                <Button fullWidth variant="outlined" startIcon={<RadioButtonUnchecked />}>
                                  Create Buffers
                                </Button>
                              </CardContent>
                            </Card>
                          </Grid>
                        </Grid>
                      </Box>
                    </TabPanel>
                  </Box>
                )}
              </Box>

              {/* Data Plotting Status */}
              {showPlotter && (
                <Box sx={{ mb: 3 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Data Plotting Status
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={`${plotLayers.length} Layers`} 
                              color="primary" 
                              size="small" 
                            />
                            <Chip 
                              label={`${plotLayers.reduce((sum, layer) => sum + (layer.featureCount || 0), 0)} Features`} 
                              color="secondary" 
                              size="small" 
                            />
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={`Mode: ${plotterMode}`} 
                              color="info" 
                              size="small" 
                            />
                            <Chip 
                              label={showPlotterPanel ? 'Panel Visible' : 'Panel Hidden'} 
                              color={showPlotterPanel ? 'success' : 'default'} 
                              size="small" 
                            />
                          </Box>
                        </Grid>
                      </Grid>
                      
                      {plotLayers.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Recent Activity
                          </Typography>
                          <List dense>
                            {plotLayers.slice(-3).map((layer, index) => (
                              <ListItem key={`status-layer-${layer.id || `layer-${index}`}`} sx={{ px: 0 }}>
                                <ListItemIcon>
                                  <MapIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={layer.name}
                                  secondary={`Added ${new Date().toLocaleTimeString()}`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Map Style Selector */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Base Map</Typography>
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

              {/* Cadastral Layers */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Cadastral Layers</Typography>
                <Stack spacing={1}>
                  {cadastralLayers.map((layer) => (
                    <FormControlLabel
                      key={layer.id}
                      control={
                        <Switch
                          checked={layer.visible}
                        onChange={async (e) => {
                          const updatedLayers = cadastralLayers.map(l => 
                            l.id === layer.id ? { ...l, visible: e.target.checked } : l
                          );
                          setCadastralLayers(updatedLayers);
                          
                          // Update backend
                          try {
                            await gisPlotAPI.updateLayerVisibility(layer.id, { 
                              visible: e.target.checked, 
                              opacity: layer.opacity 
                            });
                          } catch (error) {
                            console.error('Error updating layer visibility:', error);
                          }
                          
                          setTimeout(loadCadastralLayers, 0);
                        }}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 12, height: 12, bgcolor: layer.color, borderRadius: 0.5 }} />
                          <Typography variant="body2">{layer.name}</Typography>
                        </Box>
                      }
                    />
                  ))}
                </Stack>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Search */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Search Location</Typography>
                <Stack direction="row" spacing={1}>
                  <TextField 
                    size="small" 
                    fullWidth 
                    placeholder="Search place, village, district..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                  />
                  <Button variant="contained" onClick={searchLocation}>
                    <Search />
                  </Button>
                </Stack>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Patta List */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Patta Records ({pattaList.length})</Typography>
                <List dense>
                  {pattaList.map((patta) => (
                    <ListItem key={patta.id} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Chip 
                          size="small" 
                          label={patta.status} 
                          color={patta.status === 'approved' ? 'success' : patta.status === 'digitized' ? 'primary' : 'default'}
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${patta.village} - ${patta.surveyNumber}`}
                        secondary={`${patta.area} ${patta.areaUnit}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </CardContent>
          </Box>
        </Drawer>

        {/* Map Container */}
        <Box sx={{ flex: 1, position: 'relative', m: 0 }}>
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
                  Loading Digital GIS Plot...
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
            <Tooltip title="My Location">
              <Fab size="small" color="default">
                <MyLocation />
              </Fab>
            </Tooltip>
            <Tooltip title="Measure Distance">
              <Fab size="small" color="default">
                <Straighten />
              </Fab>
            </Tooltip>
            <Tooltip title="Upload Shapefile">
              <Fab size="small" color="primary">
                <FileUpload />
              </Fab>
            </Tooltip>
            <Tooltip title="Export Data">
              <Fab size="small" color="secondary" onClick={() => setShowExportDialog(true)}>
                <FileDownload />
              </Fab>
            </Tooltip>
          </Box>

          {/* Coordinate Display */}
          <Paper sx={{ 
            position: 'absolute', 
            bottom: 16, 
            left: 16, 
            p: 1, 
            bgcolor: 'background.paper',
            boxShadow: 3
          }}>
            <Typography variant="caption" color="text.secondary">
              Lat: {cursorInfo.lat} | Lng: {cursorInfo.lng} | Zoom: {cursorInfo.zoom}
            </Typography>
          </Paper>
        </Box>
      </Box>

      {/* Patta Data Dialog */}
      <Dialog open={showPattaDialog} onClose={() => setShowPattaDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description />
            {editingPatta ? 'Edit Patta Details' : 'Patta Details'}
          </Box>
        </DialogTitle>
        <DialogContent>
          {pattaData && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="District"
                  value={pattaData.district}
                  onChange={(e) => setPattaData({...pattaData, district: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Taluka"
                  value={pattaData.taluka}
                  onChange={(e) => setPattaData({...pattaData, taluka: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Village"
                  value={pattaData.village}
                  onChange={(e) => setPattaData({...pattaData, village: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Survey Number"
                  value={pattaData.surveyNumber}
                  onChange={(e) => setPattaData({...pattaData, surveyNumber: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Khasra Number"
                  value={pattaData.khasraNumber}
                  onChange={(e) => setPattaData({...pattaData, khasraNumber: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Compartment Number"
                  value={pattaData.compartmentNumber}
                  onChange={(e) => setPattaData({...pattaData, compartmentNumber: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Area"
                  value={pattaData.area}
                  onChange={(e) => setPattaData({...pattaData, area: parseFloat(e.target.value) || 0})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Area Unit</InputLabel>
                  <Select
                    value={pattaData.areaUnit}
                    onChange={(e) => setPattaData({...pattaData, areaUnit: e.target.value as 'hectares' | 'acres'})}
                  >
                    <MenuItem value="hectares">Hectares</MenuItem>
                    <MenuItem value="acres">Acres</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Boundary Description"
                  value={pattaData.boundaryDescription}
                  onChange={(e) => setPattaData({...pattaData, boundaryDescription: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="North Marker"
                  value={pattaData.northMarker}
                  onChange={(e) => setPattaData({...pattaData, northMarker: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="East Marker"
                  value={pattaData.eastMarker}
                  onChange={(e) => setPattaData({...pattaData, eastMarker: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="South Marker"
                  value={pattaData.southMarker}
                  onChange={(e) => setPattaData({...pattaData, southMarker: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="West Marker"
                  value={pattaData.westMarker}
                  onChange={(e) => setPattaData({...pattaData, westMarker: e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes"
                  value={pattaData.notes}
                  onChange={(e) => setPattaData({...pattaData, notes: e.target.value})}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPattaDialog(false)}>Cancel</Button>
          <Button onClick={savePattaData} variant="contained" startIcon={<Save />}>
            Save Patta
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onClose={() => setShowExportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Download />
            Export Digital Plot
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Export Format</Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportFormat === 'pdf'}
                    onChange={() => setExportFormat('pdf')}
                  />
                }
                label="PDF Map with Data"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportFormat === 'shapefile'}
                    onChange={() => setExportFormat('shapefile')}
                  />
                }
                label="Shapefile (.shp)"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportFormat === 'kml'}
                    onChange={() => setExportFormat('kml')}
                  />
                }
                label="KML (.kml)"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportFormat === 'geojson'}
                    onChange={() => setExportFormat('geojson')}
                  />
                }
                label="GeoJSON (.geojson)"
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExportDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => exportData(exportFormat)} 
            variant="contained" 
            startIcon={<Download />}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Export'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DigitalGISPlot;
