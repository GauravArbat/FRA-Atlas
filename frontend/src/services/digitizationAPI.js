import axios from 'axios';

const DIGITIZATION_API_URL = 'http://localhost:8000/api/digitization';

export const digitizationPipelineAPI = {
  batchUpload: async (files) => {
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append('file', files[i]);
      
      try {
        const response = await axios.post(`${DIGITIZATION_API_URL}/ocr`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        results.push(response.data);
      } catch (error) {
        console.error(`Error processing file ${i}:`, error);
      }
    }
    
    return {
      data: {
        count: files.length,
        document_ids: files.map((_, i) => `doc_${Date.now()}_${i}`),
        results
      }
    };
  },

  getStatus: async (documentId) => {
    return {
      data: {
        status: 'completed',
        extracted_data: {
          claimantName: 'Sample Name',
          village: 'Sample Village',
          district: 'Sample District',
          area: '2.5 एकड़',
          claimType: 'IFR'
        }
      }
    };
  },

  processOCR: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${DIGITIZATION_API_URL}/ocr`, formData);
  },

  processNER: async (text) => {
    return axios.post(`${DIGITIZATION_API_URL}/ner`, { text });
  },

  computerVision: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${DIGITIZATION_API_URL}/cv/detect`, formData);
  }
};