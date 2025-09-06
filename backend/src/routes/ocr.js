const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'), false);
    }
  }
});

// OCR Processing Endpoint
router.post('/process', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { buffer, mimetype, originalname } = req.file;
    
    // For now, we'll use Tesseract.js for OCR
    // In production, you might want to use more advanced OCR services
    const result = await Tesseract.recognize(buffer, 'eng', {
      logger: m => console.log(m) // Optional: log progress
    });

    // Calculate confidence score
    const confidence = result.data.confidence || 0;
    const extractedText = result.data.text || '';

    // Clean up the text
    const cleanedText = extractedText
      .replace(/\n+/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();

    res.json({
      success: true,
      text: cleanedText,
      confidence: Math.round(confidence),
      filename: originalname,
      fileType: mimetype,
      wordCount: cleanedText.split(' ').length,
      characterCount: cleanedText.length
    });

  } catch (error) {
    console.error('OCR processing error:', error);
    res.status(500).json({ 
      error: 'OCR processing failed',
      details: error.message 
    });
  }
});

// Batch OCR Processing
router.post('/batch', upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];
    
    for (const file of req.files) {
      try {
        const result = await Tesseract.recognize(file.buffer, 'eng');
        const confidence = result.data.confidence || 0;
        const extractedText = result.data.text || '';

        results.push({
          filename: file.originalname,
          text: extractedText.replace(/\n+/g, '\n').replace(/\s+/g, ' ').trim(),
          confidence: Math.round(confidence),
          success: true
        });
      } catch (fileError) {
        results.push({
          filename: file.originalname,
          error: fileError.message,
          success: false
        });
      }
    }

    res.json({
      success: true,
      results: results,
      totalFiles: req.files.length,
      successfulFiles: results.filter(r => r.success).length
    });

  } catch (error) {
    console.error('Batch OCR processing error:', error);
    res.status(500).json({ 
      error: 'Batch OCR processing failed',
      details: error.message 
    });
  }
});

// OCR Status Check
router.get('/status', (req, res) => {
  res.json({
    service: 'OCR Processing',
    status: 'active',
    supportedFormats: ['image/jpeg', 'image/png', 'image/tiff', 'application/pdf'],
    maxFileSize: '10MB',
    languages: ['English', 'Hindi', 'Telugu', 'Tamil', 'Bengali']
  });
});

module.exports = router;
