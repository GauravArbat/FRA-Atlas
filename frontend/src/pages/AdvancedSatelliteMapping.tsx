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
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider
} from '@mui/material';
import { 
  Satellite, 
  LocationOn, 
  Psychology, 
  ExpandMore,
  TrendingUp,
  Water,
  Agriculture,
  Forest,
  Home
} from '@mui/icons-material';
import { api } from '../services/api';
import AssetVisualizationMap from '../components/AssetVisualizationMap';

interface AdvancedAssetResult {
  village_id: string;
  village_name: string;
  coordinates: [number, number];
  assets: {
    water_bodies: Array<{ 
      type: string; 
      area?: number; 
      coordinates: [number, number];
      confidence: number;
      seasonal?: string;
      water_quality?: string;
      depth_estimate?: number;
    }>;
    agricultural_land: Array<{ 
      type: string; 
      area?: number; 
      coordinates: [number, number];
      confidence: number;
      ndvi_avg?: number;
      crop_intensity?: string;
      soil_health?: string;
      irrigation_access?: boolean;
    }>;
    forest_cover: Array<{ 
      type: string; 
      area?: number; 
      coordinates: [number, number];
      confidence: number;
      ndvi_avg?: number;
      canopy_density?: string;
      forest_type?: string;
      biodiversity_index?: number;
    }>;
    built_up: Array<{ 
      type: string; 
      coordinates: [number, number];
      confidence: number;
      night_intensity?: number;
      development_level?: string;
      infrastructure_type?: string;
    }>;
    homesteads: Array<{
      type: string;
      coordinates: [number, number];
      confidence: number;
      household_count?: number;
      electrification?: boolean;
      road_access?: boolean;
    }>;
  };
  confidence_maps: Record<string, number>;
  spectral_indices: {
    ndvi_mean: number;
    ndwi_mean: number;
    mndwi_mean: number;
    ndbi_mean: number;
    savi_mean: number;
    vegetation_health: string;
    water_stress: string;
    groundwater_potential: string;
  };
  ml_models: {
    random_forest_accuracy: number;
    cnn_accuracy: number;
    ensemble_confidence: number;
    model_versions: string[];
  };
  infrastructure_data: {
    pm_gati_shakti: {
      road_connectivity: string;
      digital_connectivity: string;
      logistics_score: number;
    };
    groundwater: {
      depth_to_water: number;
      quality_index: number;
      recharge_potential: string;
    };
    forest_data: {
      forest_type: string;
      canopy_cover_percent: number;
      biodiversity_score: number;
      conservation_status: string;
    };
  };
  processing_time: number;
  model_version: string;
}

const AdvancedSatelliteMapping: React.FC = () => {
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [analysisType, setAnalysisType] = useState('comprehensive');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);
  const [mlModel, setMlModel] = useState('ensemble');
  const [includeInfrastructure, setIncludeInfrastructure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AdvancedAssetResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dssResults, setDssResults] = useState<any>(null);
  const [dssLoading, setDssLoading] = useState(false);

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

  const runAdvancedMapping = async () => {
    if (!selectedState || !selectedDistrict || !selectedVillage) {
      setError('Please select State, District, and Village');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/satellite/advanced-mapping', {
        state: selectedState,
        district: selectedDistrict,
        village: selectedVillage,
        analysis_type: analysisType,
        confidence_threshold: confidenceThreshold,
        ml_model: mlModel,
        include_infrastructure: includeInfrastructure,
        include_pm_gati_shakti: true,
        include_groundwater_data: true,
        include_forest_data: true
      });

      setResults(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Advanced mapping failed');
    } finally {
      setLoading(false);
    }
  };

  const runDecisionSupport = async () => {
    if (!results) return;

    setDssLoading(true);
    setError(null);

    try {
      const response = await api.post('/dss/analyze-assets', {
        village_data: results,
        analysis_type: 'comprehensive',
        include_recommendations: true
      });

      setDssResults(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Decision Support System failed');
    } finally {
      setDssLoading(false);
    }
  };

  const getAssetIcon = (assetType: string) => {
    const icons = {
      water_bodies: <Water color="primary" />,
      agricultural_land: <Agriculture color="success" />,
      forest_cover: <Forest color="success" />,
      built_up: <Home color="warning" />,
      homesteads: <Home color="info" />
    };
    return icons[assetType as keyof typeof icons] || <Satellite />;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const getSpectralIndexColor = (index: string, value: number) => {
    const thresholds = {
      ndvi_mean: { good: 0.5, moderate: 0.3 },
      ndwi_mean: { good: 0.1, moderate: 0.0 },
      mndwi_mean: { good: 0.0, moderate: -0.1 },
      ndbi_mean: { good: 0.1, moderate: 0.05 },
      savi_mean: { good: 0.4, moderate: 0.2 }
    };
    
    const threshold = thresholds[index as keyof typeof thresholds];
    if (!threshold) return 'default';
    
    if (value >= threshold.good) return 'success';
    if (value >= threshold.moderate) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Psychology /> Advanced ML-Based Asset Mapping
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Multi-Spectral Analysis with Machine Learning
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

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Analysis Type</InputLabel>
                <Select
                  value={analysisType}
                  onChange={(e) => setAnalysisType(e.target.value)}
                >
                  <MenuItem value="comprehensive">Comprehensive</MenuItem>
                  <MenuItem value="water_focus">Water Focus</MenuItem>
                  <MenuItem value="agriculture_focus">Agriculture Focus</MenuItem>
                  <MenuItem value="forest_focus">Forest Focus</MenuItem>
                  <MenuItem value="homestead_focus">Homestead Focus</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>ML Model</InputLabel>
                <Select
                  value={mlModel}
                  onChange={(e) => setMlModel(e.target.value)}
                >
                  <MenuItem value="ensemble">Ensemble (RF+CNN)</MenuItem>
                  <MenuItem value="random_forest">Random Forest</MenuItem>
                  <MenuItem value="cnn">CNN Deep Learning</MenuItem>
                  <MenuItem value="unet">U-Net Segmentation</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>
              Confidence Threshold: {confidenceThreshold}
            </Typography>
            <Slider
              value={confidenceThreshold}
              onChange={(_, value) => setConfidenceThreshold(value as number)}
              min={0.5}
              max={0.95}
              step={0.05}
              marks={[
                { value: 0.5, label: '50%' },
                { value: 0.7, label: '70%' },
                { value: 0.9, label: '90%' }
              ]}
            />
          </Box>

          <Button
            variant="contained"
            onClick={runAdvancedMapping}
            disabled={loading || !selectedVillage}
            startIcon={<TrendingUp />}
            sx={{ mb: 2 }}
          >
            {loading ? 'Processing ML Models...' : 'Run Advanced ML Analysis'}
          </Button>

          {loading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Running UNet segmentation and spectral analysis...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          {dssLoading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Running Decision Support System analysis...
              </Typography>
              <LinearProgress color="success" />
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
          {/* Spectral Indices */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Spectral Indices Analysis
              </Typography>
              
              <Grid container spacing={2}>
                {Object.entries(results.spectral_indices).slice(0, 5).map(([index, value]) => (
                  <Grid item xs={12} sm={6} md={2.4} key={index}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {index.toUpperCase().replace('_', ' ')}
                        </Typography>
                        <Chip
                          label={typeof value === 'number' ? value.toFixed(3) : value}
                          color={typeof value === 'number' ? getSpectralIndexColor(index, value) : 'default'}
                          sx={{ mt: 1 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={`Vegetation Health: ${results.spectral_indices.vegetation_health}`}
                  color={results.spectral_indices.vegetation_health === 'good' ? 'success' : 'warning'}
                />
                <Chip 
                  label={`Water Stress: ${results.spectral_indices.water_stress}`}
                  color={results.spectral_indices.water_stress === 'low' ? 'success' : 'error'}
                />
                <Chip 
                  label={`Groundwater: ${results.spectral_indices.groundwater_potential}`}
                  color={results.spectral_indices.groundwater_potential === 'high' ? 'success' : 'warning'}
                />
              </Box>
            </CardContent>
          </Card>

          {/* ML Model Performance */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🤖 ML Model Performance
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Random Forest</Typography>
                      <Chip
                        label={`${(results.ml_models.random_forest_accuracy * 100).toFixed(1)}%`}
                        color="success"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">CNN Accuracy</Typography>
                      <Chip
                        label={`${(results.ml_models.cnn_accuracy * 100).toFixed(1)}%`}
                        color="success"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Ensemble Confidence</Typography>
                      <Chip
                        label={`${(results.ml_models.ensemble_confidence * 100).toFixed(1)}%`}
                        color="primary"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Infrastructure Data */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🏗️ Infrastructure & Environmental Data
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom color="primary">
                        🚀 PM Gati Shakti
                      </Typography>
                      <Typography variant="body2">Road: {results.infrastructure_data.pm_gati_shakti.road_connectivity}</Typography>
                      <Typography variant="body2">Digital: {results.infrastructure_data.pm_gati_shakti.digital_connectivity}</Typography>
                      <Typography variant="body2">Logistics Score: {results.infrastructure_data.pm_gati_shakti.logistics_score}/100</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom color="primary">
                        💧 Groundwater Data
                      </Typography>
                      <Typography variant="body2">Depth: {results.infrastructure_data.groundwater.depth_to_water}m</Typography>
                      <Typography variant="body2">Quality: {results.infrastructure_data.groundwater.quality_index}/100</Typography>
                      <Typography variant="body2">Recharge: {results.infrastructure_data.groundwater.recharge_potential}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom color="primary">
                        🌲 Forest Data
                      </Typography>
                      <Typography variant="body2">Type: {results.infrastructure_data.forest_data.forest_type}</Typography>
                      <Typography variant="body2">Canopy: {results.infrastructure_data.forest_data.canopy_cover_percent}%</Typography>
                      <Typography variant="body2">Status: {results.infrastructure_data.forest_data.conservation_status}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* ML Results */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn /> ML Segmentation Results - {results.village_name}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Model: {results.model_version} | Processing Time: {results.processing_time}s | 
                  Coordinates: {results.coordinates[0].toFixed(4)}, {results.coordinates[1].toFixed(4)}
                </Typography>
              </Box>

              {Object.entries(results.assets).map(([assetType, assets]) => (
                <Accordion key={assetType}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      {getAssetIcon(assetType)}
                      <Typography sx={{ flexGrow: 1, textTransform: 'capitalize' }}>
                        {assetType.replace('_', ' ')} ({assets.length} detected)
                      </Typography>
                      <Chip
                        label={`${(results.confidence_maps[assetType] * 100).toFixed(1)}% confidence`}
                        color={getConfidenceColor(results.confidence_maps[assetType])}
                        size="small"
                      />
                    </Box>
                  </AccordionSummary>
                  
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {assets.map((asset, index) => (
                        <Grid item xs={12} md={6} key={index}>
                          <Card variant="outlined">
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                                  {asset.type.replace('_', ' ')}
                                </Typography>
                                <Chip
                                  label={`${(asset.confidence * 100).toFixed(1)}%`}
                                  color={getConfidenceColor(asset.confidence)}
                                  size="small"
                                />
                              </Box>
                              
                              {asset.area && (
                                <Typography variant="body2" color="text.secondary">
                                  Area: {asset.area} hectares
                                </Typography>
                              )}
                              
                              <Typography variant="body2" color="text.secondary">
                                Location: {asset.coordinates[0].toFixed(4)}, {asset.coordinates[1].toFixed(4)}
                              </Typography>
                              
                              {/* Additional attributes */}
                              {(asset as any).seasonal && (
                                <Chip label={(asset as any).seasonal} size="small" sx={{ mt: 1, mr: 1 }} />
                              )}
                              {(asset as any).crop_intensity && (
                                <Chip label={`${(asset as any).crop_intensity} intensity`} size="small" sx={{ mt: 1, mr: 1 }} />
                              )}
                              {(asset as any).canopy_density && (
                                <Chip label={`${(asset as any).canopy_density} density`} size="small" sx={{ mt: 1, mr: 1 }} />
                              )}
                              {(asset as any).development_level && (
                                <Chip label={`${(asset as any).development_level} development`} size="small" sx={{ mt: 1, mr: 1 }} />
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}

              {/* Asset Visualization Map */}
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🗺️ Asset Visualization Map
                  </Typography>
                  <AssetVisualizationMap villageData={results} />
                </CardContent>
              </Card>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  🤖 ML Analysis Complete | 
                  📊 Spectral Indices: NDVI, NDWI, MNDWI, NDBI, SAVI | 
                  🎯 Confidence Filtering: {(confidenceThreshold * 100).toFixed(0)}%
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => window.open(`/atlas?village=${results.village_id}`, '_blank')}
                  >
                    View on FRA Atlas
                  </Button>
                  
                  <Button 
                    size="small" 
                    variant="contained"
                    color="success"
                    onClick={() => runDecisionSupport()}
                    startIcon={<Psychology />}
                    disabled={dssLoading}
                  >
                    {dssLoading ? 'Running DSS...' : 'Run Decision Support System'}
                  </Button>
                </Box>
              </Box>

              {/* Decision Support System Results */}
              {dssResults && (
                <Card sx={{ mt: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Psychology color="success" /> Decision Support System Analysis
                    </Typography>

                    <Grid container spacing={3}>
                      {/* Eligibility Assessment */}
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              🎯 FRA Eligibility Assessment
                            </Typography>
                            <Chip 
                              label={`${dssResults.eligibility_score}% Eligible`}
                              color={dssResults.eligibility_score >= 70 ? 'success' : 'warning'}
                              sx={{ mb: 2 }}
                            />
                            <Typography variant="body2">
                              {dssResults.eligibility_reason}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Priority Ranking */}
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              📊 Priority Ranking
                            </Typography>
                            <Chip 
                              label={`Priority: ${dssResults.priority_level}`}
                              color={dssResults.priority_level === 'High' ? 'error' : dssResults.priority_level === 'Medium' ? 'warning' : 'success'}
                              sx={{ mb: 2 }}
                            />
                            <Typography variant="body2">
                              Score: {dssResults.priority_score}/100
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* CSS Scheme Layering */}
                      <Grid item xs={12}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              🎯 Central Sector Schemes for FRA Patta Holders
                            </Typography>
                            
                            <Box sx={{ mb: 2 }}>
                              <Chip 
                                label={`${dssResults.scheme_convergence?.eligible_schemes}/${dssResults.scheme_convergence?.total_schemes} Schemes Eligible`}
                                color="primary"
                                sx={{ mr: 1 }}
                              />
                              <Chip 
                                label={`Convergence Score: ${dssResults.scheme_convergence?.convergence_score}%`}
                                color={dssResults.scheme_convergence?.convergence_score > 70 ? 'success' : 'warning'}
                                sx={{ mr: 1 }}
                              />
                              <Chip 
                                label={`Annual Benefit: ${dssResults.fra_patta_benefits?.total_estimated_annual_benefit}`}
                                color="success"
                              />
                            </Box>
                            
                            <Grid container spacing={2}>
                              {Object.entries(dssResults.css_schemes || {}).map(([scheme, details]: [string, any]) => (
                                <Grid item xs={12} sm={6} md={4} key={scheme}>
                                  <Card variant="outlined" sx={{ 
                                    border: details.eligible ? '2px solid #4caf50' : '1px solid #e0e0e0',
                                    bgcolor: details.eligible ? '#f1f8e9' : 'transparent'
                                  }}>
                                    <CardContent sx={{ p: 2 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" fontWeight="bold">
                                          {scheme.replace('_', ' ')}
                                        </Typography>
                                        <Chip 
                                          label={details.eligible ? 'Eligible' : 'Not Eligible'}
                                          color={details.eligible ? 'success' : 'default'}
                                          size="small"
                                        />
                                      </Box>
                                      <Typography variant="caption" display="block" color="text.secondary" gutterBottom>
                                        {details.ministry}
                                      </Typography>
                                      <Typography variant="body2" gutterBottom>
                                        <strong>Benefit:</strong> {details.benefit_amount}
                                      </Typography>
                                      <Typography variant="caption" display="block" color="primary">
                                        {details.fra_integration}
                                      </Typography>
                                    </CardContent>
                                  </Card>
                                </Grid>
                              ))}
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      {/* Ministry Coordination */}
                      <Grid item xs={12}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              🏛️ Multi-Ministry Coordination Required
                            </Typography>
                            <Grid container spacing={2}>
                              {Object.entries(dssResults.ministry_coordination || {}).map(([ministry, schemes]: [string, any]) => (
                                <Grid item xs={12} sm={6} md={4} key={ministry}>
                                  <Card variant="outlined">
                                    <CardContent sx={{ p: 2 }}>
                                      <Typography variant="body2" fontWeight="bold" gutterBottom>
                                        {ministry}
                                      </Typography>
                                      {schemes.map((scheme: string) => (
                                        <Chip 
                                          key={scheme}
                                          label={scheme.replace('_', ' ')}
                                          size="small"
                                          sx={{ m: 0.25 }}
                                          variant="outlined"
                                        />
                                      ))}
                                    </CardContent>
                                  </Card>
                                </Grid>
                              ))}
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Asset-based Insights */}
                      <Grid item xs={12}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              🔍 Asset-based Insights & Interventions
                            </Typography>
                            <Grid container spacing={2}>
                              {Object.entries(dssResults.asset_insights || {}).map(([assetType, insight]: [string, any]) => (
                                <Grid item xs={12} sm={6} key={assetType}>
                                  <Card variant="outlined" sx={{ p: 1 }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      {assetType.replace('_', ' ').toUpperCase()}
                                    </Typography>
                                    <Chip 
                                      label={insight.status}
                                      color={insight.status === 'Good' ? 'success' : insight.status === 'Fair' ? 'warning' : 'error'}
                                      size="small"
                                      sx={{ mb: 1 }}
                                    />
                                    {insight.intervention && (
                                      <Typography variant="caption" display="block" color="text.secondary" gutterBottom>
                                        {insight.intervention}
                                      </Typography>
                                    )}
                                    {insight.css_scheme && (
                                      <Chip 
                                        label={insight.css_scheme.replace('_', ' ')}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                      />
                                    )}
                                  </Card>
                                </Grid>
                              ))}
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default AdvancedSatelliteMapping;