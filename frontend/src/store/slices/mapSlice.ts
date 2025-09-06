import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MapState {
  center: [number, number];
  zoom: number;
  selectedClaim: string | null;
  layers: string[];
}

const initialState: MapState = {
  center: [78.9629, 20.5937], // India center
  zoom: 5,
  selectedClaim: null,
  layers: ['claims', 'boundaries'],
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setCenter: (state, action: PayloadAction<[number, number]>) => {
      state.center = action.payload;
    },
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = action.payload;
    },
    setSelectedClaim: (state, action: PayloadAction<string | null>) => {
      state.selectedClaim = action.payload;
    },
    toggleLayer: (state, action: PayloadAction<string>) => {
      const layer = action.payload;
      if (state.layers.includes(layer)) {
        state.layers = state.layers.filter(l => l !== layer);
      } else {
        state.layers.push(layer);
      }
    },
  },
});

export const { setCenter, setZoom, setSelectedClaim, toggleLayer } = mapSlice.actions;
export default mapSlice.reducer;



