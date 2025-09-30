import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Chip
} from '@mui/material';
import { Satellite, LocationOn, Map } from '@mui/icons-material';
import { api } from '../services/api';

interface AssetMappingResult {
  village_id: string;
  village_name: string;
  coordinates: [number, number];
  assets: {
    water_bodies: Array<{ type: string; area?: number; coordinates: [number, number] }>;
    agricultural_land: Array<{ type: string; area?: number; coordinates: [number, number] }>;
    forest_cover: Array<{ type: string; area?: number; coordinates: [number, number] }>;
    infrastructure: Array<{ type: string; area?: number; coordinates: [number, number] }>;
  };
  processing_time: number;
}

const SatelliteAssetMapping: React.FC = () => {
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AssetMappingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const states = [
    'Madhya Pradesh',
    'Odisha', 
    'Tripura',
    'Telangana'
  ];

  const districts = {
    'Madhya Pradesh': ['Khargone', 'Dhar', 'Jhabua', 'Alirajpur'],
    'Odisha': ['Mayurbhanj', 'Keonjhar', 'Sundargarh', 'Kandhamal'],
    'Tripura': ['West Tripura', 'South Tripura', 'North Tripura'],
    'Telangana': ['Hyderabad', 'Adilabad', 'Warangal', 'Khammam']
  };

  const villages = {
    'Khargone': ['Khargone Village', 'Tribal Settlement A', 'Forest Village B'],
    'Mayurbhanj': ['Tribal Settlement', 'Forest Village C', 'Adivasi Gram'],
    'West Tripura': ['Forest Village', 'Tribal Colony', 'Hill Village'],
    'Hyderabad': ['Suburban Village', 'Tribal Area', 'Forest Settlement']
  };

  const runAssetMapping = async () => {
    if (!selectedState || !selectedDistrict || !selectedVillage) {
      setError('Please select State, District, and Village');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/satellite/asset-mapping', {
        state: selectedState,
        district: selectedDistrict,
        village: selectedVillage
      });

      setResults(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Asset mapping failed');
    } finally {
      setLoading(false);
    }
  };

  const getAssetColor = (assetType: string) => {
    const colors = {
      water_bodies: '#2196F3',
      agricultural_land: '#4CAF50', 
      forest_cover: '#388E3C',
      infrastructure: '#FF9800'
    };
    return colors[assetType as keyof typeof colors] || '#757575';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Satellite /> Satellite-Based Asset Mapping
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Select Location for Asset Mapping
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>State</InputLabel>
                <Select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedDistrict('');
                    setSelectedVillage('');
                  }}
                >
                  {states.map((state) => (
                    <MenuItem key={state} value={state}>{state}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth disabled={!selectedState}>
                <InputLabel>District</InputLabel>
                <Select
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setSelectedVillage('');
                  }}
                >
                  {selectedState && districts[selectedState as keyof typeof districts]?.map((district) => (
                    <MenuItem key={district} value={district}>{district}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth disabled={!selectedDistrict}>
                <InputLabel>Village</InputLabel>
                <Select
                  value={selectedVillage}
                  onChange={(e) => setSelectedVillage(e.target.value)}
                >
                  {selectedDistrict && villages[selectedDistrict as keyof typeof villages]?.map((village) => (
                    <MenuItem key={village} value={village}>{village}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Button
            variant="contained"
            onClick={runAssetMapping}
            disabled={loading || !selectedVillage}
            startIcon={<Map />}
            sx={{ mb: 2 }}
          >
            {loading ? 'Processing Satellite Data...' : 'Run Asset Mapping'}
          </Button>

          {loading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Analyzing satellite imagery for {selectedVillage}...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOn /> Asset Mapping Results - {results.village_name}
            </Typography>

            <Grid container spacing={3}>
              {Object.entries(results.assets).map(([assetType, assets]) => (
                <Grid item xs={12} md={6} key={assetType}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom sx={{ 
                        color: getAssetColor(assetType),
                        fontWeight: 'bold',
                        textTransform: 'capitalize'
                      }}>
                        {assetType.replace('_', ' ')} ({assets.length} detected)
                      </Typography>
                      
                      {assets.slice(0, 5).map((asset, index) => (
                        <Box key={index} sx={{ mb: 1 }}>
                          <Chip
                            label={`${asset.type || assetType} ${asset.area ? `- ${asset.area.toFixed(1)} ha` : ''}`}
                            size="small"
                            sx={{ 
                              bgcolor: getAssetColor(assetType),
                              color: 'white',
                              mr: 1,
                              mb: 0.5
                            }}
                          />
                        </Box>
                      ))}
                      
                      {assets.length > 5 && (
                        <Typography variant="caption" color="text.secondary">
                          +{assets.length - 5} more assets detected
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Processing completed in {results.processing_time}s | 
                Coordinates: {results.coordinates[0].toFixed(4)}, {results.coordinates[1].toFixed(4)} |
                <Button 
                  size="small" 
                  sx={{ ml: 1 }}
                  onClick={() => window.open(`/atlas?village=${results.village_id}`, '_blank')}
                >
                  View on FRA Atlas
                </Button>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default SatelliteAssetMapping;