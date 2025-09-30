import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Fab,
  Tooltip
} from '@mui/material';
import {
  Map as MapIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

// Mapbox token (optional - falls back to OpenStreetMap)
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

interface LegacyRecord {
  type: string;
  properties: {
    id: string;
    ownerName: string;
    address: {
      village: string;
      block: string;
      district: string;
      state: string;
      pincode: number;
      fullAddress: string;
    };
    area: {
      hectares: number;
      acres: number;
      squareMeters: number;
    };
    created: string;
    lastModified: string;
    status: string;
    type: string;
    claimType: string;
    documentType: string;
    verificationStatus: string;
  };
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

interface Statistics {
  totalRecords: number;
  totalArea: number;
  byState: Record<string, number>;
  byClaimType: Record<string, number>;
  averageArea: number;
}

const LegacyDataDigitization: React.FC = () => {
  const { user } = useAuth();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  
  const [records, setRecords] = useState<LegacyRecord[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<LegacyRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map with or without Mapbox token
    if (MAPBOX_TOKEN) {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: [78.9629, 20.5937], // Center of India
        zoom: 5
      });
    } else {
      // Fallback to OpenStreetMap
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [
            {
              id: 'osm',
              type: 'raster',
              source: 'osm'
            }
          ]
        },
        center: [78.9629, 20.5937],
        zoom: 5
      });
    }

    // Initialize drawing tools
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      },
      defaultMode: 'draw_polygon'
    });

    map.current.addControl(draw.current);
    map.current.addControl(new mapboxgl.NavigationControl());
    map.current.addControl(new mapboxgl.FullscreenControl());

    // Load existing records
    loadRecords();
    loadStatistics();

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Load existing records
  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await api.get('/legacy-digitization/records');
      if (response.data.success) {
        setRecords(response.data.data.features || []);
        
        // Add records to map
        if (map.current && response.data.data.features.length > 0) {
          map.current.on('load', () => {
            if (map.current!.getSource('legacy-records')) {
              (map.current!.getSource('legacy-records') as mapboxgl.GeoJSONSource).setData(response.data.data);
            } else {
              map.current!.addSource('legacy-records', {
                type: 'geojson',
                data: response.data.data
              });

              map.current!.addLayer({
                id: 'legacy-records-fill',
                type: 'fill',
                source: 'legacy-records',
                paint: {
                  'fill-color': '#ff6b6b',
                  'fill-opacity': 0.6
                }
              });

              map.current!.addLayer({
                id: 'legacy-records-line',
                type: 'line',
                source: 'legacy-records',
                paint: {
                  'line-color': '#ff5252',
                  'line-width': 2
                }
              });

              // Add click handler
              map.current!.on('click', 'legacy-records-fill', (e) => {
                if (e.features && e.features[0]) {
                  const feature = e.features[0] as any;
                  const record = records.find(r => r.properties.id === feature.properties.id);
                  if (record) {
                    setSelectedRecord(record);
                    setShowDetails(true);
                  }
                }
              });

              // Fit map to records
              const bounds = new mapboxgl.LngLatBounds();
              response.data.data.features.forEach((feature: any) => {
                feature.geometry.coordinates[0].forEach((coord: number[]) => {
                  bounds.extend(coord);
                });
              });
              if (!bounds.isEmpty()) {
                map.current!.fitBounds(bounds, { padding: 50 });
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error loading records:', error);
      setSnackbar({ open: true, message: 'Failed to load records', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    try {
      const response = await api.get('/legacy-digitization/statistics');
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  // Save drawn polygon
  const savePolygon = async () => {
    if (!draw.current || !map.current) return;

    const data = draw.current.getAll();
    if (data.features.length === 0) {
      setSnackbar({ open: true, message: 'Please draw a polygon first', severity: 'error' });
      return;
    }

    const polygon = data.features[data.features.length - 1]; // Get the last drawn polygon

    try {
      setSaving(true);
      const response = await api.post('/legacy-digitization/save-record', { polygon });
      
      if (response.data.success) {
        setSnackbar({ open: true, message: 'Legacy record saved successfully!', severity: 'success' });
        
        // Clear the drawing
        draw.current.deleteAll();
        
        // Reload records and statistics
        await loadRecords();
        await loadStatistics();
      }
    } catch (error) {
      console.error('Error saving record:', error);
      setSnackbar({ open: true, message: 'Failed to save record', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Generate dummy records
  const generateDummyRecords = async () => {
    try {
      setLoading(true);
      const response = await api.post('/legacy-digitization/generate-dummy', { count: 5 });
      
      if (response.data.success) {
        setSnackbar({ open: true, message: `Generated ${response.data.data.length} dummy records!`, severity: 'success' });
        await loadRecords();
        await loadStatistics();
      }
    } catch (error) {
      console.error('Error generating dummy records:', error);
      setSnackbar({ open: true, message: 'Failed to generate dummy records', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Delete record
  const deleteRecord = async (recordId: string) => {
    try {
      const response = await api.delete(`/legacy-digitization/records/${recordId}`);
      
      if (response.data.success) {
        setSnackbar({ open: true, message: 'Record deleted successfully!', severity: 'success' });
        setShowDetails(false);
        await loadRecords();
        await loadStatistics();
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      setSnackbar({ open: true, message: 'Failed to delete record', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MapIcon fontSize="large" />
          Legacy FRA Claims/Pattas Digitization
        </Typography>
        <Typography variant="subtitle1">
          Convert legacy IFR, CR, and CFR claims/pattas from paper to digital format
        </Typography>
      </Paper>

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Records
                </Typography>
                <Typography variant="h4" color="primary">
                  {statistics.totalRecords}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Area
                </Typography>
                <Typography variant="h4" color="secondary">
                  {statistics.totalArea} ha
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Area
                </Typography>
                <Typography variant="h4" color="success.main">
                  {statistics.averageArea} ha
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  States Covered
                </Typography>
                <Typography variant="h4" color="info.main">
                  {Object.keys(statistics.byState).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Instructions */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Instructions:</strong> Draw polygons on the map to digitize legacy FRA claims/pattas. 
          Each polygon will be automatically filled with dummy Indian names and location data. 
          Click the save button to store the digitized record in the database.
        </Typography>
      </Alert>

      {/* Map Container */}
      <Paper sx={{ height: '600px', mb: 3, position: 'relative' }}>
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
        
        {/* Floating Action Buttons */}
        <Box sx={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Tooltip title="Save Drawn Polygon">
            <Fab 
              color="primary" 
              onClick={savePolygon}
              disabled={saving}
              size="medium"
            >
              {saving ? <CircularProgress size={24} /> : <SaveIcon />}
            </Fab>
          </Tooltip>
          
          <Tooltip title="Generate Dummy Records">
            <Fab 
              color="secondary" 
              onClick={generateDummyRecords}
              disabled={loading}
              size="medium"
            >
              {loading ? <CircularProgress size={24} /> : <AddIcon />}
            </Fab>
          </Tooltip>
        </Box>

        {/* Loading Overlay */}
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
          >
            <CircularProgress size={60} />
          </Box>
        )}
      </Paper>

      {/* Records List */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Digitized Records ({records.length})
        </Typography>
        
        {records.length === 0 ? (
          <Alert severity="info">
            No records found. Draw polygons on the map or generate dummy data to get started.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {records.map((record) => (
              <Grid item xs={12} sm={6} md={4} key={record.properties.id}>
                <Card sx={{ cursor: 'pointer' }} onClick={() => { setSelectedRecord(record); setShowDetails(true); }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {record.properties.ownerName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {record.properties.address.village}, {record.properties.address.district}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <Chip label={record.properties.claimType} size="small" color="primary" />
                      <Chip label={`${record.properties.area.hectares} ha`} size="small" color="secondary" />
                      <Chip label={record.properties.verificationStatus} size="small" color="default" />
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                      Created: {new Date(record.properties.created).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Record Details Dialog */}
      <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon />
            Record Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>Owner Name</Typography>
                <Typography variant="body1" gutterBottom>{selectedRecord.properties.ownerName}</Typography>
                
                <Typography variant="subtitle2" gutterBottom>Address</Typography>
                <Typography variant="body2" gutterBottom>{selectedRecord.properties.address.fullAddress}</Typography>
                
                <Typography variant="subtitle2" gutterBottom>Claim Type</Typography>
                <Chip label={selectedRecord.properties.claimType} color="primary" size="small" />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>Area</Typography>
                <Typography variant="body2" gutterBottom>
                  {selectedRecord.properties.area.hectares} hectares ({selectedRecord.properties.area.acres} acres)
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>Status</Typography>
                <Chip label={selectedRecord.properties.verificationStatus} color="default" size="small" />
                
                <Typography variant="subtitle2" gutterBottom>Created</Typography>
                <Typography variant="body2" gutterBottom>
                  {new Date(selectedRecord.properties.created).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Close</Button>
          {selectedRecord && (
            <Button 
              color="error" 
              onClick={() => deleteRecord(selectedRecord.properties.id)}
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LegacyDataDigitization;