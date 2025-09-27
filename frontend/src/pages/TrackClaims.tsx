import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert
} from '@mui/material';
import { TrackChanges, Search } from '@mui/icons-material';

const TrackClaims: React.FC = () => {
  const [claimNumber, setClaimNumber] = useState('');
  // const [claims, setClaims] = useState([]);
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!claimNumber.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/claims/track/${claimNumber}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResult(data);
      } else {
        setSearchResult(null);
      }
    } catch (error) {
      console.error('Track claim error:', error);
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'submitted': 'info',
      'under_review': 'warning',
      'digitized': 'secondary',
      'approved': 'success',
      'rejected': 'error',
      'pending_gis_validation': 'warning'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <TrackChanges color="primary" />
        Track Claims
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Search by Claim Number
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            label="Enter Claim Number"
            value={claimNumber}
            onChange={(e) => setClaimNumber(e.target.value)}
            placeholder="e.g., MP001234567890"
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading}
            startIcon={<Search />}
          >
            Search
          </Button>
        </Box>

        {searchResult && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Claim found! Details below:
          </Alert>
        )}

        {searchResult && (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Claim Number</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Applicant</TableCell>
                  <TableCell>Village</TableCell>
                  <TableCell>Area</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>{(searchResult as any).claim.claim_number}</TableCell>
                  <TableCell>{(searchResult as any).claim.claim_type}</TableCell>
                  <TableCell>{(searchResult as any).claim.applicant_name}</TableCell>
                  <TableCell>{(searchResult as any).claim.village}</TableCell>
                  <TableCell>{(searchResult as any).claim.area} ha</TableCell>
                  <TableCell>
                    <Chip 
                      label={(searchResult as any).claim.status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor((searchResult as any).claim.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date((searchResult as any).claim.submitted_date).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {claimNumber && !searchResult && !loading && (
          <Alert severity="warning">
            No claim found with the provided claim number. Please check and try again.
          </Alert>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Status Meanings
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Chip label="SUBMITTED" color="info" size="small" />
          <Typography variant="body2" sx={{ alignSelf: 'center' }}>- Claim received and under initial review</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
          <Chip label="UNDER REVIEW" color="warning" size="small" />
          <Typography variant="body2" sx={{ alignSelf: 'center' }}>- Being reviewed by district office</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
          <Chip label="APPROVED" color="success" size="small" />
          <Typography variant="body2" sx={{ alignSelf: 'center' }}>- Claim approved and processed</Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default TrackClaims;