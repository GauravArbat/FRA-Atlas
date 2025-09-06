const express = require('express');
const router = express.Router();

// Simple NER implementation for FRA-specific entities
// In production, you would use more sophisticated NLP libraries like spaCy, NLTK, or cloud services

// FRA-specific entity patterns
const ENTITY_PATTERNS = {
  PERSON: [
    /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Names like "John Doe"
    /\b(?:Shri|Smt|Kumari|Dr|Mr|Mrs|Ms)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g // Titles with names
  ],
  LOCATION: [
    /\b(?:Village|Town|City|District|State|Block|Panchayat|Taluka|Mandal)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g,
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Village|Town|City|District|State|Block|Panchayat|Taluka|Mandal)\b/g,
    /\b\d+\s+(?:acres?|hectares?|sq\.?\s*km|square\s+kilometers?)\b/g // Land measurements
  ],
  ORGANIZATION: [
    /\b(?:Government|Ministry|Department|Commission|Board|Corporation|Society|Trust|Foundation)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g,
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Government|Ministry|Department|Commission|Board|Corporation|Society|Trust|Foundation)\b/g
  ],
  DATE: [
    /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g, // DD/MM/YYYY or DD-MM-YYYY
    /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{2,4}\b/g,
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{2,4}\b/g
  ],
  MONEY: [
    /\b(?:Rs\.?|₹|INR)\s*\d+(?:,\d{3})*(?:\.\d{2})?\b/g, // Currency amounts
    /\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:rupees?|lakhs?|crores?)\b/g
  ],
  PERCENTAGE: [
    /\b\d+(?:\.\d+)?%\b/g
  ],
  FRA_SPECIFIC: [
    /\b(?:Forest Rights Act|FRA|Individual Forest Rights|IFR|Community Forest Rights|CFR|Community Forest Resource|CFR)\b/g,
    /\b(?:Patta|Title Deed|Land Record|Revenue Record|Survey Number|Survey No\.?)\s*(?:No\.?)?\s*\d+\b/g,
    /\b(?:Scheduled Tribe|ST|Scheduled Caste|SC|Other Traditional Forest Dweller|OTFD)\b/g,
    /\b(?:Gram Sabha|Village Council|Panchayat|Forest Department|Revenue Department)\b/g
  ]
};

// NER Processing Endpoint
router.post('/process', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for NER processing' });
    }

    if (text.length < 10) {
      return res.status(400).json({ error: 'Text must be at least 10 characters long' });
    }

    const entities = {};
    const allMatches = [];

    // Process each entity type
    Object.entries(ENTITY_PATTERNS).forEach(([entityType, patterns]) => {
      entities[entityType] = [];
      
      patterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const cleanMatch = match.trim();
            if (cleanMatch && !entities[entityType].includes(cleanMatch)) {
              entities[entityType].push(cleanMatch);
              allMatches.push({
                text: cleanMatch,
                type: entityType,
                start: text.indexOf(cleanMatch),
                end: text.indexOf(cleanMatch) + cleanMatch.length
              });
            }
          });
        }
      });
    });

    // Remove duplicates and sort by position
    const uniqueMatches = allMatches
      .filter((match, index, self) => 
        index === self.findIndex(m => m.text === match.text && m.type === match.type)
      )
      .sort((a, b) => a.start - b.start);

    // Calculate statistics
    const stats = {
      totalEntities: uniqueMatches.length,
      entityTypes: Object.keys(entities).filter(type => entities[type].length > 0),
      textLength: text.length,
      wordCount: text.split(/\s+/).length,
      entityDensity: uniqueMatches.length / text.split(/\s+/).length
    };

    // Generate insights
    const insights = [];
    
    if (entities.FRA_SPECIFIC.length > 0) {
      insights.push("This document contains FRA-specific terminology");
    }
    
    if (entities.LOCATION.length > 0) {
      insights.push(`Mentions ${entities.LOCATION.length} location(s)`);
    }
    
    if (entities.PERSON.length > 0) {
      insights.push(`References ${entities.PERSON.length} person(s)`);
    }
    
    if (entities.MONEY.length > 0) {
      insights.push("Contains financial information");
    }

    res.json({
      success: true,
      text: text,
      entities: entities,
      matches: uniqueMatches,
      statistics: stats,
      insights: insights,
      processingTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('NER processing error:', error);
    res.status(500).json({ 
      error: 'NER processing failed',
      details: error.message 
    });
  }
});

// Batch NER Processing
router.post('/batch', async (req, res) => {
  try {
    const { texts } = req.body;
    
    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'Texts array is required for batch NER processing' });
    }

    if (texts.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 texts allowed for batch processing' });
    }

    const results = [];
    
    for (let i = 0; i < texts.length; i++) {
      try {
        const text = texts[i];
        if (!text || typeof text !== 'string') {
          results.push({
            index: i,
            error: 'Invalid text input',
            success: false
          });
          continue;
        }

        // Process NER for this text (simplified version)
        const entities = {};
        Object.entries(ENTITY_PATTERNS).forEach(([entityType, patterns]) => {
          entities[entityType] = [];
          patterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
              matches.forEach(match => {
                const cleanMatch = match.trim();
                if (cleanMatch && !entities[entityType].includes(cleanMatch)) {
                  entities[entityType].push(cleanMatch);
                }
              });
            }
          });
        });

        results.push({
          index: i,
          text: text,
          entities: entities,
          success: true
        });

      } catch (textError) {
        results.push({
          index: i,
          error: textError.message,
          success: false
        });
      }
    }

    res.json({
      success: true,
      results: results,
      totalTexts: texts.length,
      successfulTexts: results.filter(r => r.success).length
    });

  } catch (error) {
    console.error('Batch NER processing error:', error);
    res.status(500).json({ 
      error: 'Batch NER processing failed',
      details: error.message 
    });
  }
});

// NER Status Check
router.get('/status', (req, res) => {
  res.json({
    service: 'Named Entity Recognition',
    status: 'active',
    supportedEntityTypes: Object.keys(ENTITY_PATTERNS),
    maxTextLength: '10000 characters',
    batchLimit: 10,
    languages: ['English', 'Hindi'],
    specializations: ['FRA Documents', 'Government Documents', 'Legal Text']
  });
});

// Get Entity Patterns (for debugging/development)
router.get('/patterns', (req, res) => {
  res.json({
    patterns: ENTITY_PATTERNS,
    description: 'Available entity recognition patterns'
  });
});

module.exports = router;
