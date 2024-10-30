/**
 * Authentication Service
 * Implements JWT-based authentication flow, token management, and secure user session handling
 * for the frontend application.
 * 
 * Requirements implemented:
 * - API Authentication (system_design/api_design/api_authentication)
 * - Role-Based Access Control (security_considerations/authentication_and_authorization/role-based_access_control)
 */

// axios v0.21.1
import { makeApiRequest } from '../utils/api';
import { AUTH } from '../constants/api';
import { User, UserRole } from '../types/user';

// Constants for token management
const TOKEN_KEY = 'auth_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes before expiry

/**
 * Interface for authentication response from backend
 */
interface AuthResponse {
  token: string;
  user: User;
  expiresIn: number;
}

/**
 * Interface for token payload structure
 */
interface TokenPayload {
  sub: string;
  exp: number;
  role: UserRole;
}

/**
 * Authenticates a user by sending credentials to the backend
 * Implements the authentication flow from security_considerations/authentication_and_authorization/authentication_flow
 * 
 * @param username - User's login username
 * @param password - User's password
 * @returns Promise resolving to authenticated User object
 */
export const login = async (username: string, password: string): Promise<User> => {
  try {
    // Validate input parameters
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    // Send login request to backend
    const response = await makeApiRequest<AuthResponse>(
      AUTH.LOGIN,
      'POST',
      { username, password }
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Authentication failed');
    }

    const { token, user, expiresIn } = response.data;

    // Store token and expiry
    const expiryDate = new Date(Date.now() + expiresIn * 1000);
    storeToken(token, expiryDate);

    // Schedule token refresh
    scheduleTokenRefresh(expiryDate);

    return user;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

/**
 * Handles user logout by invalidating the session and clearing tokens
 * Implements session termination from security_considerations/authentication_and_authorization/authentication_flow
 */
export const logout = async (): Promise<void> => {
  try {
    // Send logout request to backend to invalidate server session
    await makeApiRequest(AUTH.LOGOUT, 'POST');
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    // Clear local storage and session data regardless of server response
    clearAuthData();
  }
};

/**
 * Refreshes the JWT token before expiration to maintain user session
 * Implements token refresh mechanism from system_design/api_design/api_authentication
 * 
 * @returns Promise resolving to the new JWT token
 */
export const refreshToken = async (): Promise<string> => {
  try {
    // Check if current token exists and is close to expiration
    const currentToken = getStoredToken();
    if (!currentToken) {
      throw new Error('No token available for refresh');
    }

    // Send refresh token request
    const response = await makeApiRequest<AuthResponse>(
      AUTH.REFRESH_TOKEN,
      'POST'
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Token refresh failed');
    }

    const { token, expiresIn } = response.data;

    // Store new token and expiry
    const expiryDate = new Date(Date.now() + expiresIn * 1000);
    storeToken(token, expiryDate);

    // Schedule next refresh
    scheduleTokenRefresh(expiryDate);

    return token;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear auth data on refresh failure to force re-login
    clearAuthData();
    throw error;
  }
};

/**
 * Stores authentication token and expiry in localStorage
 * 
 * @param token - JWT token to store
 * @param expiryDate - Token expiration date
 */
const storeToken = (token: string, expiryDate: Date): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryDate.toISOString());
};

/**
 * Retrieves stored authentication token
 * 
 * @returns Stored JWT token or null if not found
 */
const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Clears all authentication-related data from localStorage
 */
const clearAuthData = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

/**
 * Schedules token refresh before expiration
 * 
 * @param expiryDate - Current token expiration date
 */
const scheduleTokenRefresh = (expiryDate: Date): void => {
  const refreshTime = expiryDate.getTime() - Date.now() - REFRESH_THRESHOLD_MS;
  
  if (refreshTime > 0) {
    setTimeout(() => {
      refreshToken().catch(error => {
        console.error('Scheduled token refresh failed:', error);
      });
    }, refreshTime);
  }
};

/**
 * Decodes JWT token payload
 * 
 * @param token - JWT token to decode
 * @returns Decoded token payload
 */
const decodeToken = (token: string): TokenPayload => {
  try {
    const base64Payload = token.split('.')[1];
    const payload = JSON.parse(atob(base64Payload));
    return payload as TokenPayload;
  } catch (error) {
    console.error('Token decode failed:', error);
    throw new Error('Invalid token format');
  }
};

/**
 * Checks if current token is expired
 * 
 * @returns boolean indicating if token is expired
 */
export const isTokenExpired = (): boolean => {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiry) return true;
  
  const expiryDate = new Date(expiry);
  return Date.now() >= expiryDate.getTime();
};

/**
 * Gets current user's role from stored token
 * 
 * @returns UserRole from token or null if no valid token exists
 */
export const getCurrentUserRole = (): UserRole | null => {
  const token = getStoredToken();
  if (!token) return null;
  
  try {
    const payload = decodeToken(token);
    return payload.role;
  } catch (error) {
    return null;
  }
};