const express = require('express');
const router = express.Router();

let processedDocuments = {
  'doc_1759673255837_0': {
    id: 'doc_1759673255837_0',
    filename: 'fra_claim_1.pdf',
    extractedData: {
      claimantName: 'राम कुमार शर्मा',
      village: 'कमलापुर',
      district: 'बस्तर',
      area: '2.5 एकड़',
      claimType: 'IFR'
    },
    confidence: 0.92,
    status: 'processed'
  },
  'doc_1759673255837_1': {
    id: 'doc_1759673255837_1',
    filename: 'fra_patta_2.pdf',
    extractedData: {
      claimantName: 'सुनीता देवी',
      village: 'जंगलपुर',
      district: 'दंतेवाड़ा',
      area: '1.8 एकड़',
      claimType: 'CFR'
    },
    confidence: 0.88,
    status: 'processed'
  },
  'doc_1759673255837_2': {
    id: 'doc_1759673255837_2',
    filename: 'fra_record_3.pdf',
    extractedData: {
      claimantName: 'अजय सिंह',
      village: 'वनग्राम',
      district: 'कांकेर',
      area: '3.2 एकड़',
      claimType: 'IFR'
    },
    confidence: 0.95,
    status: 'processed'
  }
};

router.get('/documents', (req, res) => {
  res.json({ success: true, documents: Object.values(processedDocuments) });
});

router.put('/documents/:id', (req, res) => {
  const doc = processedDocuments[req.params.id];
  if (!doc) return res.status(404).json({ success: false });
  
  processedDocuments[req.params.id] = {
    ...doc,
    extractedData: { ...doc.extractedData, ...req.body.extractedData },
    status: 'edited'
  };
  
  res.json({ success: true, document: processedDocuments[req.params.id] });
});

router.post('/documents/:id/plot', (req, res) => {
  const doc = processedDocuments[req.params.id];
  if (!doc) return res.status(404).json({ success: false });
  
  processedDocuments[req.params.id].status = 'plotted';
  res.json({ success: true, document: processedDocuments[req.params.id] });
});

module.exports = router;