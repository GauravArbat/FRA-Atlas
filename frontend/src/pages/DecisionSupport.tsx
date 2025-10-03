import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  Chip,
  Stack,
  Divider,
  Paper,
  Container
} from '@mui/material';
import {
  AccountBalance,
  Public,
  LocationCity,
  Groups,
  Analytics,
  TrendingUp,
  Flag,
  Gavel,
  BarChart,
  PieChart,
  ShowChart,
  Assignment,
  CheckCircle,
  Schedule
} from '@mui/icons-material';
import { api } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const DecisionSupport: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  // State-wise Analysis
  const [selectedState, setSelectedState] = useState('');

  // District-wise Analysis
  const [districtState, setDistrictState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  // Patta Holders Analysis
  const [pattaState, setPattaState] = useState('');
  const [pattaDistrict, setPattaDistrict] = useState('');
  const [pattaVillage, setPattaVillage] = useState('');

  const states = ['Madhya Pradesh', 'Odisha', 'Tripura', 'Telangana'];
  const [districts, setDistricts] = useState<Record<string, string[]>>({
    'Madhya Pradesh': ['Khargone', 'Dhar', 'Jhabua', 'Alirajpur', 'Barwani', 'Dewas', 'Indore', 'Ujjain', 'Ratlam', 'Mandsaur', 'Neemuch', 'Shajapur', 'Rajgarh', 'Sehore', 'Bhopal', 'Raisen', 'Vidisha', 'Guna', 'Ashoknagar', 'Shivpuri', 'Gwalior', 'Datia', 'Sheopur', 'Morena', 'Bhind', 'Tikamgarh', 'Chhatarpur', 'Panna', 'Sagar', 'Damoh', 'Jabalpur', 'Katni', 'Umaria', 'Shahdol', 'Anuppur', 'Dindori', 'Mandla', 'Chhindwara', 'Seoni', 'Balaghat', 'Narsinghpur', 'Hoshangabad', 'Betul', 'Harda', 'Khandwa', 'Burhanpur', 'Satna', 'Rewa', 'Sidhi', 'Singrauli'],
    'Odisha': ['Angul', 'Balangir', 'Balasore', 'Bargarh', 'Bhadrak', 'Boudh', 'Cuttack', 'Deogarh', 'Dhenkanal', 'Gajapati', 'Ganjam', 'Jagatsinghpur', 'Jajpur', 'Jharsuguda', 'Kalahandi', 'Kandhamal', 'Kendrapara', 'Kendujhar', 'Khordha', 'Koraput', 'Malkangiri', 'Mayurbhanj', 'Nabarangpur', 'Nayagarh', 'Nuapada', 'Puri', 'Rayagada', 'Sambalpur', 'Subarnapur', 'Sundargarh'],
    'Tripura': ['Dhalai', 'Gomati', 'Khowai', 'North Tripura', 'Sepahijala', 'South Tripura', 'Unakoti', 'West Tripura'],
    'Telangana': ['Adilabad', 'Bhadradri Kothagudem', 'Hyderabad', 'Jagtial', 'Jangaon', 'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy', 'Karimnagar', 'Khammam', 'Komaram Bheem Asifabad', 'Mahabubabad', 'Mahabubnagar', 'Mancherial', 'Medak', 'Medchal Malkajgiri', 'Mulugu', 'Nagarkurnool', 'Nalgonda', 'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli', 'Rajanna Sircilla', 'Rangareddy', 'Sangareddy', 'Siddipet', 'Suryapet', 'Vikarabad', 'Wanaparthy', 'Warangal Rural', 'Warangal Urban', 'Yadadri Bhuvanagiri']
  });
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


  const runStateAnalysis = async () => {
    if (!selectedState) {
      setError('Please select State');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/fra/dss/state-analysis', {
        params: { state: selectedState }
      });
      setResults(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'State analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const runDistrictAnalysis = async () => {
    if (!districtState || !selectedDistrict) {
      setError('Please select State and District');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/fra/dss/district-analysis', {
        params: { state: districtState, district: selectedDistrict }
      });
      setResults(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'District analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const runPattaAnalysis = async () => {
    if (!pattaState || !pattaDistrict || !pattaVillage) {
      setError('Please select State, District and Village');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/fra/dss/patta-analysis', {
        params: { state: pattaState, district: pattaDistrict, village: pattaVillage }
      });
      setResults(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Patta Holders analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccountBalance /> Decision Support System (DSS) Analysis
      </Typography>

      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab
              label="State-wise Analysis"
              icon={<Public />}
              iconPosition="start"
            />
            <Tab
              label="District-wise Analysis"
              icon={<LocationCity />}
              iconPosition="start"
            />
            <Tab
              label="Patta Holders Analysis"
              icon={<Groups />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* State-wise Analysis Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom color="primary">
            State-level DSS Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Analyze FRA implementation and scheme convergence at state level
          </Typography>

          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select State</InputLabel>
                <Select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  MenuProps={{
                    disablePortal: true,
                    PaperProps: {
                      style: {
                        maxHeight: 300
                      }
                    }
                  }}
                >
                  {states.map((state) => (
                    <MenuItem key={state} value={state}>{state}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                variant="contained"
                fullWidth
                onClick={runStateAnalysis}
                disabled={loading || !selectedState}
                startIcon={<Analytics />}
              >
                Run State Analysis (All Schemes)
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* District-wise Analysis Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom color="primary">
            District-level DSS Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Analyze FRA implementation and scheme convergence at district level
          </Typography>

          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select State</InputLabel>
                <Select
                  value={districtState}
                  onChange={(e) => {
                    setDistrictState(e.target.value);
                    setSelectedDistrict('');
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
                  {states.map((state) => (
                    <MenuItem key={state} value={state}>{state}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth disabled={!districtState}>
                <InputLabel>Select District</InputLabel>
                <Select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  MenuProps={{
                    disablePortal: true,
                    PaperProps: {
                      style: {
                        maxHeight: 300
                      }
                    }
                  }}
                >
                  {districtState && districts[districtState as keyof typeof districts]?.map((district) => (
                    <MenuItem key={district} value={district}>{district}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                fullWidth
                onClick={runDistrictAnalysis}
                disabled={loading || !districtState || !selectedDistrict}
                startIcon={<Analytics />}
              >
                Run District Analysis (All Schemes)
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Patta Holders Analysis Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom color="primary">
            Patta Holders DSS Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Analyze individual FRA Patta Holders and their scheme eligibility
          </Typography>

          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Select State</InputLabel>
                <Select
                  value={pattaState}
                  onChange={(e) => {
                    setPattaState(e.target.value);
                    setPattaDistrict('');
                    setPattaVillage('');
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
                  {states.map((state) => (
                    <MenuItem key={state} value={state}>{state}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth disabled={!pattaState}>
                <InputLabel>Select District</InputLabel>
                <Select
                  value={pattaDistrict}
                  onChange={(e) => {
                    setPattaDistrict(e.target.value);
                    setPattaVillage('');
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
                  {pattaState && districts[pattaState as keyof typeof districts]?.map((district) => (
                    <MenuItem key={district} value={district}>{district}</MenuItem>
                  )) || []}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth disabled={!pattaDistrict}>
                <InputLabel>Select Village</InputLabel>
                <Select
                  value={pattaVillage}
                  onChange={(e) => setPattaVillage(e.target.value)}
                  MenuProps={{
                    disablePortal: true,
                    PaperProps: {
                      style: {
                        maxHeight: 300
                      }
                    }
                  }}
                >
                  {pattaDistrict && villages[pattaDistrict as keyof typeof villages]?.map((village) => (
                    <MenuItem key={village} value={village}>{village}</MenuItem>
                  )) || []}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                fullWidth
                onClick={runPattaAnalysis}
                disabled={loading || !pattaState || !pattaDistrict || !pattaVillage}
                startIcon={<Groups />}
              >
                Analyze Patta Holders
              </Button>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {loading && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="body2" gutterBottom>
              Running DSS Analysis...
            </Typography>
            <LinearProgress />
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {results && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp /> DSS Analysis Results
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Eligibility Assessment
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {results.eligibility?.beneficiaries?.map((b: any, i: number) => (
                        <Chip
                          key={i}
                          label={`${b.name || 'Beneficiary'} - ${Math.round((b.eligibilityScore || 0) * 100)}%`}
                          color={b.eligibilityScore > 0.7 ? 'success' : 'warning'}
                        />
                      )) || (
                        <Typography variant="body2" color="text.secondary">
                          No eligibility data available
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Priority Recommendations
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {results.priorities?.recommendations?.map((r: any, i: number) => (
                        <Chip
                          key={i}
                          label={`${r.block || r.area} - Priority ${Math.round((r.priorityScore || 0) * 100)}`}
                          color={i === 0 ? 'success' : i === 1 ? 'warning' : 'default'}
                        />
                      )) || (
                        <Typography variant="body2" color="text.secondary">
                          No priority data available
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Policy Metrics
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {results.metrics ? (
                      <>
                        <Typography variant="body2" gutterBottom>
                          Coverage: {results.metrics.coveragePct || 0}% | 
                          Beneficiaries: {(results.metrics.beneficiaries || 0).toLocaleString()} | 
                          Projects: {(results.metrics.fundedProjects || 0).toLocaleString()}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
                          {results.metrics.states?.map((s: any) => (
                            <Chip
                              key={s.name}
                              label={`${s.name}: ${s.beneficiaries?.toLocaleString() || 0} (${s.coveragePct || 0}%)`}
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No metrics data available
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DecisionSupport;



