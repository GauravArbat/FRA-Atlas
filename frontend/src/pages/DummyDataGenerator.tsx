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
  LocationOn
} from '@mui/icons-material';
import L from 'leaflet';
import { usePageTranslation } from '../hooks/usePageTranslation';
import { pattaHoldersAPI } from '../services/pattaHoldersAPI';
import type { PattaHolder as PattaHolderType } from '../services/pattaHoldersAPI';
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
  male: ['Rajesh', 'Suresh', 'Ramesh', 'Mahesh', 'Dinesh', 'Mukesh', 'Naresh', 'Ganesh', 'Rakesh', 'Umesh', 'Anil', 'Sunil', 'Vinod', 'Manoj', 'Sanjay', 'Vijay', 'Ajay', 'Ravi', 'Amit', 'Rohit'],
  female: ['Sunita', 'Geeta', 'Sita', 'Rita', 'Anita', 'Kavita', 'Mamta', 'Shanti', 'Parvati', 'Saraswati', 'Lakshmi', 'Radha', 'Meera', 'Seema', 'Reema', 'Neeta', 'Preeta', 'Savita', 'Lalita', 'Malti'],
  surnames: ['Kumar', 'Singh', 'Sharma', 'Verma', 'Gupta', 'Agarwal', 'Tripathi', 'Mishra', 'Pandey', 'Tiwari', 'Yadav', 'Joshi', 'Patel', 'Shah', 'Mehta', 'Desai', 'Modi', 'Thakur', 'Chauhan', 'Rajput']
};

const states = ['Madhya Pradesh', 'Tripura', 'Odisha', 'Telangana'];
const districts = {
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas', 'Satna'],
  'Tripura': ['West Tripura', 'South Tripura', 'North Tripura', 'Dhalai', 'Gomati', 'Khowai', 'Sepahijala', 'Unakoti'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Berhampur', 'Sambalpur', 'Rourkela', 'Balasore', 'Puri', 'Angul'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam', 'Mahbubnagar', 'Nalgonda']
};

// Location-based mapping
const locationMapping = {
  'Madhya Pradesh': {
    districts: ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas', 'Satna'],
    villages: {
      'Bhopal': ['Khairlanji', 'Greenpur', 'Shivnagar'],
      'Indore': ['Raghunathpur', 'Laxmipur'],
      'Gwalior': ['Haripur', 'Krishnapur'],
      'Jabalpur': ['Gopalpur', 'Rampur']
    },
    blocks: {
      'Bhopal': ['Bhopal Block', 'Berasia Block'],
      'Indore': ['Indore Block', 'Mhow Block'],
      'Gwalior': ['Gwalior Block', 'Dabra Block'],
      'Jabalpur': ['Jabalpur Block', 'Sihora Block']
    }
  },
  'Tripura': {
    districts: ['West Tripura', 'South Tripura', 'North Tripura', 'Dhalai'],
    villages: {
      'West Tripura': ['Gandacherra', 'Agartala', 'Mohanpur'],
      'South Tripura': ['Udaipur', 'Belonia'],
      'North Tripura': ['Dharmanagar', 'Kailashahar'],
      'Dhalai': ['Ambassa', 'Kamalpur']
    },
    blocks: {
      'West Tripura': ['West Tripura Block', 'Agartala Block'],
      'South Tripura': ['South Tripura Block', 'Belonia Block'],
      'North Tripura': ['North Tripura Block', 'Dharmanagar Block'],
      'Dhalai': ['Dhalai Block', 'Ambassa Block']
    }
  },
  'Odisha': {
    districts: ['Bhubaneswar', 'Cuttack', 'Berhampur', 'Sambalpur', 'Rourkela', 'Balasore', 'Puri', 'Angul'],
    villages: {
      'Cuttack': ['Baripada', 'Phulbani'],
      'Bhubaneswar': ['Khordha', 'Jatni'],
      'Berhampur': ['Ganjam', 'Chhatrapur'],
      'Sambalpur': ['Burla', 'Hirakud']
    },
    blocks: {
      'Cuttack': ['Cuttack Block', 'Baripada Block'],
      'Bhubaneswar': ['Bhubaneswar Block', 'Khordha Block'],
      'Berhampur': ['Berhampur Block', 'Ganjam Block'],
      'Sambalpur': ['Sambalpur Block', 'Burla Block']
    }
  },
  'Telangana': {
    districts: ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam', 'Mahbubnagar', 'Nalgonda'],
    villages: {
      'Hyderabad': ['Utnoor', 'Secunderabad'],
      'Warangal': ['Hanamkonda', 'Kazipet'],
      'Nizamabad': ['Bodhan', 'Armoor'],
      'Khammam': ['Kothagudem', 'Yellandu']
    },
    blocks: {
      'Hyderabad': ['Hyderabad Block', 'Utnoor Block'],
      'Warangal': ['Warangal Block', 'Hanamkonda Block'],
      'Nizamabad': ['Nizamabad Block', 'Bodhan Block'],
      'Khammam': ['Khammam Block', 'Kothagudem Block']
    }
  }
};

type PattaHolder = PattaHolderType;

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

  // Generate location-based address from coordinates
  const generateLocationBasedAddress = (coordinates: number[][]) => {
    // Get center point of polygon
    const centerLat = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
    const centerLng = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
    
    // Determine state based on coordinates (rough approximation)
    let state: string;
    let stateData: any;
    
    if (centerLat >= 21.0 && centerLat <= 26.0 && centerLng >= 74.0 && centerLng <= 82.0) {
      state = 'Madhya Pradesh';
    } else if (centerLat >= 23.0 && centerLat <= 25.0 && centerLng >= 91.0 && centerLng <= 93.0) {
      state = 'Tripura';
    } else if (centerLat >= 17.0 && centerLat <= 22.0 && centerLng >= 81.0 && centerLng <= 87.0) {
      state = 'Odisha';
    } else if (centerLat >= 16.0 && centerLat <= 20.0 && centerLng >= 77.0 && centerLng <= 81.0) {
      state = 'Telangana';
    } else {
      // Default fallback
      state = 'Madhya Pradesh';
    }
    
    stateData = locationMapping[state as keyof typeof locationMapping];
    const district = stateData.districts[Math.floor(Math.random() * stateData.districts.length)];
    const villageList = stateData.villages[district] || Object.values(stateData.villages)[0] as string[];
    const village = villageList[Math.floor(Math.random() * villageList.length)];
    const blockList = stateData.blocks[district] || Object.values(stateData.blocks)[0] as string[];
    const block = blockList[Math.floor(Math.random() * blockList.length)];
    const pincode = Math.floor(Math.random() * 900000) + 100000;

    return {
      village,
      block,
      district,
      state,
      pincode,
      fullAddress: `${village}, ${block}, ${district}, ${state} - ${pincode}`
    };
  };

  // Generate random land details
  const generateLandDetails = (area: number) => {
    const stateCode = ['MP', 'TR', 'OD', 'TG'][Math.floor(Math.random() * 4)];
    const districtCode = ['BHO', 'AGR', 'HYD', 'CUT'][Math.floor(Math.random() * 4)];
    const surveyNo = `${stateCode}-${districtCode}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;
    const khasra = `${Math.floor(Math.random() * 200) + 1}/${Math.floor(Math.random() * 10) + 1}`;
    
    const classifications = ['Forest Land (Community)', 'Agricultural Land', 'Homestead Land', 'Grazing Land'];
    const fraStatuses = ['CFR Granted', 'IFR Granted', 'CR Granted', 'Under Review', 'Pending'];
    
    return {
      surveyNo,
      khasra,
      area: {
        hectares: area,
        acres: area * 2.471,
        squareMeters: area * 10000
      },
      classification: classifications[Math.floor(Math.random() * classifications.length)],
      fraStatus: fraStatuses[Math.floor(Math.random() * fraStatuses.length)]
    };
  };

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [20.5937, 78.9629], // India center
      zoom: 5,
      zoomControl: true,
      minZoom: 3,
      maxZoom: 18
    });

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles © Esri',
      maxZoom: 18
    }).addTo(map);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      attribution: '',
      maxZoom: 18
    }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    const drawControl = new (L.Control as any).Draw({
      edit: {
        featureGroup: drawnItems
      },
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
    
    // Load existing plots after map is ready
    setTimeout(() => {
      loadExistingPlotsOnMap();
    }, 1000);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle drawing creation
  const handleDrawingCreate = (e: any) => {
    const layer = e.layer;
    if (layer && drawnItemsRef.current) {
      drawnItemsRef.current.addLayer(layer);
      
      const geoJson = layer.toGeoJSON();
      if (geoJson.geometry.type === 'Polygon') {
        setCurrentPolygon(geoJson);
        
        // Calculate area
        const coords = geoJson.geometry.coordinates[0];
        let area = 0;
        for (let i = 0; i < coords.length - 1; i++) {
          area += (coords[i][0] * coords[i + 1][1] - coords[i + 1][0] * coords[i][1]);
        }
        area = Math.abs(area) / 2;
        const areaHectares = (area * 111320 * 111320) / 10000; // Convert to hectares

        // Generate dummy data with location-based address
        const locationBasedAddress = generateLocationBasedAddress(coords);
        const dummyData: PattaHolder = {
          id: `polygon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ownerName: generateRandomName(),
          fatherName: generateRandomName(),
          address: locationBasedAddress,
          landDetails: generateLandDetails(Math.max(0.1, areaHectares)),
          coordinates: coords,
          geometry: geoJson.geometry,
          created: new Date().toISOString(),
          lastModified: new Date().toISOString()
        };

        setGeneratedData(dummyData);
        setShowSaveDialog(true);
      }
    }
  };

  // Save patta holder data
  const savePattaHolder = async () => {
    if (!generatedData) return;

    setLoading(true);
    try {
      // Save to backend API
      const response = await pattaHoldersAPI.create(generatedData);
      
      if (response.success) {
        const newRecord = response.data;
        const updatedRecords = [...savedRecords, newRecord];
        setSavedRecords(updatedRecords);
        
        // Also save to localStorage as backup
        localStorage.setItem('pattaHolders', JSON.stringify(updatedRecords));

        setSuccess(`Patta holder data saved successfully! Owner: ${generatedData.ownerName}`);
        setShowSaveDialog(false);
        setGeneratedData(null);
        
        // Clear the drawn polygon
        if (drawnItemsRef.current) {
          drawnItemsRef.current.clearLayers();
        }
        
        // Reload existing plots to show the new one
        setTimeout(() => {
          loadExistingPlotsOnMap();
        }, 500);
      } else {
        throw new Error(response.message || 'Failed to save data');
      }
    } catch (error: any) {
      console.error('Error saving patta holder:', error);
      setError(error.response?.data?.message || 'Failed to save patta holder data');
    } finally {
      setLoading(false);
    }
  };

  // Focus on specific plot
  const focusOnPlot = (record: PattaHolder) => {
    if (!mapRef.current || !record.coordinates) return;
    
    try {
      // Convert coordinates to Leaflet format
      const coordinates: [number, number][] = record.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
      
      // Create bounds from coordinates
      const bounds = L.latLngBounds(coordinates);
      
      // Fit map to bounds with padding
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      
      // Highlight the plot temporarily
      const highlightPolygon = L.polygon(coordinates, {
        color: '#ff1744',
        fillColor: '#ff1744',
        fillOpacity: 0.3,
        weight: 3,
        dashArray: '10,5'
      }).addTo(mapRef.current);
      
      // Remove highlight after 3 seconds
      setTimeout(() => {
        if (mapRef.current && highlightPolygon) {
          mapRef.current.removeLayer(highlightPolygon);
        }
      }, 3000);
      
    } catch (error) {
      console.warn('Failed to focus on plot:', error);
    }
  };

  // Load existing plots on map
  const loadExistingPlotsOnMap = async () => {
    try {
      const response = await pattaHoldersAPI.getGeoJSON();
      if (response.success && response.data && mapRef.current) {
        const geojson = response.data;
        
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
            color: '#e91e63',
            fillColor: '#f8bbd9',
            fillOpacity: 0.3,
            weight: 2,
            dashArray: '5,5'
          });

          const popupContent = `
            <div style="min-width: 200px;">
              <h4>🏠 ${props.ownerName}</h4>
              <p><strong>Village:</strong> ${props.village}</p>
              <p><strong>District:</strong> ${props.district}</p>
              <p><strong>Area:</strong> ${props.area} hectares</p>
              <p><strong>Status:</strong> ${props.fraStatus}</p>
              <p style="color: #e91e63; font-size: 12px;"><strong>Existing Plot</strong></p>
            </div>
          `;

          polygon.bindPopup(popupContent);
          polygon.addTo(mapRef.current!);
        });
      }
    } catch (error) {
      console.warn('Failed to load existing plots:', error);
    }
  };

  // Load saved records on component mount
  useEffect(() => {
    const loadRecords = async () => {
      try {
        // Try to load from API first
        const response = await pattaHoldersAPI.getAll();
        if (response.success && response.data) {
          setSavedRecords(response.data);
          // Update localStorage with latest data
          localStorage.setItem('pattaHolders', JSON.stringify(response.data));
        }
      } catch (error) {
        console.warn('Failed to load from API, using localStorage:', error);
        // Fallback to localStorage
        const saved = localStorage.getItem('pattaHolders');
        if (saved) {
          setSavedRecords(JSON.parse(saved));
        }
      }
    };
    
    loadRecords();
  }, []);

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
      {/* Controls Sidebar */}
      <Box
        sx={{
          width: 400,
          flexShrink: 0,
          bgcolor: 'background.paper',
          borderRight: (theme) => `1px solid ${theme.palette.divider}`,
          height: '100%',
          overflow: 'auto',
          p: 2
        }}
      >
        <Typography variant="h6" gutterBottom color="text.primary">
          <span data-translate>Dummy Patta Data Generator</span>
        </Typography>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              <span data-translate>Instructions</span>
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
            <Typography variant="subtitle2" gutterBottom>
              <span data-translate>Statistics</span>
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Chip 
                  label={`${savedRecords.length} Records Generated`}
                  color="primary"
                  size="small"
                  icon={<Person />}
                />
              </Grid>
              <Grid item xs={12}>
                <Chip 
                  label="Ready to Generate"
                  color="success"
                  size="small"
                  icon={<AutoFixHigh />}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Recent Records */}
        {savedRecords.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                <span data-translate>Recent Records</span>
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1} sx={{ maxHeight: 300, overflow: 'auto' }}>
                {savedRecords.slice(-5).reverse().map((record) => (
                  <Box key={record.id} sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {record.ownerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {record.address.village}, {record.address.district}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {record.landDetails.area.hectares.toFixed(2)} hectares
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => focusOnPlot(record)}
                      sx={{ minWidth: 'auto', px: 1 }}
                    >
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
        <Box
          ref={containerRef}
          sx={{
            width: '100%',
            height: '100%',
            '& .leaflet-container': {
              width: '100% !important',
              height: '100% !important'
            }
          }}
        />

        {/* Success/Error Messages */}
        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              position: 'absolute', 
              top: 16, 
              left: 16, 
              zIndex: 1001,
              maxWidth: 400
            }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              position: 'absolute', 
              top: 16, 
              left: 16, 
              zIndex: 1001,
              maxWidth: 400
            }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
      </Box>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <span data-translate>Generated Patta Holder Data</span>
        </DialogTitle>
        <DialogContent>
          {generatedData && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      <span data-translate>Owner Details</span>
                    </Typography>
                    <Typography variant="body2">
                      <strong>Name:</strong> {generatedData.ownerName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Father:</strong> {generatedData.fatherName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Village:</strong> {generatedData.address.village}
                    </Typography>
                    <Typography variant="body2">
                      <strong>District:</strong> {generatedData.address.district}
                    </Typography>
                    <Typography variant="body2">
                      <strong>State:</strong> {generatedData.address.state}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      <span data-translate>Land Details</span>
                    </Typography>
                    <Typography variant="body2">
                      <strong>Survey No:</strong> {generatedData.landDetails.surveyNo}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Khasra:</strong> {generatedData.landDetails.khasra}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Area:</strong> {generatedData.landDetails.area.hectares.toFixed(2)} hectares
                    </Typography>
                    <Typography variant="body2">
                      <strong>Classification:</strong> {generatedData.landDetails.classification}
                    </Typography>
                    <Typography variant="body2">
                      <strong>FRA Status:</strong> {generatedData.landDetails.fraStatus}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)}>
            <span data-translate>Cancel</span>
          </Button>
          <Button 
            onClick={savePattaHolder} 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          >
            <span data-translate>Save Patta Holder</span>
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DummyDataGenerator;