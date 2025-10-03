import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import {
  Save,
  AutoFixHigh,
  Visibility,
  Person,
  LocationOn,
  Home,
  Assignment,
  Map,
  DataUsage,
  Terrain,
  Place,
  Straighten,
  CheckCircle,
  Info,
  History,
  MyLocation
} from '@mui/icons-material';
import L from 'leaflet';
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

// Indian names data
const indianNames = {
  male: ['Rajesh', 'Suresh', 'Ramesh', 'Mahesh', 'Dinesh', 'Mukesh', 'Naresh', 'Ganesh', 'Rakesh', 'Umesh'],
  female: ['Sunita', 'Geeta', 'Sita', 'Rita', 'Anita', 'Kavita', 'Mamta', 'Shanti', 'Parvati', 'Saraswati'],
  surnames: ['Kumar', 'Singh', 'Sharma', 'Verma', 'Gupta', 'Agarwal', 'Tripathi', 'Mishra', 'Pandey', 'Tiwari']
};

const states = ['Madhya Pradesh', 'Tripura', 'Odisha', 'Telangana'];
const districts = {
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur'],
  'Tripura': ['West Tripura', 'South Tripura', 'North Tripura', 'Dhalai'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Berhampur', 'Sambalpur'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam']
};

interface PattaHolder {
  id: string;
  ownerName: string;
  fatherName: string;
  address: {
    village: string;
    district: string;
    state: string;
  };
  landDetails: {
    surveyNo: string;
    khasra: string;
    area: {
      hectares: number;
    };
    classification: string;
    fraStatus: string;
  };
  coordinates: number[][];
  geometry: any;
  created: string;
}

const DummyDataGenerator: React.FC = () => {
  usePageTranslation();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [currentPolygon, setCurrentPolygon] = useState<any>(null);
  const [generatedData, setGeneratedData] = useState<PattaHolder | null>(null);
  const [savedRecords, setSavedRecords] = useState<PattaHolder[]>([]);

  // Generate random Indian name
  const generateRandomName = () => {
    const isMale = Math.random() > 0.5;
    const firstName = isMale 
      ? indianNames.male[Math.floor(Math.random() * indianNames.male.length)]
      : indianNames.female[Math.floor(Math.random() * indianNames.female.length)];
    const surname = indianNames.surnames[Math.floor(Math.random() * indianNames.surnames.length)];
    return `${firstName} ${surname}`;
  };

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
      minZoom: 3,
      maxZoom: 18
    });

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles © Esri',
      maxZoom: 18
    }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    const drawControl = new (L.Control as any).Draw({
      edit: { featureGroup: drawnItems },
      draw: {
        polygon: true,
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false
      }
    });
    map.addControl(drawControl);

    map.on((L as any).Draw.Event.CREATED, handleDrawingCreate);
    mapRef.current = map;
    
    loadExistingPlotsOnMap();
    loadRecords();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const handleDrawingCreate = (e: any) => {
    const layer = e.layer;
    if (layer && drawnItemsRef.current) {
      drawnItemsRef.current.addLayer(layer);
      
      const geoJson = layer.toGeoJSON();
      if (geoJson.geometry.type === 'Polygon') {
        const coords = geoJson.geometry.coordinates[0];
        let area = 0;
        for (let i = 0; i < coords.length - 1; i++) {
          area += (coords[i][0] * coords[i + 1][1] - coords[i + 1][0] * coords[i][1]);
        }
        area = Math.abs(area) / 2;
        const areaHectares = (area * 111320 * 111320) / 10000;

        const state = states[Math.floor(Math.random() * states.length)];
        const districtList = districts[state as keyof typeof districts];
        const district = districtList[Math.floor(Math.random() * districtList.length)];

        const dummyData: PattaHolder = {
          id: `polygon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ownerName: generateRandomName(),
          fatherName: generateRandomName(),
          address: {
            village: `Village_${Math.floor(Math.random() * 100)}`,
            district,
            state
          },
          landDetails: {
            surveyNo: `${state.substring(0,2).toUpperCase()}-${Math.floor(Math.random() * 999) + 1}`,
            khasra: `${Math.floor(Math.random() * 200) + 1}/${Math.floor(Math.random() * 10) + 1}`,
            area: { hectares: Math.max(0.1, areaHectares) },
            classification: 'Forest Land (Community)',
            fraStatus: ['CFR Granted', 'IFR Granted', 'Under Review'][Math.floor(Math.random() * 3)]
          },
          coordinates: coords,
          geometry: geoJson.geometry,
          created: new Date().toISOString()
        };

        setGeneratedData(dummyData);
        setShowSaveDialog(true);
      }
    }
  };

  const savePattaHolder = () => {
    if (!generatedData) return;

    setLoading(true);
    try {
      const updatedRecords = [...savedRecords, generatedData];
      setSavedRecords(updatedRecords);
      localStorage.setItem('pattaHolders', JSON.stringify(updatedRecords));

      setSuccess(`Patta holder data saved! Owner: ${generatedData.ownerName}`);
      setShowSaveDialog(false);
      setGeneratedData(null);
      
      if (drawnItemsRef.current) {
        drawnItemsRef.current.clearLayers();
      }
      
      setTimeout(() => {
        loadExistingPlotsOnMap();
      }, 500);
      
    } catch (error: any) {
      setError('Failed to save patta holder data');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingPlotsOnMap = () => {
    if (!mapRef.current) return;
    
    const saved = localStorage.getItem('pattaHolders');
    if (saved) {
      try {
        const records = JSON.parse(saved);
        records.forEach((record: PattaHolder) => {
          if (record.coordinates && record.coordinates.length > 0) {
            const coordinates: [number, number][] = record.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
            
            const polygon = L.polygon(coordinates, {
              color: '#e91e63',
              fillColor: '#f8bbd9',
              fillOpacity: 0.3,
              weight: 2,
              dashArray: '5,5'
            });

            const popupContent = `
              <div style="min-width: 200px;">
                <h4>${record.ownerName}</h4>
                <p><strong>Village:</strong> ${record.address.village}</p>
                <p><strong>District:</strong> ${record.address.district}</p>
                <p><strong>Area:</strong> ${record.landDetails.area.hectares.toFixed(2)} hectares</p>
                <p><strong>Status:</strong> ${record.landDetails.fraStatus}</p>
              </div>
            `;

            polygon.bindPopup(popupContent);
            polygon.addTo(mapRef.current!);
          }
        });
      } catch (error) {
        console.warn('Failed to load existing plots:', error);
      }
    }
  };

  const loadRecords = () => {
    const saved = localStorage.getItem('pattaHolders');
    if (saved) {
      try {
        setSavedRecords(JSON.parse(saved));
      } catch (error) {
        setSavedRecords([]);
      }
    }
  };

  const focusOnPlot = (record: PattaHolder) => {
    if (!mapRef.current || !record.coordinates) return;
    
    try {
      const coordinates: [number, number][] = record.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
      const bounds = L.latLngBounds(coordinates);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    } catch (error) {
      console.warn('Failed to focus on plot:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 104px)', bgcolor: 'background.default', position: 'relative', left: '260px', width: 'calc(100vw - 260px)' }}>
      {/* Controls Sidebar */}
      <Box sx={{ width: 400, flexShrink: 0, bgcolor: 'background.paper', borderRight: (theme) => `1px solid ${theme.palette.divider}`, height: '100%', overflow: 'auto', p: 2 }}>
        <Typography variant="h6" gutterBottom color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Home /> Dummy Patta Data Generator
        </Typography>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assignment /> Instructions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary" paragraph>
              1. Draw a polygon on the map to define the land boundary
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              2. System will auto-generate Indian names and land details
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              3. Review and save the generated patta holder data
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DataUsage /> Statistics
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Chip label={`${savedRecords.length} Records Generated`} color="primary" size="small" icon={<Person />} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {savedRecords.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <History /> Recent Records
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1} sx={{ maxHeight: 300, overflow: 'auto' }}>
                {savedRecords.slice(-5).reverse().map((record, index) => (
                  <Box key={record.id || `record-${index}`} sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {record.ownerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {record.address?.village || 'N/A'}, {record.address?.district || 'N/A'}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {typeof record.landDetails?.area?.hectares === 'number' ? record.landDetails.area.hectares.toFixed(2) : '0'} hectares
                      </Typography>
                    </Box>
                    <Button size="small" variant="outlined" onClick={() => focusOnPlot(record)} sx={{ minWidth: 'auto', px: 1 }} startIcon={<MyLocation />}>
                      Focus
                    </Button>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Map Container */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <Box ref={containerRef} sx={{ width: '100%', height: '100%', '& .leaflet-container': { width: '100% !important', height: '100% !important' } }} />

        {success && (
          <Alert severity="success" sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1001, maxWidth: 400 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1001, maxWidth: 400 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assignment /> Generated Patta Holder Data
        </DialogTitle>
        <DialogContent>
          {generatedData && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person /> Owner Details
                    </Typography>
                    <Typography variant="body2"><strong>Name:</strong> {generatedData.ownerName}</Typography>
                    <Typography variant="body2"><strong>Father:</strong> {generatedData.fatherName}</Typography>
                    <Typography variant="body2"><strong>Village:</strong> {generatedData.address.village}</Typography>
                    <Typography variant="body2"><strong>District:</strong> {generatedData.address.district}</Typography>
                    <Typography variant="body2"><strong>State:</strong> {generatedData.address.state}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Terrain /> Land Details
                    </Typography>
                    <Typography variant="body2"><strong>Survey No:</strong> {generatedData.landDetails.surveyNo}</Typography>
                    <Typography variant="body2"><strong>Khasra:</strong> {generatedData.landDetails.khasra}</Typography>
                    <Typography variant="body2"><strong>Area:</strong> {generatedData.landDetails.area.hectares.toFixed(2)} hectares</Typography>
                    <Typography variant="body2"><strong>Classification:</strong> {generatedData.landDetails.classification}</Typography>
                    <Typography variant="body2"><strong>FRA Status:</strong> {generatedData.landDetails.fraStatus}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)}>Cancel</Button>
          <Button onClick={savePattaHolder} variant="contained" disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : <Save />}>
            Save Patta Holder
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DummyDataGenerator;