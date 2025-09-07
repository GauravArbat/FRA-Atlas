import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Stack, Button, Divider, Alert, TextField, IconButton } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArchiveIcon from '@mui/icons-material/Archive';
import MapIcon from '@mui/icons-material/Map';
import { api } from '../services/api';
import { loadOcrItems, addOcrItem, deleteOcrItem, updateOcrItem, type OcrItem } from '../utils/ocrStore';

const DataManagement: React.FC = () => {
  const [uploadInfo, setUploadInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [archiveType, setArchiveType] = useState('complete');
  const [archiveFormat, setArchiveFormat] = useState('json');
  const [ocrText, setOcrText] = useState('');
  const [nerEntities, setNerEntities] = useState<any[]>([]);
  const [history, setHistory] = useState<OcrItem[]>([]);
  const [info, setInfo] = useState<string | null>(null);

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
      let text = ocrText;
      try {
        const res = await api.post('/digitization/ocr', { text: ocrText || undefined });
        text = res.data.text;
      } catch {
        setInfo('OCR service unavailable. Using input as OCR text.');
      }
      setOcrText(text);
    } catch (e: any) {
      setError('OCR failed');
    }
  };

  const runNer = async () => {
    try {
      setError(null);
      let entities: Array<{ label: string; value: string }> = [];
      try {
        const res = await api.post('/digitization/ner', { text: ocrText });
        entities = res.data.entities || [];
      } catch {
        setInfo('NER service unavailable. Saving locally.');
        entities = [];
      }
      setNerEntities(entities);
      const item: OcrItem = {
        id: `${Date.now()}`,
        text: ocrText,
        entities,
        createdAt: new Date().toISOString(),
      };
      setHistory(addOcrItem(item));
    } catch (e: any) {
      setError('NER failed');
    }
  };

  const handleDelete = async (id: string) => {
    try { setHistory(deleteOcrItem(id)); } catch {}
  };

  const handleEdit = async (row: OcrItem) => {
    const updated = { ...row, text: ocrText || row.text, updatedAt: new Date().toISOString() };
    setHistory(updateOcrItem(updated));
  };

  useEffect(() => { setHistory(loadOcrItems()); }, []);

  const columns: GridColDef[] = useMemo(() => ([
    { field: 'createdAt', headerName: 'Created At', flex: 1, valueGetter: (p) => new Date(p.value as string).toLocaleString() },
    { field: 'text', headerName: 'Text', flex: 2, minWidth: 260 },
    { field: 'entities', headerName: 'Entities', flex: 1.5, valueGetter: (p) => (p.value as any[]).map((e) => `${e.label}:${e.value}`).join(', ') },
    { field: 'actions', headerName: 'Actions', sortable: false, filterable: false, width: 120, renderCell: (params) => (
      <Box>
        <IconButton size="small" onClick={() => handleEdit(params.row as OcrItem)}><EditIcon fontSize="small" /></IconButton>
        <IconButton size="small" onClick={() => handleDelete((params.row as OcrItem).id)}><DeleteIcon fontSize="small" /></IconButton>
      </Box>
    ) },
  ]), []);

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
            {info && <Alert severity="info">{info}</Alert>}
            {nerEntities.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>Extracted Entities</Typography>
                {nerEntities.map((ent, idx) => (
                  <Typography key={idx} variant="body2">{ent.label}: {ent.value}</Typography>
                ))}
              </Box>
            )}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>History</Typography>
            <div style={{ width: '100%', height: 320 }}>
              <DataGrid rows={history} columns={columns} getRowId={(r) => r.id} pageSizeOptions={[5,10]} initialState={{ pagination: { paginationModel: { pageSize: 5 } } }} />
            </div>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
};

export default DataManagement;



