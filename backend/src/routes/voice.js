const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' }); // Using basic free Gemini model

// Track conversation sessions
const conversationSessions = new Map();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    status: 'Voice API is working!',
    timestamp: new Date().toISOString(),
    geminiAvailable: !!process.env.GEMINI_API_KEY
  });
});

// Fallback responses when Gemini API is unavailable
const getFallbackResponse = (question) => {
  const q = question.toLowerCase();
  
  if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
    return "Hello! I am Rudra, your voice assistant for the FRA Atlas. How can I help you today?";
  }
  
  if (q.includes('fri') || q.includes('what is fri')) {
    return "FRI stands for Forest Research Institute. However, you might be asking about FRA - the Forest Rights Act of 2006, which recognizes the rights of forest dwelling tribal communities. Our FRA Atlas helps manage these forest rights digitally.";
  }
  
  if (q.includes('fra') || q.includes('forest rights act') || q.includes('forest rights')) {
    return "The Forest Rights Act (FRA) 2006 is a landmark legislation that recognizes the rights of forest dwelling tribal communities and other traditional forest dwellers to forest resources. It provides for individual forest rights, community forest rights, and community forest resource rights. Our FRA Atlas helps digitize and manage these important land records and claims.";
  }
  
  if (q.includes('navigation') || q.includes('navigate') || q.includes('perform navigation')) {
    return "Yes, I can help you navigate through the FRA Atlas! I can guide you to different sections like the interactive map, data management, decision support system, reports, and GIS plotting tools. Just tell me where you'd like to go, for example say 'navigate to atlas' or 'open reports'.";
  }
  
  if (q.includes('help') || q.includes('what can you do')) {
    return "I can help you with FRA information, navigate the atlas, assist with land records, answer questions about forest rights, and guide you through the application features. What would you like to know?";
  }
  
  if (q.includes('language') || q.includes('hindi') || q.includes('marathi') || q.includes('odia') || q.includes('tamil') || q.includes('malayalam') || q.includes('telugu')) {
    return "I support multiple languages including English, Hindi, Marathi, Odia, Tamil, Malayalam, and Telugu. You can ask me questions in any of these languages.";
  }
  
  if (q.includes('atlas') || q.includes('map')) {
    return "The FRA Atlas is an interactive mapping system that visualizes forest rights data across India. It shows individual forest rights, community forest rights, and helps in spatial analysis of forest dwelling communities' claims.";
  }
  
  return "I'm here to help with Forest Rights Act information and navigation. You can ask me about FRA, forest rights, how to use the atlas, or ask me to navigate to different sections. What specific information do you need?";
};

router.post('/ask', async (req, res) => {
  try {
    const { question, sessionId } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    console.log('🤖 Voice Assistant API: Received question:', question);

    // Check if this is first interaction in session
    const currentSessionId = sessionId || 'default';
    const isFirstInteraction = !conversationSessions.has(currentSessionId);
    const isGreeting = question.toLowerCase().includes('hey rudra') || question.toLowerCase().includes('hello rudra') || question.toLowerCase().includes('hi rudra');
    
    // Mark session as started
    conversationSessions.set(currentSessionId, true);

    let answer;
    
    // Check if we should use fallback first (for common questions)
    const shouldUseFallback = question.toLowerCase().includes('fri') || 
                             question.toLowerCase().includes('what is fri') ||
                             question.toLowerCase().includes('navigation') ||
                             question.toLowerCase().includes('perform navigation');
    
    if (shouldUseFallback) {
      console.log('🤖 Using optimized fallback response for common question');
      answer = getFallbackResponse(question);
    } else {
      try {
        // Try Gemini API for complex questions
        let prompt;
        if (isGreeting && isFirstInteraction) {
          prompt = `You are Rudra, a personalized voice assistant for the Forest Rights Act (FRA) Atlas application. The user is greeting you for the first time. Respond with: "Welcome to our FRA Atlas! I am Rudra, your personalized assistant. What can I help you with today?"`;
        } else {
          prompt = `You are Rudra, a personalized voice assistant for the Forest Rights Act (FRA) Atlas application. You help users with FRA information, navigation, and multilingual support.

Key behaviors:
- For greetings after the first time, just say "Hello!"
- If asked about language capabilities, confirm you understand English, Hindi, Marathi, Odia, Tamil, Malayalam, and Telugu
- If asked to speak a specific language, switch to that language and respond ONLY in that language without English translations or explanations
- For FRA-related questions, provide detailed, accurate information
- For navigation requests, acknowledge and guide appropriately
- Keep responses conversational and helpful
- Do not repeat the welcome message
- Never include English translations in parentheses when speaking other languages

User question: "${question}"

Respond as Rudra:`;
        }

        const result = await model.generateContent(prompt);
        answer = result.response.text();
        
        // Remove English translations in parentheses
        answer = answer.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
        answer = answer.replace(/\s+/g, ' '); // Clean up extra spaces

        console.log('🤖 Voice Assistant API: Gemini response:', answer);
        
      } catch (geminiError) {
        console.log('🤖 Gemini API unavailable, using fallback response');
        console.error('Gemini error:', geminiError.message);
        
        // Use fallback response
        answer = getFallbackResponse(question);
      }
    }

    res.json({ 
      question: question,
      answer: answer,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Voice Assistant API Error:', error.message);
    
    // Final fallback
    const fallbackAnswer = "I'm sorry, I'm experiencing technical difficulties right now. Please try again in a moment.";
    
    res.json({ 
      question: req.body.question || 'Unknown',
      answer: fallbackAnswer,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;