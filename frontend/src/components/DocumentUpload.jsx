import React from 'react';
import { Paper, Typography, Button, Box } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

const DocumentUpload = ({ onUpload, isProcessing, processedCount }) => {
  return (
    <Paper sx={{ p: 4, mb: 3, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>
        Document Processing & Data Extraction
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Upload FRA documents (PDFs, claims, verification reports, pattas) to automatically extract information and coordinates for mapping.
      </Typography>
      
      <input
        accept=".pdf,.jpg,.jpeg,.png,.tiff,.bmp"
        style={{ display: 'none' }}
        id="document-upload"
        multiple
        type="file"
        onChange={onUpload}
      />
      <label htmlFor="document-upload">
        <Button
          variant="contained"
          component="span"
          startIcon={<CloudUpload />}
          size="large"
          disabled={isProcessing}
          sx={{ px: 4, py: 1.5 }}
        >
          {isProcessing ? 'Processing...' : 'Upload Documents'}
        </Button>
      </label>
      
      {processedCount > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="success.main">
            ✓ {processedCount} documents processed successfully
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default DocumentUpload;