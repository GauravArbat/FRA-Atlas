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
  Assessment,
  MyLocation
} from '@mui/icons-material';
import mapboxgl from 'mapbox-gl';
import * as maplibregl from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { api } from '../services/api';

const token = process.env.REACT_APP_MAPBOX_TOKEN || '';
mapboxgl.accessToken = token;

// Datameet data sources (corrected paths)
const DATAMEET_STATES_GEOJSON_URL =
  'https://raw.githubusercontent.com/datameet/india-geojson/master/india_telangana_and_ladakh/state/india_telangana_and_ladakh_state.geojson';
// Datameet repo does not have a canonical cities file in all branches; we try one, else fallback to vector tiles
const DATAMEET_CITIES_GEOJSON_URL =
  'https://raw.githubusercontent.com/datameet/india-geojson/master/india_telangana_and_ladakh/city/india_telangana_and_ladakh_city.geojson';

// Professional Satellite style (free): ESRI World Imagery + ESRI Boundaries & Places labels overlay
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
      maxzoom: 17,
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
    // label layer drawn above imagery
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
  const [datameetToggles, setDatameetToggles] = useState({ stateBorders: false, cityLabels: false });
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
  const [autoSwitchedStyle, setAutoSwitchedStyle] = useState<null | 'osm'>(null);
  const fetchLockRef = useRef(false);
  const lastFetchRef = useRef(0);
  const backoffRef = useRef(0);
  const [adminToggles, setAdminToggles] = useState({ osmAdminBoundaries: false });
  const [hillshadeOn, setHillshadeOn] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cursorInfo, setCursorInfo] = useState<{lng:number;lat:number;zoom:number}>({lng:73.86,lat:19.08,zoom:11});
  const userLocRef = useRef<{lng:number; lat:number; acc:number} | null>(null);
  const geoWatchIdRef = useRef<number | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  const addGeoJsonSource = async () => {
    try {
      const now = Date.now();
      if (fetchLockRef.current || now - lastFetchRef.current < 5000) {
        return; // throttle frequent calls to avoid 429
      }
      fetchLockRef.current = true;
      setLoading(true);
      let data: any;
      try {
        const res = await api.get('/fra/atlas/geojson', { params: { ...filters } });
        data = res.data;
        setUsingMockData(false);
      } catch (err) {
        // Fallback to local mock if backend is down
        const mock = await fetch('/mock/fra_areas.json');
        data = await mock.json();
        setUsingMockData(true);
        setInfo('Using sample FRA data (demo)');
        setError(null);
      }
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

      // Popup on click with claimant details
      map.on('click', 'fra-granted-fill', (e: any) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties || {} as any;
        const html = `<div style="min-width:200px"><strong>${p.id || 'FRA Claim'}</strong><br/>` +
          `Status: ${p.status || ''}<br/>Person: ${p.person || ''}<br/>Village: ${p.village || ''}<br/>District: ${p.district || ''}<br/>Area: ${p.area_ha || ''} ha</div>`;
        const popup = (token && token.length > 20 && !token.includes('placeholder'))
          ? new (mapboxgl as any).Popup({ closeButton: true })
          : new (maplibregl as any).Popup({ closeButton: true });
        (popup as any).setLngLat(e.lngLat).setHTML(html).addTo(map as any);
      });
      map.on('click', 'fra-potential-fill', (e: any) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties || {} as any;
        const html = `<div style="min-width:200px"><strong>${p.id || 'FRA Claim'}</strong><br/>` +
          `Status: ${p.status || ''}<br/>Person: ${p.person || ''}<br/>Village: ${p.village || ''}<br/>District: ${p.district || ''}<br/>Area: ${p.area_ha || ''} ha</div>`;
        const popup = (token && token.length > 20 && !token.includes('placeholder'))
          ? new (mapboxgl as any).Popup({ closeButton: true })
          : new (maplibregl as any).Popup({ closeButton: true });
        (popup as any).setLngLat(e.lngLat).setHTML(html).addTo(map as any);
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
      // On success, reset rate-limit backoff
      backoffRef.current = 0;
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 429) {
        const next = backoffRef.current ? Math.min(backoffRef.current * 2, 30000) : 2000;
        backoffRef.current = next;
        setInfo(`Server is rate limiting. Retrying in ${Math.round(next / 1000)}s...`);
        setTimeout(() => { setInfo(null); addGeoJsonSource(); }, next);
      } else {
        setError('Failed to load atlas data');
      }
    } finally {
      setLoading(false);
      fetchLockRef.current = false;
      lastFetchRef.current = Date.now();
    }
  };

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
        addGeoJsonSource();
        setMapLoaded(true);
        if (datameetToggles.stateBorders || datameetToggles.cityLabels) {
          syncDatameetOverlays();
        }
        try { (map as any).setLayoutProperty?.('hillshade', 'visibility', hillshadeOn ? 'visible' : 'none'); } catch (_) {}
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
            style: OSM_STYLE,
            center: [73.86, 19.08],
            zoom: 11,
            maxZoom: 19
          }) as unknown as mapboxgl.Map;
          mapRef.current = ml;
          ml.on('load', () => {
            addGeoJsonSource();
            setMapLoaded(true);
            if (datameetToggles.stateBorders || datameetToggles.cityLabels) {
              syncDatameetOverlays();
            }
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
        try { (map as unknown as maplibregl.Map).addControl(new (maplibregl as any).ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left'); } catch (_) {}
      }

      // Removed auto style switching on zoom to respect user selection
      map.on('mousemove', (e: any) => {
        setCursorInfo({ lng: Number(e.lngLat.lng.toFixed(5)), lat: Number(e.lngLat.lat.toFixed(5)), zoom: Number(map.getZoom().toFixed(2)) });
      });
      // optional: we can start a passive geolocation to show user's location once
      // (won't follow unless user taps the button we'll add in UI)
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

  // Throttled ResizeObserver (reduced frequency to avoid dev overlay warnings)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !(window as any).ResizeObserver) return;
    let scheduled = false;
    const ro = new (window as any).ResizeObserver(() => {
      if (scheduled) return;
      scheduled = true;
      setTimeout(() => {
        scheduled = false;
        if (mapRef.current) {
          try { mapRef.current.resize(); } catch (_) { /* ignore */ }
        }
      }, 120);
    });
    ro.observe(el);
    return () => { ro.disconnect(); };
  }, []);

  // Suppress benign ResizeObserver loop errors in dev overlay
  useEffect(() => {
    const handler = (ev: any) => {
      const msg = ev?.message || ev?.error?.message || ev?.reason?.message || '';
      if (msg.includes('ResizeObserver loop completed') || msg.includes('ResizeObserver loop limit exceeded')) {
        try { ev?.preventDefault?.(); ev?.stopImmediatePropagation?.(); ev?.stopPropagation?.(); } catch (_) {}
        return true;
      }
      return undefined;
    };
    window.addEventListener('error', handler, true);
    window.addEventListener('unhandledrejection', handler, true);
    const prev = window.onerror;
    window.onerror = function (message: any, source?: any, lineno?: any, colno?: any, error?: any) {
      const text = String(message || error?.message || '');
      if (text.includes('ResizeObserver loop completed') || text.includes('ResizeObserver loop limit exceeded')) {
        return true;
      }
      return prev ? prev(message, source, lineno, colno, error) : false;
    };
    return () => {
      window.removeEventListener('error', handler, true);
      window.removeEventListener('unhandledrejection', handler, true);
      // do not restore window.onerror to keep suppression during session
    };
  }, []);

  // periodic refresh (reduced frequency to avoid 429)
  useEffect(() => {
    const id = setInterval(() => {
      if (mapRef.current?.isStyleLoaded()) {
        addGeoJsonSource();
      }
    }, 60000);
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

  // OSM admin boundaries via OpenMapTiles (vector tiles)
  const syncAdminBoundaries = async () => {
    const map = mapRef.current!;
    if (map.getLayer('vt-admin-boundary')) map.removeLayer('vt-admin-boundary');
    if (map.getSource('vt-admin')) map.removeSource('vt-admin' as any);
    if (!adminToggles.osmAdminBoundaries) return;
    const key = process.env.REACT_APP_MAPTILER_KEY;
    if (!key) return;
    try {
      map.addSource('vt-admin', { type: 'vector', url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${key}` } as any);
      map.addLayer({
        id: 'vt-admin-boundary',
        type: 'line',
        source: 'vt-admin',
        'source-layer': 'boundary',
        paint: {
          'line-color': '#000',
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.3, 8, 0.6, 10, 1.0, 12, 1.5],
          'line-opacity': 0.8
        }
      } as any);
    } catch (_) { /* ignore */ }
    setTimeout(() => map.resize(), 0);
  };

  // Datameet state borders and city labels
  const syncDatameetOverlays = async () => {
    const map = mapRef.current!;
    // Remove existing
    ['dm-state-outline', 'dm-city-labels'].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    ['dm-states-src', 'dm-cities-src'].forEach((id) => {
      if (map.getSource(id)) map.removeSource(id as any);
    });

    // States
    if (datameetToggles.stateBorders) {
      try {
        const key = process.env.REACT_APP_MAPTILER_KEY;
        // If a vector key is configured, prefer vector boundaries directly (skip Datameet probe)
        if (key) {
          if (!map.getSource('vt-places')) {
            map.addSource('vt-places', { type: 'vector', url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${key}` } as any);
          }
          map.addLayer({
            id: 'dm-state-outline',
            type: 'line',
            source: 'vt-places',
            'source-layer': 'boundary',
            paint: { 'line-color': '#283593', 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 8, 1.0, 10, 1.5], 'line-opacity': 0.9 }
          } as any);
        } else {
          // Otherwise try Datameet GeoJSON
          map.addSource('dm-states-src', { type: 'geojson', data: DATAMEET_STATES_GEOJSON_URL } as any);
          map.addLayer({ id: 'dm-state-outline', type: 'line', source: 'dm-states-src', paint: { 'line-color': '#283593', 'line-width': 1.5 } } as any);
        }
      } catch (_) { /* ignore */ }
    }

    // Cities
    if (datameetToggles.cityLabels) {
      try {
        const key = process.env.REACT_APP_MAPTILER_KEY;
        if (key) {
          // Prefer vector places if key present
          if (!map.getSource('vt-places')) {
            map.addSource('vt-places', { type: 'vector', url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${key}` } as any);
          }
          map.addLayer({
            id: 'dm-city-labels',
            type: 'symbol',
            source: 'vt-places',
            'source-layer': 'place',
            minzoom: 5,
            layout: {
              'text-field': ['get', 'name'],
              'text-size': ['interpolate', ['linear'], ['zoom'], 5, 10, 12, 13],
              'text-anchor': 'center'
            },
            paint: {
              'text-color': '#1b5e20',
              'text-halo-color': '#ffffff',
              'text-halo-width': 1
            }
          } as any);
        } else {
          // Try Datameet cities GeoJSON
          map.addSource('dm-cities-src', { type: 'geojson', data: DATAMEET_CITIES_GEOJSON_URL } as any);
          map.addLayer({
            id: 'dm-city-labels',
            type: 'symbol',
            source: 'dm-cities-src',
            layout: {
              'text-field': ['coalesce', ['get', 'name'], ['get', 'NAME'], ['get', 'city'], ['get', 'City'], ['get', 'NAME_2'], ['get', 'NAME_3']],
              'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
              'text-size': 12,
              'text-offset': [0, 0.8],
              'text-anchor': 'top'
            },
            paint: { 'text-color': '#1b5e20', 'text-halo-color': '#ffffff', 'text-halo-width': 1 }
          } as any);
        }
      } catch (_) { /* ignore */ }
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
    
    mapRef.current.setStyle(newStyle as any, { diff: true } as any);
    try { (mapRef.current as any).setMaxZoom?.(19); } catch (_) {}
    mapRef.current.on('style.load', () => {
      addGeoJsonSource();
      syncAdminBoundaries();
      if (datameetToggles.stateBorders || datameetToggles.cityLabels) {
        syncDatameetOverlays();
      }
      try { mapRef.current?.setLayoutProperty('hillshade', 'visibility', hillshadeOn ? 'visible' : 'none'); } catch (_) {}
    });
  };

  const searchPlace = async () => {
    const q = searchQuery.trim();
    if (!q || !mapRef.current) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=geojson&q=${encodeURIComponent(q)}&limit=1`);
      const data = await res.json();
      const feat = data?.features?.[0];
      if (!feat) return;
      const [lng, lat] = feat.geometry.type === 'Point' ? feat.geometry.coordinates : feat.bbox ? [ (feat.bbox[0]+feat.bbox[2])/2, (feat.bbox[1]+feat.bbox[3])/2 ] : [0,0];
      mapRef.current.flyTo({ center: [lng, lat], zoom: 12, pitch: 45, speed: 0.8 });
    } catch (_) {}
  };

  const upsertMyLocationLayers = () => {
    const map = mapRef.current!;
    const p = userLocRef.current;
    if (!p) return;
    const point = { type: 'FeatureCollection', features: [ { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [p.lng, p.lat] } } ] } as any;
    if (!map.getSource('me-point')) {
      map.addSource('me-point', { type: 'geojson', data: point } as any);
      map.addLayer({ id: 'me-point-layer', type: 'circle', source: 'me-point', paint: { 'circle-color': '#1976d2', 'circle-radius': 6, 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' } });
    } else {
      (map.getSource('me-point') as any).setData(point);
    }
    const radiusMeters = Math.max(10, Math.min(500, p.acc || 50));
    const circle = { type: 'FeatureCollection', features: [ { type: 'Feature', properties: { radius: radiusMeters }, geometry: { type: 'Point', coordinates: [p.lng, p.lat] } } ] } as any;
    if (!map.getSource('me-accuracy')) {
      map.addSource('me-accuracy', { type: 'geojson', data: circle } as any);
      map.addLayer({ id: 'me-accuracy-layer', type: 'circle', source: 'me-accuracy', paint: { 'circle-color': '#1976d2', 'circle-opacity': 0.12, 'circle-radius': [ 'interpolate', ['linear'], ['zoom'], 0, 0, 20, radiusMeters ] } });
    } else {
      (map.getSource('me-accuracy') as any).setData(circle);
    }
  };

  const locateMe = (follow = false) => {
    if (!navigator.geolocation || !mapRef.current) return;
    const map = mapRef.current;
    const onPos = (pos: GeolocationPosition) => {
      userLocRef.current = { lng: pos.coords.longitude, lat: pos.coords.latitude, acc: pos.coords.accuracy };
      try { upsertMyLocationLayers(); } catch (_) {}
      map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: Math.max(14, (map as any).getZoom?.() || 12), speed: 0.8 });
    };
    const onErr = () => {};
    navigator.geolocation.getCurrentPosition(onPos, onErr, { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 });
    if (follow) {
      if (geoWatchIdRef.current != null) return;
      geoWatchIdRef.current = navigator.geolocation.watchPosition(onPos, onErr, { enableHighAccuracy: true, maximumAge: 10000 });
    }
  };

  useEffect(() => {
    return () => {
      if (geoWatchIdRef.current != null) {
        try { navigator.geolocation.clearWatch(geoWatchIdRef.current); } catch (_) {}
      }
    };
  }, []);

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
      {!usingMockData && error && (
        <Alert severity="error" sx={{ m: 2, flexShrink: 0 }}>
          {error}
        </Alert>
      )}
      {(usingMockData || info) && (
        <Alert severity={usingMockData ? 'info' : 'info'} sx={{ m: 2, flexShrink: 0 }}>
          {usingMockData ? 'Demo data active: serving sample FRA areas locally.' : info}
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
                        checked={hillshadeOn}
                        onChange={() => {
                          setHillshadeOn((v) => {
                            const nv = !v;
                            setTimeout(() => {
                              try { mapRef.current?.setLayoutProperty('hillshade', 'visibility', nv ? 'visible' : 'none'); } catch (_) {}
                            }, 0);
                            return nv;
                          });
                        }}
                      />
                    }
                    label="Hillshade (relief)"
                  />
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

                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>Datameet</Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={datameetToggles.stateBorders}
                        onChange={() => {
                          setDatameetToggles((p) => {
                            const n = { ...p, stateBorders: !p.stateBorders };
                            setTimeout(syncDatameetOverlays, 0);
                            return n;
                          });
                        }}
                      />
                    }
                    label="State Borders"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={datameetToggles.cityLabels}
                        onChange={() => {
                          setDatameetToggles((p) => {
                            const n = { ...p, cityLabels: !p.cityLabels };
                            setTimeout(syncDatameetOverlays, 0);
                            return n;
                          });
                        }}
                      />
                    }
                    label="City Labels"
                  />
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>Administrative (near real-time)</Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={adminToggles.osmAdminBoundaries}
                        onChange={() => {
                          setAdminToggles((p) => {
                            const n = { ...p, osmAdminBoundaries: !p.osmAdminBoundaries };
                            setTimeout(syncAdminBoundaries, 0);
                            return n;
                          });
                        }}
                      />
                    }
                    label="OSM Admin Boundaries"
                  />
                </Stack>
              </Box>

              {/* Search */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Search Place</Typography>
                <Stack direction="row" spacing={1}>
                  <TextField size="small" fullWidth placeholder="Search city, place…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  <Button variant="contained" onClick={searchPlace}>Go</Button>
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



