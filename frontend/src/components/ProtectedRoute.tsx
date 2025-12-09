// Archer ITSM - Protected Route Component
// Handles authentication checks and redirects for protected routes

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from '@fluentui/react-components';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  fallbackPath?: string;
}

/**
 * ProtectedRoute component
 * Wraps routes that require authentication and/or specific permissions
 * 
 * @param children - Route content to render if authorized
 * @param requiredPermission - Optional permission check (e.g., "tickets:create")
 * @param requiredRole - Optional role check (e.g., "admin")
 * @param fallbackPath - Path to redirect to if unauthorized (default: /login)
 */
export function ProtectedRoute({
  children,
  requiredPermission,
  requiredRole,
  fallbackPath = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission, hasRole, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <Spinner size="large" label="Loading..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the attempted location for redirect after login
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check permission if required
  if (requiredPermission && !hasPermission(requiredPermission)) {
    console.warn(
      `User ${user?.email} lacks required permission: ${requiredPermission}`
    );
    return (
      <Navigate
        to="/unauthorized"
        state={{ from: location, reason: 'insufficient_permissions' }}
        replace
      />
    );
  }

  // Check role if required
  if (requiredRole && !hasRole(requiredRole)) {
    console.warn(
      `User ${user?.email} lacks required role: ${requiredRole}`
    );
    return (
      <Navigate
        to="/unauthorized"
        state={{ from: location, reason: 'insufficient_role' }}
        replace
      />
    );
  }

  // User is authenticated and authorized
  return <>{children}</>;
}
