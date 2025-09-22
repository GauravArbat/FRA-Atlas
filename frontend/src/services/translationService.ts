import { api } from './api';

export interface TranslationResponse {
  translatedText: string;
  detectedSourceLanguage?: string;
}

// Rate limiting
const translationQueue: Array<() => Promise<any>> = [];
let isProcessing = false;
const RATE_LIMIT_DELAY = 100; // 100ms between requests

const processQueue = async () => {
  if (isProcessing || translationQueue.length === 0) return;
  
  isProcessing = true;
  while (translationQueue.length > 0) {
    const request = translationQueue.shift();
    if (request) {
      try {
        await request();
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      } catch (error) {
        console.warn('Translation request failed:', error);
      }
    }
  }
  isProcessing = false;
};

export const translateText = async (
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<TranslationResponse> => {
  // Check cache first
  const cacheKey = `${text}_${targetLanguage}_${sourceLanguage || 'auto'}`;
  const cached = localStorage.getItem(`translate_${cacheKey}`);
  if (cached) {
    return JSON.parse(cached);
  }

  return new Promise((resolve, reject) => {
    const request = async () => {
      try {
        const response = await api.post('/translate/translate', {
          text,
          target: targetLanguage,
          source: sourceLanguage
        });
        
        // Cache the result
        localStorage.setItem(`translate_${cacheKey}`, JSON.stringify(response.data));
        resolve(response.data);
      } catch (error: any) {
        if (error.response?.status === 429) {
          // Rate limit exceeded - return original text
          console.warn('Translation rate limit exceeded, using original text');
          resolve({ translatedText: text, detectedSourceLanguage: sourceLanguage });
        } else {
          console.error('Translation error:', error);
          resolve({ translatedText: text, detectedSourceLanguage: sourceLanguage });
        }
      }
    };
    
    translationQueue.push(request);
    processQueue();
  });
};

export const getSupportedLanguages = () => [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी (Hindi)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'mr', name: 'मराठी (Marathi)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', name: 'മലയാളം (Malayalam)' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'or', name: 'ଓଡ଼ିଆ (Odia)' },
  { code: 'as', name: 'অসমীয়া (Assamese)' },
  { code: 'ur', name: 'اردو (Urdu)' },
  { code: 'sa', name: 'संस्कृत (Sanskrit)' },
  { code: 'ne', name: 'नेपाली (Nepali)' },
  { code: 'si', name: 'සිංහල (Sinhala)' },
  { code: 'my', name: 'မြန်မာ (Myanmar)' },
  { code: 'sd', name: 'سنڌي (Sindhi)' },
  { code: 'kok', name: 'कोंकणी (Konkani)' },
  { code: 'mai', name: 'मैथिली (Maithili)' },
  { code: 'sat', name: 'ᱥᱟᱱᱛᱟᱲᱤ (Santali)' },
  { code: 'ks', name: 'कॉशुर (Kashmiri)' },
  { code: 'doi', name: 'डोगरी (Dogri)' },
  { code: 'mni', name: 'মৈতৈলোন্ (Manipuri)' },
  { code: 'bo', name: 'བོད་སྐད (Tibetan)' }
];