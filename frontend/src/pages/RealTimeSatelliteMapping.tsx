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
import { 
  Satellite, 
  LocationOn, 
  TrendingUp,
  Refresh
} from '@mui/icons-material';
import { api } from '../services/api';
import SimpleLandUseMap from '../components/SimpleLandUseMap';

interface RealTimeResult {
  village_id: string;
  village_name: string;
  coordinates: [number, number];
  classification_map: {
    tiles_url: string;
    map_id: string;
    token: string;
  };
  land_use_stats: {
    water_bodies: number;
    crop_fields: number;
    rich_forest: number;
    urban: number;
    other: number;
  };
  processing_time: number;
  model_version: string;
}

const RealTimeSatelliteMapping: React.FC = () => {
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [analysisType, setAnalysisType] = useState('comprehensive');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RealTimeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const states = ['Madhya Pradesh', 'Odisha', 'Tripura', 'Telangana'];
  
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

  const runRealTimeClassification = async () => {
    if (!selectedState || !selectedDistrict || !selectedVillage) {
      setError('Please select State, District, and Village');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/satellite/realtime-classification', {
        state: selectedState,
        district: selectedDistrict,
        village: selectedVillage,
        analysis_type: analysisType,
        confidence_threshold: 0.7
      });

      setResults(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Real-time classification failed');
    } finally {
      setLoading(false);
    }
  };

  const getTotalCoverage = () => {
    if (!results) return 0;
    return Object.values(results.land_use_stats).reduce((sum, val) => sum + val, 0);
  };

  const getDominantLandUse = () => {
    if (!results) return 'Unknown';
    const stats = results.land_use_stats;
    const maxKey = Object.keys(stats).reduce((a, b) => stats[a as keyof typeof stats] > stats[b as keyof typeof stats] ? a : b);
    return maxKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        🛰️ Real-time Satellite Land Use Classification
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Sentinel-2 Real-time Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Get real-time land use classification using latest satellite imagery and machine learning.
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
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

            <Grid item xs={12} md={3}>
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

            <Grid item xs={12} md={3}>
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

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Analysis Type</InputLabel>
                <Select
                  value={analysisType}
                  onChange={(e) => setAnalysisType(e.target.value)}
                >
                  <MenuItem value="comprehensive">Comprehensive</MenuItem>
                  <MenuItem value="forest_focus">Forest Focus</MenuItem>
                  <MenuItem value="agriculture_focus">Agriculture Focus</MenuItem>
                  <MenuItem value="water_focus">Water Focus</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Button
            variant="contained"
            onClick={runRealTimeClassification}
            disabled={loading || !selectedVillage}
            startIcon={loading ? <Refresh /> : <TrendingUp />}
            sx={{ mb: 2 }}
          >
            {loading ? 'Processing Satellite Data...' : 'Run Real-time Classification'}
          </Button>

          {loading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Analyzing latest Sentinel-2 imagery for {selectedVillage}...
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
        <>
          {/* Summary Statistics */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Land Use Summary - {results.village_name}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" color="primary">
                        {getTotalCoverage().toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Coverage
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h6" color="success.main">
                        {getDominantLandUse()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Dominant Land Use
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h6" color="info.main">
                        {results.processing_time}s
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Processing Time
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Chip 
                        label={results.model_version}
                        color="primary"
                        size="small"
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Model Version
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Real-time Land Use Map */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn /> Real-time Land Use Classification Map
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Interactive map showing real-time land use classification based on latest Sentinel-2 satellite imagery.
              </Typography>
              
              <SimpleLandUseMap villageData={results} />
            </CardContent>
          </Card>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              🛰️ Real-time Analysis Complete | 
              📡 Data Source: Sentinel-2 Satellite Imagery | 
              🤖 Classification: Machine Learning Land Use Model |
              <Button 
                size="small" 
                sx={{ ml: 1 }}
                onClick={() => window.open(`/atlas?village=${results.village_id}`, '_blank')}
              >
                View on FRA Atlas
              </Button>
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
};

export default RealTimeSatelliteMapping;