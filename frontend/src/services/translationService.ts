import { api } from './api';

export interface TranslationResponse {
  translatedText: string;
  detectedSourceLanguage?: string;
}

// Rate limiting
const translationQueue: Array<() => Promise<any>> = [];
let isProcessing = false;
const RATE_LIMIT_DELAY = 1; // 1ms between requests for faster translation

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
  // Instant cache lookup
  const cacheKey = `${text}_${targetLanguage}_${sourceLanguage || 'auto'}`;
  const cached = localStorage.getItem(`translate_${cacheKey}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Skip translation if target is same as source or for very short text
  if (targetLanguage === 'en' || text.length < 3) {
    return { translatedText: text, detectedSourceLanguage: sourceLanguage };
  }

  // Check if translation is disabled
  const isTranslationDisabled = localStorage.getItem('translationDisabled') === 'true';
  if (isTranslationDisabled) {
    return { translatedText: text, detectedSourceLanguage: sourceLanguage };
  }

  return new Promise((resolve) => {
    const request = async () => {
      try {
        const response = await api.post('/translate/translate', {
          text,
          target: targetLanguage,
          source: sourceLanguage
        }, {
          timeout: 3000 // Increased timeout
        });
        
        // Cache the result
        localStorage.setItem(`translate_${cacheKey}`, JSON.stringify(response.data));
        resolve(response.data);
      } catch (error: any) {
        // Always fallback to original text on any error
        console.warn('Translation failed, using original text:', error.message);
        
        // Disable translation temporarily if server errors persist
        if (error.response?.status >= 500) {
          localStorage.setItem('translationDisabled', 'true');
          setTimeout(() => localStorage.removeItem('translationDisabled'), 300000); // Re-enable after 5 minutes
        }
        
        resolve({ translatedText: text, detectedSourceLanguage: sourceLanguage });
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