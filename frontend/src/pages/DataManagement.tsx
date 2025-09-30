import React, { useEffect, useMemo, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Stack, 
  Button, 
  Divider, 
  Alert, 
  TextField, 
  IconButton,
  Card,
  CardContent,
  CardActions,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArchiveIcon from '@mui/icons-material/Archive';
import MapIcon from '@mui/icons-material/Map';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { api, pdfProcessorAPI, geojsonPlotAPI } from '../services/api';
import { pattaHoldersAPI } from '../services/pattaHoldersAPI';
import { useNavigate } from 'react-router-dom';
import { loadOcrItems, addOcrItem, deleteOcrItem, updateOcrItem, type OcrItem } from '../utils/ocrStore';
import { usePageTranslation } from '../hooks/usePageTranslation';

interface ProcessedPDFData {
  id: string;
  name: string;
  village: string;
  district: string;
  area: string;
  applicationDate: string;
  geoJSON: any;
  personalInfo: any;
  processedAt: string;
}

const DataManagement: React.FC = () => {
  const navigate = useNavigate();
  usePageTranslation();
  // Original states
  const [uploadInfo, setUploadInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [archiveType, setArchiveType] = useState('complete');
  const [archiveFormat, setArchiveFormat] = useState('json');
  const [ocrText, setOcrText] = useState('');
  const [nerEntities, setNerEntities] = useState<any[]>([]);
  const [history, setHistory] = useState<OcrItem[]>([]);
  const [info, setInfo] = useState<string | null>(null);

  // PDF Processing states
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<any>(null);
  const [processedPDFs, setProcessedPDFs] = useState<ProcessedPDFData[]>([]);
  const [pattaHolders, setPattaHolders] = useState<any[]>([]);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState<ProcessedPDFData | null>(null);

  // PDF Processing Functions
  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const processPDF = async () => {
    if (!pdfFile) return;

    try {
      setIsProcessing(true);
      setError(null);
      setProcessedData(null);

      const response = await pdfProcessorAPI.processPDF(pdfFile);
      const data = response.data.data;

      setProcessedData(data);
      setUploadInfo(`PDF processed successfully! Extracted data for ${data.personalInfo.name || 'Unknown'}`);
      
      // Add to processed PDFs list
      const newProcessedPDF: ProcessedPDFData = {
        id: `pdf-${Date.now()}`,
        name: data.personalInfo.name || 'Unknown',
        village: data.personalInfo.village || 'Unknown',
        district: data.personalInfo.district || 'Unknown',
        area: data.personalInfo.area || 'Unknown',
        applicationDate: data.personalInfo.applicationDate || 'Unknown',
        geoJSON: data.geoJSON,
        personalInfo: data.personalInfo,
        processedAt: new Date().toISOString()
      };

      setProcessedPDFs(prev => [newProcessedPDF, ...prev]);
      setPdfFile(null);

    } catch (err: any) {
      setError(err?.response?.data?.error || 'PDF processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToMapLayers = async (data: any) => {
    try {
      setError(null);
      const fallbackPersonalInfo = data.personalInfo || {
        name: data.name || 'Unknown',
        village: data.village || '',
        district: data.district || '',
        area: data.area || '',
        applicationDate: data.applicationDate || ''
      };
      const response = await pdfProcessorAPI.saveToLayers(data.geoJSON, fallbackPersonalInfo);
      setUploadInfo(`Data saved to map layers successfully! Layer: ${response.data.data.name}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save to map layers');
    }
  };

  const viewOnMap = (pdfData: ProcessedPDFData) => {
    setSelectedPDF(pdfData);
    setShowPreviewDialog(true);
  };

  const focusOnMap = (route: string, geo: any, personalInfo?: any) => {
    try {
      if (!geo) return;
      // Store both GeoJSON and personal info for persistent layer
      const layerData = {
        geoJSON: geo,
        personalInfo: personalInfo || {},
        timestamp: Date.now(),
        persistent: true // Flag to keep layer visible
      };
      sessionStorage.setItem('mapFocusGeoJSON', JSON.stringify(layerData));
      navigate(route);
    } catch {}
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append('files', file);
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
        archiveType: archiveType,
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

  useEffect(() => { 
    setHistory(loadOcrItems());
    loadProcessedPDFs();
    loadPattaHolders();
  }, []);

  const loadProcessedPDFs = async () => {
    try {
      const response = await pdfProcessorAPI.getProcessedData();
      setProcessedPDFs(response.data.data || []);
    } catch (err) {
      console.log('No processed PDFs found or error loading');
    }
  };

  const loadPattaHolders = async () => {
    try {
      const response = await pattaHoldersAPI.getAll();
      if (response.success) {
        setPattaHolders(response.data || []);
      }
    } catch (err) {
      console.log('No patta holders found or error loading');
    }
  };

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

  const pdfColumns: GridColDef[] = useMemo(() => ([
    { field: 'name', headerName: 'Name', flex: 1.5, minWidth: 150 },
    { field: 'village', headerName: 'Village', flex: 1 },
    { field: 'district', headerName: 'District', flex: 1 },
    { field: 'area', headerName: 'Area', flex: 1 },
    { field: 'applicationDate', headerName: 'Application Date', flex: 1 },
    { field: 'processedAt', headerName: 'Processed At', flex: 1, valueGetter: (p) => new Date(p.value as string).toLocaleString() },
    { field: 'actions', headerName: 'Actions', sortable: false, filterable: false, width: 200, renderCell: (params) => (
      <Box>
        <IconButton size="small" onClick={() => viewOnMap(params.row as ProcessedPDFData)} title="View on Map">
          <VisibilityIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => saveToMapLayers(params.row as ProcessedPDFData)} title="Save to Map">
          <MapIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => focusOnMap('/atlas', (params.row as ProcessedPDFData).geoJSON, (params.row as ProcessedPDFData).personalInfo)} title="Focus on FRA Atlas">
          <MyLocationIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => focusOnMap('/gis-plot', (params.row as ProcessedPDFData).geoJSON, (params.row as ProcessedPDFData).personalInfo)} title="Focus on GIS Plot">
          <MyLocationIcon fontSize="small" />
        </IconButton>
      </Box>
    ) },
  ]), []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <span data-translate>PDF Data Processing & Digitization</span>
      </Typography>

      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}
        {uploadInfo && <Alert severity="success">{uploadInfo}</Alert>}

        {/* PDF Processing Section */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            <PictureAsPdfIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            <span data-translate>PDF Processing & Data Extraction</span>
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <span data-translate>Upload FRA claim PDFs to automatically extract personal information and coordinates, then convert to GeoJSON for mapping.</span>
          </Typography>
          
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Box>
              <Button 
                variant="contained" 
                component="label" 
                startIcon={<CloudUploadIcon />}
                disabled={isProcessing}
              > 
                <span data-translate>{pdfFile ? 'Change PDF File' : 'Select PDF File'}</span>
                <input 
                  hidden 
                  type="file" 
                  accept=".pdf"
                  onChange={handlePDFUpload} 
                />
              </Button>
              {pdfFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              )}
            </Box>

            {pdfFile && (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={processPDF}
                disabled={isProcessing}
                startIcon={<PictureAsPdfIcon />}
              >
                <span data-translate>{isProcessing ? 'Processing PDF...' : 'Process PDF & Extract Data'}</span>
              </Button>
            )}

            {isProcessing && (
              <Box>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <span data-translate>Extracting text, personal information, and coordinates from PDF...</span>
                </Typography>
              </Box>
            )}
          </Stack>
        </Paper>

        {/* Processed Data Preview */}
        {processedData && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
              <span data-translate>Extracted Data Preview</span>
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      <span data-translate>Personal Information</span>
                    </Typography>
                    <List dense>
                      {Object.entries(processedData?.personalInfo || {}).map(([key, value]) => (
                        <ListItem key={key} sx={{ py: 0.5 }}>
                          <ListItemText 
                            primary={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            secondary={value as string}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      <LocationOnIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      <span data-translate>Geographic Data</span>
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Coordinates Found: {processedData?.coordinates?.length || 0}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Geometry Type: {processedData?.geoJSON?.features?.[0]?.geometry?.type || 'None'}
                    </Typography>
                    {processedData?.coordinates?.length > 0 && (
                      <Box>
                        <Typography variant="body2" gutterBottom>Coordinates:</Typography>
                        {processedData.coordinates.map((coord: number[], idx: number) => (
                          <Chip 
                            key={idx} 
                            label={`${coord[0]}, ${coord[1]}`} 
                            size="small" 
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <CardActions sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                startIcon={<MapIcon />}
                onClick={() => saveToMapLayers(processedData)}
              >
                <span data-translate>Save to Map Layers</span>
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<VisibilityIcon />}
                onClick={() => {
                  const tempPDF: ProcessedPDFData = {
                    id: 'temp',
                    name: processedData?.personalInfo?.name || 'Unknown',
                    village: processedData?.personalInfo?.village || 'Unknown',
                    district: processedData?.personalInfo?.district || 'Unknown',
                    area: processedData?.personalInfo?.area || 'Unknown',
                    applicationDate: processedData?.personalInfo?.applicationDate || 'Unknown',
                    geoJSON: processedData?.geoJSON || {},
                    personalInfo: processedData?.personalInfo || {},
                    processedAt: new Date().toISOString()
                  };
                  viewOnMap(tempPDF);
                }}
              >
                <span data-translate>Preview on Map</span>
              </Button>
            </CardActions>
          </Paper>
        )}

        {/* Processed PDFs List */}
        {(processedPDFs.length > 0 || pattaHolders.length > 0) && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <span data-translate>Processed PDF Records ({processedPDFs.length + pattaHolders.length})</span>
            </Typography>
            
            {/* Combined Data Grid */}
            <div style={{ width: '100%', height: 400 }}>
              <DataGrid 
                rows={[
                  ...processedPDFs,
                  ...pattaHolders.map(holder => ({
                    id: holder.id,
                    name: holder.ownerName,
                    village: holder.address.village,
                    district: holder.address.district,
                    area: `${holder.landDetails.area.hectares} hectares`,
                    applicationDate: new Date(holder.created).toLocaleDateString(),
                    processedAt: holder.lastModified,
                    geoJSON: {
                      type: 'FeatureCollection',
                      features: [{
                        type: 'Feature',
                        properties: {
                          ownerName: holder.ownerName,
                          fatherName: holder.fatherName,
                          village: holder.address.village,
                          district: holder.address.district,
                          area: holder.landDetails.area.hectares,
                          surveyNo: holder.landDetails.surveyNo,
                          khasra: holder.landDetails.khasra,
                          fraStatus: holder.landDetails.fraStatus
                        },
                        geometry: holder.geometry || {
                          type: 'Point',
                          coordinates: holder.coordinates && holder.coordinates.length > 0 
                            ? [holder.coordinates[0][0], holder.coordinates[0][1]]
                            : [0, 0]
                        }
                      }]
                    },
                    personalInfo: {
                      name: holder.ownerName,
                      fatherName: holder.fatherName,
                      village: holder.address.village,
                      district: holder.address.district,
                      state: holder.address.state,
                      area: `${holder.landDetails.area.hectares} hectares`,
                      surveyNo: holder.landDetails.surveyNo,
                      khasra: holder.landDetails.khasra,
                      classification: holder.landDetails.classification,
                      fraStatus: holder.landDetails.fraStatus,
                      type: 'Patta Holder (Dummy Data)'
                    }
                  }))
                ]} 
                columns={pdfColumns} 
                getRowId={(r) => r.id} 
                pageSizeOptions={[5, 10]} 
                initialState={{ pagination: { paginationModel: { pageSize: 5 } } }} 
              />
            </div>
          </Paper>
        )}

        {/* Original OCR & NER Section */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom><span data-translate>OCR & NER (Hindi/English/Marathi)</span></Typography>
          <Stack spacing={2}>
            <TextField label={<span data-translate>Text / OCR output</span>} multiline minRows={4} value={ocrText} onChange={(e) => setOcrText(e.target.value)} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="contained" onClick={runOcr}><span data-translate>Run OCR (mock)</span></Button>
              <Button variant="outlined" onClick={runNer}><span data-translate>Run NER</span></Button>
            </Stack>
            {info && <Alert severity="info">{info}</Alert>}
            {nerEntities.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom><span data-translate>Extracted Entities</span></Typography>
                {nerEntities.map((ent, idx) => (
                  <Typography key={idx} variant="body2">{ent.label}: {ent.value}</Typography>
                ))}
              </Box>
            )}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom><span data-translate>History</span></Typography>
            <div style={{ width: '100%', height: 320 }}>
              <DataGrid rows={history} columns={columns} getRowId={(r) => r.id} pageSizeOptions={[5,10]} initialState={{ pagination: { paginationModel: { pageSize: 5 } } }} />
            </div>
          </Stack>
        </Paper>

        {/* Legacy Features */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom><span data-translate>Legacy Document Processing</span></Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <span data-translate>Upload FRA claims, verification reports, or pattas for digitization.</span>
          </Typography>
          <Button variant="contained" component="label" startIcon={<CloudUploadIcon />}> 
            Select files
            <input hidden multiple type="file" onChange={handleUpload} />
          </Button>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom><span data-translate>Create Machine-readable Archive</span></Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField label="Archive type" size="small" value={archiveType} onChange={(e) => setArchiveType(e.target.value)} />
            <TextField label="Format" size="small" value={archiveFormat} onChange={(e) => setArchiveFormat(e.target.value)} />
            <Button variant="outlined" startIcon={<ArchiveIcon />} onClick={handleCreateArchive}>Create Archive</Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom><span data-translate>Generate Shapefile</span></Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <span data-translate>Generate geospatial shapefiles of FRA patta lands.</span>
          </Typography>
          <Button variant="outlined" startIcon={<MapIcon />} onClick={handleGenerateShapefile}><span data-translate>Generate</span></Button>
        </Paper>
      </Stack>

      {/* Map Preview Dialog */}
      <Dialog 
        open={showPreviewDialog} 
        onClose={() => setShowPreviewDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Map Preview - {selectedPDF?.name}
        </DialogTitle>
        <DialogContent>
          {selectedPDF && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Personal Information</Typography>
                  <List dense>
                    {Object.entries(selectedPDF?.personalInfo || {}).map(([key, value]) => (
                      <ListItem key={key} sx={{ py: 0.5 }}>
                        <ListItemText 
                          primary={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          secondary={value as string}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>GeoJSON Data</Typography>
                  <Box sx={{ 
                    bgcolor: 'grey.100', 
                    p: 2, 
                    borderRadius: 1, 
                    maxHeight: 300, 
                    overflow: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem'
                  }}>
                    <pre>{JSON.stringify(selectedPDF?.geoJSON || {}, null, 2)}</pre>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreviewDialog(false)}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              if (selectedPDF) {
                saveToMapLayers(selectedPDF);
                setShowPreviewDialog(false);
              }
            }}
          >
            Save to Map Layers
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataManagement;



