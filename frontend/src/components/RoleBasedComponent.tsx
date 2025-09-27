import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface RoleBasedComponentProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermission?: {
    resource: string;
    action: string;
  };
  fallback?: React.ReactNode;
  hideIfNoAccess?: boolean;
}

const RoleBasedComponent: React.FC<RoleBasedComponentProps> = ({
  children,
  allowedRoles,
  requiredPermission,
  fallback = null,
  hideIfNoAccess = false
}) => {
  const { user, hasPermission } = useAuth();

  if (!user) {
    return hideIfNoAccess ? null : <>{fallback}</>;
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return hideIfNoAccess ? null : <>{fallback}</>;
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(requiredPermission.resource, requiredPermission.action)) {
    return hideIfNoAccess ? null : <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleBasedComponent;