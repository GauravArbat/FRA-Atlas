import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Alert, Box } from '@mui/material';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermission?: {
    resource: string;
    action: string;
  };
  fallback?: React.ReactNode;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission,
  fallback
}) => {
  const { user, hasPermission, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <>{
      fallback || (
        <Box p={3}>
          <Alert severity="error">
            Access Denied: You don't have permission to view this page.
            <br />
            Required roles: {allowedRoles.join(', ')}
            <br />
            Your role: {user.role}
          </Alert>
        </Box>
      )
    }</>;
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(requiredPermission.resource, requiredPermission.action)) {
    return <>{
      fallback || (
        <Box p={3}>
          <Alert severity="error">
            Access Denied: Insufficient permissions.
            <br />
            Required: {requiredPermission.action} on {requiredPermission.resource}
          </Alert>
        </Box>
      )
    }</>;
  }

  return <>{children}</>;
};

export default RoleBasedRoute;