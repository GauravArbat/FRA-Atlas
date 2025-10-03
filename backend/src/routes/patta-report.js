const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Generate report for patta holder
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Load patta holders data
    const dataFile = path.join(__dirname, '../../data/patta-holders.json');
    const pattaHolders = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const patta = pattaHolders.find(p => p.id === id);
    
    if (!patta) {
      return res.status(404).json({ error: 'Patta holder not found' });
    }

    // Generate detailed report data
    const report = {
      id: patta.id,
      ownerName: patta.ownerName,
      fatherName: patta.fatherName,
      address: patta.address,
      landDetails: patta.landDetails,
      area: {
        hectares: patta.landDetails.area.hectares,
        acres: patta.landDetails.area.acres,
        squareMeters: patta.landDetails.area.squareMeters
      },
      coordinates: patta.coordinates,
      created: patta.created,
      lastModified: patta.lastModified,
      createdBy: patta.createdBy,
      status: patta.status,
      summary: {
        totalArea: `${patta.landDetails.area.hectares.toFixed(2)} hectares (${patta.landDetails.area.acres.toFixed(2)} acres)`,
        classification: patta.landDetails.classification,
        fraStatus: patta.landDetails.fraStatus,
        location: `${patta.address.village}, ${patta.address.district}, ${patta.address.state}`,
        surveyDetails: `Survey No: ${patta.landDetails.surveyNo}, Khasra: ${patta.landDetails.khasra}`,
        fullAddress: patta.address.fullAddress,
        pincode: patta.address.pincode
      },
      analysis: {
        areaAnalysis: getAreaAnalysis(patta.landDetails.area),
        locationAnalysis: getLocationAnalysis(patta.address),
        statusAnalysis: getStatusAnalysis(patta.landDetails.fraStatus),
        timeAnalysis: getTimeAnalysis(patta.created, patta.lastModified)
      },
      recommendations: generateRecommendations(patta),
      compliance: checkCompliance(patta),
      documents: {
        required: getRequiredDocuments(patta.landDetails.fraStatus),
        submitted: getSubmittedDocuments(patta)
      },
      timeline: generateTimeline(patta)
    };

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

function generateRecommendations(patta) {
  const recommendations = [];
  
  if (patta.landDetails.fraStatus === 'Pending') {
    recommendations.push('Submit required documents for FRA claim processing');
  }
  
  if (patta.landDetails.area.hectares > 4) {
    recommendations.push('Large land holding - verify eligibility criteria');
  }
  
  if (patta.landDetails.classification === 'Forest Land (Community)') {
    recommendations.push('Ensure community consent for CFR claim');
  }
  
  return recommendations;
}

function checkCompliance(patta) {
  return {
    documentationComplete: patta.landDetails.surveyNo && patta.landDetails.khasra,
    areaWithinLimits: patta.landDetails.area.hectares <= 4,
    statusValid: ['Pending', 'Under Review', 'IFR Granted', 'CFR Granted', 'CR Granted'].includes(patta.landDetails.fraStatus),
    addressComplete: patta.address.village && patta.address.district && patta.address.state,
    coordinatesAvailable: patta.coordinates && patta.coordinates.length > 0
  };
}

function getAreaAnalysis(area) {
  const hectares = area.hectares;
  let category = 'Small';
  let description = 'Suitable for individual/family cultivation';
  
  if (hectares > 10) {
    category = 'Large';
    description = 'May require community management or subdivision';
  } else if (hectares > 4) {
    category = 'Medium';
    description = 'Above typical FRA limits, requires verification';
  }
  
  return {
    category,
    description,
    areaInAcres: area.acres.toFixed(2),
    areaInSqMeters: area.squareMeters.toFixed(0)
  };
}

function getLocationAnalysis(address) {
  return {
    administrativeLevel: 'District',
    region: `${address.district}, ${address.state}`,
    ruralUrban: address.village ? 'Rural' : 'Urban',
    accessibility: address.pincode ? 'Postal service available' : 'Remote area'
  };
}

function getStatusAnalysis(fraStatus) {
  const statusMap = {
    'Pending': { stage: 'Initial', nextStep: 'Document verification', priority: 'Medium' },
    'Under Review': { stage: 'Processing', nextStep: 'Field verification', priority: 'High' },
    'IFR Granted': { stage: 'Completed', nextStep: 'Implementation', priority: 'Low' },
    'CFR Granted': { stage: 'Completed', nextStep: 'Community management', priority: 'Low' },
    'CR Granted': { stage: 'Completed', nextStep: 'Conservation activities', priority: 'Low' }
  };
  
  return statusMap[fraStatus] || { stage: 'Unknown', nextStep: 'Status verification', priority: 'High' };
}

function getTimeAnalysis(created, lastModified) {
  const createdDate = new Date(created);
  const modifiedDate = new Date(lastModified);
  const now = new Date();
  
  const daysSinceCreated = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
  const daysSinceModified = Math.floor((now - modifiedDate) / (1000 * 60 * 60 * 24));
  
  return {
    age: `${daysSinceCreated} days`,
    lastActivity: `${daysSinceModified} days ago`,
    status: daysSinceModified > 30 ? 'Stale' : 'Active'
  };
}

function getRequiredDocuments(fraStatus) {
  const baseDocuments = [
    'Identity Proof (Aadhaar/Voter ID)',
    'Residence Proof',
    'Land Occupation Evidence',
    'Community Certificate'
  ];
  
  if (fraStatus.includes('CFR')) {
    baseDocuments.push('Gram Sabha Resolution', 'Community Management Plan');
  }
  
  return baseDocuments;
}

function getSubmittedDocuments(patta) {
  // Simulate document submission status
  return [
    'Identity Proof - Submitted',
    'Residence Proof - Pending',
    'Land Occupation Evidence - Submitted'
  ];
}

function generateTimeline(patta) {
  return [
    {
      date: patta.created,
      event: 'Patta Record Created',
      status: 'Completed',
      description: 'Initial record entry in system'
    },
    {
      date: patta.lastModified,
      event: 'Last Updated',
      status: 'Completed',
      description: 'Record information updated'
    },
    {
      date: null,
      event: 'Field Verification',
      status: 'Pending',
      description: 'Physical verification of land boundaries'
    },
    {
      date: null,
      event: 'Final Approval',
      status: 'Pending',
      description: 'Final decision on FRA claim'
    }
  ];
}

module.exports = router;