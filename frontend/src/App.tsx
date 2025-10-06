import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import FRAAtlas from './pages/FRAAtlas';
import DigitalGISPlot from './pages/DigitalGISPlot_OpenStreetMap';
import DataManagement from './pages/DataManagement';
import DecisionSupport from './pages/DecisionSupport';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SatelliteMapping from './pages/SatelliteMapping';
import SatelliteAssetMapping from './pages/SatelliteAssetMapping';
import AdvancedSatelliteMapping from './pages/AdvancedSatelliteMapping';
import FRAProgressTracker from './components/FRAProgressTracker';
import RealTimeSatelliteMapping from './pages/RealTimeSatelliteMapping';
import AIAnalysis from './pages/AIAnalysis';
import Notifications from './pages/Notifications';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import ContactUs from './pages/ContactUs';
import SubmitClaim from './pages/SubmitClaim';
import TrackClaims from './pages/TrackClaims';
import LegacyDataDigitization from './pages/LegacyDataDigitization';
import DummyDataGenerator from './pages/DummyDataGenerator';
import UploadData from './pages/UploadData';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { LanguageProvider } from './contexts/LanguageContext';
import { CustomThemeProvider } from './contexts/ThemeContext';
import VoiceAssistant from './components/VoiceAssistant';
import RoleBasedRoute from './components/RoleBasedRoute';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }
  
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Header />
        <Box component="main" sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 3 }, mt: { xs: '56px', md: '56px' }, bgcolor: 'background.default' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/atlas" element={<FRAAtlas />} />
            <Route path="/gis-plot" element={<RoleBasedRoute allowedRoles={['admin']}><DigitalGISPlot /></RoleBasedRoute>} />
            <Route path="/data" element={<RoleBasedRoute allowedRoles={['admin']}><DataManagement /></RoleBasedRoute>} />
            <Route path="/upload-data" element={<RoleBasedRoute allowedRoles={['admin', 'district_admin']}><UploadData /></RoleBasedRoute>} />
            <Route path="/decisions" element={<RoleBasedRoute allowedRoles={['admin']}><DecisionSupport /></RoleBasedRoute>} />
            <Route path="/satellite-mapping" element={<RoleBasedRoute allowedRoles={['admin', 'mota_technical']}><SatelliteAssetMapping /></RoleBasedRoute>} />
            <Route path="/advanced-mapping" element={<RoleBasedRoute allowedRoles={['admin', 'mota_technical']}><AdvancedSatelliteMapping /></RoleBasedRoute>} />
            <Route path="/progress-tracking" element={<FRAProgressTracker />} />
            <Route path="/realtime-satellite" element={<RoleBasedRoute allowedRoles={['admin', 'mota_technical']}><RealTimeSatelliteMapping /></RoleBasedRoute>} />
            <Route path="/dss-analysis" element={<RoleBasedRoute allowedRoles={['admin', 'mota_technical']}><DecisionSupport /></RoleBasedRoute>} />
            <Route path="/ai-analysis" element={<RoleBasedRoute allowedRoles={['admin', 'mota_technical']}><AIAnalysis /></RoleBasedRoute>} />
            <Route path="/settings" element={<RoleBasedRoute allowedRoles={['admin']}><Settings /></RoleBasedRoute>} />
            <Route path="/model-results" element={<RoleBasedRoute allowedRoles={['admin', 'mota_technical']}><Reports /></RoleBasedRoute>} />
            <Route path="/claims-review" element={<RoleBasedRoute allowedRoles={['admin', 'state_admin']}><DataManagement /></RoleBasedRoute>} />
            <Route path="/gis-validation" element={<RoleBasedRoute allowedRoles={['admin', 'state_admin']}><DigitalGISPlot /></RoleBasedRoute>} />
            <Route path="/legacy-upload" element={<RoleBasedRoute allowedRoles={['admin', 'district_admin']}><DataManagement /></RoleBasedRoute>} />
            <Route path="/legacy-digitization" element={<RoleBasedRoute allowedRoles={['admin', 'district_admin']}><LegacyDataDigitization /></RoleBasedRoute>} />
            <Route path="/dummy-data" element={<RoleBasedRoute allowedRoles={['admin']}><DummyDataGenerator /></RoleBasedRoute>} />
            <Route path="/claims-processing" element={<RoleBasedRoute allowedRoles={['admin', 'district_admin']}><DataManagement /></RoleBasedRoute>} />
            <Route path="/ocr-review" element={<RoleBasedRoute allowedRoles={['admin', 'district_admin']}><Reports /></RoleBasedRoute>} />
            <Route path="/submit-claim" element={<RoleBasedRoute allowedRoles={['admin', 'beneficiary']}><SubmitClaim /></RoleBasedRoute>} />
            <Route path="/track-claims" element={<RoleBasedRoute allowedRoles={['admin', 'beneficiary']}><TrackClaims /></RoleBasedRoute>} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/contact" element={<ContactUs />} />
          </Routes>
        </Box>
      </Box>
      <VoiceAssistant />
    </Box>
  );
};

function App() {
  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('React DevTools') || message.includes('reactjs.org/link/react-devtools')) {
        return;
      }
      originalConsoleError.apply(console, args);
    };
    
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <AuthProvider>
      <CustomThemeProvider>
        <LanguageProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </LanguageProvider>
      </CustomThemeProvider>
    </AuthProvider>
  );
}

export default App;