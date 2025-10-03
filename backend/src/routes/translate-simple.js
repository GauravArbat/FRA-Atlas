const express = require('express');
const router = express.Router();

// Simple translation mappings for common words
const translations = {
  hi: {
    'Dashboard': 'डैशबोर्ड',
    'FRA Atlas': 'एफआरए एटलस',
    'Digital GIS Plot': 'डिजिटल जीआईएस प्लॉट',
    'Data Management': 'डेटा प्रबंधन',
    'Decision Support': 'निर्णय सहायता',
    'Reports': 'रिपोर्ट',
    'Settings': 'सेटिंग्स',
    'Login': 'लॉगिन',
    'Logout': 'लॉगआउट',
    'Profile': 'प्रोफाइल',
    'Hello': 'नमस्ते',
    'Welcome': 'स्वागत',
    'Forest Rights Act': 'वन अधिकार अधिनियम',
    'Claims': 'दावे',
    'Village': 'गांव',
    'District': 'जिला',
    'State': 'राज्य',
    'Submit': 'जमा करें',
    'Cancel': 'रद्द करें',
    'Save': 'सेव करें',
    'Delete': 'हटाएं',
    'Edit': 'संपादित करें',
    'View': 'देखें',
    'Search': 'खोजें',
    'Filter': 'फिल्टर',
    'Export': 'निर्यात',
    'Import': 'आयात',
    'Upload': 'अपलोड',
    'Download': 'डाउनलोड'
  }
};

// Simple translate endpoint
router.post('/translate', async (req, res) => {
  try {
    const { text, target } = req.body;
    
    if (!text || !target) {
      return res.status(400).json({ error: 'Text and target language required' });
    }
    
    // Use simple mapping for common UI elements
    if (translations[target] && translations[target][text]) {
      return res.json({
        translatedText: translations[target][text],
        detectedSourceLanguage: 'en'
      });
    }
    
    // Return original text if no translation found
    res.json({
      translatedText: text,
      detectedSourceLanguage: 'en'
    });
    
  } catch (error) {
    console.error('Translation error:', error);
    res.json({
      translatedText: req.body.text,
      detectedSourceLanguage: 'en'
    });
  }
});

module.exports = router;