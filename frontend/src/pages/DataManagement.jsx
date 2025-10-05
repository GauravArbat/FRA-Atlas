import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Snackbar, Alert, Paper } from '@mui/material';
import { CloudUpload, Edit, Map, Visibility } from '@mui/icons-material';

const DataManagement = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editData, setEditData] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/data/documents');
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files.length) return;

    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('files', file));

    try {
      const response = await fetch('http://localhost:8000/api/data/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      
      setSnackbar({ open: true, message: `${files.length} documents processed successfully`, severity: 'success' });
      fetchDocuments();
    } catch (error) {
      setSnackbar({ open: true, message: 'Upload failed', severity: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (doc) => {
    setSelectedDoc(doc);
    setEditData(doc.extractedData);
    setEditDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      await fetch(`http://localhost:8000/api/data/documents/${selectedDoc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractedData: editData })
      });
      setSnackbar({ open: true, message: 'Updated successfully', severity: 'success' });
      setEditDialog(false);
      fetchDocuments();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error updating', severity: 'error' });
    }
  };

  const handlePlot = async (docId) => {
    try {
      await fetch(`http://localhost:8000/api/data/documents/${docId}/plot`, {
        method: 'POST'
      });
      setSnackbar({ open: true, message: 'Plotted successfully', severity: 'success' });
      fetchDocuments();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error plotting', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Data Management</Typography>
      
      {/* Upload Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Upload Documents</Typography>
        <input
          accept=".pdf,.jpg,.jpeg,.png"
          style={{ display: 'none' }}
          id="file-upload"
          multiple
          type="file"
          onChange={handleFileUpload}
        />
        <label htmlFor="file-upload">
          <Button
            variant="contained"
            component="span"
            startIcon={<CloudUpload />}
            disabled={uploading}
          >
            {uploading ? 'Processing...' : 'Upload Documents'}
          </Button>
        </label>
      </Paper>

      {/* Documents Grid */}
      <Typography variant="h6" gutterBottom>Processed Documents ({documents.length})</Typography>
      <Grid container spacing={3}>
        {documents.map((doc) => (
          <Grid item xs={12} md={6} lg={4} key={doc.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" noWrap>{doc.filename}</Typography>
                  <Chip 
                    label={doc.status} 
                    color={doc.status === 'plotted' ? 'success' : doc.status === 'edited' ? 'warning' : 'primary'} 
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  Confidence: {(doc.confidence * 100).toFixed(1)}%
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography><strong>Name:</strong> {doc.extractedData.claimantName}</Typography>
                  <Typography><strong>Village:</strong> {doc.extractedData.village}</Typography>
                  <Typography><strong>District:</strong> {doc.extractedData.district}</Typography>
                  <Typography><strong>Area:</strong> {doc.extractedData.area}</Typography>
                  <Typography><strong>Type:</strong> {doc.extractedData.claimType}</Typography>
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button size="small" startIcon={<Visibility />} onClick={() => setSelectedDoc(doc)}>
                    View
                  </Button>
                  <Button size="small" startIcon={<Edit />} onClick={() => handleEdit(doc)}>
                    Edit
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<Map />} 
                    onClick={() => handlePlot(doc.id)} 
                    disabled={doc.status === 'plotted'}
                    variant={doc.status === 'plotted' ? 'outlined' : 'contained'}
                  >
                    {doc.status === 'plotted' ? 'Plotted' : 'Plot'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Extracted Data</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                label="Claimant Name" 
                value={editData.claimantName || ''} 
                onChange={(e) => setEditData({...editData, claimantName: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                label="Village" 
                value={editData.village || ''} 
                onChange={(e) => setEditData({...editData, village: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                label="District" 
                value={editData.district || ''} 
                onChange={(e) => setEditData({...editData, district: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                label="Area" 
                value={editData.area || ''} 
                onChange={(e) => setEditData({...editData, area: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                label="Claim Type" 
                value={editData.claimType || ''} 
                onChange={(e) => setEditData({...editData, claimType: e.target.value})} 
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!selectedDoc && !editDialog} onClose={() => setSelectedDoc(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Document Details</DialogTitle>
        <DialogContent>
          {selectedDoc && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>{selectedDoc.filename}</Typography>
              <Typography><strong>Status:</strong> {selectedDoc.status}</Typography>
              <Typography><strong>Confidence:</strong> {(selectedDoc.confidence * 100).toFixed(1)}%</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Extracted Data:</Typography>
                {Object.entries(selectedDoc.extractedData).map(([key, value]) => (
                  <Typography key={key}>
                    <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {value}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedDoc(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({...snackbar, open: false})}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default DataManagement;