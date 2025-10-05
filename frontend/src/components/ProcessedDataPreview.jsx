import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Snackbar, Alert
} from '@mui/material';
import { Edit, Save, Map, Visibility } from '@mui/icons-material';
import axios from 'axios';

const ProcessedDataPreview = () => {
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
      const response = await axios.get('/api/processed-data/documents');
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleEdit = (doc) => {
    setSelectedDoc(doc);
    setEditData(doc.extractedData);
    setEditDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(`/api/processed-data/documents/${selectedDoc.id}`, {
        extractedData: editData
      });
      setSnackbar({ open: true, message: 'Document updated successfully', severity: 'success' });
      setEditDialog(false);
      fetchDocuments();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error updating document', severity: 'error' });
    }
  };

  const handlePlot = async (docId) => {
    try {
      await axios.post(`/api/processed-data/documents/${docId}/plot`);
      setSnackbar({ open: true, message: 'Document plotted successfully', severity: 'success' });
      fetchDocuments();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error plotting document', severity: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed': return 'primary';
      case 'edited': return 'warning';
      case 'plotted': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Processed Documents Preview
      </Typography>
      
      <Grid container spacing={3}>
        {documents.map((doc) => (
          <Grid item xs={12} md={6} lg={4} key={doc.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" noWrap>
                    {doc.filename}
                  </Typography>
                  <Chip 
                    label={doc.status} 
                    color={getStatusColor(doc.status)}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Confidence: {(doc.confidence * 100).toFixed(1)}%
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Claimant: {doc.extractedData.claimantName}</Typography>
                  <Typography variant="body2">Village: {doc.extractedData.village}</Typography>
                  <Typography variant="body2">District: {doc.extractedData.district}</Typography>
                  <Typography variant="body2">Area: {doc.extractedData.area}</Typography>
                  <Typography variant="body2">Type: {doc.extractedData.claimType}</Typography>
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => setSelectedDoc(doc)}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => handleEdit(doc)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Map />}
                    onClick={() => handlePlot(doc.id)}
                    disabled={doc.status === 'plotted'}
                  >
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
                label="Father's Name"
                value={editData.fatherName || ''}
                onChange={(e) => setEditData({...editData, fatherName: e.target.value})}
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
                label="State"
                value={editData.state || ''}
                onChange={(e) => setEditData({...editData, state: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Survey Number"
                value={editData.surveyNumber || ''}
                onChange={(e) => setEditData({...editData, surveyNumber: e.target.value})}
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

      {/* Detailed View Dialog */}
      <Dialog open={!!selectedDoc && !editDialog} onClose={() => setSelectedDoc(null)} maxWidth="md" fullWidth>
        <DialogTitle>Document Details</DialogTitle>
        <DialogContent>
          {selectedDoc && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Field</TableCell>
                    <TableCell>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(selectedDoc.extractedData).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell component="th" scope="row">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </TableCell>
                      <TableCell>{value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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

export default ProcessedDataPreview;