import React from 'react';
import { Paper, Typography, Button, Box } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

const BatchUploadSection = ({ onUpload, processedDocuments }) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Batch Document Upload
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Upload multiple FRA documents (PDFs, claims, verification reports, pattas) for automatic processing
      </Typography>
      
      <input
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        id="batch-upload"
        multiple
        type="file"
        onChange={onUpload}
      />
      <label htmlFor="batch-upload">
        <Button
          variant="contained"
          component="span"
          startIcon={<CloudUpload />}
          size="large"
        >
          Upload Documents for Processing
        </Button>
      </label>
      
      {processedDocuments.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="success.main">
            {processedDocuments.length} documents processed and ready for preview
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default BatchUploadSection;