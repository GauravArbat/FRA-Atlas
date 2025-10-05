import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Snackbar, Alert } from '@mui/material';
import { Edit, Map, Visibility } from '@mui/icons-material';

const ProcessedData = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editData, setEditData] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/processed-data/documents');
      const data = await response.json();
      setDocuments(data.documents);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEdit = (doc) => {
    setSelectedDoc(doc);
    setEditData(doc.extractedData);
    setEditDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      await fetch(`http://localhost:8000/api/processed-data/documents/${selectedDoc.id}`, {
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
      await fetch(`http://localhost:8000/api/processed-data/documents/${docId}/plot`, {
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
      <Typography variant="h4" gutterBottom>Processed Documents</Typography>
      
      <Grid container spacing={3}>
        {documents.map((doc) => (
          <Grid item xs={12} md={6} lg={4} key={doc.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">{doc.filename}</Typography>
                  <Chip label={doc.status} color={doc.status === 'plotted' ? 'success' : 'primary'} />
                </Box>
                
                <Typography variant="body2">Confidence: {(doc.confidence * 100).toFixed(1)}%</Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography><strong>Name:</strong> {doc.extractedData.claimantName}</Typography>
                  <Typography><strong>Village:</strong> {doc.extractedData.village}</Typography>
                  <Typography><strong>District:</strong> {doc.extractedData.district}</Typography>
                  <Typography><strong>Area:</strong> {doc.extractedData.area}</Typography>
                  <Typography><strong>Type:</strong> {doc.extractedData.claimType}</Typography>
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button size="small" startIcon={<Visibility />} onClick={() => setSelectedDoc(doc)}>
                    View
                  </Button>
                  <Button size="small" startIcon={<Edit />} onClick={() => handleEdit(doc)}>
                    Edit
                  </Button>
                  <Button size="small" startIcon={<Map />} onClick={() => handlePlot(doc.id)} disabled={doc.status === 'plotted'}>
                    Plot
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Data</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Name" value={editData.claimantName || ''} onChange={(e) => setEditData({...editData, claimantName: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Village" value={editData.village || ''} onChange={(e) => setEditData({...editData, village: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="District" value={editData.district || ''} onChange={(e) => setEditData({...editData, district: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Area" value={editData.area || ''} onChange={(e) => setEditData({...editData, area: e.target.value})} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!selectedDoc && !editDialog} onClose={() => setSelectedDoc(null)}>
        <DialogTitle>Document Details</DialogTitle>
        <DialogContent>
          {selectedDoc && Object.entries(selectedDoc.extractedData).map(([key, value]) => (
            <Typography key={key}><strong>{key}:</strong> {value}</Typography>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedDoc(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({...snackbar, open: false})}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ProcessedData;