import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export interface PattaHolder {
  id: string;
  ownerName: string;
  fatherName: string;
  address: {
    village: string;
    block: string;
    district: string;
    state: string;
    pincode: number;
    fullAddress: string;
  };
  landDetails: {
    surveyNo: string;
    khasra: string;
    area: {
      hectares: number;
      acres: number;
      squareMeters: number;
    };
    classification: string;
    fraStatus: string;
  };
  coordinates?: number[][];
  geometry?: any;
  created: string;
  lastModified: string;
  createdBy?: string;
  status?: string;
}

export const pattaHoldersAPI = {
  // Get all patta holders
  getAll: async () => {
    const response = await axios.get(`${API_BASE_URL}/patta-holders`);
    return response.data;
  },

  // Create new patta holder
  create: async (pattaHolder: Partial<PattaHolder>) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_BASE_URL}/patta-holders`,
      pattaHolder,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  },

  // Get patta holder by ID
  getById: async (id: string) => {
    const response = await axios.get(`${API_BASE_URL}/patta-holders/${id}`);
    return response.data;
  },

  // Update patta holder
  update: async (id: string, pattaHolder: Partial<PattaHolder>) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `${API_BASE_URL}/patta-holders/${id}`,
      pattaHolder,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  },

  // Delete patta holder
  delete: async (id: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(
      `${API_BASE_URL}/patta-holders/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  },

  // Get patta holders as GeoJSON
  getGeoJSON: async (filters?: {
    state?: string;
    district?: string;
    village?: string;
    fraStatus?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.state) params.append('state', filters.state);
    if (filters?.district) params.append('district', filters.district);
    if (filters?.village) params.append('village', filters.village);
    if (filters?.fraStatus) params.append('fraStatus', filters.fraStatus);

    const response = await axios.get(
      `${API_BASE_URL}/patta-holders/geojson/all?${params.toString()}`
    );
    return response.data;
  },

  // Get statistics
  getStatistics: async () => {
    const response = await axios.get(`${API_BASE_URL}/patta-holders/stats/summary`);
    return response.data;
  },

  // Bulk create patta holders
  bulkCreate: async (pattaHolders: Partial<PattaHolder>[]) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_BASE_URL}/patta-holders/bulk`,
      { pattaHolders },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  },

  // Generate report for patta holder
  generateReport: async (id: string) => {
    const response = await axios.get(`${API_BASE_URL}/patta-report/${id}`);
    return response.data;
  }
};

export default pattaHoldersAPI;