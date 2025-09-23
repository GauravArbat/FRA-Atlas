import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { store } from './store';
import './index.css';
import { hydrate, setUser, clearAuth } from './store/slices/authSlice';
import { api } from './services/api';

import { addSampleNotifications } from './store/slices/addSampleNotifications';

// Leaflet CSS (already imported in components that use it)
// import 'leaflet/dist/leaflet.css';

// Hydrate auth from localStorage and fetch current user on bootstrap
const token = localStorage.getItem('token');
if (token) {
  store.dispatch(hydrate(token));
  api
    .get('/auth/me')
    .then((res) => {
      if (res?.data?.user) {
        store.dispatch(setUser(res.data.user));
      }
    })
    .catch(() => {
      store.dispatch(clearAuth());
    });
}

// Add sample notifications for demonstration
addSampleNotifications();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter
        future={{
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

