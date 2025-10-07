import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  LinearProgress,
  Input
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Visibility,
  Save,
  Map as MapIcon,
  CheckCircle,
  Error,
  Info
} from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { digitizationPipelineAPI } from '../services/digitizationAPI';

interface ExtractedData {
  claimantName?: string;
  village?: string;
  district?: string;
  state?: string;
  area?: string;
  claimType?: string;
  plotNumber?: string;
  coordinates?: any;
  confidence?: number;
}

interface ProcessedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  extractedData?: ExtractedData;
  rawText?: string;
  error?: string;
}

const UploadData: React.FC = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ProcessedFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    const fileArray = Array.from(uploadedFiles);
    const newFiles: ProcessedFile[] = fileArray.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading'
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Process each file
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const fileId = newFiles[i].id;

      try {
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'processing' } : f
        ));

        console.log('Processing file:', file.name);
        const response = await digitizationPipelineAPI.processOCR(file);
        console.log('OCR Response:', response);
        console.log('Response data:', response.data);
        
        if (response.data && (response.data.success || response.data.status === 'completed')) {
          const extractedData: ExtractedData = {
            claimantName: response.data.fraInfo?.applicantName,
            village: response.data.fraInfo?.village,
            district: response.data.fraInfo?.district,
            state: response.data.fraInfo?.state,
            area: response.data.fraInfo?.area,
            claimType: response.data.fraInfo?.claimNumber?.includes('IFR') ? 'IFR' : 
                      response.data.fraInfo?.claimNumber?.includes('CFR') ? 'CFR' : 'CR',
            plotNumber: response.data.fraInfo?.pattaNumber,
            confidence: response.data.confidence
          };

          setFiles(prev => prev.map(f => 
            f.id === fileId ? { 
              ...f, 
              status: 'completed',
              extractedData,
              rawText: response.data.text
            } : f
          ));
        } else {
          console.log('OCR failed - response.data:', response.data);
          const errorMsg = response.data?.message || 'OCR processing failed';
          throw { message: errorMsg };
        }
      } catch (error: any) {
        console.error('OCR Processing Error:', error);
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { 
            ...f, 
            status: 'error',
            error: error?.response?.data?.error || error?.message || 'Processing failed'
          } : f
        ));
      }
    }
  };

  const handlePreview = (file: ProcessedFile) => {
    setSelectedFile(file);
    setPreviewOpen(true);
  };

  const handleSaveData = async (file: ProcessedFile) => {
    try {
      // Save extracted data to backend
      const response = await fetch('http://localhost:8000/api/digitization/save-extracted-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: file.id,
          fileName: file.name,
          extractedData: file.extractedData,
          rawText: file.rawText
        })
      });

      if (response.ok) {
        alert('Data saved successfully!');
      }
    } catch (error) {
      alert('Failed to save data');
    }
  };

  const handlePlotOnMap = (file: ProcessedFile) => {
    setSelectedFile(file);
    setMapOpen(true);
    
    setTimeout(() => {
      if (mapContainer.current && !map.current) {
        // Use Leaflet with OpenStreetMap
        map.current = L.map(mapContainer.current).setView([20.5937, 78.9629], 10);
        
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map.current);

        // Add sample polygon for the claim
        if (file.extractedData?.village) {
          const polygon = L.polygon([
            [20.5937, 78.9629],
            [20.5937, 78.9729],
            [20.6037, 78.9729],
            [20.6037, 78.9629]
          ], {
            color: '#ff5252',
            fillColor: '#ff6b6b',
            fillOpacity: 0.6
          }).addTo(map.current);
          
          polygon.bindPopup(`
            <b>${file.extractedData.claimantName || 'Unknown'}</b><br>
            Village: ${file.extractedData.village || 'N/A'}<br>
            Area: ${file.extractedData.area || 'N/A'}
          `);
          
          map.current.fitBounds(polygon.getBounds());
        }
      }
    }, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'error': return 'error';
      case 'processing': return 'warning';
      default: return 'info';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'error': return <Error />;
      case 'processing': return <CircularProgress size={20} />;
      default: return <Info />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CloudUpload fontSize="large" />
          Upload Data - Digitization & Standardization
        </Typography>
        <Typography variant="subtitle1">
          Convert legacy scanned FRA documents into structured digital data (claims, pattas, shapefiles)
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* Upload Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload Documents
              </Typography>
              
              <Box
                sx={{
                  border: '2px dashed #ccc',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.05)' }
                }}
              >
                <Input
                  type="file"
                  inputProps={{ 
                    multiple: true,
                    accept: '.pdf,.jpg,.jpeg,.png,.tiff'
                  }}
                  onChange={handleFileUpload}
                  sx={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <CloudUpload sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Click to select files
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Upload documents for processing
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Supported: PDF, JPEG, PNG, TIFF
                  </Typography>
                </label>
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Supported formats:</strong> PDF documents, scanned images (JPEG, PNG, TIFF)
                  <br />
                  <strong>Auto-processing:</strong> OCR extraction, NER analysis, data structuring
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Processing Statistics
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {files.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Files
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {files.filter(f => f.status === 'completed').length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Processed
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="textSecondary" gutterBottom>
                Processing Pipeline:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="1. OCR Processing" size="small" color="primary" />
                  <Typography variant="caption">Extract text from images/PDFs</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="2. NER Analysis" size="small" color="secondary" />
                  <Typography variant="caption">Identify FRA entities</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="3. Data Structuring" size="small" color="success" />
                  <Typography variant="caption">Format structured data</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Files List */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Uploaded Files ({files.length})
              </Typography>

              {files.length === 0 ? (
                <Alert severity="info">
                  No files uploaded yet. Use the upload area above to get started.
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>File Name</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Extracted Data</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {files.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Description />
                              <Box>
                                <Typography variant="body2">{file.name}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {(file.size / 1024).toFixed(1)} KB
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(file.status)}
                              label={file.status.toUpperCase()}
                              color={getStatusColor(file.status) as any}
                              size="small"
                            />
                            {file.status === 'processing' && (
                              <LinearProgress sx={{ mt: 1, width: 100 }} />
                            )}
                          </TableCell>
                          <TableCell>
                            {file.extractedData ? (
                              <Box>
                                <Typography variant="caption" display="block">
                                  <strong>Name:</strong> {file.extractedData.claimantName || 'N/A'}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  <strong>Village:</strong> {file.extractedData.village || 'N/A'}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  <strong>Area:</strong> {file.extractedData.area || 'N/A'}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="caption" color="textSecondary">
                                {file.status === 'completed' ? 'No data extracted' : 'Processing...'}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                startIcon={<Visibility />}
                                onClick={() => handlePreview(file)}
                                disabled={file.status !== 'completed'}
                              >
                                Preview
                              </Button>
                              <Button
                                size="small"
                                startIcon={<Save />}
                                onClick={() => handleSaveData(file)}
                                disabled={file.status !== 'completed'}
                                color="success"
                              >
                                Save
                              </Button>
                              <Button
                                size="small"
                                startIcon={<MapIcon />}
                                onClick={() => handlePlotOnMap(file)}
                                disabled={file.status !== 'completed'}
                                color="secondary"
                              >
                                Plot
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Data Preview - {selectedFile?.name}</DialogTitle>
        <DialogContent>
          {selectedFile && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Extracted Data</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Claimant Name</strong></TableCell>
                        <TableCell>{selectedFile.extractedData?.claimantName || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Village</strong></TableCell>
                        <TableCell>{selectedFile.extractedData?.village || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>District</strong></TableCell>
                        <TableCell>{selectedFile.extractedData?.district || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>State</strong></TableCell>
                        <TableCell>{selectedFile.extractedData?.state || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Area</strong></TableCell>
                        <TableCell>{selectedFile.extractedData?.area || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Claim Type</strong></TableCell>
                        <TableCell>{selectedFile.extractedData?.claimType || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Confidence</strong></TableCell>
                        <TableCell>{selectedFile.extractedData?.confidence || 0}%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Raw OCR Text</Typography>
                <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {selectedFile.rawText || 'No text extracted'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button onClick={() => selectedFile && handleSaveData(selectedFile)} color="primary">
            Save Data
          </Button>
        </DialogActions>
      </Dialog>

      {/* Map Dialog */}
      <Dialog open={mapOpen} onClose={() => setMapOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Plot on Map - {selectedFile?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ height: 500, width: '100%' }}>
            <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMapOpen(false)}>Close</Button>
          <Button color="primary">Save to Database</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UploadData;