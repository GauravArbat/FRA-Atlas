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
import ListIcon from '@mui/icons-material/List';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import '../styles/mapPopup.css';
import { geojsonPlotAPI } from '../services/api';
import BhunakshaSearch from '../components/BhunakshaSearch';
import { LandRecord, getAllLandRecords } from '../services/bhunakshaService';
import { usePageTranslation } from '../hooks/usePageTranslation';

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
  usePageTranslation();
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const uploadedLayersRef = useRef<L.LayerGroup | null>(null);
  
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
    forests: true
  });

  // Layer references
  const fraGrantedLayerRef = useRef<L.LayerGroup | null>(null);
  const fraPotentialLayerRef = useRef<L.LayerGroup | null>(null);
  const boundariesLayerRef = useRef<L.LayerGroup | null>(null);
  const forestsLayerRef = useRef<L.LayerGroup | null>(null);

  // OCR and NER states
  const [showOCRDialog, setShowOCRDialog] = useState(false);
  const [showNERDialog, setShowNERDialog] = useState(false);
  const [ocrResults, setOcrResults] = useState<any>(null);
  const [nerResults, setNerResults] = useState<any>(null);
  const [processingOCR, setProcessingOCR] = useState(false);
  const [processingNER, setProcessingNER] = useState(false);
  const [showLayersDialog, setShowLayersDialog] = useState(false);
  const [uploadedLayers, setUploadedLayers] = useState<any[]>([]);
  const uploadedLayerBoundsRef = useRef<L.LatLngBounds | null>(null);
  const [showBhunakshaSearch, setShowBhunakshaSearch] = useState(false);
  const bhunakshaLayerRef = useRef<L.LayerGroup | null>(null);
  const allPlotsLayerRef = useRef<L.LayerGroup | null>(null);
  const [allPlotsVisible, setAllPlotsVisible] = useState(false);
  const persistentLayerRef = useRef<L.LayerGroup | null>(null);
  const [persistentLayerInfo, setPersistentLayerInfo] = useState<any>(null);

  // Initialize map
  useEffect(() => {
    if (containerRef.current && !mapRef.current) {
      // Initialize map with satellite imagery - centered on central India
      const map = L.map(containerRef.current, {
        center: [21.5, 82.5], // Central India coordinates
        zoom: 6,
        minZoom: 4,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: true,
        maxBounds: [[6.0, 68.0], [37.0, 97.0]], // India bounds
        maxBoundsViscosity: 1.0
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

      // Ensure uploaded layers are drawn on initial load
      setTimeout(() => { loadUploadedLayers(); }, 0);

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

      // Handle persistent layer from Data Management
      try {
        const raw = sessionStorage.getItem('mapFocusGeoJSON');
        if (raw) {
          const layerData = JSON.parse(raw);
          
          if (layerData.persistent) {
            // Don't remove from session storage for persistent layers
            setPersistentLayerInfo(layerData.personalInfo || {});
            addPersistentLayer(layerData.geoJSON, layerData.personalInfo || {});
          } else {
            // Legacy behavior for non-persistent layers
            sessionStorage.removeItem('mapFocusGeoJSON');
            const gj = L.geoJSON(layerData.geoJSON || layerData);
            const b = (gj as any).getBounds?.();
            if (b && b.isValid()) {
              map.fitBounds(b, { padding: [20, 20] });
            }
            gj.remove();
          }
        }
      } catch {}
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
          claimantName: 'Ramsingh Gond',
          area: 2.5,
          status: 'granted',
          coordinates: [[21.8047, 80.1847], [21.8057, 80.1847], [21.8057, 80.1857], [21.8047, 80.1857]],
          village: 'Khairlanji',
          district: 'Balaghat',
          state: 'Madhya Pradesh',
          dateSubmitted: '2024-01-15',
          surveyNumber: 'MP001'
        },
        {
          id: '2',
          claimantName: 'Kokborok Debbarma',
          area: 1.8,
          status: 'potential',
          coordinates: [[23.8372, 91.8624], [23.8382, 91.8624], [23.8382, 91.8634], [23.8372, 91.8634]],
          village: 'Gandacherra',
          district: 'Dhalai',
          state: 'Tripura',
          dateSubmitted: '2024-01-20',
          surveyNumber: 'TR002'
        },
        {
          id: '3',
          claimantName: 'Arjun Santal',
          area: 3.2,
          status: 'granted',
          coordinates: [[21.9287, 86.7350], [21.9297, 86.7350], [21.9297, 86.7360], [21.9287, 86.7360]],
          village: 'Baripada',
          district: 'Mayurbhanj',
          state: 'Odisha',
          dateSubmitted: '2024-01-10',
          surveyNumber: 'OD003'
        },
        {
          id: '4',
          claimantName: 'Gram Sabha Utnoor',
          area: 15.0,
          status: 'granted',
          coordinates: [[19.6677, 78.5311], [19.6687, 78.5311], [19.6687, 78.5321], [19.6677, 78.5321]],
          village: 'Utnoor',
          district: 'Adilabad',
          state: 'Telangana',
          dateSubmitted: '2024-01-05',
          surveyNumber: 'TG004'
        }
      ];
      
      setFraData(mockData);
      setFilteredData(mockData);
      
      // Initialize layer groups
      fraGrantedLayerRef.current = L.layerGroup().addTo(mapRef.current);
      fraPotentialLayerRef.current = L.layerGroup().addTo(mapRef.current);
      boundariesLayerRef.current = L.layerGroup();
      forestsLayerRef.current = L.layerGroup().addTo(mapRef.current);

      // Add FRA layers to map
      const addFRALayersToMap = (data: FRAData[]) => {
        if (!mapRef.current || !fraGrantedLayerRef.current || !fraPotentialLayerRef.current) return;

        // Clear existing layers
        fraGrantedLayerRef.current.clearLayers();
        fraPotentialLayerRef.current.clearLayers();

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
          polygon.on('click', () => {
            try {
              const b = polygon.getBounds();
              if (b && b.isValid() && mapRef.current) {
                mapRef.current.fitBounds(b, { padding: [16, 16] });
              }
            } catch {}
          });

          // Add to appropriate layer group
          if (item.status === 'granted') {
            polygon.addTo(fraGrantedLayerRef.current!);
          } else {
            polygon.addTo(fraPotentialLayerRef.current!);
          }
        });

        // Add sample boundaries and forest areas
        addBoundariesLayer();
        addForestsLayer();
      };
      
      addFRALayersToMap(mockData);
      // Load uploaded layers as well
      await loadUploadedLayers();
    } catch (error) {
      setError('Failed to load FRA data');
      console.error('Error loading FRA data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add boundaries layer
  const addBoundariesLayer = () => {
    if (!mapRef.current || !boundariesLayerRef.current) return;

    boundariesLayerRef.current.clearLayers();

    // Sample administrative boundaries
    const boundaries = [
      {
        name: 'Madhya Pradesh',
        coordinates: [[21.0, 80.0], [21.0, 82.0], [23.0, 82.0], [23.0, 80.0]]
      },
      {
        name: 'Odisha',
        coordinates: [[20.0, 85.0], [20.0, 87.0], [22.0, 87.0], [22.0, 85.0]]
      }
    ];

    boundaries.forEach(boundary => {
      const coordinates = boundary.coordinates.map(coord => [coord[0], coord[1]] as [number, number]);
      const polygon = L.polygon(coordinates, {
        color: '#1976d2',
        fillColor: '#2196f3',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '5,5'
      });

      polygon.bindPopup(`<h4>${boundary.name}</h4><p>Administrative Boundary</p>`);
      polygon.addTo(boundariesLayerRef.current!);
    });
  };

  // Add forests layer
  const addForestsLayer = () => {
    if (!mapRef.current || !forestsLayerRef.current) return;

    forestsLayerRef.current.clearLayers();

    // Sample forest areas
    const forests = [
      {
        name: 'Kanha National Park',
        coordinates: [[22.2, 80.6], [22.2, 80.8], [22.4, 80.8], [22.4, 80.6]]
      },
      {
        name: 'Simlipal Forest',
        coordinates: [[21.8, 86.1], [21.8, 86.3], [22.0, 86.3], [22.0, 86.1]]
      }
    ];

    forests.forEach(forest => {
      const coordinates = forest.coordinates.map(coord => [coord[0], coord[1]] as [number, number]);
      const polygon = L.polygon(coordinates, {
        color: '#2e7d32',
        fillColor: '#4caf50',
        fillOpacity: 0.3,
        weight: 2
      });

      polygon.bindPopup(`<h4>${forest.name}</h4><p>Forest Area</p>`);
      polygon.addTo(forestsLayerRef.current!);
    });
  };

  // Toggle layer visibility
  const toggleLayerVisibility = (layerName: keyof typeof layerVisibility) => {
    const newVisibility = !layerVisibility[layerName];
    setLayerVisibility(prev => ({ ...prev, [layerName]: newVisibility }));

    if (!mapRef.current) return;

    switch (layerName) {
      case 'fraGranted':
        if (fraGrantedLayerRef.current) {
          if (newVisibility) {
            fraGrantedLayerRef.current.addTo(mapRef.current);
          } else {
            fraGrantedLayerRef.current.remove();
          }
        }
        break;
      case 'fraPotential':
        if (fraPotentialLayerRef.current) {
          if (newVisibility) {
            fraPotentialLayerRef.current.addTo(mapRef.current);
          } else {
            fraPotentialLayerRef.current.remove();
          }
        }
        break;
      case 'boundaries':
        if (boundariesLayerRef.current) {
          if (newVisibility) {
            boundariesLayerRef.current.addTo(mapRef.current);
          } else {
            boundariesLayerRef.current.remove();
          }
        }
        break;
      case 'forests':
        if (forestsLayerRef.current) {
          if (newVisibility) {
            forestsLayerRef.current.addTo(mapRef.current);
          } else {
            forestsLayerRef.current.remove();
          }
        }
        break;
    }
  };

  const loadUploadedLayers = async () => {
    try {
      if (!mapRef.current) return;
      if (!uploadedLayersRef.current) {
        uploadedLayersRef.current = L.layerGroup().addTo(mapRef.current);
      }
      uploadedLayersRef.current.clearLayers();

      const res = await geojsonPlotAPI.getLayers();
      const layers = res.data.data || [];
      setUploadedLayers(layers);
      uploadedLayerBoundsRef.current = null;
      layers.forEach((layer: any) => {
        const style = layer.style || {};
        const gj = L.geoJSON(layer.data, {
          style: {
            color: style.strokeColor || '#1976d2',
            weight: style.strokeWidth || 2,
            opacity: style.strokeOpacity ?? 1,
            fillColor: style.fillColor || '#2196f3',
            fillOpacity: style.fillOpacity ?? 0.6,
          },
          onEachFeature: (_feature, lyr) => {
            // Hover: show info tooltip and highlight
            lyr.on('mouseover', (e: any) => {
              const props = (e?.target?.feature && e.target.feature.properties) || {};
              const html = getPopupHtml(props, layer.name, persistentLayerInfo);
              (lyr as any).bindTooltip(html, { sticky: true, direction: 'top', opacity: 0.95 }).openTooltip();
              try {
                (lyr as any).setStyle && (lyr as any).setStyle({ weight: (style.strokeWidth || 2) + 2, fillOpacity: Math.min(0.8, (style.fillOpacity ?? 0.6) + 0.2) });
                (lyr as any).bringToFront && (lyr as any).bringToFront();
              } catch {}
            });
            lyr.on('mouseout', () => {
              try {
                (lyr as any).closeTooltip && (lyr as any).closeTooltip();
                (lyr as any).setStyle && (lyr as any).setStyle({
                  color: style.strokeColor || '#1976d2',
                  weight: style.strokeWidth || 2,
                  opacity: style.strokeOpacity ?? 1,
                  fillColor: style.fillColor || '#2196f3',
                  fillOpacity: style.fillOpacity ?? 0.6,
                });
              } catch {}
            });

            // Click: focus and open detailed popup
            lyr.on('click', (e: any) => {
              try {
                const b = (lyr as any).getBounds?.();
                if (b && b.isValid() && mapRef.current) {
                  mapRef.current.fitBounds(b, { padding: [16, 16] });
                }
                const props = (e?.target?.feature && e.target.feature.properties) || {};
                const html = getPopupHtml(props, layer.name, persistentLayerInfo);
                (lyr as any).bindPopup(html, { maxWidth: 400, className: 'custom-popup' }).openPopup();
              } catch {}
            });
          }
        });
        gj.bindPopup(getPopupHtml({}, layer.name, persistentLayerInfo));
        gj.addTo(uploadedLayersRef.current as L.LayerGroup);
        try {
          const b = (gj as any).getBounds?.();
          if (b && b.isValid()) {
            uploadedLayerBoundsRef.current = uploadedLayerBoundsRef.current ? uploadedLayerBoundsRef.current.extend(b) : b;
          }
        } catch {}
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

  // Add persistent layer from Data Management
  const addPersistentLayer = (geoJSON: any, personalInfo: any) => {
    try {
      if (!mapRef.current) return;
      
      // Remove existing persistent layer
      if (persistentLayerRef.current) {
        persistentLayerRef.current.remove();
      }
      
      // Create new persistent layer group
      persistentLayerRef.current = L.layerGroup().addTo(mapRef.current);
      
      const gj = L.geoJSON(geoJSON, {
        style: {
          color: '#ff4444',
          weight: 3,
          opacity: 1,
          fillColor: '#ff6666',
          fillOpacity: 0.4,
        },
        onEachFeature: (_feature, lyr) => {
          // Enhanced hover with owner details
          lyr.on('mouseover', (e: any) => {
            const props = (e?.target?.feature && e.target.feature.properties) || {};
            const html = getPopupHtml(props, 'Uploaded Plot', personalInfo);
            (lyr as any).bindTooltip(html, { sticky: true, direction: 'top', opacity: 0.95 }).openTooltip();
            try {
              (lyr as any).setStyle && (lyr as any).setStyle({ weight: 5, fillOpacity: 0.6 });
              (lyr as any).bringToFront && (lyr as any).bringToFront();
            } catch {}
          });
          
          lyr.on('mouseout', () => {
            try {
              (lyr as any).closeTooltip && (lyr as any).closeTooltip();
              (lyr as any).setStyle && (lyr as any).setStyle({
                color: '#ff4444',
                weight: 3,
                opacity: 1,
                fillColor: '#ff6666',
                fillOpacity: 0.4,
              });
            } catch {}
          });

          // Click: show detailed popup with all owner information
          lyr.on('click', (e: any) => {
            try {
              const b = (lyr as any).getBounds?.();
              if (b && b.isValid() && mapRef.current) {
                mapRef.current.fitBounds(b, { padding: [16, 16] });
              }
              const props = (e?.target?.feature && e.target.feature.properties) || {};
              const html = getPopupHtml(props, 'Uploaded Plot', personalInfo);
              (lyr as any).bindPopup(html, { maxWidth: 400, className: 'custom-popup' }).openPopup();
            } catch {}
          });
        }
      });
      
      gj.addTo(persistentLayerRef.current);
      
      // Fit to bounds
      try {
        const bounds = (gj as any).getBounds();
        if (bounds && bounds.isValid()) {
          mapRef.current.fitBounds(bounds, { padding: [20, 20] });
        }
      } catch {}
      
      // Show info message
      setInfo(`Persistent layer added: ${personalInfo?.name || 'Uploaded Plot'}. Layer will remain visible until manually closed.`);
      
    } catch (e) {
      console.warn('Failed to add persistent layer:', e);
    }
  };

  // Remove persistent layer
  const removePersistentLayer = () => {
    try {
      if (persistentLayerRef.current) {
        persistentLayerRef.current.remove();
        persistentLayerRef.current = null;
      }
      setPersistentLayerInfo(null);
      sessionStorage.removeItem('mapFocusGeoJSON');
      setInfo('Persistent layer removed.');
    } catch {}
  };

  // Handle Bhunaksha plot selection
  const handleBhunakshaPlotSelect = (record: LandRecord) => {
    try {
      if (!mapRef.current) return;
      
      // Remove existing Bhunaksha layer
      if (bhunakshaLayerRef.current) {
        bhunakshaLayerRef.current.remove();
      }
      
      // Create new Bhunaksha layer
      bhunakshaLayerRef.current = L.layerGroup().addTo(mapRef.current);
      
      const gj = L.geoJSON(record.boundaries, {
        style: {
          color: record.fraStatus.includes('Granted') ? '#4caf50' : '#ff9800',
          weight: 3,
          opacity: 1,
          fillColor: record.fraStatus.includes('Granted') ? '#66bb6a' : '#ffb74d',
          fillOpacity: 0.4,
        },
        onEachFeature: (_feature, lyr) => {
          const popupContent = getPlotPopupContent(record);
          lyr.bindPopup(popupContent, { maxWidth: 400 });
          
          // Auto-open popup and fit bounds
          lyr.openPopup();
          const bounds = (lyr as any).getBounds();
          if (bounds && bounds.isValid()) {
            mapRef.current!.fitBounds(bounds, { padding: [20, 20] });
          }
        }
      });
      
      gj.addTo(bhunakshaLayerRef.current);
      setShowBhunakshaSearch(false);
      setInfo(`Land record loaded: ${record.ownerName} - Khasra ${record.khasraNumber}`);
      
    } catch (e) {
      console.warn('Failed to add Bhunaksha layer:', e);
    }
  };

  // Generate plot popup content
  const getPlotPopupContent = (record: LandRecord) => {
    return `
      <div style="min-width:300px;">
        <h4 style="margin:0 0 12px 0;color:#1976d2;">🏠 Khasra: ${record.khasraNumber}</h4>
        <div style="margin:8px 0;padding:8px;background:#f5f5f5;border-radius:4px;">
          <h5 style="margin:0 0 8px 0;color:#2196f3;">📋 Owner Details</h5>
          <table style="font-size:12px;width:100%;">
            <tr><td style="color:#666;padding:2px 8px;">Name:</td><td style="padding:2px 8px;">${record.ownerName}</td></tr>
            <tr><td style="color:#666;padding:2px 8px;">Father:</td><td style="padding:2px 8px;">${record.fatherName}</td></tr>
            <tr><td style="color:#666;padding:2px 8px;">Village:</td><td style="padding:2px 8px;">${record.village}</td></tr>
            <tr><td style="color:#666;padding:2px 8px;">District:</td><td style="padding:2px 8px;">${record.district}</td></tr>
          </table>
        </div>
        <div style="margin:8px 0;">
          <h5 style="margin:0 0 8px 0;color:#666;">📍 Land Details</h5>
          <table style="font-size:12px;width:100%;">
            <tr><td style="color:#666;padding:2px 8px;">Survey No:</td><td style="padding:2px 8px;">${record.surveyNumber}</td></tr>
            <tr><td style="color:#666;padding:2px 8px;">Area:</td><td style="padding:2px 8px;">${record.area}</td></tr>
            <tr><td style="color:#666;padding:2px 8px;">Classification:</td><td style="padding:2px 8px;">${record.classification}</td></tr>
            <tr><td style="color:#666;padding:2px 8px;">FRA Status:</td><td style="padding:2px 8px;color:${record.fraStatus.includes('Granted') ? '#4caf50' : '#ff9800'};font-weight:600;">${record.fraStatus}</td></tr>
          </table>
        </div>
      </div>
    `;
  };

  // Toggle All Plots layer
  const toggleAllPlotsLayer = async () => {
    try {
      if (!mapRef.current) return;
      
      if (allPlotsVisible) {
        // Remove all plots layer
        if (allPlotsLayerRef.current) {
          allPlotsLayerRef.current.remove();
          allPlotsLayerRef.current = null;
        }
        setAllPlotsVisible(false);
        setInfo('All plots layer hidden.');
      } else {
        // Load and display all plots
        const allRecords = await getAllLandRecords();
        
        if (allPlotsLayerRef.current) {
          allPlotsLayerRef.current.remove();
        }
        
        allPlotsLayerRef.current = L.layerGroup().addTo(mapRef.current);
        
        allRecords.forEach(record => {
          // Create proper GeoJSON feature
          const feature = {
            type: 'Feature' as const,
            properties: {
              khasraNumber: record.khasraNumber,
              ownerName: record.ownerName,
              fraStatus: record.fraStatus
            },
            geometry: record.boundaries
          };
          
          const gj = L.geoJSON(feature as any, {
            style: {
              color: record.fraStatus.includes('Granted') ? '#4caf50' : '#ff9800',
              weight: 3,
              opacity: 1,
              fillColor: record.fraStatus.includes('Granted') ? '#66bb6a' : '#ffb74d',
              fillOpacity: 0.5,
            },
            onEachFeature: (_feature, lyr) => {
              // Hover effect
              lyr.on('mouseover', () => {
                (lyr as any).setStyle({ 
                  weight: 5, 
                  fillOpacity: 0.8,
                  color: '#1976d2'
                });
                (lyr as any).bringToFront();
              });
              
              lyr.on('mouseout', () => {
                (lyr as any).setStyle({
                  color: record.fraStatus.includes('Granted') ? '#4caf50' : '#ff9800',
                  weight: 3,
                  fillOpacity: 0.5
                });
              });
              
              // Click to show details
              lyr.on('click', () => {
                const popupContent = getPlotPopupContent(record);
                (lyr as any).bindPopup(popupContent, { maxWidth: 400 }).openPopup();
                
                // Zoom to plot
                const bounds = (lyr as any).getBounds();
                if (bounds && bounds.isValid()) {
                  mapRef.current!.fitBounds(bounds, { padding: [20, 20] });
                }
              });
            }
          });
          
          gj.addTo(allPlotsLayerRef.current!);
          
          // Debug: Log each plot creation
          console.log(`Plot added: ${record.ownerName} at`, record.boundaries.coordinates[0]);
        });
        
        setAllPlotsVisible(true);
        setInfo(`All plots layer displayed: ${allRecords.length} plots loaded.`);
        
        // Debug: Log coordinates
        console.log('All records loaded:', allRecords.map(r => ({
          name: r.ownerName,
          coords: r.boundaries.coordinates[0]
        })));
        
        // Fit map to show all plots
        if (allRecords.length > 0) {
          try {
            // Calculate bounds from all coordinates
            const allCoords: [number, number][] = [];
            allRecords.forEach(record => {
              if (record.boundaries?.coordinates?.[0]) {
                record.boundaries.coordinates[0].forEach((coord: [number, number]) => {
                  allCoords.push([coord[1], coord[0]]); // Leaflet uses [lat, lng]
                });
              }
            });
            
            if (allCoords.length > 0) {
              const bounds = L.latLngBounds(allCoords);
              mapRef.current.fitBounds(bounds, { padding: [50, 50] });
            } else {
              // Fallback: zoom to central India if no coordinates
              mapRef.current.setView([21.5, 82.5], 6);
            }
          } catch (e) {
            console.warn('Could not fit bounds to all plots:', e);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to toggle all plots layer:', e);
      setError('Failed to load all plots layer.');
    }
  };

  // Refresh uploaded list when the dialog opens
  useEffect(() => {
    if (showLayersDialog) {
      loadUploadedLayers();
    }
  }, [showLayersDialog]);

  const flashHighlight = (geojson: any) => {
    try {
      if (!mapRef.current) return;
      const highlight = L.geoJSON(geojson, {
        style: { color: '#ff1744', weight: 3, dashArray: '6,4', fillOpacity: 0 }
      }).addTo(mapRef.current);
      setTimeout(() => {
        try { mapRef.current && highlight.remove(); } catch {}
      }, 4000);
    } catch {}
  };

  const getPopupHtml = (props: any, fallbackName?: string, personalInfo?: any) => {
    // Prefer a structured card if we detect standard land attributes
    const name = props?.claimantName || props?.name || props?.Name || personalInfo?.name || fallbackName || 'Area';
    const status = props?.status || props?.Status;
    const area = props?.area || props?.Area || props?.area_hectares || props?.['Area (hectares)'];
    const village = props?.village || props?.Village;
    const district = props?.district || props?.District;
    const surveyNo = props?.surveyNumber || props?.SurveyNo || props?.['Survey No'] || props?.Survey || props?.Khasra;
    const date = props?.dateSubmitted || props?.Date || props?.Created || props?.LastModified;

    // Enhanced popup with owner details and area measurement
    let ownerSection = '';
    if (personalInfo && Object.keys(personalInfo).length > 0) {
      const ownerEntries = Object.entries(personalInfo)
        .filter(([k, v]) => v && String(v).trim())
        .map(([k, v]) => {
          const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          return `<tr><td style="padding:4px 8px;color:#2196f3;font-weight:600;">${label}:</td><td style="padding:4px 8px;">${String(v)}</td></tr>`;
        }).join('');
      
      if (ownerEntries) {
        ownerSection = `
          <div style="margin:12px 0;padding:8px;background:#f5f5f5;border-radius:4px;">
            <h5 style="margin:0 0 8px 0;color:#1976d2;">📋 Owner Details</h5>
            <table style="border-collapse:collapse;font-size:12px;width:100%;">${ownerEntries}</table>
          </div>`;
      }
    }

    if (status || area || village || district || surveyNo || date) {
      return `
        <div style="min-width:280px;max-width:400px;">
          <h4 style="margin:0 0 12px 0;color:#1976d2;border-bottom:2px solid #e3f2fd;padding-bottom:4px;">🏞️ ${name}</h4>
          ${ownerSection}
          <div style="font-size:13px;line-height:1.6">
            ${status ? `<div><strong>Status:</strong> ${status}</div>` : ''}
            ${area ? `<div><strong>Area:</strong> ${area}${typeof area === 'number' ? ' hectares' : ''}</div>` : ''}
            ${village ? `<div><strong>Village:</strong> ${village}</div>` : ''}
            ${district ? `<div><strong>District:</strong> ${district}</div>` : ''}
            ${surveyNo ? `<div><strong>Survey No:</strong> ${surveyNo}</div>` : ''}
            ${date ? `<div><strong>Date:</strong> ${new Date(date).toLocaleDateString?.() || date}</div>` : ''}
          </div>
          <div style="margin-top:12px;padding:6px;background:#e8f5e8;border-radius:4px;font-size:11px;color:#2e7d32;">
            📏 <strong>Area Measurement:</strong> Click and drag to measure distances
          </div>
        </div>`;
    }

    // Fallback: show a simple table of whatever properties exist
    const entries = props && typeof props === 'object' ? Object.entries(props) : [];
    const rows = entries
      .filter(([k]) => typeof k === 'string')
      .map(([k, v]) => `<tr><td style="padding:4px 8px;color:#666;">${k}:</td><td style="padding:4px 8px;">${String(v)}</td></tr>`) 
      .join('');
    
    return `
      <div style="min-width:220px">
        <h4 style="margin:0 0 8px 0;">${name}</h4>
        ${ownerSection}
        <table style="border-collapse:collapse;font-size:12px;">${rows || '<tr><td>No attributes</td></tr>'}</table>
      </div>`;
  };

  const summarizeLayer = (layer: any) => {
    try {
      const feature = layer?.data?.features?.[0];
      const p = feature?.properties || {};
      const name = layer?.name || p?.claimantName || p?.name || p?.Name;
      const parts: string[] = [];
      if (p?.Village || p?.village) parts.push(`Village: ${p.Village || p.village}`);
      if (p?.District || p?.district) parts.push(`District: ${p.District || p.district}`);
      if (p?.area || p?.Area) parts.push(`Area: ${p.area || p.Area}`);
      return { name, subtitle: parts.join(' • '), props: p };
    } catch { return { name: layer?.name || 'Layer', subtitle: '', props: {} }; }
  };

  const handleDeleteLayer = async (id: string) => {
    try {
      await geojsonPlotAPI.deleteLayer(id);
      await loadUploadedLayers();
    } catch {}
  };

  const handleExportLayer = async (id: string) => {
    try {
      const res = await geojsonPlotAPI.exportLayer(id, 'geojson');
      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${id}.geojson.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {}
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
                <span data-translate>FRA Atlas - Free Mapping</span>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <span data-translate>Professional satellite mapping with Leaflet & Esri imagery</span>
              </Typography>
            </Box>
          </Box>
          
          <Stack direction="row" spacing={1}>
            <Chip 
              label={<span data-translate>{`${filteredData.length} Claims`}</span>} 
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
            <AlertTitle><span data-translate>Error</span></AlertTitle>
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
              <Typography variant="h6" fontWeight="bold"><span data-translate>Map Controls</span></Typography>
              <IconButton onClick={() => setShowControls(false)} size="small">
                <Close />
              </IconButton>
            </Box>

            {/* Map Style Selection */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom><span data-translate>Map Style</span></Typography>
                <Stack spacing={1}>
                  <Button
                    variant={currentMapStyle === 'satellite' ? 'contained' : 'outlined'}
                    startIcon={<Satellite />}
                    onClick={() => changeMapStyle('satellite')}
                    fullWidth
                  >
                    <span data-translate>Satellite</span>
                  </Button>
                  <Button
                    variant={currentMapStyle === 'terrain' ? 'contained' : 'outlined'}
                    startIcon={<Terrain />}
                    onClick={() => changeMapStyle('terrain')}
                    fullWidth
                  >
                    <span data-translate>Terrain</span>
                  </Button>
                  <Button
                    variant={currentMapStyle === 'osm' ? 'contained' : 'outlined'}
                    startIcon={<MapIcon />}
                    onClick={() => changeMapStyle('osm')}
                    fullWidth
                  >
                    <span data-translate>OpenStreetMap</span>
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Layer Controls */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom><span data-translate>Layers</span></Typography>
                <Stack spacing={1}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={layerVisibility.fraGranted}
                        onChange={() => toggleLayerVisibility('fraGranted')}
                      />
                    }
                    label={<span data-translate>FRA Granted</span>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={layerVisibility.fraPotential}
                        onChange={() => toggleLayerVisibility('fraPotential')}
                      />
                    }
                    label={<span data-translate>FRA Potential</span>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={layerVisibility.boundaries}
                        onChange={() => toggleLayerVisibility('boundaries')}
                      />
                    }
                    label={<span data-translate>Boundaries</span>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={layerVisibility.forests}
                        onChange={() => toggleLayerVisibility('forests')}
                      />
                    }
                    label={<span data-translate>Forest Areas</span>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={allPlotsVisible}
                        onChange={toggleAllPlotsLayer}
                      />
                    }
                    label={<span data-translate>All Land Plots</span>}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom><span data-translate>Filters</span></Typography>
                <Stack spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel><span data-translate>Status</span></InputLabel>
                    <Select
                      value={selectedFilters.status}
                      label="Status"
                      onChange={(e) => setSelectedFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <MenuItem value="all"><span data-translate>All Status</span></MenuItem>
                      <MenuItem value="granted"><span data-translate>Granted</span></MenuItem>
                      <MenuItem value="potential"><span data-translate>Potential</span></MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth size="small">
                    <InputLabel><span data-translate>District</span></InputLabel>
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
            <Tooltip title="Uploaded Data (Data Management)">
              <Fab size="small" color="default" onClick={() => setShowLayersDialog(true)}>
                <ListIcon />
              </Fab>
            </Tooltip>
            <Tooltip title="Bhunaksha Land Records">
              <Fab size="small" color="secondary" onClick={() => setShowBhunakshaSearch(true)}>
                <MapIcon />
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
            
            {persistentLayerRef.current && (
              <Tooltip title="Remove Persistent Layer">
                <Fab size="small" color="error" onClick={removePersistentLayer}>
                  <Close />
                </Fab>
              </Tooltip>
            )}
          </Box>

          {/* Persistent Layer Info Panel */}
          {persistentLayerInfo && Object.keys(persistentLayerInfo).length > 0 && (
            <Paper className="persistent-layer-info" sx={{ 
              position: 'absolute', 
              top: 80, 
              right: 16, 
              p: 2, 
              bgcolor: 'rgba(255,255,255,0.95)', 
              border: '2px solid #ff4444',
              borderRadius: 2,
              boxShadow: 3,
              zIndex: 1000,
              maxWidth: 250
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" color="error" fontWeight="bold">
                  📍 Active Layer
                </Typography>
                <IconButton size="small" onClick={removePersistentLayer}>
                  <Close fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="body2" fontWeight="600" gutterBottom>
                {persistentLayerInfo.name || 'Uploaded Plot'}
              </Typography>
              {persistentLayerInfo.village && (
                <Typography variant="caption" display="block">
                  📍 {persistentLayerInfo.village}, {persistentLayerInfo.district}
                </Typography>
              )}
              {persistentLayerInfo.area && (
                <Typography variant="caption" display="block">
                  📐 Area: {persistentLayerInfo.area}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Click on plot for detailed information
              </Typography>
            </Paper>
          )}

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
      {/* Bhunaksha Search Dialog */}
      <Dialog open={showBhunakshaSearch} onClose={() => setShowBhunakshaSearch(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MapIcon />
            Bhunaksha FRA - Land Records Search
          </Box>
        </DialogTitle>
        <DialogContent>
          <BhunakshaSearch onPlotSelect={handleBhunakshaPlotSelect} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBhunakshaSearch(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Uploaded Layers Dialog */}
      <Dialog open={showLayersDialog} onClose={() => setShowLayersDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ListIcon />
            Uploaded Data (Data Management)
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {uploadedLayers.length === 0 ? (
            <Typography color="text.secondary">No uploaded data found.</Typography>
          ) : (
            <List>
              {uploadedLayers.map((l: any) => {
                const meta = summarizeLayer(l);
                return (
                  <ListItem
                    key={l.id}
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="outlined" onClick={() => {
                          try {
                            if (!mapRef.current) return;
                            const gj = L.geoJSON(l.data);
                            const b = (gj as any).getBounds?.();
                            if (b && b.isValid()) {
                              mapRef.current.fitBounds(b, { padding: [20, 20] });
                            }
                            // Open a popup at the center with summarized props
                            const center = b?.getCenter?.();
                            if (center) {
                              const layerProps = l?.data?.features?.[0]?.properties || {};
                              const html = getPopupHtml(layerProps, meta.name);
                              L.popup({ autoClose: true })
                                .setLatLng(center)
                                .setContent(html)
                                .openOn(mapRef.current);
                            }
                            gj.remove();
                            setShowLayersDialog(false);
                            // Also draw a visible dashed highlight
                            const highlight = L.geoJSON(l.data, { style: { color: '#ff1744', weight: 3, dashArray: '6,4', fillOpacity: 0 } }).addTo(mapRef.current);
                            setTimeout(() => { try { mapRef.current && highlight.remove(); } catch {} }, 5000);
                          } catch {}
                        }}>Focus</Button>
                        <Button size="small" onClick={() => handleExportLayer(l.id)}>Export</Button>
                        <Button size="small" color="error" onClick={() => handleDeleteLayer(l.id)}>Delete</Button>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={meta.name || l.name}
                      secondary={meta.subtitle || `Features: ${l.data?.features?.length ?? 0}`}
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLayersDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

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
        {persistentLayerRef.current && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: '#ff6666', opacity: 0.4, border: '2px solid #ff4444', borderRadius: 1 }} />
            <Typography variant="body2">Uploaded Data</Typography>
          </Box>
        )}
        {allPlotsVisible && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: '#66bb6a', opacity: 0.3, border: '2px solid #4caf50', borderRadius: 1 }} />
            <Typography variant="body2">All Land Plots</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default FRAAtlas;
