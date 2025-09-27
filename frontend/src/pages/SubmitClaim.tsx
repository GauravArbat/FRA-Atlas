import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Grid,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import { Assignment, Send } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const SubmitClaim: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    claim_type: '',
    applicant_name: '',
    village: '',
    area: '',
    documents: null
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/claims/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          district: user?.district,
          state: user?.state
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({
          claim_type: '',
          applicant_name: '',
          village: '',
          area: '',
          documents: null
        });
      }
    } catch (error) {
      console.error('Submit claim error:', error);
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Assignment color="primary" />
        Submit FRA Claim
      </Typography>

      {submitted && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Your FRA claim has been submitted successfully! You will receive a claim number shortly.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Claim Type"
                    value={formData.claim_type}
                    onChange={handleChange('claim_type')}
                    required
                  >
                    <MenuItem value="IFR">Individual Forest Rights (IFR)</MenuItem>
                    <MenuItem value="CFR">Community Forest Rights (CFR)</MenuItem>
                    <MenuItem value="CR">Community Rights (CR)</MenuItem>
                  </TextField>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Applicant Name"
                    value={formData.applicant_name}
                    onChange={handleChange('applicant_name')}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Village"
                    value={formData.village}
                    onChange={handleChange('village')}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Area (in hectares)"
                    type="number"
                    value={formData.area}
                    onChange={handleChange('area')}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="State"
                    value={user?.state || ''}
                    disabled
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="District"
                    value={user?.district || ''}
                    disabled
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={<Send />}
                    sx={{ mt: 2 }}
                  >
                    Submit Claim
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Claim Types
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>IFR:</strong> Individual Forest Rights for traditional forest dwellers
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>CFR:</strong> Community Forest Rights for village communities
              </Typography>
              <Typography variant="body2">
                <strong>CR:</strong> Community Rights for traditional access
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SubmitClaim;