const express = require('express');
const axios = require('axios');
const router = express.Router();

const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';

// Translate text
router.post('/translate', async (req, res) => {
  try {
    const { text, target, source } = req.body;

    if (!text || !target) {
      return res.status(400).json({ error: 'Text and target language are required' });
    }

    // Check if translation is disabled or API key is missing
    if (process.env.DISABLE_TRANSLATION === 'true' || !GOOGLE_TRANSLATE_API_KEY) {
      return res.json({
        translatedText: text,
        detectedSourceLanguage: source || 'en'
      });
    }

    const params = {
      q: text,
      target: target,
      key: GOOGLE_TRANSLATE_API_KEY,
    };

    if (source) {
      params.source = source;
    }

    const response = await axios.post(GOOGLE_TRANSLATE_URL, null, { 
      params,
      timeout: 5000 // 5 second timeout
    });
    
    const translation = response.data.data.translations[0];
    res.json({
      translatedText: translation.translatedText,
      detectedSourceLanguage: translation.detectedSourceLanguage,
    });
  } catch (error) {
    console.error('Translation error:', error.message);
    // Return original text instead of error
    res.json({
      translatedText: req.body.text,
      detectedSourceLanguage: req.body.source || 'en'
    });
  }
});

// Get supported languages
router.get('/languages', (req, res) => {
  const supportedLanguages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी (Hindi)' },
    { code: 'mr', name: 'मराठी (Marathi)' },
    { code: 'bn', name: 'বাংলা (Bengali)' },
    { code: 'te', name: 'తెలుగు (Telugu)' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
    { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
    { code: 'ml', name: 'മലയാളം (Malayalam)' },
    { code: 'or', name: 'ଓଡ଼ିଆ (Odia)' },
  ];
  
  res.json(supportedLanguages);
});

module.exports = router;