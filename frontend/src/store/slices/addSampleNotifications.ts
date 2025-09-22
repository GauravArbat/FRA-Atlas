import { store } from '../index';
import { addNotification } from './uiSlice';

// Function to add sample notifications to the Redux store
export const addSampleNotifications = () => {
  // Sample notification data
  const notifications = [
    {
      message: 'New forest rights claim submitted for review',
      type: 'info' as const,
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
    },
    {
      message: 'Satellite imagery processing completed',
      type: 'success' as const,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
    },
    {
      message: 'Error uploading GIS data: Invalid format',
      type: 'error' as const,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
    },
    {
      message: 'System maintenance scheduled for tomorrow',
      type: 'warning' as const,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() // 2 days ago
    },
  ];

  // Add each notification to the store
  notifications.forEach(notification => {
    store.dispatch(addNotification(notification));
  });
};