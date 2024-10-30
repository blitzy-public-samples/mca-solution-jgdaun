/**
 * API Utility Module
 * Provides utility functions for making API requests with consistent handling of
 * authentication, rate limiting, error handling, and request retries.
 * 
 * Requirements implemented:
 * - RESTful Endpoints (system_design/api_design/restful_endpoints)
 * - API Authentication (system_design/api_design/api_authentication)
 * - Error Responses (system_design/api_design/error_responses)
 */

// axios v0.21.1
import axios, { AxiosError, AxiosRequestConfig, Method } from 'axios';
import { configureAxios } from '../config/api';
import { 
  AUTH,
  APPLICATIONS,
  DOCUMENTS,
  WEBHOOKS,
  EMAIL,
  OCR 
} from '../constants/api';
import { ApiResponse, ApiError } from '../types/api';

// Initialize configured axios instance
const axiosInstance = configureAxios();

/**
 * Makes an API request using the configured Axios instance with proper error handling and retries
 * @template T - Type of the expected response data
 * @param endpoint - API endpoint to call
 * @param method - HTTP method to use
 * @param data - Request payload (optional)
 * @param config - Additional axios request configuration (optional)
 * @returns Promise resolving to ApiResponse<T>
 */
export const makeApiRequest = async <T>(
  endpoint: string,
  method: Method,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  try {
    // Validate endpoint and method
    if (!endpoint) {
      throw new Error('Endpoint is required');
    }
    if (!method) {
      throw new Error('HTTP method is required');
    }

    // Merge provided config with defaults
    const requestConfig: AxiosRequestConfig = {
      ...config,
      method,
      url: endpoint,
      data: method !== 'GET' ? data : undefined,
      params: method === 'GET' ? data : undefined,
    };

    // Make the API request
    const response = await axiosInstance.request<ApiResponse<T>>(requestConfig);

    // Transform successful response to standard format
    return {
      success: true,
      message: response.data.message || 'Request successful',
      data: response.data.data,
      request_id: response.headers['x-request-id'] || response.data.request_id
    };
  } catch (error) {
    // Handle API errors
    return handleApiError(error as AxiosError);
  }
};

/**
 * Handles API errors and transforms them into standardized error responses
 * @param error - Axios error object
 * @returns Standardized API error response
 */
export const handleApiError = (error: AxiosError): ApiResponse<null> => {
  // Extract error details from response
  const errorResponse = error.response?.data as ApiError;
  const requestId = error.response?.headers['x-request-id'] || 
                   errorResponse?.request_id ||
                   'unknown';

  // Handle different error scenarios
  if (error.response) {
    // Server responded with error status
    return {
      success: false,
      message: errorResponse?.message || 'An error occurred while processing your request',
      data: null,
      request_id: requestId
    };
  } else if (error.request) {
    // Request made but no response received
    return {
      success: false,
      message: 'No response received from server',
      data: null,
      request_id: requestId
    };
  } else {
    // Error in request configuration
    return {
      success: false,
      message: error.message || 'Error setting up the request',
      data: null,
      request_id: requestId
    };
  }
};

// Type guard to check if an error is an AxiosError
const isAxiosError = (error: any): error is AxiosError => {
  return error.isAxiosError === true;
};

/**
 * Type guard to check if a response matches the ApiResponse interface
 * @param response - Response to check
 * @returns boolean indicating if response matches ApiResponse interface
 */
const isApiResponse = <T>(response: any): response is ApiResponse<T> => {
  return (
    response !== null &&
    typeof response === 'object' &&
    'success' in response &&
    'message' in response &&
    'data' in response
  );
};

/**
 * Utility function to build URL with path parameters
 * @param endpoint - Base endpoint with parameter placeholders
 * @param params - Object containing parameter values
 * @returns Formatted URL with replaced parameters
 */
const buildUrl = (endpoint: string, params: Record<string, string>): string => {
  let url = endpoint;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, encodeURIComponent(value));
  });
  return url;
};

/**
 * Utility function to handle request retries with exponential backoff
 * @param fn - Async function to retry
 * @param retries - Number of retries remaining
 * @param delay - Current delay in milliseconds
 * @returns Promise resolving to function result
 */
const withRetry = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0 || !isAxiosError(error) || error.response?.status !== 429) {
      throw error;
    }

    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
};