const axios = require('axios');

const key = 'AIzaSyASEFuAudEZjYbCrx8OhbZHMUCb1s5qCvU';

console.log('🧪 Testing Google Translate API key...');
console.log('Key:', key);

axios.post('https://translation.googleapis.com/language/translate/v2', null, {
  params: { 
    q: 'Hello World', 
    target: 'hi', 
    key: key 
  },
  timeout: 10000
}).then(response => {
  console.log('✅ API Key Works!');
  console.log('Original: Hello World');
  console.log('Hindi:', response.data.data.translations[0].translatedText);
}).catch(error => {
  console.log('❌ API Key Failed');
  if (error.response) {
    console.log('Error:', error.response.data.error.message);
    console.log('Status:', error.response.status);
  } else {
    console.log('Error:', error.message);
  }
});