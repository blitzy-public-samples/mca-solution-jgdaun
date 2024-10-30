/**
 * API Configuration Module
 * This module configures the Axios instance used for making API requests in the frontend application.
 * 
 * Requirements implemented:
 * - API Authentication (system_design/api_design/api_authentication)
 * - Rate Limiting (system_design/api_design/rate_limiting)
 * 
 * @version 1.0.0
 */

// axios v0.21.1
import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { 
  API_ENDPOINTS, 
  API_VERSION,
} from '../constants/api';

// Global configuration constants
const RETRY_COUNT = 3;
const RETRY_DELAY = 1000;
const DEFAULT_TIMEOUT = 30000;

/**
 * Creates and configures the base Axios instance with default settings
 */
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-API-Version': API_VERSION,
  },
  timeout: DEFAULT_TIMEOUT,
});

/**
 * Handles JWT token refresh when authentication fails
 * @returns Promise<string> New JWT token
 */
const refreshAuthToken = async (): Promise<string> => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await axios.post(
      API_ENDPOINTS.AUTH.REFRESH_TOKEN,
      { refreshToken },
      { baseURL: process.env.REACT_APP_API_BASE_URL }
    );
    const { accessToken } = response.data;
    localStorage.setItem('accessToken', accessToken);
    return accessToken;
  } catch (error) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    throw error;
  }
};

/**
 * Implements exponential backoff for rate-limited requests
 * @param retryCount Current retry attempt number
 * @param retryAfter Server-specified retry delay
 * @returns Calculated delay in milliseconds
 */
const calculateBackoffDelay = (retryCount: number, retryAfter?: number): number => {
  if (retryAfter) {
    return retryAfter * 1000;
  }
  return Math.min(1000 * Math.pow(2, retryCount), 10000);
};

/**
 * Handles rate-limited requests with exponential backoff
 * @param error AxiosError from failed request
 * @returns Promise resolving to retried request response
 */
const handleRateLimiting = async (error: AxiosError): Promise<any> => {
  const config = error.config;
  if (!config) {
    return Promise.reject(error);
  }

  config.retryCount = config.retryCount || 0;

  if (error.response?.status === 429 && config.retryCount < RETRY_COUNT) {
    const retryAfter = parseInt(error.response.headers['retry-after'] || '0');
    const delay = calculateBackoffDelay(config.retryCount, retryAfter);
    
    config.retryCount += 1;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(axiosInstance(config));
      }, delay);
    });
  }

  return Promise.reject(error);
};

/**
 * Configures the Axios instance with interceptors and error handling
 * @returns Configured Axios instance
 */
const configureAxios = (): AxiosInstance => {
  // Request interceptor for authentication
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken');
      const apiKey = process.env.REACT_APP_API_KEY;

      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      if (apiKey) {
        config.headers['X-API-Key'] = apiKey;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for token refresh and rate limiting
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Store rate limit information from headers
      const rateLimitRemaining = response.headers['x-ratelimit-remaining'];
      const rateLimitReset = response.headers['x-ratelimit-reset'];
      
      if (rateLimitRemaining) {
        // Could emit an event or update store with rate limit status
        const remainingRequests = parseInt(rateLimitRemaining);
        if (remainingRequests < 10) {
          console.warn(`Rate limit warning: ${remainingRequests} requests remaining`);
        }
      }

      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config;
      if (!originalRequest) {
        return Promise.reject(error);
      }

      // Handle rate limiting
      if (error.response?.status === 429) {
        return handleRateLimiting(error);
      }

      // Handle authentication errors
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const newToken = await refreshAuthToken();
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      // Handle other errors
      if (error.response?.status === 403) {
        // Handle forbidden access
        console.error('Access forbidden:', error.response.data);
      } else if (error.response?.status === 404) {
        // Handle resource not found
        console.error('Resource not found:', error.response.data);
      } else if (error.response?.status >= 500) {
        // Handle server errors
        console.error('Server error:', error.response.data);
      }

      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

export default configureAxios;