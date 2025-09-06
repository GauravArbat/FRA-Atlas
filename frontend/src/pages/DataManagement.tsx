import React, { useState } from 'react';
import { Box, Typography, Paper, Stack, Button, Divider, Alert, TextField } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArchiveIcon from '@mui/icons-material/Archive';
import MapIcon from '@mui/icons-material/Map';
import { api } from '../services/api';

const DataManagement: React.FC = () => {
  const [uploadInfo, setUploadInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [archiveType, setArchiveType] = useState('complete');
  const [archiveFormat, setArchiveFormat] = useState('json');
  const [ocrText, setOcrText] = useState('');
  const [nerEntities, setNerEntities] = useState<any[]>([]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append('documents', file);
      }

      const res = await api.post('/digitization/batch-process', formData);
      setUploadInfo(`Processed ${res.data.results.length} files.`);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Upload failed');
    }
  };

  const handleCreateArchive = async () => {
    try {
      setError(null);
      const res = await api.post('/digitization/create-archive', {
        claims_data: [],
        reports_data: [],
        pattas_data: [],
        spatial_data: [],
        archive_type: archiveType,
        format: archiveFormat,
      });
      setUploadInfo(`Archive created: ${res.data.metadata.archive_name}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Archive creation failed');
    }
  };

  const handleGenerateShapefile = async () => {
    try {
      setError(null);
      const res = await api.post('/digitization/generate-shapefile', {
        claims_data: [
          { area_hectares: 1.2 },
          { area_hectares: 0.8 },
        ],
      });
      setUploadInfo(`Shapefile generated: ${res.data.metadata.filename}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Shapefile generation failed');
    }
  };

  const runOcr = async () => {
    try {
      setError(null);
      const res = await api.post('/digitization/ocr', { text: ocrText || undefined });
      setOcrText(res.data.text);
    } catch (e: any) {
      setError('OCR failed');
    }
  };

  const runNer = async () => {
    try {
      setError(null);
      const res = await api.post('/digitization/ner', { text: ocrText });
      setNerEntities(res.data.entities || []);
    } catch (e: any) {
      setError('NER failed');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Digitization & Standardization
      </Typography>

      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}
        {uploadInfo && <Alert severity="success">{uploadInfo}</Alert>}

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Upload Documents</Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Upload FRA claims, verification reports, or pattas for digitization.
          </Typography>
          <Button variant="contained" component="label" startIcon={<CloudUploadIcon />}> 
            Select files
            <input hidden multiple type="file" onChange={handleUpload} />
          </Button>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Create Machine-readable Archive</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField label="Archive type" size="small" value={archiveType} onChange={(e) => setArchiveType(e.target.value)} />
            <TextField label="Format" size="small" value={archiveFormat} onChange={(e) => setArchiveFormat(e.target.value)} />
            <Button variant="outlined" startIcon={<ArchiveIcon />} onClick={handleCreateArchive}>Create Archive</Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Generate Shapefile</Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Generate geospatial shapefiles of FRA patta lands.
          </Typography>
          <Button variant="outlined" startIcon={<MapIcon />} onClick={handleGenerateShapefile}>Generate</Button>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>OCR & NER (Hindi/English/Marathi)</Typography>
          <Stack spacing={2}>
            <TextField label="Text / OCR output" multiline minRows={4} value={ocrText} onChange={(e) => setOcrText(e.target.value)} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="contained" onClick={runOcr}>Run OCR (mock)</Button>
              <Button variant="outlined" onClick={runNer}>Run NER</Button>
            </Stack>
            {nerEntities.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>Extracted Entities</Typography>
                {nerEntities.map((ent, idx) => (
                  <Typography key={idx} variant="body2">{ent.label}: {ent.value}</Typography>
                ))}
              </Box>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
};

export default DataManagement;



