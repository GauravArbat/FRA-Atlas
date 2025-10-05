const express = require('express');
const router = express.Router();

// Mock processed data storage
let processedDocuments = {
  'doc_1759672882921_0': {
    id: 'doc_1759672882921_0',
    filename: 'fra_claim_1.pdf',
    extractedData: {
      claimantName: 'राम कुमार शर्मा',
      fatherName: 'श्याम लाल शर्मा',
      village: 'कमलापुर',
      district: 'बस्तर',
      state: 'छत्तीसगढ़',
      surveyNumber: '123/4',
      area: '2.5 एकड़',
      claimType: 'IFR',
      dateOfClaim: '15/03/2023'
    },
    coordinates: { lat: 19.0760, lng: 82.1391 },
    confidence: 0.92,
    status: 'processed'
  },
  'doc_1759672882921_1': {
    id: 'doc_1759672882921_1',
    filename: 'fra_patta_2.pdf',
    extractedData: {
      claimantName: 'सुनीता देवी',
      fatherName: 'मोहन लाल',
      village: 'जंगलपुर',
      district: 'दंतेवाड़ा',
      state: 'छत्तीसगढ़',
      surveyNumber: '456/7',
      area: '1.8 एकड़',
      claimType: 'CFR',
      dateOfClaim: '22/04/2023'
    },
    coordinates: { lat: 18.8948, lng: 81.3548 },
    confidence: 0.88,
    status: 'processed'
  },
  'doc_1759672882921_2': {
    id: 'doc_1759672882921_2',
    filename: 'fra_record_3.pdf',
    extractedData: {
      claimantName: 'अजय सिंह',
      fatherName: 'विजय सिंह',
      village: 'वनग्राम',
      district: 'कांकेर',
      state: 'छत्तीसगढ़',
      surveyNumber: '789/2',
      area: '3.2 एकड़',
      claimType: 'IFR',
      dateOfClaim: '10/05/2023'
    },
    coordinates: { lat: 20.2711, lng: 81.4906 },
    confidence: 0.95,
    status: 'processed'
  }
};

// Get all processed documents
router.get('/documents', (req, res) => {
  const documents = Object.values(processedDocuments);
  res.json({
    success: true,
    count: documents.length,
    documents
  });
});

// Get specific document
router.get('/documents/:id', (req, res) => {
  const doc = processedDocuments[req.params.id];
  if (!doc) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }
  res.json({ success: true, document: doc });
});

// Update document data
router.put('/documents/:id', (req, res) => {
  const doc = processedDocuments[req.params.id];
  if (!doc) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }
  
  processedDocuments[req.params.id] = {
    ...doc,
    extractedData: { ...doc.extractedData, ...req.body.extractedData },
    coordinates: req.body.coordinates || doc.coordinates,
    status: 'edited'
  };
  
  res.json({ 
    success: true, 
    message: 'Document updated successfully',
    document: processedDocuments[req.params.id]
  });
});

// Save and plot document
router.post('/documents/:id/plot', (req, res) => {
  const doc = processedDocuments[req.params.id];
  if (!doc) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }
  
  processedDocuments[req.params.id].status = 'plotted';
  
  res.json({
    success: true,
    message: 'Document plotted successfully',
    plotId: `plot_${Date.now()}`,
    document: processedDocuments[req.params.id]
  });
});

// Get all documents for mapping
router.get('/geojson', (req, res) => {
  const features = Object.values(processedDocuments)
    .filter(doc => doc.status === 'plotted')
    .map(doc => ({
      type: 'Feature',
      properties: {
        id: doc.id,
        name: doc.extractedData.claimantName,
        village: doc.extractedData.village,
        district: doc.extractedData.district,
        claimType: doc.extractedData.claimType,
        area: doc.extractedData.area
      },
      geometry: {
        type: 'Point',
        coordinates: [doc.coordinates.lng, doc.coordinates.lat]
      }
    }));

  res.json({
    type: 'FeatureCollection',
    features
  });
});

module.exports = router;