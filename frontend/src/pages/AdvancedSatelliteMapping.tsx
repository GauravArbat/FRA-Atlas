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
  Home,
  SmartToy,
  Engineering,
  Opacity,
  NaturePeople,
  AccountBalance,
  Search,
  TrendingDown,
  Assessment,
  Business
} from '@mui/icons-material';
import jsPDF from 'jspdf';
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
  const [showSpectralData, setShowSpectralData] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const states = ['Madhya Pradesh', 'Odisha', 'Tripura', 'Telangana'];
  
  const districts = {
    'Madhya Pradesh': ['Khargone', 'Dhar', 'Jhabua', 'Alirajpur', 'Barwani', 'Dewas', 'Indore', 'Ujjain', 'Ratlam', 'Mandsaur', 'Neemuch', 'Shajapur', 'Rajgarh', 'Sehore', 'Bhopal', 'Raisen', 'Vidisha', 'Guna', 'Ashoknagar', 'Shivpuri', 'Gwalior', 'Datia', 'Sheopur', 'Morena', 'Bhind', 'Tikamgarh', 'Chhatarpur', 'Panna', 'Sagar', 'Damoh', 'Jabalpur', 'Katni', 'Umaria', 'Shahdol', 'Anuppur', 'Dindori', 'Mandla', 'Chhindwara', 'Seoni', 'Balaghat', 'Narsinghpur', 'Hoshangabad', 'Betul', 'Harda', 'Khandwa', 'Burhanpur', 'Satna', 'Rewa', 'Sidhi', 'Singrauli'],
    'Odisha': ['Angul', 'Balangir', 'Balasore', 'Bargarh', 'Bhadrak', 'Boudh', 'Cuttack', 'Deogarh', 'Dhenkanal', 'Gajapati', 'Ganjam', 'Jagatsinghpur', 'Jajpur', 'Jharsuguda', 'Kalahandi', 'Kandhamal', 'Kendrapara', 'Kendujhar', 'Khordha', 'Koraput', 'Malkangiri', 'Mayurbhanj', 'Nabarangpur', 'Nayagarh', 'Nuapada', 'Puri', 'Rayagada', 'Sambalpur', 'Subarnapur', 'Sundargarh'],
    'Tripura': ['Dhalai', 'Gomati', 'Khowai', 'North Tripura', 'Sepahijala', 'South Tripura', 'Unakoti', 'West Tripura'],
    'Telangana': ['Adilabad', 'Bhadradri Kothagudem', 'Hyderabad', 'Jagtial', 'Jangaon', 'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy', 'Karimnagar', 'Khammam', 'Komaram Bheem Asifabad', 'Mahabubabad', 'Mahabubnagar', 'Mancherial', 'Medak', 'Medchal Malkajgiri', 'Mulugu', 'Nagarkurnool', 'Nalgonda', 'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli', 'Rajanna Sircilla', 'Rangareddy', 'Sangareddy', 'Siddipet', 'Suryapet', 'Vikarabad', 'Wanaparthy', 'Warangal Rural', 'Warangal Urban', 'Yadadri Bhuvanagiri']
  };

  const villages = {
    // Madhya Pradesh
    'Khargone': ['Khargone City', 'Segaon', 'Julwania', 'Maheshwar', 'Kasrawad', 'Bhikangaon', 'Barwaha'],
    'Dhar': ['Dhar City', 'Manawar', 'Kukshi', 'Sardarpur', 'Gandhwani', 'Badnawar', 'Dharampuri'],
    'Jhabua': ['Jhabua City', 'Petlawad', 'Thandla', 'Jobat', 'Alirajpur', 'Katthiwara', 'Ranapur'],
    'Alirajpur': ['Alirajpur City', 'Jobat', 'Sondwa', 'Udaygarh', 'Bhabra', 'Katthiwara'],
    'Barwani': ['Barwani City', 'Sendhwa', 'Thikri', 'Pansemal', 'Rajpur', 'Warla'],
    'Dewas': ['Dewas City', 'Bagli', 'Khategaon', 'Sonkatch', 'Kannod', 'Tonk Khurd'],
    'Indore': ['Indore City', 'Depalpur', 'Mhow', 'Sanwer', 'Hatod', 'Gautampura'],
    'Bhopal': ['Bhopal City', 'Berasia', 'Phanda', 'Huzur'],
    'Jabalpur': ['Jabalpur City', 'Sihora', 'Patan', 'Majholi', 'Panagar', 'Shahpura'],
    
    // Odisha
    'Mayurbhanj': ['Baripada', 'Rairangpur', 'Karanjia', 'Udala', 'Jashipur', 'Bangriposi', 'Bisoi'],
    'Keonjhar': ['Keonjhar City', 'Champua', 'Barbil', 'Anandapur', 'Ghatgaon', 'Patna', 'Saharpada'],
    'Sundargarh': ['Sundargarh City', 'Rourkela', 'Bonai', 'Koida', 'Lahunipara', 'Kutra'],
    'Kandhamal': ['Phulbani', 'Baliguda', 'G.Udayagiri', 'Tikabali', 'Raikia', 'Tumudibandh'],
    'Koraput': ['Koraput City', 'Jeypore', 'Kotpad', 'Kundra', 'Nandapur', 'Pottangi'],
    'Kalahandi': ['Bhawanipatna', 'Dharamgarh', 'Junagarh', 'Kesinga', 'Lanjigarh', 'Narla'],
    
    // Tripura
    'Dhalai': ['Ambassa', 'Kamalpur', 'Salema', 'Chhamanu', 'Dumburnagar', 'Gandacherra'],
    'Gomati': ['Udaipur', 'Amarpur', 'Karbook', 'Silachari', 'Kakraban', 'Matabari'],
    'Khowai': ['Khowai City', 'Teliamura', 'Kalyanpur', 'Padmabil', 'Tulashikhar'],
    'North Tripura': ['Kailashahar', 'Kumarghat', 'Panisagar', 'Dharmanagar', 'Kanchanpur'],
    'Sepahijala': ['Bishramganj', 'Melaghar', 'Sonamura', 'Boxanagar', 'Jampuijala'],
    'South Tripura': ['Belonia', 'Santirbazar', 'Sabroom', 'Matarbari', 'Hrishyamukh'],
    'Unakoti': ['Fatikroy', 'Kumarghat', 'Pecharthal', 'Chandipur'],
    'West Tripura': ['Agartala', 'Mohanpur', 'Hezamara', 'Jirania', 'Mandwi', 'Dukli'],
    
    // Telangana
    'Adilabad': ['Adilabad City', 'Boath', 'Jainoor', 'Kerameri', 'Tamsi', 'Utnoor', 'Wankidi'],
    'Hyderabad': ['Hyderabad City', 'Secunderabad', 'Kukatpally', 'LB Nagar', 'Charminar'],
    'Khammam': ['Khammam City', 'Kothagudem', 'Yellandu', 'Burgampahad', 'Sathupalli'],
    'Warangal Rural': ['Narsampet', 'Duggondi', 'Shayampet', 'Geesugonda', 'Chennaraopet'],
    'Warangal Urban': ['Warangal City', 'Hanamkonda', 'Kazipet', 'Elkathurthy'],
    'Karimnagar': ['Karimnagar City', 'Choppadandi', 'Vemulawada', 'Huzurabad', 'Manakondur'],
    'Nizamabad': ['Nizamabad City', 'Bodhan', 'Kamareddy', 'Banswada', 'Yellareddy']
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

  const generateDetailedPDFReport = (analysisResults: AdvancedAssetResult, dssResults: any) => {
    const doc = new jsPDF();
    let yPos = 20;
    
    // Header with Government Logo Area
    doc.setFontSize(20);
    doc.setTextColor(25, 118, 210);
    doc.text('GOVERNMENT OF INDIA', 20, yPos);
    yPos += 8;
    doc.setFontSize(16);
    doc.text('Ministry of Tribal Affairs', 20, yPos);
    yPos += 8;
    doc.setFontSize(18);
    doc.text('Forest Rights Act - Decision Support System Report', 20, yPos);
    yPos += 20;
    
    // Village Information
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Village: ' + analysisResults.village_name, 20, yPos);
    doc.text('State: ' + selectedState, 120, yPos);
    yPos += 6;
    doc.text('District: ' + selectedDistrict, 20, yPos);
    doc.text('Date: ' + new Date().toLocaleDateString('en-GB'), 120, yPos);
    yPos += 6;
    doc.text('Coordinates: ' + analysisResults.coordinates[0].toFixed(4) + ', ' + analysisResults.coordinates[1].toFixed(4), 20, yPos);
    yPos += 15;
    
    // Executive Summary
    doc.setFontSize(16);
    doc.setTextColor(25, 118, 210);
    doc.text('EXECUTIVE SUMMARY', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('FRA Eligibility Score: ' + dssResults.eligibility_score + '%', 20, yPos);
    doc.text('Priority Level: ' + dssResults.priority_level, 120, yPos);
    yPos += 6;
    doc.text('Scheme Convergence Score: ' + (dssResults.scheme_convergence?.convergence_score || 0) + '%', 20, yPos);
    yPos += 6;
    const benefit = String(dssResults.fra_patta_benefits?.total_estimated_annual_benefit || 'N/A').replace(/[^\w\s\-\/\.]/g, '');
    doc.text('Total Annual Benefit: Rs ' + benefit, 20, yPos);
    yPos += 6;
    doc.text('Eligible Schemes: ' + (dssResults.scheme_convergence?.eligible_schemes || 0) + ' out of ' + (dssResults.scheme_convergence?.total_schemes || 0), 20, yPos);
    yPos += 15;
    
    // ML Analysis Results
    doc.setFontSize(16);
    doc.setTextColor(25, 118, 210);
    doc.text('MACHINE LEARNING ANALYSIS', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Model Version: ' + analysisResults.model_version, 20, yPos);
    doc.text('Processing Time: ' + analysisResults.processing_time + 's', 120, yPos);
    yPos += 6;
    doc.text('ML Model Accuracy: RF ' + (analysisResults.ml_models.random_forest_accuracy * 100).toFixed(1) + '%, CNN ' + (analysisResults.ml_models.cnn_accuracy * 100).toFixed(1) + '%', 20, yPos);
    yPos += 10;
    
    // Detailed Asset Analysis
    doc.setFontSize(14);
    doc.setTextColor(25, 118, 210);
    doc.text('DETAILED ASSET ANALYSIS', 20, yPos);
    yPos += 10;
    
    Object.entries(analysisResults.assets).forEach(([type, assets]) => {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(type.replace(/_/g, ' ').toUpperCase() + ' (' + assets.length + ' detected)', 20, yPos);
      yPos += 6;
      doc.setFontSize(10);
      doc.text('Overall Confidence: ' + (analysisResults.confidence_maps[type] * 100).toFixed(1) + '%', 25, yPos);
      yPos += 5;
      
      assets.slice(0, 3).forEach((asset: any, index: number) => {
        doc.text('  ' + (index + 1) + '. Type: ' + asset.type.replace(/_/g, ' '), 25, yPos);
        yPos += 4;
        if (asset.area) {
          doc.text('     Area: ' + asset.area + ' hectares', 25, yPos);
          yPos += 4;
        }
        doc.text('     Confidence: ' + (asset.confidence * 100).toFixed(1) + '%', 25, yPos);
        yPos += 4;
        if (asset.coordinates) {
          doc.text('     Location: ' + asset.coordinates[0].toFixed(4) + ', ' + asset.coordinates[1].toFixed(4), 25, yPos);
          yPos += 4;
        }
      });
      yPos += 5;
      
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
    });
    
    // Spectral Analysis
    doc.setFontSize(14);
    doc.setTextColor(25, 118, 210);
    doc.text('SPECTRAL INDICES ANALYSIS', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    Object.entries(analysisResults.spectral_indices).slice(0, 5).forEach(([index, value]) => {
      const displayValue = typeof value === 'number' ? value.toFixed(3) : String(value);
      doc.text(index.toUpperCase().replace(/_/g, ' ') + ': ' + displayValue, 20, yPos);
      yPos += 5;
    });
    yPos += 5;
    
    doc.text('Vegetation Health: ' + analysisResults.spectral_indices.vegetation_health, 20, yPos);
    yPos += 5;
    doc.text('Water Stress Level: ' + analysisResults.spectral_indices.water_stress, 20, yPos);
    yPos += 5;
    doc.text('Groundwater Potential: ' + analysisResults.spectral_indices.groundwater_potential, 20, yPos);
    yPos += 15;
    
    // Infrastructure Assessment
    doc.setFontSize(14);
    doc.setTextColor(25, 118, 210);
    doc.text('INFRASTRUCTURE ASSESSMENT', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('PM Gati Shakti Connectivity:', 20, yPos);
    yPos += 6;
    doc.text('  Road Connectivity: ' + analysisResults.infrastructure_data.pm_gati_shakti.road_connectivity, 25, yPos);
    yPos += 5;
    doc.text('  Digital Connectivity: ' + analysisResults.infrastructure_data.pm_gati_shakti.digital_connectivity, 25, yPos);
    yPos += 5;
    doc.text('  Logistics Score: ' + analysisResults.infrastructure_data.pm_gati_shakti.logistics_score + '/100', 25, yPos);
    yPos += 10;
    
    doc.text('Groundwater Assessment:', 20, yPos);
    yPos += 6;
    doc.text('  Depth to Water: ' + analysisResults.infrastructure_data.groundwater.depth_to_water + 'm', 25, yPos);
    yPos += 5;
    doc.text('  Quality Index: ' + analysisResults.infrastructure_data.groundwater.quality_index + '/100', 25, yPos);
    yPos += 5;
    doc.text('  Recharge Potential: ' + analysisResults.infrastructure_data.groundwater.recharge_potential, 25, yPos);
    yPos += 10;
    
    doc.text('Forest Data:', 20, yPos);
    yPos += 6;
    doc.text('  Forest Type: ' + analysisResults.infrastructure_data.forest_data.forest_type, 25, yPos);
    yPos += 5;
    doc.text('  Canopy Cover: ' + analysisResults.infrastructure_data.forest_data.canopy_cover_percent + '%', 25, yPos);
    yPos += 5;
    doc.text('  Biodiversity Score: ' + analysisResults.infrastructure_data.forest_data.biodiversity_score, 25, yPos);
    yPos += 5;
    doc.text('  Conservation Status: ' + analysisResults.infrastructure_data.forest_data.conservation_status, 25, yPos);
    yPos += 15;
    
    // New Page for Schemes
    doc.addPage();
    yPos = 20;
    
    // Central Sector Schemes Analysis
    doc.setFontSize(16);
    doc.setTextColor(25, 118, 210);
    doc.text('CENTRAL SECTOR SCHEMES ANALYSIS', 20, yPos);
    yPos += 15;
    
    Object.entries(dssResults.css_schemes || {}).forEach(([scheme, details]: [string, any]) => {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      const schemeName = scheme.replace(/_/g, ' ').toUpperCase();
      doc.text(schemeName, 20, yPos);
      yPos += 6;
      
      doc.setFontSize(10);
      const status = details.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE';
      doc.text('Status: ' + status, 25, yPos);
      yPos += 5;
      
      if (details.ministry) {
        doc.text('Ministry: ' + details.ministry, 25, yPos);
        yPos += 5;
      }
      
      if (details.benefit_amount) {
        const benefit = String(details.benefit_amount).replace(/[^\w\s\-\/\.]/g, '');
        doc.text('Benefit: Rs ' + benefit, 25, yPos);
        yPos += 5;
      }
      
      if (details.fra_integration) {
        doc.text('FRA Integration: ' + details.fra_integration, 25, yPos);
        yPos += 5;
      }
      yPos += 8;
      
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
    });
    
    // Asset-based Recommendations
    doc.setFontSize(14);
    doc.setTextColor(25, 118, 210);
    doc.text('ASSET-BASED RECOMMENDATIONS', 20, yPos);
    yPos += 10;
    
    Object.entries(dssResults.asset_insights || {}).forEach(([asset, insight]: [string, any]) => {
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(asset.replace(/_/g, ' ').toUpperCase() + ':', 20, yPos);
      yPos += 6;
      doc.setFontSize(10);
      doc.text('Status: ' + (insight.status || 'N/A'), 25, yPos);
      yPos += 5;
      if (insight.intervention) {
        doc.text('Intervention: ' + insight.intervention, 25, yPos);
        yPos += 5;
      }
      if (insight.css_scheme) {
        doc.text('Recommended Scheme: ' + insight.css_scheme.replace(/_/g, ' '), 25, yPos);
        yPos += 5;
      }
      yPos += 5;
    });
    
    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Government of India - Ministry of Tribal Affairs - Forest Rights Act Implementation', 20, 285);
      doc.text('Page ' + i + ' of ' + pageCount, 180, 285);
      doc.text('Generated on: ' + new Date().toLocaleString(), 20, 290);
    }
    
    doc.save('Detailed_DSS_Report_' + analysisResults.village_name + '_' + new Date().toISOString().split('T')[0] + '.pdf');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Psychology /> Satellite-Based Asset Mapping
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
                  MenuProps={{
                    disablePortal: true,
                    PaperProps: {
                      style: {
                        maxHeight: 300
                      }
                    }
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
                  MenuProps={{
                    disablePortal: true,
                    PaperProps: {
                      style: {
                        maxHeight: 300
                      }
                    }
                  }}
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
            
            <Grid item xs={12} md={1}>
              <Button
                variant={showSettings ? "contained" : "outlined"}
                color="primary"
                onClick={() => setShowSettings(!showSettings)}
                startIcon={<Engineering />}
                sx={{ 
                  height: 56,
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                Settings
              </Button>
            </Grid>
          </Grid>

          {showSettings && (
            <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
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
          )}

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
          {/* Toggle Button for Spectral Data */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => setShowSpectralData(!showSpectralData)}
              startIcon={showSpectralData ? <TrendingDown /> : <TrendingUp />}
            >
              {showSpectralData ? 'Hide' : 'Show'} Spectral Indices & ML Performance
            </Button>
          </Box>

          {showSpectralData && (
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
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SmartToy /> ML Model Performance
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
            </>
          )}

          {/* Infrastructure Data */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Engineering /> Infrastructure & Environmental Data
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUp /> PM Gati Shakti
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
                      <Typography variant="subtitle2" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Opacity /> Groundwater Data
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
                      <Typography variant="subtitle2" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NaturePeople /> Forest Data
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
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn /> Asset Visualization Map
                  </Typography>
                  <AssetVisualizationMap villageData={results} />
                </CardContent>
              </Card>

              <Card sx={{ mt: 3, border: '2px solid #e3f2fd', boxShadow: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 2,
                    mb: 3
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      <Chip 
                        icon={<SmartToy />}
                        label="ML Analysis Complete"
                        color="success"
                        variant="filled"
                        sx={{ fontWeight: 600 }}
                      />
                      <Chip 
                        icon={<Assessment />}
                        label="Spectral Indices: NDVI, NDWI, MNDWI, NDBI, SAVI"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip 
                        icon={<Search />}
                        label={`Confidence Filtering: ${(confidenceThreshold * 100).toFixed(0)}%`}
                        color="secondary"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <Button 
                      size="large"
                      variant="outlined"
                      color="primary"
                      onClick={() => window.open(`/atlas?village=${results.village_id}`, '_blank')}
                      sx={{ 
                        px: 4, 
                        py: 1.5,
                        fontWeight: 600,
                        borderWidth: 2,
                        '&:hover': { borderWidth: 2 }
                      }}
                    >
                      View on FRA Atlas
                    </Button>
                    
                    <Button 
                      size="large"
                      variant="contained"
                      color="success"
                      onClick={() => runDecisionSupport()}
                      startIcon={<Psychology />}
                      disabled={dssLoading}
                      sx={{ 
                        px: 4, 
                        py: 1.5,
                        fontWeight: 600,
                        boxShadow: 3
                      }}
                    >
                      {dssLoading ? 'Running DSS...' : 'Run Decision Support System'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>

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
                            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Search /> FRA Eligibility Assessment
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
                            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Assessment /> Priority Ranking
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
                            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Business /> Central Sector Schemes for FRA Patta Holders
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
                            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AccountBalance /> Multi-Ministry Coordination Required
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
                            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Search /> Asset-based Insights & Interventions
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
                    
                    {/* Download Report Button */}
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={() => generateDetailedPDFReport(results, dssResults)}
                        sx={{ px: 4, py: 1.5 }}
                      >
                        Download Detailed DSS Report (PDF)
                      </Button>
                    </Box>
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