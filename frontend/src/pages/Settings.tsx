import React, { useState } from 'react';
import { Box, Typography, Paper, Stack, TextField, Button, Divider, FormControlLabel, Switch, Alert } from '@mui/material';
import { api } from '../services/api';

const Settings: React.FC = () => {
  const [mapboxToken, setMapboxToken] = useState(localStorage.getItem('REACT_APP_MAPBOX_TOKEN') || '');
  const [osmMode, setOsmMode] = useState(!mapboxToken);
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('API_URL') || (process.env.REACT_APP_API_URL || 'http://localhost:8000/api'));
  const [info, setInfo] = useState<string | null>(null);

  const save = () => {
    setInfo(null);
    localStorage.setItem('API_URL', apiUrl);
    if (mapboxToken) {
      localStorage.setItem('REACT_APP_MAPBOX_TOKEN', mapboxToken);
      setOsmMode(false);
    } else {
      localStorage.removeItem('REACT_APP_MAPBOX_TOKEN');
      setOsmMode(true);
    }
    setInfo('Settings saved. Please reload the app for changes to take effect.');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Settings</Typography>
      {info && <Alert severity="success" sx={{ mb: 2 }}>{info}</Alert>}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>API</Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={2}>
          <TextField label="Backend API URL" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} helperText="Used by the frontend to call the backend" />
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Map</Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={2}>
          <FormControlLabel control={<Switch checked={osmMode} onChange={(e) => setOsmMode(e.target.checked)} />} label="Use free OpenStreetMap (no token)" />
          <TextField label="Mapbox Token" value={mapboxToken} onChange={(e) => setMapboxToken(e.target.value)} helperText="Required for drawing/validation and Mapbox basemap" disabled={osmMode} />
        </Stack>
      </Paper>

      <Button variant="contained" onClick={save}>Save Settings</Button>
    </Box>
  );
};

export default Settings;



