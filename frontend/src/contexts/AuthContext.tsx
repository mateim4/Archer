// Archer ITSM - Authentication Context
// Manages JWT tokens, user session, and authentication state

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  AuthContextValue,
  AuthState,
  LoginResponse,
  UserProfile,
  UpdateUserRequest,
  TOKEN_STORAGE_KEYS,
  TOKEN_REFRESH_BUFFER_MS,
} from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Create context with undefined default (requires provider)
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Hook to access auth context (throws if used outside provider)
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider component
 * Manages authentication state, token storage, and automatic refresh
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: true, // Start with loading true to check stored tokens
    error: null,
  });

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Load tokens and user from localStorage on mount
   */
  useEffect(() => {
    const loadStoredAuth = () => {
      try {
        const accessToken = localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
        const refreshToken = localStorage.getItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
        const userJson = localStorage.getItem(TOKEN_STORAGE_KEYS.USER_PROFILE);

        if (accessToken && refreshToken && userJson) {
          const user: UserProfile = JSON.parse(userJson);
          setState({
            isAuthenticated: true,
            user,
            accessToken,
            refreshToken,
            isLoading: false,
            error: null,
          });

          // Schedule token refresh
          scheduleTokenRefresh(accessToken);
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error loading stored auth:', error);
        clearStoredAuth();
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadStoredAuth();

    // Cleanup refresh timer on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  /**
   * Parse JWT token to extract expiry time
   */
  const parseJwtExpiry = (token: string): number | null => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return null;
    }
  };

  /**
   * Schedule automatic token refresh before expiry
   */
  const scheduleTokenRefresh = useCallback((token: string) => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    const expiryTime = parseJwtExpiry(token);
    if (!expiryTime) {
      console.warn('Could not parse token expiry, skipping auto-refresh');
      return;
    }

    const now = Date.now();
    const timeUntilRefresh = expiryTime - now - TOKEN_REFRESH_BUFFER_MS;

    if (timeUntilRefresh > 0) {
      console.log(`Scheduling token refresh in ${Math.round(timeUntilRefresh / 1000)}s`);
      refreshTimerRef.current = setTimeout(() => {
        refreshAuth();
      }, timeUntilRefresh);
    } else {
      // Token already expired or about to expire, refresh immediately
      console.warn('Token expired or expiring soon, refreshing now');
      refreshAuth();
    }
  }, []);

  /**
   * Store tokens and user in localStorage
   */
  const storeAuth = (accessToken: string, refreshToken: string, user: UserProfile) => {
    localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(TOKEN_STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
  };

  /**
   * Clear tokens and user from localStorage
   */
  const clearStoredAuth = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.USER_PROFILE);
  };

  /**
   * Login with email and password
   */
  const login = async (email: string, password: string): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Login failed');
      }

      const data = await response.json();
      const loginResponse: LoginResponse = data.data || data;

      // Store auth data
      storeAuth(loginResponse.access_token, loginResponse.refresh_token, loginResponse.user);

      // Update state
      setState({
        isAuthenticated: true,
        user: loginResponse.user,
        accessToken: loginResponse.access_token,
        refreshToken: loginResponse.refresh_token,
        isLoading: false,
        error: null,
      });

      // Schedule token refresh
      scheduleTokenRefresh(loginResponse.access_token);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  };

  /**
   * Logout and clear session
   */
  const logout = async (): Promise<void> => {
    // Cancel refresh timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    try {
      // Call logout endpoint if we have a refresh token
      if (state.refreshToken) {
        await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: state.refreshToken }),
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Continue with local cleanup even if API call fails
    }

    // Clear local state
    clearStoredAuth();
    setState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
    });
  };

  /**
   * Refresh access token using refresh token
   */
  const refreshAuth = async (): Promise<void> => {
    if (!state.refreshToken) {
      console.warn('No refresh token available');
      await logout();
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: state.refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const refreshResponse = data.data || data;

      // Update access token
      localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, refreshResponse.access_token);

      setState((prev) => ({
        ...prev,
        accessToken: refreshResponse.access_token,
      }));

      // Schedule next refresh
      scheduleTokenRefresh(refreshResponse.access_token);
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Refresh failed, logout user
      await logout();
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updates: UpdateUserRequest): Promise<void> => {
    if (!state.accessToken) {
      throw new Error('Not authenticated');
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.accessToken}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Profile update failed');
      }

      const data = await response.json();
      const updatedUser: UserProfile = data.data || data;

      // Update stored user
      localStorage.setItem(TOKEN_STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedUser));

      setState((prev) => ({
        ...prev,
        user: updatedUser,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profile update failed';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  };

  /**
   * Change password
   */
  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!state.accessToken) {
      throw new Error('Not authenticated');
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.accessToken}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Password change failed');
      }

      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password change failed';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  };

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!state.user) return false;
    return state.user.permissions.includes(permission);
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (roleName: string): boolean => {
    if (!state.user) return false;
    return state.user.roles.some((role) => role.name === roleName);
  };

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    refreshAuth,
    updateProfile,
    changePassword,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
