import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FRAClaim {
  id: string;
  claimNumber: string;
  claimType: 'IFR' | 'CR' | 'CFR';
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  applicantName: string;
  village: string;
  block: string;
  district: string;
  state: string;
  area: number; // in hectares
  coordinates: {
    latitude: number;
    longitude: number;
  };
  submittedDate: string;
  lastUpdated: string;
  documents: string[];
  verificationStatus: 'pending' | 'verified' | 'disputed';
  spatialData?: any; // GeoJSON data
}

interface FRADataState {
  claims: FRAClaim[];
  loading: boolean;
  error: string | null;
  filters: {
    state: string;
    district: string;
    block: string;
    claimType: string;
    status: string;
  };
  statistics: {
    totalClaims: number;
    approvedClaims: number;
    pendingClaims: number;
    rejectedClaims: number;
    totalArea: number;
  };
}

const initialState: FRADataState = {
  claims: [],
  loading: false,
  error: null,
  filters: {
    state: '',
    district: '',
    block: '',
    claimType: '',
    status: '',
  },
  statistics: {
    totalClaims: 0,
    approvedClaims: 0,
    pendingClaims: 0,
    rejectedClaims: 0,
    totalArea: 0,
  },
};

const fraDataSlice = createSlice({
  name: 'fraData',
  initialState,
  reducers: {
    fetchClaimsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchClaimsSuccess: (state, action: PayloadAction<FRAClaim[]>) => {
      state.loading = false;
      state.claims = action.payload;
      // Calculate statistics
      state.statistics = {
        totalClaims: action.payload.length,
        approvedClaims: action.payload.filter(c => c.status === 'approved').length,
        pendingClaims: action.payload.filter(c => c.status === 'pending').length,
        rejectedClaims: action.payload.filter(c => c.status === 'rejected').length,
        totalArea: action.payload.reduce((sum, c) => sum + c.area, 0),
      };
    },
    fetchClaimsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateFilters: (state, action: PayloadAction<Partial<FRADataState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    addClaim: (state, action: PayloadAction<FRAClaim>) => {
      state.claims.push(action.payload);
    },
    updateClaim: (state, action: PayloadAction<FRAClaim>) => {
      const index = state.claims.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.claims[index] = action.payload;
      }
    },
  },
});

export const {
  fetchClaimsStart,
  fetchClaimsSuccess,
  fetchClaimsFailure,
  updateFilters,
  addClaim,
  updateClaim,
} = fraDataSlice.actions;

export default fraDataSlice.reducer;

