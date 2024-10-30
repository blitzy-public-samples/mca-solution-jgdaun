/**
 * Custom React hook for managing authentication state and actions
 * Implements JWT-based authentication flow with secure token storage and refresh
 * 
 * Requirements implemented:
 * - API Authentication (system_design/api_design/api_authentication)
 * - Authentication Flow (security_considerations/authentication_and_authorization/authentication_flow)
 */

import { useState, useEffect, useCallback } from 'react'; // v18.2.0
import { makeApiRequest } from '../utils/api';
import { AUTH } from '../constants/api';

// Token storage keys
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Types for authentication state
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

/**
 * Custom hook for managing authentication state and actions
 * Provides JWT token handling, secure storage, and automatic token refresh
 */
const useAuth = () => {
  // Initialize authentication state
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  /**
   * Securely stores authentication tokens in localStorage with expiration
   */
  const storeTokens = useCallback((token: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }, []);

  /**
   * Removes authentication tokens from localStorage
   */
  const clearTokens = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, []);

  /**
   * Attempts to refresh the access token using the refresh token
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        return false;
      }

      const response = await makeApiRequest<AuthResponse>(
        AUTH.REFRESH_TOKEN,
        'POST',
        { refreshToken }
      );

      if (response.success && response.data) {
        const { token, refreshToken: newRefreshToken, user } = response.data;
        storeTokens(token, newRefreshToken);
        setState(prev => ({
          ...prev,
          user,
          isAuthenticated: true,
          error: null
        }));
        return true;
      }
      return false;
    } catch (error) {
      clearTokens();
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        error: 'Session expired. Please login again.'
      }));
      return false;
    }
  }, [storeTokens, clearTokens]);

  /**
   * Handles user login with credentials
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await makeApiRequest<AuthResponse>(
        AUTH.LOGIN,
        'POST',
        credentials
      );

      if (response.success && response.data) {
        const { token, refreshToken, user } = response.data;
        storeTokens(token, refreshToken);
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
          error: null
        });
        return true;
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: response.message || 'Login failed'
      }));
      return false;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'An error occurred during login'
      }));
      return false;
    }
  }, [storeTokens]);

  /**
   * Handles user logout
   */
  const logout = useCallback(async () => {
    try {
      // Attempt to notify the server about logout
      await makeApiRequest(AUTH.LOGOUT, 'POST');
    } catch (error) {
      // Continue with local logout even if server request fails
      console.error('Logout request failed:', error);
    } finally {
      clearTokens();
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null
      });
    }
  }, [clearTokens]);

  /**
   * Initialize authentication state on mount
   * Checks for existing token and validates session
   */
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      
      if (!token) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Attempt to refresh token on initial load
        const refreshSuccessful = await refreshToken();
        if (!refreshSuccessful) {
          clearTokens();
        }
      } catch (error) {
        clearTokens();
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, [refreshToken, clearTokens]);

  // Set up token refresh interval
  useEffect(() => {
    if (!state.isAuthenticated) return;

    // Refresh token every 45 minutes to prevent expiration
    const refreshInterval = setInterval(refreshToken, 45 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [state.isAuthenticated, refreshToken]);

  return {
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,
    login,
    logout
  };
};

export default useAuth;