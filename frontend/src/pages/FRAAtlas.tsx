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
import '../styles/fraLayers.css';
import '../styles/liveData.css';
import FRALayerManager from '../components/FRALayerManager';
import { loadAllFRAData } from '../utils/dataFetcher';
import { loadRealFRAData } from '../services/realFRAData';
import { loadLocalFRAData, setCachedData, getCachedData } from '../data/localData';
import { fetchAndSaveRealData } from '../scripts/fetchRealData';
import { fetchRealStateBoundaries, fetchRealDistrictBoundaries } from '../services/realBoundaries';
import { fetchRealForestAreas } from '../services/realForestData';
import { geojsonPlotAPI } from '../services/api';
import BhunakshaSearch from '../components/BhunakshaSearch';
import { LandRecord, getAllLandRecords } from '../services/bhunakshaService';
import { pattaHoldersAPI } from '../services/pattaHoldersAPI';
import { usePageTranslation } from '../hooks/usePageTranslation';
import { useAuth } from '../contexts/AuthContext';
import PattaReportModal from '../components/PattaReportModal';

// Load data - try real data first, then permanent files
const loadPermanentData = async () => {
  try {
    // Check if we have real cached data
    const realBoundaries = localStorage.getItem('real_boundaries');
    const realForests = localStorage.getItem('real_forests');
    
    if (!realBoundaries || !realForests) {
      // Fetch real data in background
      fetchAndSaveRealData();
    }
    
    const [granted, potential, boundaries, forests] = await Promise.all([
      fetch('/data/fra-granted.geojson').then(r => r.json()),
      fetch('/data/fra-potential.geojson').then(r => r.json()),
      realBoundaries ? Promise.resolve(JSON.parse(realBoundaries)) : fetch('/data/state-boundaries.geojson').then(r => r.json()),
      realForests ? Promise.resolve(JSON.parse(realForests)) : fetch('/data/fra-states-forest-data.geojson').then(r => r.json())
    ]);
    
    return { fraGranted: granted, fraPotential: potential, boundaries, forestAreas: forests };
  } catch (error) {
    console.warn('Failed to load data, using fallback');
    return loadLocalFRAData();
  }
};

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
  // usePageTranslation(); // Translation disabled
  const { user } = useAuth();

  // Convert cached data to FRAData format
  const convertToFRAData = (data: any): FRAData[] => {
    const converted: FRAData[] = [];
    
    // Convert granted claims
    data.fraGranted?.features?.forEach((f: any) => {
      converted.push({
        id: f.properties.id,
        claimantName: f.properties.claimantName,
        area: f.properties.area,
        status: 'granted' as const,
        coordinates: f.geometry.coordinates[0].map((coord: number[]) => [coord[0], coord[1]] as [number, number]),
        village: f.properties.village,
        district: f.properties.district,
        state: f.properties.state,
        dateSubmitted: f.properties.dateGranted,
        surveyNumber: f.properties.id
      });
    });
    
    // Convert potential claims
    data.fraPotential?.features?.forEach((f: any) => {
      converted.push({
        id: f.properties.id,
        claimantName: f.properties.claimantName,
        area: f.properties.area,
        status: 'potential' as const,
        coordinates: f.geometry.coordinates[0].map((coord: number[]) => [coord[0], coord[1]] as [number, number]),
        village: f.properties.village,
        district: f.properties.district,
        state: f.properties.state,
        dateSubmitted: f.properties.dateSubmitted,
        surveyNumber: f.properties.id
      });
    });
    
    return converted;
  };
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const uploadedLayersRef = useRef<L.LayerGroup | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
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
    forests: true,
    pattaHolders: true,
    waterBodies: true
  });

  // Layer references
  const fraGrantedLayerRef = useRef<L.LayerGroup | null>(null);
  const fraPotentialLayerRef = useRef<L.LayerGroup | null>(null);
  const boundariesLayerRef = useRef<L.LayerGroup | null>(null);
  const forestsLayerRef = useRef<L.LayerGroup | null>(null);
  const pattaHoldersLayerRef = useRef<L.LayerGroup | null>(null);
  const waterBodiesLayerRef = useRef<L.LayerGroup | null>(null);

  // OCR and NER states
  const [showOCRDialog, setShowOCRDialog] = useState(false);
  const [showNERDialog, setShowNERDialog] = useState(false);
  const [ocrResults, setOcrResults] = useState<any>(null);
  const [nerResults, setNerResults] = useState<any>(null);
  const [processingOCR, setProcessingOCR] = useState(false);
  const [processingNER, setProcessingNER] = useState(false);
  const [showLayersDialog, setShowLayersDialog] = useState(false);
  const [uploadedLayers, setUploadedLayers] = useState<any[]>([]);
  const [backendPattaHolders, setBackendPattaHolders] = useState<any[]>([]);
  const uploadedLayerBoundsRef = useRef<L.LatLngBounds | null>(null);
  const [showBhunakshaSearch, setShowBhunakshaSearch] = useState(false);
  const bhunakshaLayerRef = useRef<L.LayerGroup | null>(null);
  const allPlotsLayerRef = useRef<L.LayerGroup | null>(null);
  const [allPlotsVisible, setAllPlotsVisible] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedPattaId, setSelectedPattaId] = useState<string>('');
  const [selectedOwnerName, setSelectedOwnerName] = useState<string>('');
  const [realTimeStats, setRealTimeStats] = useState({
    totalClaims: 0,
    grantedClaims: 0,
    pendingClaims: 0,
    lastUpdated: new Date()
  });


  // Get map configuration based on user role and location
  const getMapConfigForUser = () => {
    if (!user) {
      return {
        center: [21.5, 82.5] as [number, number],
        zoom: 6,
        bounds: [[6.0, 68.0], [37.0, 97.0]] as [[number, number], [number, number]]
      };
    }

    // State-level bounds and centers (tight bounds - only show the state)
    const stateConfigs = {
      'Madhya Pradesh': {
        center: [23.0, 78.0] as [number, number],
        zoom: 7,
        bounds: [[21.2, 74.5], [25.8, 81.5]] as [[number, number], [number, number]]
      },
      'Tripura': {
        center: [23.8, 91.3] as [number, number],
        zoom: 10,
        bounds: [[23.0, 91.1], [24.4, 92.3]] as [[number, number], [number, number]]
      },
      'Odisha': {
        center: [20.5, 85.0] as [number, number],
        zoom: 7,
        bounds: [[18.0, 81.5], [22.4, 87.3]] as [[number, number], [number, number]]
      },
      'Telangana': {
        center: [18.0, 79.5] as [number, number],
        zoom: 8,
        bounds: [[16.0, 77.5], [19.8, 81.5]] as [[number, number], [number, number]]
      }
    };

    // District-level bounds (tight bounds - only show the district)
    const districtConfigs = {
      'Bhopal': { center: [23.2599, 77.4126] as [number, number], zoom: 11, bounds: [[23.1, 77.1], [23.4, 77.7]] as [[number, number], [number, number]] },
      'Indore': { center: [22.7196, 75.8577] as [number, number], zoom: 11, bounds: [[22.5, 75.6], [22.9, 76.1]] as [[number, number], [number, number]] },
      'West Tripura': { center: [23.8315, 91.2868] as [number, number], zoom: 11, bounds: [[23.7, 91.1], [23.9, 91.5]] as [[number, number], [number, number]] },
      'Khordha': { center: [20.1498, 85.6597] as [number, number], zoom: 11, bounds: [[20.0, 85.4], [20.3, 85.9]] as [[number, number], [number, number]] },
      'Hyderabad': { center: [17.3850, 78.4867] as [number, number], zoom: 11, bounds: [[17.3, 78.3], [17.5, 78.7]] as [[number, number], [number, number]] }
    };

    // Role-based configuration
    if (user.role === 'district_admin' && user.district) {
      return districtConfigs[user.district as keyof typeof districtConfigs] || 
             stateConfigs[user.state as keyof typeof stateConfigs] || 
             { center: [21.5, 82.5] as [number, number], zoom: 6, bounds: [[6.0, 68.0], [37.0, 97.0]] as [[number, number], [number, number]] };
    }
    
    if (user.role === 'state_admin' && user.state) {
      return stateConfigs[user.state as keyof typeof stateConfigs] || 
             { center: [21.5, 82.5] as [number, number], zoom: 6, bounds: [[6.0, 68.0], [37.0, 97.0]] as [[number, number], [number, number]] };
    }
    
    if (user.role === 'user' && user.district) {
      return districtConfigs[user.district as keyof typeof districtConfigs] || 
             stateConfigs[user.state as keyof typeof stateConfigs] || 
             { center: [21.5, 82.5] as [number, number], zoom: 6, bounds: [[6.0, 68.0], [37.0, 97.0]] as [[number, number], [number, number]] };
    }

    // Default for admin and mota_technical - full India view
    return {
      center: [21.5, 82.5] as [number, number],
      zoom: 6,
      bounds: [[6.0, 68.0], [37.0, 97.0]] as [[number, number], [number, number]]
    };
  };

  // Filter FRA data based on user role and location
  const filterDataForUser = (data: FRAData[]) => {
    if (!user) return data;

    // Admin can see all data
    if (user.role === 'admin') {
      return data;
    }

    // State admin can see only their state data
    if (user.role === 'state_admin' && user.state) {
      return data.filter(item => item.state === user.state);
    }

    // District admin can see only their district data
    if (user.role === 'district_admin' && user.district) {
      return data.filter(item => item.district === user.district);
    }

    // Users can see only their district data
    if (user.role === 'user' && user.district) {
      return data.filter(item => item.district === user.district);
    }

    return data;
  };

  // Apply filters and update map
  const applyFiltersAndUpdateMap = () => {
    let filtered = [...fraData];

    // Apply status filter
    if (selectedFilters.status !== 'all') {
      filtered = filtered.filter(item => item.status === selectedFilters.status);
    }

    // Apply district filter
    if (selectedFilters.district !== 'all') {
      filtered = filtered.filter(item => item.district === selectedFilters.district);
    }

    setFilteredData(filtered);
    updateMapLayers(filtered);
  };

  // Update map layers with filtered data
  const updateMapLayers = (data: FRAData[]) => {
    if (!mapRef.current) {
      console.warn('Map not ready for plotting');
      return;
    }

    // Initialize layers if not exists
    if (!fraGrantedLayerRef.current) {
      fraGrantedLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }
    if (!fraPotentialLayerRef.current) {
      fraPotentialLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    // Clear existing layers
    fraGrantedLayerRef.current.clearLayers();
    fraPotentialLayerRef.current.clearLayers();

    console.log('🗺️ Plotting', data.length, 'claims on map');

    data.forEach((item, index) => {
      try {
        // Convert coordinates properly (lat, lng format for Leaflet)
        const coordinates = item.coordinates.map(coord => [coord[0], coord[1]] as [number, number]);
        
        const polygon = L.polygon(coordinates, {
          color: item.status === 'granted' ? '#1b5e20' : '#ff6f00',
          fillColor: item.status === 'granted' ? '#2e7d32' : '#ff9800',
          fillOpacity: item.status === 'granted' ? 0.6 : 0.4,
          weight: 3
        });
        
        console.log(`Plotting claim ${index + 1}:`, item.claimantName, 'at', coordinates[0]);

      const statusClass = item.status === 'granted' ? 'status-granted' : 'status-potential';
      const isRealTime = item.id.startsWith('FRA');
      polygon.bindPopup(`
        <div>
          ${isRealTime ? '<div class="popup-header"><span class="live-indicator">🔴 LIVE</span> Government FRA Data</div>' : ''}
          <div class="popup-section">
            <h5>Claimant Details</h5>
            <table class="popup-table">
              <tr><td>Name</td><td>${item.claimantName}</td></tr>
              <tr><td>Village</td><td>${item.village}</td></tr>
              <tr><td>District</td><td>${item.district}</td></tr>
              <tr><td>State</td><td>${item.state}</td></tr>
            </table>
          </div>
          <div class="popup-section">
            <h5>Land Details</h5>
            <table class="popup-table">
              <tr><td>Survey No</td><td>${item.surveyNumber || 'N/A'}</td></tr>
              <tr><td>Area</td><td>${item.area} hectares</td></tr>
              <tr><td>Status</td><td><span class="status-chip ${statusClass}">${item.status.toUpperCase()}</span></td></tr>
              <tr><td>Submitted</td><td>${new Date(item.dateSubmitted).toLocaleDateString()}</td></tr>
              ${isRealTime ? `<tr><td>Source</td><td>Ministry of Tribal Affairs</td></tr>` : ''}
            </table>
          </div>
          ${isRealTime ? '<div class="popup-footer">Real-time data from Government of India</div>' : ''}
        </div>
      `, { className: 'custom-popup' });

        // Add to appropriate layer group
        if (item.status === 'granted') {
          polygon.addTo(fraGrantedLayerRef.current!);
        } else {
          polygon.addTo(fraPotentialLayerRef.current!);
        }
      } catch (error) {
        console.error('Error plotting claim:', item.id, error);
      }
    });
    
    console.log('✅ Successfully plotted', data.length, 'FRA claims');
    
    // Auto-zoom disabled - map stays at current position
  };

  // Add base layers to map
  const addBaseLayers = (map: L.Map) => {
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
      maxZoom: 19
    });

    const labelsLayer = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      attribution: '',
      maxZoom: 19
    });

    satelliteLayer.addTo(map);
    labelsLayer.addTo(map);
  };

  // Add user-specific boundary overlay
  const addUserBoundaryOverlay = (map: L.Map) => {
    // No popup or overlay needed - map bounds already restrict the view
    return;
  };

  // Initialize map
  useEffect(() => {
    if (containerRef.current && !mapRef.current && !mapInitialized) {
      const { center, zoom, bounds } = getMapConfigForUser();
      
      // Initialize map with strict bounds - only show user's area
      const map = L.map(containerRef.current, {
        center,
        zoom,
        minZoom: zoom - 1,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: true,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0
      });

      // Add base layers
      addBaseLayers(map);
      
      // Add geographic boundary overlay for user's area
      addUserBoundaryOverlay(map);

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
      // Expose mapRef to window for popup controls
      (window as any).mapRef = mapRef;
      // Expose report function to window for popup buttons
      (window as any).openPattaReport = (pattaId: string, ownerName: string) => {
        setSelectedPattaId(pattaId);
        setSelectedOwnerName(ownerName);
        setReportModalOpen(true);
      };
      setMapLoaded(true);
      setMapInitialized(true);
      setLoading(false);

      // Initialize layer groups first
      fraGrantedLayerRef.current = L.layerGroup().addTo(map);
      fraPotentialLayerRef.current = L.layerGroup().addTo(map);
      boundariesLayerRef.current = L.layerGroup();
      forestsLayerRef.current = L.layerGroup();
      pattaHoldersLayerRef.current = L.layerGroup();
      waterBodiesLayerRef.current = L.layerGroup();
      
      // Load FRA data
      loadFRAData();


    }

    return () => {
      // Only cleanup on actual unmount, not on re-renders
    };
  }, [user]); // Only re-initialize if user changes

  // Load patta holders data when map is ready
  useEffect(() => {
    if (mapLoaded && layerVisibility.pattaHolders) {
      setTimeout(() => {
        console.log('🔄 Auto-loading patta holders on map ready...');
        loadPattaHoldersData();
      }, 1000);
    }
  }, [mapLoaded]);

  // Load FRA data
  const loadFRAData = async () => {
    if (fraData.length > 0) return; // Don't reload if data already exists
    try {
      setLoading(true);
      
      // Try to load real government FRA data first
      try {
        const { realFRADataService } = await import('../services/realFRADataService');
        const realClaims = await realFRADataService.fetchRealFRAClaims();
        console.log('✅ Loaded real FRA claims:', realClaims.length);
        
        const convertedRealData = realClaims.map(claim => {
          console.log('Converting claim:', claim.id, 'coordinates:', claim.coordinates);
          return {
            id: claim.id,
            claimantName: claim.claimantName,
            area: claim.area,
            status: claim.status === 'granted' || claim.status === 'approved' ? 'granted' as const : 'potential' as const,
            coordinates: claim.coordinates,
            village: claim.village,
            district: claim.district,
            state: claim.state,
            dateSubmitted: claim.dateSubmitted,
            surveyNumber: claim.surveyNumber
          };
        });
        
        const filteredRealData = filterDataForUser(convertedRealData);
        setFraData(filteredRealData);
        setFilteredData(filteredRealData);
        updateMapLayers(filteredRealData);
        console.log('🗺️ Plotting', filteredRealData.length, 'FRA claims on map');
        
        // Update real-time stats
        setRealTimeStats({
          totalClaims: filteredRealData.length,
          grantedClaims: filteredRealData.filter(item => item.status === 'granted').length,
          pendingClaims: filteredRealData.filter(item => item.status === 'potential').length,
          lastUpdated: new Date()
        });
        
        // setInfo(`Loaded ${filteredRealData.length} real FRA claims from government sources`);
        setLoading(false);
        
        // Start real-time updates
        realFRADataService.startRealTimeUpdates((updatedClaims) => {
          const convertedUpdatedData = updatedClaims.map(claim => ({
            id: claim.id,
            claimantName: claim.claimantName,
            area: claim.area,
            status: claim.status === 'granted' || claim.status === 'approved' ? 'granted' as const : 'potential' as const,
            coordinates: claim.coordinates,
            village: claim.village,
            district: claim.district,
            state: claim.state,
            dateSubmitted: claim.dateSubmitted,
            surveyNumber: claim.surveyNumber
          }));
          
          const filteredUpdatedData = filterDataForUser(convertedUpdatedData);
          setFraData(filteredUpdatedData);
          setFilteredData(filteredUpdatedData);
          updateMapLayers(filteredUpdatedData);
          console.log('🗺️ Updated map with', filteredUpdatedData.length, 'FRA claims');
          
          // Update real-time stats
          setRealTimeStats({
            totalClaims: filteredUpdatedData.length,
            grantedClaims: filteredUpdatedData.filter(item => item.status === 'granted').length,
            pendingClaims: filteredUpdatedData.filter(item => item.status === 'potential').length,
            lastUpdated: new Date()
          });
          
          console.log('🔄 Real-time FRA data updated:', filteredUpdatedData.length);
        });
        
        return;
      } catch (realDataError) {
        console.warn('⚠️ Real FRA data unavailable, falling back to permanent files:', realDataError);
      }
      
      // Load from permanent GeoJSON files as fallback
      const permanentData = await loadPermanentData();
      console.log('✅ Using permanent GeoJSON files');
      const filteredMockData = filterDataForUser(convertToFRAData(permanentData));
      setFraData(filteredMockData);
      setFilteredData(filteredMockData);
      updateMapLayers(filteredMockData);
      setLoading(false);
      return;
      
      // Try to load real government data
      try {
        const realData = await loadRealFRAData();
        console.log('✅ Real FRA data loaded from government APIs');
        setCachedData(realData); // Cache the data
        
        // Convert and use real data
        const convertedRealData: FRAData[] = [
          ...realData.fraGranted.features.map((f: any) => ({
            id: f.properties.id,
            claimantName: f.properties.claimantName,
            area: f.properties.area,
            status: 'granted' as const,
            coordinates: f.geometry.coordinates[0].map((coord: number[]) => [coord[0], coord[1]] as [number, number]),
            village: f.properties.village,
            district: f.properties.district,
            state: f.properties.state,
            dateSubmitted: f.properties.dateGranted,
            surveyNumber: f.properties.id
          })),
          ...realData.fraPotential.features.map((f: any) => ({
            id: f.properties.id,
            claimantName: f.properties.claimantName,
            area: f.properties.area,
            status: 'potential' as const,
            coordinates: f.geometry.coordinates[0].map((coord: number[]) => [coord[0], coord[1]] as [number, number]),
            village: f.properties.village,
            district: f.properties.district,
            state: f.properties.state,
            dateSubmitted: f.properties.dateSubmitted,
            surveyNumber: f.properties.id
          }))
        ];
        
        const realMockData = filterDataForUser(convertedRealData);
        setFraData(realMockData);
        setFilteredData(realMockData);
        updateMapLayers(realMockData);
        return;
      } catch (error) {
        console.warn('⚠️ Real data unavailable, using local data:', error);
        const localData = loadLocalFRAData();
        setCachedData(localData);
      }
      // Simulate API call - replace with actual API endpoint
      const allMockData: FRAData[] = [
        {
          id: '1',
          claimantName: 'Ramsingh Gond',
          area: 2.5,
          status: 'granted',
          coordinates: [[21.8047, 80.1847], [21.8057, 80.1847], [21.8057, 80.1857], [21.8047, 80.1857]],
          village: 'Khairlanji',
          district: 'Bhopal',
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
          district: 'West Tripura',
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
          district: 'Cuttack',
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
          district: 'Hyderabad',
          state: 'Telangana',
          dateSubmitted: '2024-01-05',
          surveyNumber: 'TG004'
        }
      ];
      
      // Use local data as fallback
      const localData = loadLocalFRAData();
      const localMockData = convertToFRAData(localData);
      const finalMockData = filterDataForUser(localMockData);
      
      setFraData(finalMockData);
      setFilteredData(finalMockData);
      
      // Initialize layer groups
      fraGrantedLayerRef.current = L.layerGroup().addTo(mapRef.current);
      fraPotentialLayerRef.current = L.layerGroup().addTo(mapRef.current);
      boundariesLayerRef.current = L.layerGroup();
      forestsLayerRef.current = L.layerGroup();
      pattaHoldersLayerRef.current = L.layerGroup();
      waterBodiesLayerRef.current = L.layerGroup();

      // Add layers based on visibility
      if (layerVisibility.boundaries) {
        boundariesLayerRef.current.addTo(mapRef.current);
      }
      if (layerVisibility.forests) {
        forestsLayerRef.current.addTo(mapRef.current);
        addForestsLayer();
      }
      if (layerVisibility.pattaHolders) {
        pattaHoldersLayerRef.current.addTo(mapRef.current);
        loadPattaHoldersData(); // Load patta holders data by default
      }
      if (layerVisibility.waterBodies) {
        waterBodiesLayerRef.current = L.layerGroup();
        waterBodiesLayerRef.current.addTo(mapRef.current);
        addWaterBodiesLayer();
      }

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

          const statusClass = item.status === 'granted' ? 'status-granted' : 'status-potential';
          polygon.bindPopup(`
            <div>
              <div class="popup-section">
                <h5>Claimant Details</h5>
                <table class="popup-table">
                  <tr><td>Name</td><td>${item.claimantName}</td></tr>
                  <tr><td>Village</td><td>${item.village}</td></tr>
                  <tr><td>District</td><td>${item.district}</td></tr>
                  <tr><td>State</td><td>${item.state}</td></tr>
                </table>
              </div>
              
              <div class="popup-section">
                <h5>Land Details</h5>
                <table class="popup-table">
                  <tr><td>Survey No</td><td>${item.surveyNumber || 'N/A'}</td></tr>
                  <tr><td>Area</td><td>${item.area} hectares</td></tr>
                  <tr><td>Status</td><td><span class="status-chip ${statusClass}">${item.status}</span></td></tr>
                  <tr><td>Date</td><td>${new Date(item.dateSubmitted).toLocaleDateString()}</td></tr>
                </table>
              </div>
            </div>
          `, { className: 'custom-popup' });
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

        // Add sample boundaries layer
        addBoundariesLayer();
      };
      
      updateMapLayers(finalMockData);
      
      // Load patta holders data immediately
      if (layerVisibility.pattaHolders && pattaHoldersLayerRef.current) {
        await loadPattaHoldersData();
      }
      
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
        color: '#e91e63',
        fillColor: '#f48fb1',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '5,5'
      });

      const boundaryPopup = `
        <div>
          <div class="popup-header">
            <h4>${boundary.name}</h4>
          </div>
          <div class="popup-section">
            <h5>Boundary Details</h5>
            <table class="popup-table">
              <tr><td>Type</td><td>Administrative Boundary</td></tr>
            </table>
          </div>
        </div>
      `;
      polygon.bindPopup(boundaryPopup, { className: 'custom-popup' });
      polygon.addTo(boundariesLayerRef.current!);
    });
  };

  // Load patta holders data from backend API
  const loadPattaHoldersData = async () => {
    try {
      if (!mapRef.current || !pattaHoldersLayerRef.current) return;

      pattaHoldersLayerRef.current.clearLayers();

      // Load from backend API first, fallback to localStorage
      let records = [];
      try {
        const response = await pattaHoldersAPI.getAll();
        if (response.success && response.data) {
          records = response.data;
          console.log('✅ Loaded patta holders from backend API:', records.length);
        }
      } catch (error) {
        console.warn('⚠️ Failed to load from backend, trying localStorage:', error);
        // Fallback to localStorage
        const saved = localStorage.getItem('pattaHolders');
        if (saved) {
          records = JSON.parse(saved);
          console.log('✅ Loaded patta holders from localStorage:', records.length);
        } else {
          console.warn('⚠️ No patta holders data found in localStorage either');
        }
      }
      
      console.log('🔍 Total patta holders to display:', records.length);
      
      if (records.length === 0) {
        console.log('⚠️ No patta holders found, checking uploaded layers...');
        return;
      }

      if (records.length > 0) {
        const geojson = {
          type: 'FeatureCollection',
          features: records.map((record: any) => ({
            type: 'Feature',
            properties: {
              ownerName: record.ownerName,
              fatherName: record.fatherName,
              village: record.address?.village || 'N/A',
              district: record.address?.district || 'N/A',
              state: record.address?.state || 'N/A',
              surveyNo: record.landDetails?.surveyNo || 'N/A',
              khasra: record.landDetails?.khasra || 'N/A',
              area: record.landDetails?.area?.hectares || 0,
              classification: record.landDetails?.classification || 'N/A',
              fraStatus: record.landDetails?.fraStatus || 'N/A',
              created: record.created
            },
            geometry: record.geometry || {
              type: 'Polygon',
              coordinates: [record.coordinates || []]
            }
          }))
        };
        
        geojson.features.forEach((feature: any, index: number) => {
          const props = feature.properties;
          const recordId = records[index]?.id || `patta_${index}`;
          
          let coordinates: [number, number][];
          if (feature.geometry.type === 'Polygon') {
            coordinates = feature.geometry.coordinates[0].map((coord: [number, number]) => [coord[1], coord[0]]);
          } else if (feature.geometry.type === 'Point') {
            // Create a small square around the point
            const [lng, lat] = feature.geometry.coordinates;
            const offset = 0.001;
            coordinates = [
              [lat - offset, lng - offset],
              [lat - offset, lng + offset],
              [lat + offset, lng + offset],
              [lat + offset, lng - offset]
            ];
          } else {
            console.warn('Skipping unsupported geometry type:', feature.geometry.type);
            return; // Skip unsupported geometry types
          }

          const polygon = L.polygon(coordinates, {
            color: props.fraStatus?.includes('Granted') ? '#4caf50' : '#ff9800',
            fillColor: props.fraStatus?.includes('Granted') ? '#66bb6a' : '#ffb74d',
            fillOpacity: 0.6,
            weight: 3
          });

          const statusClass = props.fraStatus?.includes('Granted') ? 'status-granted' : 'status-potential';
          const escapeHtml = (text: string) => {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
          };
          
          const popupContent = `
            <div>
              <div class="popup-header">
                <h4>🏠 ${escapeHtml(props.ownerName || '')}</h4>
              </div>
              
              <div class="popup-section">
                <h5>Owner Details</h5>
                <table class="popup-table">
                  <tr><td>Father</td><td>${escapeHtml(props.fatherName || 'N/A')}</td></tr>
                  <tr><td>Village</td><td>${escapeHtml(props.village || '')}</td></tr>
                  <tr><td>District</td><td>${escapeHtml(props.district || '')}</td></tr>
                  <tr><td>State</td><td>${escapeHtml(props.state || '')}</td></tr>
                </table>
              </div>
              
              <div class="popup-section">
                <h5>Land Details</h5>
                <table class="popup-table">
                  <tr><td>Survey No</td><td>${escapeHtml(props.surveyNo || '')}</td></tr>
                  <tr><td>Khasra</td><td>${escapeHtml(props.khasra || '')}</td></tr>
                  <tr><td>Area</td><td>${escapeHtml(String(props.area || 0))} hectares</td></tr>
                  <tr><td>Classification</td><td>${escapeHtml(props.classification || '')}</td></tr>
                  <tr><td>FRA Status</td><td><span class="status-chip ${statusClass}">${escapeHtml(props.fraStatus || '')}</span></td></tr>
                  <tr><td>Created</td><td>${escapeHtml(new Date(props.created).toLocaleDateString())}</td></tr>
                </table>
              </div>
              
              <div class="popup-section" style="border-top: 1px solid #e0e0e0; padding-top: 12px; margin-top: 12px;">
                <button 
                  onclick="window.openPattaReport('${escapeHtml(recordId)}', '${escapeHtml(props.ownerName || '')}')"
                  style="
                    width: 100%;
                    background: #f8f9fa;
                    color: #1976d2;
                    border: 1px solid #1976d2;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 12px;
                    font-family: inherit;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    transition: all 0.2s ease;
                  "
                  onmouseover="this.style.background='#1976d2'; this.style.color='white'"
                  onmouseout="this.style.background='#f8f9fa'; this.style.color='#1976d2'"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                  </svg>
                  Generate Report
                </button>
              </div>
            </div>
          `;

          polygon.bindPopup(popupContent, { className: 'custom-popup' });
          polygon.on('click', () => {
            try {
              const b = polygon.getBounds();
              if (b && b.isValid() && mapRef.current) {
                mapRef.current.fitBounds(b, { padding: [16, 16] });
              }
            } catch {}
          });

          polygon.addTo(pattaHoldersLayerRef.current!);
          
          // Ensure patta holders are visible
          polygon.bringToFront();
        });

        console.log('✅ Displayed patta holder records on map:', geojson.features.length);
      } else {
        console.warn('⚠️ No patta holders data available to display');
        // Force reload from Digital GIS Plot if no data found
        console.log('🔄 Attempting to reload from uploaded layers...');
        await loadUploadedLayers();
      }
    } catch (error) {
      console.error('❌ Failed to load patta holders data:', error);
    }
  };

  // Add forests layer - Load from fra-states-forest-data.geojson only
  const addForestsLayer = async () => {
    if (!mapRef.current || !forestsLayerRef.current) return;

    forestsLayerRef.current.clearLayers();

    try {
      const fraStatesForest = await fetch('/data/fra-states-forest-data.geojson').then(r => r.json());
      const forestFeatures = fraStatesForest.features || [];

      console.log('Loading forest areas:', forestFeatures.length);

      forestFeatures.forEach((feature: any) => {
        const props = feature.properties;
        const geometry = feature.geometry;

        if (geometry.type === 'Polygon') {
          // Convert coordinates from [lng, lat] to [lat, lng] for Leaflet
          const coordinates = geometry.coordinates[0].map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
          
          const polygon = L.polygon(coordinates, {
            color: '#2e7d32',
            fillColor: '#4caf50',
            fillOpacity: 0.4,
            weight: 2
          });

          const forestPopup = `
            <div>
              <div class="popup-header">
                <h4>🌲 ${props.name || 'Forest Area'}</h4>
              </div>
              <div class="popup-section">
                <h5>Forest Details</h5>
                <table class="popup-table">
                  <tr><td>Type</td><td>${props.type || 'Forest'}</td></tr>
                  <tr><td>Area</td><td>${props.area || 'Unknown'} ${typeof props.area === 'number' ? 'sq km' : ''}</td></tr>
                  <tr><td>State</td><td>${props.state || 'N/A'}</td></tr>
                  ${props.osm_id ? `<tr><td>OSM ID</td><td>${props.osm_id}</td></tr>` : ''}
                  ${props.source ? `<tr><td>Source</td><td>${props.source}</td></tr>` : ''}
                </table>
              </div>
            </div>
          `;
          
          polygon.bindPopup(forestPopup, { className: 'custom-popup' });
          polygon.on('click', () => {
            try {
              const b = polygon.getBounds();
              if (b && b.isValid() && mapRef.current) {
                mapRef.current.fitBounds(b, { padding: [16, 16] });
              }
            } catch {}
          });
          
          polygon.addTo(forestsLayerRef.current!);
          
          // Send forest polygon to back
          polygon.bringToBack();
        }
      });



      console.log('✅ Loaded forest areas successfully:', forestFeatures.length);
    } catch (error) {
      console.error('Failed to load forest data:', error);
    }
  };

  // Add water bodies layer
  const addWaterBodiesLayer = async () => {
    if (!mapRef.current || !waterBodiesLayerRef.current) return;

    waterBodiesLayerRef.current.clearLayers();

    try {
      console.log('Fetching real water bodies from external sources...');
      
      // Use OpenStreetMap data via Nominatim for water bodies
      const bounds = mapRef.current.getBounds();
      const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
      
      // Fetch water bodies using Nominatim search
      const waterQueries = [
        'river in India',
        'lake in India', 
        'reservoir in India'
      ];
      
      let totalFeatures = 0;
      
      for (const query of waterQueries) {
        try {
          const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=geojson&q=${encodeURIComponent(query)}&limit=20&polygon_geojson=1`;
          const response = await fetch(nominatimUrl);
          const data = await response.json();
          
          if (data.features) {
            data.features.forEach((feature: any) => {
              const props = feature.properties;
              const geometry = feature.geometry;
              
              if (geometry && (geometry.type === 'Polygon' || geometry.type === 'LineString')) {
                let waterFeature;
                
                if (geometry.type === 'LineString') {
                  const coordinates = geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
                  waterFeature = L.polyline(coordinates, {
                    color: '#00bcd4',
                    weight: 6,
                    opacity: 1
                  });
                } else {
                  const coordinates = geometry.coordinates[0].map((coord: [number, number]) => [coord[1], coord[0]]);
                  waterFeature = L.polygon(coordinates, {
                    color: '#00bcd4',
                    fillColor: '#4dd0e1',
                    fillOpacity: 0.8,
                    weight: 4
                  });
                }
                
                const name = props.display_name?.split(',')[0] || 'Water Body';
                const type = props.type || query.split(' ')[0];
                
                waterFeature.bindPopup(`
                  <div>
                    <h4>💧 ${name}</h4>
                    <p>Type: ${type}</p>
                    <p>Source: OpenStreetMap</p>
                  </div>
                `);
                
                waterFeature.addTo(waterBodiesLayerRef.current!);
                totalFeatures++;
              }
            });
          }
          
          // Add delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.warn(`Failed to fetch ${query}:`, error);
        }
      }
      
      console.log(`✅ Real water bodies loaded: ${totalFeatures} features from OpenStreetMap`);
      
    } catch (error) {
      console.error('Failed to load external water data:', error);
      
      // Fallback to local data
      try {
        const response = await fetch('/data/water-bodies.geojson');
        const waterData = await response.json();
        
        waterData.features.forEach((feature: any) => {
          const props = feature.properties;
          const geometry = feature.geometry;
          
          let waterFeature;
          
          if (geometry.type === 'LineString') {
            const coordinates = geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
            waterFeature = L.polyline(coordinates, {
              color: '#00bcd4',
              weight: 6,
              opacity: 1
            });
          } else if (geometry.type === 'Polygon') {
            const coordinates = geometry.coordinates[0].map((coord: [number, number]) => [coord[1], coord[0]]);
            waterFeature = L.polygon(coordinates, {
              color: '#00bcd4',
              fillColor: '#4dd0e1',
              fillOpacity: 0.8,
              weight: 4
            });
          }
          
          if (waterFeature) {
            waterFeature.bindPopup(`<h4>💧 ${props.name}</h4><p>Type: ${props.type}</p>`);
            waterFeature.addTo(waterBodiesLayerRef.current!);
            waterFeature.bringToFront();
          }
        });
        
        console.log('✅ Fallback water bodies loaded');
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }
  };



  // Toggle layer visibility
  const toggleLayerVisibility = (layerName: keyof typeof layerVisibility) => {
    setLayerVisibility(prev => ({ ...prev, [layerName]: !prev[layerName] }));
  };

  // Handle layer visibility changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // FRA Granted layer
    if (fraGrantedLayerRef.current) {
      if (layerVisibility.fraGranted && !mapRef.current.hasLayer(fraGrantedLayerRef.current)) {
        fraGrantedLayerRef.current.addTo(mapRef.current);
      } else if (!layerVisibility.fraGranted && mapRef.current.hasLayer(fraGrantedLayerRef.current)) {
        mapRef.current.removeLayer(fraGrantedLayerRef.current);
      }
    }

    // FRA Potential layer
    if (fraPotentialLayerRef.current) {
      if (layerVisibility.fraPotential && !mapRef.current.hasLayer(fraPotentialLayerRef.current)) {
        fraPotentialLayerRef.current.addTo(mapRef.current);
      } else if (!layerVisibility.fraPotential && mapRef.current.hasLayer(fraPotentialLayerRef.current)) {
        mapRef.current.removeLayer(fraPotentialLayerRef.current);
      }
    }

    // Boundaries layer - auto-fetch real data when toggled on
    if (!boundariesLayerRef.current) {
      boundariesLayerRef.current = L.layerGroup();
    }
    
    if (layerVisibility.boundaries) {
      if (!mapRef.current.hasLayer(boundariesLayerRef.current)) {
        boundariesLayerRef.current.addTo(mapRef.current);
        
        // Auto-fetch real boundaries when layer is turned on
        if (boundariesLayerRef.current.getLayers().length === 0) {
          console.log('🔄 Auto-fetching real boundaries...');
          fetchRealStateBoundaries().then(stateBoundaries => {
            const boundaryLayer = L.geoJSON(stateBoundaries as any, {
              style: {
                color: '#e91e63',
                fillColor: '#f48fb1',
                fillOpacity: 0.1,
                weight: 3,
                dashArray: '10,5'
              },
              interactive: false
            });
            
            boundaryLayer.addTo(boundariesLayerRef.current!);
            console.log('✅ Real state boundaries loaded automatically');
          }).catch(error => {
            console.warn('Failed to auto-load boundaries:', error);
            addBoundariesLayer();
          });
        }
      }
    } else {
      if (mapRef.current.hasLayer(boundariesLayerRef.current)) {
        mapRef.current.removeLayer(boundariesLayerRef.current);
      }
    }

    // Forests layer - load forest data when toggled on
    if (!forestsLayerRef.current) {
      forestsLayerRef.current = L.layerGroup();
    }
    
    if (layerVisibility.forests) {
      if (!mapRef.current.hasLayer(forestsLayerRef.current)) {
        forestsLayerRef.current.addTo(mapRef.current);
        
        // Load forest data when layer is turned on
        if (forestsLayerRef.current.getLayers().length === 0) {
          console.log('🌲 Loading forest areas...');
          addForestsLayer();
        }
      }
    } else {
      if (mapRef.current.hasLayer(forestsLayerRef.current)) {
        mapRef.current.removeLayer(forestsLayerRef.current);
      }
    }

    // Patta Holders layer - auto-initialize if needed
    console.log('Patta Holders toggle:', layerVisibility.pattaHolders, 'Layer exists:', !!pattaHoldersLayerRef.current);
    if (!pattaHoldersLayerRef.current) {
      pattaHoldersLayerRef.current = L.layerGroup();
      console.log('🔄 Patta holders layer initialized');
    }
    
    if (pattaHoldersLayerRef.current) {
      console.log('Layer count:', pattaHoldersLayerRef.current.getLayers().length);
      if (layerVisibility.pattaHolders) {
        if (!mapRef.current.hasLayer(pattaHoldersLayerRef.current)) {
          pattaHoldersLayerRef.current.addTo(mapRef.current);
          console.log('✅ Patta holders layer added to map');
        }
        // Always reload data when layer is toggled on
        if (pattaHoldersLayerRef.current.getLayers().length === 0) {
          console.log('🔄 Loading patta holders data...');
          loadPattaHoldersData();
        }
      } else {
        if (mapRef.current.hasLayer(pattaHoldersLayerRef.current)) {
          mapRef.current.removeLayer(pattaHoldersLayerRef.current);
          console.log('❌ Patta holders layer removed from map');
        }
      }
    }

    // Water Bodies layer - load water data when toggled on
    if (!waterBodiesLayerRef.current) {
      waterBodiesLayerRef.current = L.layerGroup();
    }
    
    if (layerVisibility.waterBodies) {
      if (!mapRef.current.hasLayer(waterBodiesLayerRef.current)) {
        waterBodiesLayerRef.current.addTo(mapRef.current);
        
        // Load water bodies data when layer is turned on
        console.log('💧 Loading water bodies...');
        addWaterBodiesLayer();
      }
    } else {
      if (mapRef.current.hasLayer(waterBodiesLayerRef.current)) {
        mapRef.current.removeLayer(waterBodiesLayerRef.current);
      }
    }
  }, [layerVisibility, mapLoaded]);

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
      
      // Also load backend patta holders for the dialog
      try {
        const pattaResponse = await pattaHoldersAPI.getAll();
        if (pattaResponse.success && pattaResponse.data) {
          setBackendPattaHolders(pattaResponse.data);
        }
      } catch (error) {
        console.warn('Failed to load backend patta holders for dialog:', error);
        setBackendPattaHolders([]);
      }
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
              const html = getPopupHtml(props, layer.name);
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
                const html = getPopupHtml(props, layer.name);
                (lyr as any).bindPopup(html, { maxWidth: 400, className: 'custom-popup' }).openPopup();
              } catch {}
            });
          }
        });
        gj.bindPopup(getPopupHtml({}, layer.name), { className: 'custom-popup' });
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
    const statusClass = record.fraStatus.includes('Granted') ? 'status-granted' : 
                       record.fraStatus.includes('Potential') ? 'status-potential' : 'status-pending';
    
    return `
      <div>
        <div class="popup-header">
          <h4>Khasra: ${record.khasraNumber}</h4>
        </div>
        
        <div class="popup-section">
          <h5>Owner Details</h5>
          <table class="popup-table">
            <tr><td>Name</td><td>${record.ownerName}</td></tr>
            <tr><td>Father</td><td>${record.fatherName || 'N/A'}</td></tr>
            <tr><td>Village</td><td>${record.village}</td></tr>
            <tr><td>District</td><td>${record.district}</td></tr>
          </table>
        </div>
        
        <div class="popup-section">
          <h5>Land Details</h5>
          <table class="popup-table">
            <tr><td>Survey No</td><td>${record.surveyNumber}</td></tr>
            <tr><td>Area</td><td>${record.area}</td></tr>
            <tr><td>Classification</td><td>${record.classification}</td></tr>
            <tr><td>FRA Status</td><td><span class="status-chip ${statusClass}">${record.fraStatus}</span></td></tr>
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
        // Load and display all plots (FRA Atlas + Patta Holders)
        let allRecords = [];
        let pattaResponse = { success: false, data: { features: [] } };
        
        try {
          allRecords = await getAllLandRecords();
        } catch (e) {
          console.warn('Failed to load FRA Atlas records:', e);
        }
        
        try {
          pattaResponse = await pattaHoldersAPI.getGeoJSON();
        } catch (e) {
          console.warn('Failed to load patta holders:', e);
        }
        
        if (allPlotsLayerRef.current) {
          allPlotsLayerRef.current.remove();
        }
        
        allPlotsLayerRef.current = L.layerGroup().addTo(mapRef.current);
        
        // Add FRA Atlas records
        allRecords.forEach(record => {
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
              lyr.on('click', () => {
                const popupContent = getPlotPopupContent(record);
                (lyr as any).bindPopup(popupContent, { maxWidth: 400, className: 'custom-popup' }).openPopup();
              });
            }
          });
          
          gj.addTo(allPlotsLayerRef.current!);
        });
        
        // Add Patta Holders data
        if (pattaResponse.success && pattaResponse.data) {
          const geojson = pattaResponse.data;
          
          geojson.features.forEach((feature: any) => {
            const props = feature.properties;
            
            let coordinates: [number, number][];
            if (feature.geometry.type === 'Polygon') {
              coordinates = feature.geometry.coordinates[0].map((coord: [number, number]) => [coord[1], coord[0]]);
            } else if (feature.geometry.type === 'Point') {
              const [lng, lat] = feature.geometry.coordinates;
              const offset = 0.001;
              coordinates = [
                [lat - offset, lng - offset],
                [lat - offset, lng + offset],
                [lat + offset, lng + offset],
                [lat + offset, lng - offset]
              ];
            } else {
              return;
            }

            const polygon = L.polygon(coordinates, {
              color: '#9c27b0',
              fillColor: '#ba68c8',
              fillOpacity: 0.5,
              weight: 3
            });

            const statusClass = 'status-potential';
            const escapeHtml = (text: string) => {
              const div = document.createElement('div');
              div.textContent = text;
              return div.innerHTML;
            };
            
            const popupContent = `
              <div>
                <div class="popup-header">
                  <h4>🏠 ${escapeHtml(props.ownerName || '')}</h4>
                </div>
                
                <div class="popup-section">
                  <h5>Owner Details</h5>
                  <table class="popup-table">
                    <tr><td>Father</td><td>${escapeHtml(props.fatherName || 'N/A')}</td></tr>
                    <tr><td>Village</td><td>${escapeHtml(props.village || '')}</td></tr>
                    <tr><td>District</td><td>${escapeHtml(props.district || '')}</td></tr>
                    <tr><td>State</td><td>${escapeHtml(props.state || '')}</td></tr>
                  </table>
                </div>
                
                <div class="popup-section">
                  <h5>Land Details</h5>
                  <table class="popup-table">
                    <tr><td>Survey No</td><td>${escapeHtml(props.surveyNo || '')}</td></tr>
                    <tr><td>Khasra</td><td>${escapeHtml(props.khasra || '')}</td></tr>
                    <tr><td>Area</td><td>${escapeHtml(String(props.area || 0))} hectares</td></tr>
                    <tr><td>Classification</td><td>${escapeHtml(props.classification || '')}</td></tr>
                    <tr><td>FRA Status</td><td><span class="status-chip ${statusClass}">${escapeHtml(props.fraStatus || '')}</span></td></tr>
                    <tr><td>Type</td><td>Patta Holder</td></tr>
                  </table>
                </div>
              </div>
            `;

            polygon.bindPopup(popupContent, { className: 'custom-popup' });
            polygon.addTo(allPlotsLayerRef.current!);
          });
        }
        
        const totalPlots = allRecords.length + (pattaResponse.success ? pattaResponse.data.features.length : 0);
        setAllPlotsVisible(true);
        setInfo(`All plots layer displayed: ${totalPlots} plots loaded (${allRecords.length} FRA Atlas + ${pattaResponse.success ? pattaResponse.data.features.length : 0} Patta Holders).`);
      }
    } catch (e) {
      console.warn('Failed to toggle all plots layer:', e);
      setError('Failed to load all plots layer.');
    }
  };

  // Apply filters when filter selection changes
  useEffect(() => {
    if (fraData.length > 0 && mapRef.current) {
      applyFiltersAndUpdateMap();
    }
  }, [selectedFilters, fraData]);

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

  const getPopupHtml = (props: any, fallbackName?: string) => {
    const ownerName = props?.ownerName || props?.claimantName || props?.name || props?.Name || fallbackName || 'Unknown';
    const fatherName = props?.fatherName || 'N/A';
    const village = props?.village || props?.Village || 'Unknown';
    const district = props?.district || props?.District || 'Unknown';
    const surveyNo = props?.surveyNo || props?.surveyNumber || props?.SurveyNo || props?.['Survey No'] || 'N/A';
    const khasra = props?.khasra || props?.Khasra || props?.khasraNumber || '45/2';
    const area = props?.area || props?.Area || props?.area_hectares || props?.['Area (hectares)'] || '0';
    const classification = props?.classification || props?.Classification || 'Forest Land (Community)';
    const fraStatus = props?.fraStatus || props?.status || props?.Status || 'Under Review';
    const statusClass = fraStatus.includes('Granted') ? 'status-granted' : fraStatus.includes('Potential') ? 'status-potential' : 'status-pending';

    return `
      <div>
        <div class="popup-header">
          <h4>Khasra: ${khasra}</h4>
        </div>
        
        <div class="popup-section">
          <h5>Owner Details</h5>
          <table class="popup-table">
            <tr><td>Name</td><td>${ownerName}</td></tr>
            <tr><td>Father</td><td>${fatherName}</td></tr>
            <tr><td>Village</td><td>${village}</td></tr>
            <tr><td>District</td><td>${district}</td></tr>
          </table>
        </div>
        
        <div class="popup-section">
          <h5>Land Details</h5>
          <table class="popup-table">
            <tr><td>Survey No</td><td>${surveyNo}</td></tr>
            <tr><td>Area</td><td>${area}${typeof area === 'number' ? ' hectares' : (area.toString().includes('hectares') ? '' : ' hectares')}</td></tr>
            <tr><td>Classification</td><td>${classification}</td></tr>
            <tr><td>FRA Status</td><td><span class="status-chip ${statusClass}">${fraStatus}</span></td></tr>
          </table>
        </div>
      </div>
    `;
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
    
    // Re-add user boundary overlay after style change
    addUserBoundaryOverlay(mapRef.current);

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

  // Search location using Nominatim API
  const searchLocation = async (query: string) => {
    if (!query.trim()) return;
    
    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`
      );
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      setError('Location search failed');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Go to selected location
  const goToLocation = (result: any) => {
    if (!mapRef.current) return;
    
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    mapRef.current.setView([lat, lon], 15);
    
    // Add marker
    const marker = L.marker([lat, lon]).addTo(mapRef.current)
      .bindPopup(`<h4>${result.display_name}</h4>`)
      .openPopup();
    
    setShowLocationSearch(false);
    setInfo(`Location found: ${result.display_name}`);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header */}
      <Paper sx={{ 
        p: { xs: 1, sm: 1.5, md: 2 }, 
        mb: 0, 
        borderRadius: 0, 
        boxShadow: 1,
        position: 'sticky',
        top: 0,
        zIndex: 1200,
        minHeight: { xs: '56px', sm: '64px', md: '72px' }
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: { xs: 'wrap', md: 'nowrap' },
          gap: { xs: 1, sm: 2 }
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1.5, sm: 2 },
            flex: 1,
            minWidth: 0
          }}>
            <Satellite 
              color="primary" 
              sx={{ 
                fontSize: { xs: 20, sm: 24, md: 28, lg: 32 },
                flexShrink: 0
              }} 
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography 
                variant="h6" 
                fontWeight="bold" 
                color="primary"
                sx={{
                  fontSize: { xs: '12px', sm: '14px', md: '16px', lg: '18px' },
                  lineHeight: 1.2,
                  mb: 0.5
                }}
              >
                <span data-translate>FRA Atlas - Free Mapping</span>
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  fontSize: { xs: '8px', sm: '9px', md: '10px', lg: '11px' },
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                <span data-translate>Professional satellite mapping with Leaflet & Esri imagery</span>
              </Typography>
            </Box>
          </Box>
          
          <Stack 
            direction="row" 
            spacing={{ xs: 0.5, sm: 1 }}
            sx={{ flexShrink: 0 }}
          >
            <Chip 
              label={<span data-translate>{`${filteredData.length} Claims`}</span>} 
              color="primary" 
              variant="outlined"
              size={window.innerWidth < 768 ? "small" : "medium"}
              sx={{ fontSize: { xs: '8px', sm: '10px', md: '12px' } }}
            />
            <Chip 
              label="LIVE DATA" 
              color="success" 
              size="small"
              sx={{ 
                fontSize: { xs: '7px', sm: '9px', md: '11px' },
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 }
                }
              }}
            />
            <Chip 
              label={currentMapStyle.toUpperCase()} 
              color="secondary" 
              size="small"
              sx={{ fontSize: { xs: '7px', sm: '9px', md: '11px' } }}
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
              width: { xs: '100vw', sm: '90vw', md: 400, lg: 420 },
              backgroundColor: '#f8fafc',
              borderLeft: '2.4px solid #1976d2',
              borderRight: '0.8px solid rgba(27, 27, 39, 0.12)',
              boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
              position: 'fixed',
              right: 0,
              top: { xs: 0, sm: 36 },
              height: { xs: '100vh', sm: 'calc(100vh - 36px - 24px)' },
              overflowX: 'auto',
              overflowY: 'auto',
              transition: 'transform 0.225s cubic-bezier(0, 0, 0.2, 1)',
              zIndex: 1300,
              m: { xs: 0, sm: '24px 0 0 8px' }
            }
          }}
        >
          {/* Government Header */}
          <Box sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', 
            color: 'white', 
            p: { xs: 2, sm: 3 },
            borderBottom: '2px solid #0d47a1',
            position: 'sticky',
            top: 0,
            zIndex: 1
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              gap: 1
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                <Box sx={{ 
                  width: { xs: 36, sm: 40 }, 
                  height: { xs: 36, sm: 40 }, 
                  background: 'rgba(255,255,255,0.2)', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Settings sx={{ fontSize: { xs: 18, sm: 20 } }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography 
                    variant="h6" 
                    fontWeight="bold" 
                    sx={{ 
                      fontSize: { xs: '16px', sm: '18px' },
                      lineHeight: 1.2,
                      mb: 0.5
                    }}
                  >
                    <span data-translate>Map Controls</span>
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      opacity: 0.9, 
                      fontSize: { xs: '11px', sm: '12px' },
                      lineHeight: 1.3,
                      display: { xs: 'none', sm: 'block' }
                    }}
                  >
                    Government of India • Forest Rights Act
                  </Typography>
                </Box>
              </Box>
              <IconButton 
                onClick={() => setShowControls(false)} 
                sx={{ 
                  color: 'white',
                  p: { xs: 1, sm: 1.5 },
                  flexShrink: 0
                }}
              >
                <Close sx={{ fontSize: { xs: 20, sm: 24 } }} />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ 
            p: { xs: 2, sm: 3 }, 
            height: 'calc(100vh - 120px)', 
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '6px'
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1'
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#c1c1c1',
              borderRadius: '3px'
            }
          }}>
            {/* Map Style Selection */}
            <Paper sx={{ 
              mb: { xs: 2, sm: 3 }, 
              border: '1px solid #e3f2fd', 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <Box sx={{ 
                background: 'linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%)', 
                p: { xs: 1.5, sm: 2 }, 
                borderBottom: '1px solid #90caf9' 
              }}>
                <Typography 
                  variant="subtitle1" 
                  fontWeight="bold" 
                  color="#1976d2" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    fontSize: { xs: '14px', sm: '16px' }
                  }}
                >
                  <Satellite sx={{ fontSize: { xs: 16, sm: 18 } }} />
                  <span data-translate>Map Style</span>
                </Typography>
              </Box>
              <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Stack spacing={{ xs: 1, sm: 1.5 }}>
                  <Button
                    variant={currentMapStyle === 'satellite' ? 'contained' : 'outlined'}
                    startIcon={<Satellite sx={{ fontSize: { xs: 16, sm: 20 } }} />}
                    onClick={() => changeMapStyle('satellite')}
                    fullWidth
                    sx={{ 
                      py: { xs: 1, sm: 1.5 }, 
                      fontWeight: 600,
                      fontSize: { xs: '12px', sm: '14px' },
                      justifyContent: 'flex-start'
                    }}
                  >
                    <span data-translate>Satellite</span>
                  </Button>
                  <Button
                    variant={currentMapStyle === 'terrain' ? 'contained' : 'outlined'}
                    startIcon={<Terrain sx={{ fontSize: { xs: 16, sm: 20 } }} />}
                    onClick={() => changeMapStyle('terrain')}
                    fullWidth
                    sx={{ 
                      py: { xs: 1, sm: 1.5 }, 
                      fontWeight: 600,
                      fontSize: { xs: '12px', sm: '14px' },
                      justifyContent: 'flex-start'
                    }}
                  >
                    <span data-translate>Terrain</span>
                  </Button>
                  <Button
                    variant={currentMapStyle === 'osm' ? 'contained' : 'outlined'}
                    startIcon={<MapIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />}
                    onClick={() => changeMapStyle('osm')}
                    fullWidth
                    sx={{ 
                      py: { xs: 1, sm: 1.5 }, 
                      fontWeight: 600,
                      fontSize: { xs: '12px', sm: '14px' },
                      justifyContent: 'flex-start'
                    }}
                  >
                    <span data-translate>OpenStreetMap</span>
                  </Button>
                </Stack>
              </Box>
            </Paper>

            {/* Layer Controls */}
            <Paper sx={{ 
              mb: { xs: 2, sm: 3 }, 
              border: '1px solid #e8f5e8', 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <Box sx={{ 
                background: 'linear-gradient(90deg, #e8f5e8 0%, #c8e6c9 100%)', 
                p: { xs: 1.5, sm: 2 }, 
                borderBottom: '1px solid #a5d6a7' 
              }}>
                <Typography 
                  variant="subtitle1" 
                  fontWeight="bold" 
                  color="#2e7d32" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    fontSize: { xs: '14px', sm: '16px' }
                  }}
                >
                  <Layers sx={{ fontSize: { xs: 16, sm: 18 } }} />
                  <span data-translate>Layers</span>
                </Typography>
              </Box>
              <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Stack spacing={{ xs: 0.5, sm: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={layerVisibility.fraGranted}
                        onChange={() => toggleLayerVisibility('fraGranted')}
                        color="success"
                        size={window.innerWidth < 600 ? 'small' : 'medium'}
                      />
                    }
                    label={
                      <Typography 
                        variant="body2" 
                        fontWeight={500}
                        sx={{ fontSize: { xs: '12px', sm: '14px' } }}
                      >
                        <span data-translate>FRA Granted</span>
                      </Typography>
                    }
                    sx={{ mx: 0, width: '100%' }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={layerVisibility.fraPotential}
                        onChange={() => toggleLayerVisibility('fraPotential')}
                        color="warning"
                        size={window.innerWidth < 600 ? 'small' : 'medium'}
                      />
                    }
                    label={
                      <Typography 
                        variant="body2" 
                        fontWeight={500}
                        sx={{ fontSize: { xs: '12px', sm: '14px' } }}
                      >
                        <span data-translate>FRA Potential</span>
                      </Typography>
                    }
                    sx={{ mx: 0, width: '100%' }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={layerVisibility.boundaries}
                        onChange={() => toggleLayerVisibility('boundaries')}
                        color="primary"
                        size={window.innerWidth < 600 ? 'small' : 'medium'}
                      />
                    }
                    label={
                      <Typography 
                        variant="body2" 
                        fontWeight={500}
                        sx={{ fontSize: { xs: '12px', sm: '14px' } }}
                      >
                        <span data-translate>Boundaries</span>
                      </Typography>
                    }
                    sx={{ mx: 0, width: '100%' }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={layerVisibility.forests}
                        onChange={() => toggleLayerVisibility('forests')}
                        color="success"
                        size={window.innerWidth < 600 ? 'small' : 'medium'}
                      />
                    }
                    label={
                      <Typography 
                        variant="body2" 
                        fontWeight={500}
                        sx={{ fontSize: { xs: '12px', sm: '14px' } }}
                      >
                        <span data-translate>Forest Areas</span>
                      </Typography>
                    }
                    sx={{ mx: 0, width: '100%' }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={layerVisibility.pattaHolders}
                        onChange={() => toggleLayerVisibility('pattaHolders')}
                        color="secondary"
                        size={window.innerWidth < 600 ? 'small' : 'medium'}
                      />
                    }
                    label={
                      <Typography 
                        variant="body2" 
                        fontWeight={500}
                        sx={{ fontSize: { xs: '12px', sm: '14px' } }}
                      >
                        <span data-translate>Patta Holders</span>
                      </Typography>
                    }
                    sx={{ mx: 0, width: '100%' }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={layerVisibility.waterBodies}
                        onChange={() => toggleLayerVisibility('waterBodies')}
                        color="info"
                        size={window.innerWidth < 600 ? 'small' : 'medium'}
                      />
                    }
                    label={
                      <Typography 
                        variant="body2" 
                        fontWeight={500}
                        sx={{ fontSize: { xs: '12px', sm: '14px' } }}
                      >
                        <span data-translate>Water Bodies</span>
                      </Typography>
                    }
                    sx={{ mx: 0, width: '100%' }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={allPlotsVisible}
                        onChange={toggleAllPlotsLayer}
                        color="info"
                        size={window.innerWidth < 600 ? 'small' : 'medium'}
                      />
                    }
                    label={
                      <Typography 
                        variant="body2" 
                        fontWeight={500}
                        sx={{ fontSize: { xs: '12px', sm: '14px' } }}
                      >
                        <span data-translate>All Land Plots</span>
                      </Typography>
                    }
                    sx={{ mx: 0, width: '100%' }}
                  />
                </Stack>
              </Box>
            </Paper>

            {/* Filters */}
            <Paper sx={{ 
              border: '1px solid #fff3e0', 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <Box sx={{ 
                background: 'linear-gradient(90deg, #fff3e0 0%, #ffe0b2 100%)', 
                p: { xs: 1.5, sm: 2 }, 
                borderBottom: '1px solid #ffcc02' 
              }}>
                <Typography 
                  variant="subtitle1" 
                  fontWeight="bold" 
                  color="#f57c00" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    fontSize: { xs: '14px', sm: '16px' }
                  }}
                >
                  <FilterList sx={{ fontSize: { xs: 16, sm: 18 } }} />
                  <span data-translate>Filters</span>
                </Typography>
              </Box>
              <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Stack spacing={{ xs: 1.5, sm: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: { xs: '12px', sm: '14px' } }}>
                      <span data-translate>Status</span>
                    </InputLabel>
                    <Select
                      value={selectedFilters.status}
                      label="Status"
                      onChange={(e) => {
                        setSelectedFilters(prev => ({ ...prev, status: e.target.value }));
                      }}
                      sx={{ fontSize: { xs: '12px', sm: '14px' } }}
                    >
                      <MenuItem value="all" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>
                        <span data-translate>All Status</span>
                      </MenuItem>
                      <MenuItem value="granted" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>
                        <span data-translate>Granted</span>
                      </MenuItem>
                      <MenuItem value="potential" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>
                        <span data-translate>Potential</span>
                      </MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: { xs: '12px', sm: '14px' } }}>
                      <span data-translate>District</span>
                    </InputLabel>
                    <Select
                      value={selectedFilters.district}
                      label="District"
                      onChange={(e) => {
                        setSelectedFilters(prev => ({ ...prev, district: e.target.value }));
                      }}
                      sx={{ fontSize: { xs: '12px', sm: '14px' } }}
                    >
                      <MenuItem value="all" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>All Districts</MenuItem>
                      <MenuItem value="Bhopal" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>Bhopal</MenuItem>
                      <MenuItem value="West Tripura" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>West Tripura</MenuItem>
                      <MenuItem value="Cuttack" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>Cuttack</MenuItem>
                      <MenuItem value="Hyderabad" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>Hyderabad</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </Box>
            </Paper>
          </Box>
          
          {/* Government Footer */}
          <Box sx={{ 
            background: '#f1f5f9', 
            borderTop: '1px solid #cbd5e1', 
            p: { xs: 1.5, sm: 2 }, 
            textAlign: 'center',
            position: 'sticky',
            bottom: 0,
            zIndex: 1
          }}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                fontWeight: 500,
                fontSize: { xs: '10px', sm: '12px' },
                lineHeight: 1.4,
                display: 'block'
              }}
            >
              Ministry of Tribal Affairs • भारत सरकार • Government of India
            </Typography>
          </Box>
        </Drawer>

        {/* Map Container */}
        <Box sx={{ flex: 1, position: 'relative', m: 0 }}>
          <Box 
            ref={containerRef} 
            sx={{
              position: 'absolute',
              top: 2,
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

          {/* Base Layer Switcher */}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', gap: { xs: '8px', sm: '12px', md: '20px' }, '@media (max-width: 767px)': { flexDirection: 'column', alignItems: 'stretch', gap: 0 } }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 'normal', width: { xs: '100%', md: '50%' }, ml: 0 }}>
                <Paper sx={{ position: 'absolute', top: { xs: 8, sm: 12, md: 14 }, left: { xs: 8, sm: 32, md: 58 }, zIndex: 1000, p: { xs: 0.5, sm: 0.75, md: 1 }, minWidth: { xs: 80, sm: 100, md: 120 }, width: { xs: 90, sm: 110, md: 136 }, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', m: 'auto 0', transition: 'box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.25, sm: 0.375, md: 0.5 } }}>
                    <Button
                      size="small"
                      variant={currentMapStyle === 'satellite' ? 'contained' : 'outlined'}
                      onClick={() => changeMapStyle('satellite')}
                      startIcon={<Satellite sx={{ fontSize: { xs: 12, sm: 14, md: 16 } }} />}
                      sx={{ justifyContent: 'flex-start', py: { xs: 0.25, sm: 0.375, md: 0.5 }, fontSize: { xs: '8px', sm: '9px', md: '11px' } }}
                    >
                      Satellite
                    </Button>
                    <Button
                      size="small"
                      variant={currentMapStyle === 'terrain' ? 'contained' : 'outlined'}
                      onClick={() => changeMapStyle('terrain')}
                      startIcon={<Terrain sx={{ fontSize: { xs: 12, sm: 14, md: 16 } }} />}
                      sx={{ justifyContent: 'flex-start', py: { xs: 0.25, sm: 0.375, md: 0.5 }, fontSize: { xs: '8px', sm: '9px', md: '11px' } }}
                    >
                      Terrain
                    </Button>
                    <Button
                      size="small"
                      variant={currentMapStyle === 'osm' ? 'contained' : 'outlined'}
                      onClick={() => changeMapStyle('osm')}
                      startIcon={<MapIcon sx={{ fontSize: { xs: 12, sm: 14, md: 16 } }} />}
                      sx={{ justifyContent: 'flex-start', py: { xs: 0.25, sm: 0.375, md: 0.5 }, fontSize: { xs: '8px', sm: '9px', md: '11px' } }}
                    >
                      OSM
                    </Button>
                  </Box>
                </Paper>
              </Box>
              <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', lineHeight: 'normal', width: '50%', ml: { xs: 0, md: '20px' } }}>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: { xs: '10px', sm: '11px', md: '12px' }, fontWeight: 600, lineHeight: '20px', mb: 1 }}>
                  Base Layer
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Floating Action Buttons */}
          <Box sx={{ 
            position: 'absolute', 
            top: { xs: 8, sm: 16 }, 
            right: { 
              xs: showControls ? '100vw' : 8, 
              sm: showControls ? '90vw' : 16, 
              md: showControls ? 420 : 16, 
              lg: showControls ? 440 : 16 
            }, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: { xs: 0.5, sm: 1 }, 
            zIndex: 1400, 
            transition: 'right 300ms ease-in-out',
            opacity: showControls && window.innerWidth < 768 ? 0 : 1
          }}>
            <Tooltip title="Map Controls">
              <Fab
                size={window.innerWidth < 768 ? "small" : "medium"}
                color="primary"
                onClick={() => setShowControls(true)}
                sx={{
                  width: { xs: 36, sm: 44, md: 48, lg: 52 },
                  height: { xs: 36, sm: 44, md: 48, lg: 56 },
                  minHeight: 0,
                  ml: 'auto',
                  boxShadow: 3
                }}
              >
                <Layers sx={{ fontSize: { xs: 16, sm: 18, md: 20, lg: 24 } }} />
              </Fab>
            </Tooltip>
            <Tooltip title="Uploaded Data">
              <Fab 
                size="small" 
                color="default" 
                onClick={() => setShowLayersDialog(true)}
                sx={{ 
                  width: { xs: 32, sm: 36, md: 40 },
                  height: { xs: 32, sm: 36, md: 40 }
                }}
              >
                <ListIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
              </Fab>
            </Tooltip>
            <Tooltip title="Land Records">
              <Fab 
                size="small" 
                color="secondary" 
                onClick={() => setShowBhunakshaSearch(true)}
                sx={{ 
                  width: { xs: 32, sm: 36, md: 40 },
                  height: { xs: 32, sm: 36, md: 40 }
                }}
              >
                <MapIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
              </Fab>
            </Tooltip>
            <Tooltip title="My Location">
              <Fab 
                size="small" 
                color="default" 
                onClick={() => locateMe(false)}
                sx={{ 
                  width: { xs: 32, sm: 36, md: 40 },
                  height: { xs: 32, sm: 36, md: 40 }
                }}
              >
                <MyLocation sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
              </Fab>
            </Tooltip>
            <Tooltip title="OCR Processing">
              <Fab 
                size="small" 
                color="primary" 
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={processingOCR}
                sx={{ 
                  width: { xs: 32, sm: 36, md: 40 },
                  height: { xs: 32, sm: 36, md: 40 }
                }}
              >
                {processingOCR ? 
                  <CircularProgress size={window.innerWidth < 768 ? 14 : 18} /> : 
                  <PhotoCamera sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
                }
              </Fab>
            </Tooltip>
            
            <Tooltip title="NER Analysis">
              <Fab 
                size="small" 
                color="secondary" 
                onClick={() => setShowNERDialog(true)}
                disabled={processingNER}
                sx={{ 
                  width: { xs: 32, sm: 36, md: 40 },
                  height: { xs: 32, sm: 36, md: 40 }
                }}
              >
                {processingNER ? 
                  <CircularProgress size={window.innerWidth < 768 ? 14 : 18} /> : 
                  <TextFields sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
                }
              </Fab>
            </Tooltip>

            <Tooltip title="Search Location">
              <Fab 
                size="small" 
                color="default"
                onClick={() => setShowLocationSearch(true)}
                sx={{ 
                  width: { xs: 32, sm: 36, md: 40 },
                  height: { xs: 32, sm: 36, md: 40 }
                }}
              >
                <Search sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
              </Fab>
            </Tooltip>
            

            

            
            <Tooltip title="Fetch Real External Data">
              <Fab 
                size="small" 
                color="success" 
                sx={{ 
                  width: { xs: 32, sm: 36, md: 40 },
                  height: { xs: 32, sm: 36, md: 40 }
                }}
                onClick={async () => {
                  setLoading(true);
                  const success = await fetchAndSaveRealData();
                  if (success) {
                    // Reload with real data
                    const realData = await loadPermanentData();
                    const mockData = filterDataForUser(convertToFRAData(realData));
                    setFraData(mockData);
                    setFilteredData(mockData);
                    updateMapLayers(mockData);
                    setInfo('Real external data fetched and loaded!');
                  } else {
                    setError('Failed to fetch real external data');
                  }
                  setLoading(false);
                }}
              >
                <Refresh sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
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
      {/* FRA Atlas Search Dialog */}
      <Dialog open={showBhunakshaSearch} onClose={() => setShowBhunakshaSearch(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MapIcon />
            FRA Atlas - Land Records Search
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
      <Dialog 
        open={showLayersDialog} 
        onClose={() => setShowLayersDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '70vh',
            maxHeight: '85vh',
            position: 'fixed',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', 
          color: 'white',
          py: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ListIcon sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                Uploaded Data (Data Management)
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Government of India - Forest Rights Act Atlas
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, bgcolor: '#f8f9fa' }}>
          {uploadedLayers.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary" variant="h6">No uploaded data found.</Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>Upload data through Data Management to see records here.</Typography>
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, color: '#1976d2', fontWeight: 600 }}>
                Total Records: {uploadedLayers.length + backendPattaHolders.length}
              </Typography>
              <List sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}>
                {/* Backend Patta Holders */}
                {backendPattaHolders.map((record: any, index: number) => (
                  <React.Fragment key={`patta-${index}`}>
                    <ListItem sx={{ py: 2, '&:hover': { bgcolor: '#e3f2fd' }, borderLeft: '4px solid #4caf50' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#4caf50', mb: 0.5 }}>
                          {record.ownerName || 'Patta Holder'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {record.address?.village}, {record.address?.district} • Area: {record.landDetails?.area?.hectares || 0} hectares
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button size="small" variant="contained" sx={{ minWidth: 80 }}
                            onClick={() => {
                              try {
                                if (!mapRef.current || !record.coordinates) return;
                                const coordinates: [number, number][] = record.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
                                const bounds = L.latLngBounds(coordinates);
                                mapRef.current.fitBounds(bounds, { padding: [20, 20] });
                                setShowLayersDialog(false);
                              } catch {}
                            }}>
                            Focus
                          </Button>
                          <Button size="small" variant="outlined" sx={{ minWidth: 80 }}>
                            Export
                          </Button>
                          <Button size="small" variant="outlined" color="error" sx={{ minWidth: 80 }}>
                            Delete
                          </Button>
                        </Box>
                      </Box>
                    </ListItem>
                    {index < backendPattaHolders.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
                
                
                {/* Uploaded Layers */}
                {uploadedLayers.map((l: any, index) => {
                  const meta = summarizeLayer(l);
                  return (
                    <React.Fragment key={l.id}>
                      <ListItem
                        sx={{
                          py: 2,
                          '&:hover': { bgcolor: '#e3f2fd' },
                          borderLeft: '4px solid #1976d2'
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 0.5 }}>
                            {meta.name || l.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {meta.subtitle || `Features: ${l.data?.features?.length ?? 0}`}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button 
                              size="small" 
                              variant="contained" 
                              sx={{ minWidth: 80 }}
                              onClick={() => {
                                try {
                                  if (!mapRef.current) return;
                                  const gj = L.geoJSON(l.data);
                                  const b = (gj as any).getBounds?.();
                                  if (b && b.isValid()) {
                                    mapRef.current.fitBounds(b, { padding: [20, 20] });
                                  }
                                  gj.remove();
                                  setShowLayersDialog(false);
                                  const highlight = L.geoJSON(l.data, { style: { color: '#ff1744', weight: 3, dashArray: '6,4', fillOpacity: 0 } }).addTo(mapRef.current);
                                  setTimeout(() => { try { mapRef.current && highlight.remove(); } catch {} }, 5000);
                                } catch {}
                              }}
                            >
                              Focus
                            </Button>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              sx={{ minWidth: 80 }}
                              onClick={() => handleExportLayer(l.id)}
                            >
                              Export
                            </Button>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="error" 
                              sx={{ minWidth: 80 }}
                              onClick={() => handleDeleteLayer(l.id)}
                            >
                              Delete
                            </Button>
                          </Box>
                        </Box>
                      </ListItem>
                      {(index < uploadedLayers.length - 1 || (pattaHoldersLayerRef.current?.getLayers().length || 0) > 0) && <Divider />}
                    </React.Fragment>
                  );
                })}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#f8f9fa', p: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            Ministry of Tribal Affairs • Government of India
          </Typography>
          <Button onClick={() => setShowLayersDialog(false)} variant="contained">
            Close
          </Button>
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

      {/* Location Search Dialog */}
      <Dialog 
        open={showLocationSearch} 
        onClose={() => setShowLocationSearch(false)} 
        PaperProps={{
          style: {
            position: 'fixed',
            top: '20%',
            left: '30%',
            width: '400px',
            height: '500px',
            resize: 'both',
            overflow: 'auto',
            minWidth: '300px',
            minHeight: '200px',
            margin: 0,
            maxWidth: 'none',
            maxHeight: 'none'
          },
          onMouseDown: (e: any) => {
            const dialog = e.currentTarget;
            const rect = dialog.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;
            
            const handleMouseMove = (moveEvent: MouseEvent) => {
              dialog.style.left = (moveEvent.clientX - offsetX) + 'px';
              dialog.style.top = (moveEvent.clientY - offsetY) + 'px';
            };
            
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }
        }}
      >
        <DialogTitle
          style={{
            cursor: 'move',
            userSelect: 'none',
            backgroundColor: '#f5f5f5',
            borderBottom: '1px solid #ddd'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Search />
            Search Location
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Enter location name"
            placeholder="e.g., Mumbai, Delhi, Bhopal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                searchLocation(searchQuery);
              }
            }}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <IconButton 
                  onClick={() => searchLocation(searchQuery)}
                  disabled={searchLoading}
                >
                  {searchLoading ? <CircularProgress size={20} /> : <Search />}
                </IconButton>
              )
            }}
          />
          
          {searchResults.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>Search Results:</Typography>
              <List>
                {searchResults.map((result, index) => (
                  <ListItem 
                    key={index}
                    button
                    onClick={() => goToLocation(result)}
                    sx={{ 
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': { bgcolor: '#f5f5f5' }
                    }}
                  >
                    <ListItemIcon>
                      <LocationOn color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={result.display_name}
                      secondary={`${result.type} • ${result.lat}, ${result.lon}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLocationSearch(false)}>Close</Button>
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
      <Paper 
        sx={{ 
          position: 'absolute', 
          bottom: 20, 
          left: { xs: 20, md: 300 }, 
          p: 2, 
          display: 'flex', 
          gap: 2,
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          borderRadius: 2,
          border: '1px solid rgba(0,0,0,0.1)',
          flexWrap: 'wrap',
          maxWidth: 'calc(100vw - 40px)',
          zIndex: 1000,
          cursor: 'move',
          userSelect: 'none',
          resize: 'horizontal',
          overflow: 'hidden',
          minWidth: '200px',
          width: '400px'
        }}
        onMouseDown={(e) => {
          const legend = e.currentTarget;
          const rect = legend.getBoundingClientRect();
          const offsetX = e.clientX - rect.left;
          const offsetY = e.clientY - rect.top;
          
          const handleMouseMove = (moveEvent: MouseEvent) => {
            legend.style.left = (moveEvent.clientX - offsetX) + 'px';
            legend.style.top = (moveEvent.clientY - offsetY) + 'px';
            legend.style.bottom = 'auto';
          };
          
          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
          <Box sx={{ 
            width: { xs: 12, sm: 16 }, 
            height: { xs: 12, sm: 16 }, 
            bgcolor: '#2e7d32', 
            opacity: 0.35, 
            border: '2px solid #1b5e20', 
            borderRadius: 1 
          }} />
          <Typography variant="body2" sx={{ fontSize: { xs: '9px', sm: '11px', md: '14px' }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Granted FRA</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
          <Box sx={{ 
            width: { xs: 12, sm: 16 }, 
            height: { xs: 12, sm: 16 }, 
            bgcolor: '#ff9800', 
            opacity: 0.25, 
            border: '2px solid #ff6f00', 
            borderRadius: 1 
          }} />
          <Typography variant="body2" sx={{ fontSize: { xs: '9px', sm: '11px', md: '14px' }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Potential FRA</Typography>
        </Box>

        {allPlotsVisible && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
            <Box sx={{ 
              width: { xs: 12, sm: 16 }, 
              height: { xs: 12, sm: 16 }, 
              bgcolor: '#66bb6a', 
              opacity: 0.3, 
              border: '2px solid #4caf50', 
              borderRadius: 1 
            }} />
            <Typography variant="body2" sx={{ fontSize: { xs: '9px', sm: '11px', md: '14px' }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>All Land Plots</Typography>
          </Box>
        )}
        {layerVisibility.forests && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
            <Box sx={{ 
              width: { xs: 12, sm: 16 }, 
              height: { xs: 12, sm: 16 }, 
              bgcolor: '#4caf50', 
              opacity: 0.4, 
              border: '2px solid #2e7d32', 
              borderRadius: 1 
            }} />
            <Typography variant="body2" sx={{ fontSize: { xs: '9px', sm: '11px', md: '14px' }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Forest Areas</Typography>
          </Box>
        )}
        {layerVisibility.pattaHolders && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
            <Box sx={{ 
              width: { xs: 12, sm: 16 }, 
              height: { xs: 12, sm: 16 }, 
              bgcolor: '#ffb74d', 
              opacity: 0.4, 
              border: '2px solid #ff9800', 
              borderRadius: 1 
            }} />
            <Typography variant="body2" sx={{ fontSize: { xs: '9px', sm: '11px', md: '14px' }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Patta Holders</Typography>
          </Box>
        )}
        {layerVisibility.waterBodies && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
            <Box sx={{ 
              width: { xs: 12, sm: 16 }, 
              height: { xs: 12, sm: 16 }, 
              bgcolor: '#4dd0e1', 
              opacity: 0.8, 
              border: '2px solid #00bcd4', 
              borderRadius: 1 
            }} />
            <Typography variant="body2" sx={{ fontSize: { xs: '9px', sm: '11px', md: '14px' }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Water Bodies</Typography>
          </Box>
        )}
      </Paper>

      {/* Real-time Statistics Panel */}
      {fraData.length > 0 && (
        <Paper sx={{
          position: 'absolute',
          bottom: { xs: 140, sm: 120 },
          left: { xs: 8, md: 300 },
          p: { xs: 1, sm: 2 },
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          boxShadow: 2,
          borderRadius: 2,
          border: '1px solid rgba(0,0,0,0.1)',
          zIndex: 1000,
          cursor: 'move',
          userSelect: 'none',
          minWidth: { xs: '150px', sm: '200px' },
          maxWidth: { xs: '200px', sm: '250px' }
        }}
        onMouseDown={(e) => {
          const panel = e.currentTarget;
          const rect = panel.getBoundingClientRect();
          const offsetX = e.clientX - rect.left;
          const offsetY = e.clientY - rect.top;
          
          const handleMouseMove = (moveEvent: MouseEvent) => {
            panel.style.left = (moveEvent.clientX - offsetX) + 'px';
            panel.style.top = (moveEvent.clientY - offsetY) + 'px';
            panel.style.bottom = 'auto';
          };
          
          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}>
          <Typography variant="h6" sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            fontSize: { xs: '14px', sm: '16px' },
            mb: 1
          }}>
            <Analytics sx={{ fontSize: { xs: '14px', sm: '16px' } }} />
            FRA Statistics
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontSize: { xs: '11px', sm: '12px' } }}>Total Claims:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: { xs: '11px', sm: '12px' } }}>{realTimeStats.totalClaims}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontSize: { xs: '11px', sm: '12px' } }}>Granted:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main', fontSize: { xs: '11px', sm: '12px' } }}>{realTimeStats.grantedClaims}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ fontSize: { xs: '11px', sm: '12px' } }}>Pending:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'warning.main', fontSize: { xs: '11px', sm: '12px' } }}>{realTimeStats.pendingClaims}</Typography>
          </Box>
          <Typography variant="caption" sx={{ 
            display: 'block', 
            textAlign: 'center', 
            color: 'text.secondary',
            fontSize: { xs: '9px', sm: '10px' },
            borderTop: '1px solid rgba(0,0,0,0.1)',
            pt: 0.5
          }}>
            Updated: {realTimeStats.lastUpdated.toLocaleTimeString()}
          </Typography>
        </Paper>
      )}

      {/* Patta Report Modal */}
      <PattaReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        pattaId={selectedPattaId}
        ownerName={selectedOwnerName}
      />
    </Box>
  );
};

export default FRAAtlas;
