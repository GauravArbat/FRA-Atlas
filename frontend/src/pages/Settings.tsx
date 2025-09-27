import React, { useState } from 'react';
import { Box, Typography, Paper, Stack, TextField, Button, Divider, Alert } from '@mui/material';
import { api } from '../services/api';

const Settings: React.FC = () => {
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('API_URL') || (process.env.REACT_APP_API_URL || 'http://localhost:8000/api'));
  const [info, setInfo] = useState<string | null>(null);

  const save = () => {
    setInfo(null);
    localStorage.setItem('API_URL', apiUrl);
    // Clean up any old Mapbox tokens since we no longer use them
    localStorage.removeItem('REACT_APP_MAPBOX_TOKEN');
    setInfo('Settings saved. Please reload the app for changes to take effect.');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom><span data-translate>Settings</span></Typography>
      {info && <Alert severity="success" sx={{ mb: 2 }}>{info}</Alert>}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom><span data-translate>API</span></Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={2}>
          <TextField label={<span data-translate>Backend API URL</span>} value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} helperText={<span data-translate>Used by the frontend to call the backend</span>} />
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom><span data-translate>Map</span></Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={2}>
          <Alert severity="info">
            <span data-translate>This application now uses free Leaflet maps with Esri satellite imagery. No tokens or API keys are required for mapping functionality.</span>
          </Alert>
        </Stack>
      </Paper>

      <Button variant="contained" onClick={save}><span data-translate>Save Settings</span></Button>
    </Box>
  );
};

export default Settings;



