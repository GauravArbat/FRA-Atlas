import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import FRAAtlas from './pages/FRAAtlas';
import DataManagement from './pages/DataManagement';
import DecisionSupport from './pages/DecisionSupport';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import { useAuth } from './hooks/useAuth';

function App() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
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
        <Box component="main" sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 3 }, mt: { xs: 7, md: 8 } }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/atlas" element={<FRAAtlas />} />
            <Route path="/data" element={<DataManagement />} />
            <Route path="/decisions" element={<DecisionSupport />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

export default App;

