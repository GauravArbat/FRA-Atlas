import axios from 'axios';

const api = axios.create({
  baseURL: (process.env.REACT_APP_API_URL || 'http://localhost:8000') + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// GIS Plot API functions
export const gisPlotAPI = {
  // Patta Records
  getPattaRecords: () => api.get('/gis-plot/patta'),
  createPattaRecord: (data: any) => api.post('/gis-plot/patta', data),
  updatePattaRecord: (id: string, data: any) => api.put(`/gis-plot/patta/${id}`, data),
  deletePattaRecord: (id: string) => api.delete(`/gis-plot/patta/${id}`),
  
  // Cadastral Layers
  getCadastralLayers: () => api.get('/gis-plot/cadastral-layers'),
  addCadastralLayer: (data: any) => api.post('/gis-plot/cadastral-layers', data),
  updateLayerVisibility: (id: string, data: any) => api.put(`/gis-plot/cadastral-layers/${id}/visibility`, data),
  
  // Export
  exportData: (format: string, ids?: string[]) => {
    const params = ids ? { ids: ids.join(',') } : {};
    return api.get(`/gis-plot/export/${format}`, { params });
  },
  
  // Validation
  validateGeometry: (geometry: any) => api.post('/gis-plot/validate-geometry', { geometry }),
  
  // Statistics
  getStatistics: () => api.get('/gis-plot/statistics')
};

// GeoJSON Plot API functions
export const geojsonPlotAPI = {
  // Sample data
  getSampleData: () => api.get('/geojson-plot/sample'),
  
  // Validation
  validateData: (data: any) => api.post('/geojson-plot/validate', { data }),
  
  // Layer management
  saveLayer: (name: string, data: any, style?: any) => 
    api.post('/geojson-plot/save', { name, data, style }),
  getLayers: () => api.get('/geojson-plot/layers'),
  updateLayerStyle: (id: string, style: any) => 
    api.put(`/geojson-plot/layers/${id}/style`, { style }),
  deleteLayer: (id: string) => api.delete(`/geojson-plot/layers/${id}`),
  
  // Export
  exportLayer: (id: string, format: string) => 
    api.get(`/geojson-plot/layers/${id}/export/${format}`),
};

// PDF Processor API functions
export const pdfProcessorAPI = {
  // Process PDF and extract data
  processPDF: (file: File) => {
    const formData = new FormData();
    formData.append('pdf', file);
    return api.post('/pdf-processor/process-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Get all processed data
  getProcessedData: () => api.get('/pdf-processor/processed-data'),
  
  // Save processed data to map layers
  saveToLayers: (geoJSON: any, personalInfo: any) => 
    api.post('/pdf-processor/save-to-layers', { geoJSON, personalInfo }),
};

export { api };



