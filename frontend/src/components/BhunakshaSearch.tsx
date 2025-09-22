import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Search,
  LocationOn,
  Print,
  Download,
  Visibility,
  Map as MapIcon
} from '@mui/icons-material';
import { searchByKhasra, searchByOwner, getVillageRecords, generateLandCertificate, LandRecord } from '../services/bhunakshaService';

interface BhunakshaSearchProps {
  onPlotSelect: (record: LandRecord) => void;
}

const BhunakshaSearch: React.FC<BhunakshaSearchProps> = ({ onPlotSelect }) => {
  const [searchType, setSearchType] = useState<'khasra' | 'owner' | 'village'>('khasra');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [khasraNumber, setKhasraNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [searchResults, setSearchResults] = useState<LandRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<LandRecord | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [loading, setLoading] = useState(false);

  const districts = ['Balaghat', 'Mayurbhanj', 'Dhalai', 'Adilabad'];
  const villages: Record<string, string[]> = {
    'Balaghat': ['Khairlanji', 'Mandla'],
    'Mayurbhanj': ['Baripada', 'Rairangpur'],
    'Dhalai': ['Gandacherra', 'Ambassa'],
    'Adilabad': ['Utnoor', 'Mancherial']
  };

  const handleSearch = async () => {
    if (!district) return;
    
    setLoading(true);
    try {
      let results: LandRecord[] = [];
      
      switch (searchType) {
        case 'khasra':
          if (village && khasraNumber) {
            const record = await searchByKhasra(district, village, khasraNumber);
            results = record ? [record] : [];
          }
          break;
        case 'owner':
          if (ownerName) {
            results = await searchByOwner(district, ownerName);
          }
          break;
        case 'village':
          if (village) {
            results = await getVillageRecords(district, village);
          }
          break;
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOnMap = (record: LandRecord) => {
    onPlotSelect(record);
  };

  const handlePrintCertificate = (record: LandRecord) => {
    setSelectedRecord(record);
    setShowCertificate(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IFR Granted':
      case 'CFR Granted':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MapIcon color="primary" />
          Bhunaksha FRA - Land Records Search
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Search Type</InputLabel>
              <Select
                value={searchType}
                label="Search Type"
                onChange={(e) => setSearchType(e.target.value as any)}
              >
                <MenuItem value="khasra">Khasra Number</MenuItem>
                <MenuItem value="owner">Owner Name</MenuItem>
                <MenuItem value="village">Village Records</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>District</InputLabel>
              <Select
                value={district}
                label="District"
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setVillage('');
                }}
              >
                {districts.map(d => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {(searchType === 'khasra' || searchType === 'village') && (
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Village</InputLabel>
                <Select
                  value={village}
                  label="Village"
                  onChange={(e) => setVillage(e.target.value)}
                  disabled={!district}
                >
                  {(villages[district] || []).map(v => (
                    <MenuItem key={v} value={v}>{v}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          
          {searchType === 'khasra' && (
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Khasra Number"
                value={khasraNumber}
                onChange={(e) => setKhasraNumber(e.target.value)}
                placeholder="e.g., 45/2"
              />
            </Grid>
          )}
          
          {searchType === 'owner' && (
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Owner Name"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Enter owner name"
              />
            </Grid>
          )}
        </Grid>
        
        <Button
          variant="contained"
          startIcon={<Search />}
          onClick={handleSearch}
          disabled={loading || !district}
        >
          {loading ? 'Searching...' : 'Search Records'}
        </Button>
      </Paper>

      {searchResults.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Search Results ({searchResults.length} records found)
          </Typography>
          
          <Grid container spacing={2}>
            {searchResults.map((record, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="div">
                        Khasra: {record.khasraNumber}
                      </Typography>
                      <Chip
                        label={record.fraStatus}
                        color={getStatusColor(record.fraStatus) as any}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Survey No: {record.surveyNumber}
                    </Typography>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Typography variant="body2"><strong>Owner:</strong> {record.ownerName}</Typography>
                    <Typography variant="body2"><strong>Father:</strong> {record.fatherName}</Typography>
                    <Typography variant="body2"><strong>Village:</strong> {record.village}</Typography>
                    <Typography variant="body2"><strong>Area:</strong> {record.area}</Typography>
                    <Typography variant="body2"><strong>Classification:</strong> {record.classification}</Typography>
                    
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewOnMap(record)}
                        title="View on Map"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handlePrintCertificate(record)}
                        title="Print Certificate"
                      >
                        <Print />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Certificate Dialog */}
      <Dialog open={showCertificate} onClose={() => setShowCertificate(false)} maxWidth="md" fullWidth>
        <DialogTitle>Land Record Certificate</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '12px' }}>
                {generateLandCertificate(selectedRecord)}
              </pre>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>Mutation History</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedRecord.mutationHistory.map((mutation, index) => (
                      <TableRow key={index}>
                        <TableCell>{mutation.date}</TableCell>
                        <TableCell>{mutation.type}</TableCell>
                        <TableCell>{mutation.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCertificate(false)}>Close</Button>
          <Button variant="contained" startIcon={<Print />}>
            Print Certificate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BhunakshaSearch;