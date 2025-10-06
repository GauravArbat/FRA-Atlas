const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';

async function testTranslation() {
  console.log('🧪 Testing Google Translate API...\n');
  
  console.log('API Key:', GOOGLE_TRANSLATE_API_KEY ? 'Present' : 'Missing');
  console.log('DISABLE_TRANSLATION:', process.env.DISABLE_TRANSLATION);
  
  if (!GOOGLE_TRANSLATE_API_KEY) {
    console.log('❌ Google Translate API key is missing');
    return;
  }
  
  try {
    const params = {
      q: 'Hello World',
      target: 'hi',
      key: GOOGLE_TRANSLATE_API_KEY,
    };
    
    console.log('\n🔄 Testing translation: "Hello World" -> Hindi');
    const response = await axios.post(GOOGLE_TRANSLATE_URL, null, { params });
    
    const translation = response.data.data.translations[0];
    console.log('✅ Translation successful:', translation.translatedText);
    
  } catch (error) {
    console.log('❌ Translation failed:', error.response?.data?.error || error.message);
    
    if (error.response?.status === 403) {
      console.log('💡 API key might be invalid or billing not enabled');
    }
  }
}

testTranslation();