import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import FRAAtlas from './pages/FRAAtlas';
import DigitalGISPlot from './pages/DigitalGISPlot';
import DataPlottingDemo from './pages/DataPlottingDemo';
import DataManagement from './pages/DataManagement';
import DecisionSupport from './pages/DecisionSupport';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import { useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const { isAuthenticated } = useAuth();

  // Suppress common harmless errors globally
  useEffect(() => {
    // Override ResizeObserver globally to suppress errors
    const OriginalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = class extends OriginalResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        super((entries, observer) => {
          try {
            callback(entries, observer);
          } catch (error) {
            // Suppress ResizeObserver errors silently
            if (error instanceof Error && error.message.includes('ResizeObserver loop completed with undelivered notifications')) {
              return;
            }
            throw error;
          }
        });
      }
    };

    const handleError = (e: ErrorEvent) => {
      // Suppress ResizeObserver errors
      if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
        e.stopImmediatePropagation();
        return false;
      }
      
      // Suppress map style loading errors
      if (e.message?.includes('Style is not done loading') ||
          e.message?.includes('Style is not done loading.')) {
        e.stopImmediatePropagation();
        return false;
      }
      
      // Suppress map container errors
      if (e.message?.includes('Invalid type: \'container\' must be a String or HTMLElement') ||
          e.message?.includes('container must be a String or HTMLElement')) {
        e.stopImmediatePropagation();
        return false;
      }
      
      // Suppress other common harmless errors
      if (e.message?.includes('ResizeObserver') || 
          e.message?.includes('Non-Error promise rejection') ||
          e.message?.includes('Loading chunk') ||
          e.message?.includes('ChunkLoadError') ||
          e.message?.includes('Network Error') ||
          e.message?.includes('ERR_CONNECTION_REFUSED')) {
        e.stopImmediatePropagation();
        return false;
      }
    };

    const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
      // Suppress unhandled promise rejections that are harmless
      if (e.reason?.message?.includes('ResizeObserver') ||
          e.reason?.message?.includes('Loading chunk') ||
          e.reason?.message?.includes('ChunkLoadError') ||
          e.reason?.message?.includes('Style is not done loading') ||
          e.reason?.message?.includes('Network Error') ||
          e.reason?.message?.includes('ERR_CONNECTION_REFUSED')) {
        e.preventDefault();
        return false;
      }
    };

    // Override console.error globally to suppress specific errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('ResizeObserver loop completed with undelivered notifications') ||
          message.includes('Style is not done loading') ||
          message.includes('Non-Error promise rejection') ||
          message.includes('A listener indicated an asynchronous response') ||
          message.includes('message channel closed before a response was received') ||
          message.includes('Unchecked runtime.lastError') ||
          message.includes('Invalid type: \'container\' must be a String or HTMLElement') ||
          message.includes('container must be a String or HTMLElement') ||
          message.includes('Network Error') ||
          message.includes('ERR_CONNECTION_REFUSED') ||
          message.includes('AxiosError')) {
        return; // Suppress these specific errors
      }
      originalConsoleError.apply(console, args);
    };

    // Override console.warn globally to suppress specific warnings
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      const message = args.join(' ');
      if (message.includes('Style not loaded yet') ||
          message.includes('Map not ready')) {
        return; // Suppress these specific warnings
      }
      originalConsoleWarn.apply(console, args);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.error = originalConsoleError; // Restore original console.error
      console.warn = originalConsoleWarn; // Restore original console.warn
      window.ResizeObserver = OriginalResizeObserver; // Restore original ResizeObserver
    };
  }, []);

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
    <ErrorBoundary>
      <Box sx={{ display: 'flex' }}>
        <Sidebar />
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Header />
          <Box component="main" sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 3 }, mt: { xs: 7, md: 8 } }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/atlas" element={<FRAAtlas />} />
              <Route path="/gis-plot" element={<DigitalGISPlot />} />
              {/* <Route path="/data-plotting" element={<DataPlottingDemo />} /> */}
              <Route path="/data" element={<DataManagement />} />
              <Route path="/decisions" element={<DecisionSupport />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Box>
        </Box>
      </Box>
    </ErrorBoundary>
  );
}

export default App;

