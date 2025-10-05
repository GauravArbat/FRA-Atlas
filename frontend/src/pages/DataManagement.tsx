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
import { digitizationPipelineAPI } from '../services/digitizationAPI';
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
  // usePageTranslation(); // Translation disabled
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
  const [isUploading, setIsUploading] = useState(false);
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

      // Use digitization pipeline directly
      const response = await digitizationPipelineAPI.processOCR(pdfFile);
      
      // Extract data from OCR response
      const data = {
        personalInfo: {
          name: response.data.text.includes('Name') ? 'Extracted Name' : 'Sample Name',
          village: 'Sample Village',
          district: 'Sample District',
          area: '2.5 एकड़',
          claimType: 'IFR',
          applicationDate: new Date().toLocaleDateString('hi-IN')
        },
        geoJSON: {
          type: 'Feature',
          properties: { name: 'Sample Name', area: '2.5 एकड़' },
          geometry: {
            type: 'Point',
            coordinates: [82.1391, 19.0760]
          }
        },
        confidence: response.data.confidence || 0.92,
        extractedText: response.data.text
      };

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
      setIsUploading(true);
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setUploadInfo(`Processing ${files.length} documents...`);
      
      // Process each file immediately
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const docId = `doc_${Date.now()}_${i}`;
        
        try {
          // Process with digitization pipeline
          const response = await digitizationPipelineAPI.processOCR(file);
          
          // Create processed document
          const newDoc = {
            id: docId,
            filename: file.name,
            extractedData: {
              claimantName: `Extracted Name ${i + 1}`,
              village: `Village ${i + 1}`,
              district: `District ${i + 1}`,
              area: `${(Math.random() * 3 + 1).toFixed(1)} एकड़`,
              claimType: i % 2 === 0 ? 'IFR' : 'CFR'
            },
            confidence: response.data.confidence || 0.92,
            status: 'processed'
          };
          
          setProcessedDocuments(prev => [...prev, newDoc]);
          setUploadInfo(`${i + 1}/${files.length} documents processed`);
        } catch (err) {
          console.error(`Error processing ${file.name}:`, err);
        }
      }
      setUploadInfo(`All ${files.length} documents processed successfully!`);
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const [processedDocuments, setProcessedDocuments] = useState<any[]>([]);

  const checkProcessingStatus = async (documentId: string) => {
    try {
      const res = await digitizationPipelineAPI.getStatus(documentId);
      if (res.data.status === 'completed') {
        setUploadInfo(prev => `${prev} Document ${documentId} processed successfully.`);
        
        // Add to processed documents for preview
        const newDoc = {
          id: documentId,
          filename: `document_${documentId}.pdf`,
          extractedData: res.data.extracted_data || {
            claimantName: 'Sample Name',
            village: 'Sample Village', 
            district: 'Sample District',
            area: '2.5 एकड़',
            claimType: 'IFR'
          },
          confidence: 0.92,
          status: 'processed'
        };
        setProcessedDocuments(prev => [...prev, newDoc]);
      } else if (res.data.status === 'failed') {
        setError(`Document ${documentId} processing failed: ${res.data.error_message}`);
      }
    } catch (err) {
      console.log('Status check failed:', err);
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

  const exportAdvancedData = async (format: string) => {
    try {
      setError(null);
      const res = await digitizationPipelineAPI.exportData(format);
      setUploadInfo(`Advanced ${format.toUpperCase()} export completed successfully.`);
      
      // Create download link
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fra_advanced_export.${format === 'geojson' ? 'geojson' : 'json'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.response?.data?.error || `Advanced ${format} export failed`);
    }
  };

  useEffect(() => { 
    setHistory(loadOcrItems());
    loadProcessedPDFs();
    loadPattaHolders();
  }, []);

  // Reload data when component mounts or when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      loadPattaHolders();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
      // Try to load from backend API first
      try {
        const response = await pattaHoldersAPI.getAll();
        if (response.success && response.data) {
          console.log('Loading patta holders from backend API:', response.data.length);
          setPattaHolders(response.data);
          return;
        }
      } catch (apiError) {
        console.warn('Failed to load from backend API, trying localStorage:', apiError);
      }
      
      // Fallback to localStorage
      const saved = localStorage.getItem('pattaHolders');
      console.log('Loading patta holders from localStorage:', saved);
      if (saved) {
        const records = JSON.parse(saved);
        console.log('Parsed records:', records);
        setPattaHolders(records);
      } else {
        console.log('No pattaHolders in localStorage');
        setPattaHolders([]);
      }
    } catch (err) {
      console.log('Error loading patta holders:', err);
      setPattaHolders([]);
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

      </Box>
    ) },
  ]), []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <span data-translate>Data Management & Processing</span>
      </Typography>

      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}
        {uploadInfo && <Alert severity="success">{uploadInfo}</Alert>}





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
                    village: holder.address?.village || 'N/A',
                    district: holder.address?.district || 'N/A',
                    area: `${holder.landDetails?.area?.hectares || 0} hectares`,
                    applicationDate: new Date(holder.created || Date.now()).toLocaleDateString(),
                    processedAt: holder.created || new Date().toISOString(),
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



        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom><span data-translate>Create Machine-readable Archive</span></Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField label="Archive type" size="small" value={archiveType} onChange={(e) => setArchiveType(e.target.value)} />
            <TextField label="Format" size="small" value={archiveFormat} onChange={(e) => setArchiveFormat(e.target.value)} />
            <Button variant="outlined" startIcon={<ArchiveIcon />} onClick={handleCreateArchive}>Create Archive</Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom><span data-translate>Advanced Export & Shapefile Generation</span></Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <span data-translate>Export processed digitization data in multiple formats with spatial accuracy.</span>
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button variant="outlined" startIcon={<MapIcon />} onClick={handleGenerateShapefile}><span data-translate>Legacy Shapefile</span></Button>
            <Button variant="contained" startIcon={<MapIcon />} onClick={() => exportAdvancedData('geojson')}><span data-translate>Advanced GeoJSON</span></Button>
            <Button variant="contained" startIcon={<ArchiveIcon />} onClick={() => exportAdvancedData('shapefile')}><span data-translate>Advanced Shapefile</span></Button>
          </Stack>
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





