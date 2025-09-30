import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { Satellite, Analytics, TrendingUp, Water, Forest, Agriculture } from '@mui/icons-material';
import { api } from '../services/api';

interface VillageData {
  village_id: string;
  village_name: string;
  state: string;
  district: string;
  coordinates: [number, number];
  fra_claims: number;
  fra_titles: number;
  population: number;
}

interface DSSResult {
  village_id: string;
  village_name: string;
  ensemble_priority: number;
  model_predictions: { [key: string]: number };
  confidence_score: number;
  satellite_insights: {
    ndvi: { value: number; level: string };
    water_availability: { value: number; level: string };
    forest_cover: { value: number; level: string };
    infrastructure: { value: number; level: string };
  };
  scheme_recommendations: Array<{
    scheme_name: string;
    eligibility_score: number;
    priority: string;
  }>;
}

const SatelliteMapping: React.FC = () => {
  const [results, setResults] = useState<DSSResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampleVillages: VillageData[] = [
    {
      village_id: 'MP001',
      village_name: 'Khargone Village',
      state: 'Madhya Pradesh',
      district: 'Khargone',
      coordinates: [21.8245, 75.6102],
      fra_claims: 45,
      fra_titles: 32,
      population: 1200
    },
    {
      village_id: 'OD001',
      village_name: 'Tribal Settlement',
      state: 'Odisha',
      district: 'Mayurbhanj',
      coordinates: [21.9270, 86.7470],
      fra_claims: 67,
      fra_titles: 28,
      population: 890
    },
    {
      village_id: 'TR001',
      village_name: 'Forest Village',
      state: 'Tripura',
      district: 'West Tripura',
      coordinates: [23.8315, 91.2868],
      fra_claims: 23,
      fra_titles: 18,
      population: 650
    }
  ];

  const runSatelliteAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/dss/hybrid-analyze', {
        villages: sampleVillages,
        schemes: ['PM_KISAN', 'JAL_JEEVAN', 'MGNREGA', 'DAJGUA']
      });
      
      setResults(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Hybrid analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 70) return 'error';
    if (score >= 50) return 'warning';
    return 'success';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'agriculture': return <Agriculture />;
      case 'water': return <Water />;
      case 'forest': return <Forest />;
      default: return <Analytics />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Satellite /> Satellite Mapping & AI Analysis
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Google Earth Engine Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Analyze villages using satellite data for NDVI, water availability, forest cover, and infrastructure.
          </Typography>
          
          <Button
            variant="contained"
            onClick={runSatelliteAnalysis}
            disabled={loading}
            startIcon={<TrendingUp />}
            sx={{ mb: 2 }}
          >
            {loading ? 'Running Hybrid Analysis...' : 'Run Hybrid AI Analysis'}
          </Button>
          
          <Typography variant="body2" color="primary" sx={{ mb: 2 }}>
            🚀 Enhanced with 5 ML algorithms: Random Forest, Gradient Boosting, Neural Network, Deep Learning & Ensemble
          </Typography>
          
          {loading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Processing satellite data from Google Earth Engine...
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

      {results.length > 0 && (
        <>
          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            Analysis Results
          </Typography>

          <Grid container spacing={3}>
            {results.map((result) => (
              <Grid item xs={12} key={result.village_id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        {result.village_name}
                      </Typography>
                      <Chip
                        label={`Priority: ${result.ensemble_priority}`}
                        color={getPriorityColor(result.ensemble_priority)}
                        variant="filled"
                      />
                    </Box>

                    <Grid container spacing={2}>
                      {/* Satellite Insights */}
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom>
                          Satellite Insights
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Agricultural Potential (NDVI)
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Agriculture color="success" />
                            <Typography variant="body1">
                              {result.satellite_insights.ndvi.value.toFixed(2)} - {result.satellite_insights.ndvi.level}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Water Availability
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Water color="primary" />
                            <Typography variant="body1">
                              {result.satellite_insights.water_availability.value}% - {result.satellite_insights.water_availability.level}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Forest Cover
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Forest color="success" />
                            <Typography variant="body1">
                              {result.satellite_insights.forest_cover.value.toFixed(1)}% - {result.satellite_insights.forest_cover.level}
                            </Typography>
                          </Box>
                        </Box>

                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Infrastructure Level
                          </Typography>
                          <Typography variant="body1">
                            {result.satellite_insights.infrastructure.level}
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Scheme Recommendations */}
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom>
                          Scheme Recommendations
                        </Typography>
                        
                        {result.scheme_recommendations.map((scheme, index) => (
                          <Box key={index} sx={{ mb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2">
                                {scheme.scheme_name}
                              </Typography>
                              <Chip
                                label={`${scheme.eligibility_score}%`}
                                size="small"
                                color={scheme.priority === 'high' ? 'error' : scheme.priority === 'medium' ? 'warning' : 'default'}
                              />
                            </Box>
                          </Box>
                        ))}

                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" color="primary">
                            Confidence Score: {result.confidence_score}%
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Summary Table */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Analysis Summary
              </Typography>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Village</TableCell>
                      <TableCell align="right">Priority Score</TableCell>
                      <TableCell align="right">NDVI</TableCell>
                      <TableCell align="right">Water %</TableCell>
                      <TableCell align="right">Forest %</TableCell>
                      <TableCell>Top Scheme</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={result.village_id}>
                        <TableCell>{result.village_name}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={result.ensemble_priority}
                            color={getPriorityColor(result.ensemble_priority)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {result.satellite_insights.ndvi.value.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          {result.satellite_insights.water_availability.value}
                        </TableCell>
                        <TableCell align="right">
                          {result.satellite_insights.forest_cover.value.toFixed(1)}
                        </TableCell>
                        <TableCell>
                          {result.scheme_recommendations[0]?.scheme_name || 'None'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default SatelliteMapping;