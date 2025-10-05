import React from 'react';
import { Grid, Card, CardContent, CardActions, Typography, Button, Chip, Box } from '@mui/material';
import { Visibility, Edit, Map } from '@mui/icons-material';

const DocumentPreview = ({ documents, onView, onEdit, onPlot }) => {
  if (!documents || documents.length === 0) return null;

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Processed Documents ({documents.length})
      </Typography>
      <Grid container spacing={2}>
        {documents.map((doc) => (
          <Grid item xs={12} md={6} lg={4} key={doc.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" noWrap>{doc.filename}</Typography>
                  <Chip label={doc.status} color="primary" />
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
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<Visibility />} onClick={() => onView(doc)}>
                  View
                </Button>
                <Button size="small" startIcon={<Edit />} onClick={() => onEdit(doc)}>
                  Edit
                </Button>
                <Button size="small" startIcon={<Map />} onClick={() => onPlot(doc)}>
                  Plot
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DocumentPreview;