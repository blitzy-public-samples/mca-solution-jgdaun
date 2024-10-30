/**
 * @file API Types and Interfaces
 * This file defines TypeScript types and interfaces for API-related data structures
 * within the frontend application. These types ensure type safety and consistency
 * when handling API responses, requests, and error handling across the application.
 */

/**
 * Represents the structure of a standard API response within the application.
 * Implements REQ-API-1: Standard API Response Structure
 * @template T - The type of data contained in the response
 */
export interface ApiResponse<T = any> {
  /** Indicates if the API request was successful */
  success: boolean;
  /** Human-readable message describing the response */
  message: string;
  /** The actual response data */
  data: T;
  /** Unique identifier for tracking the request (optional) */
  request_id?: string;
}

/**
 * Represents the structure of a paginated API response.
 * Implements REQ-API-2: Paginated Response Structure
 * @template T - The type of items in the paginated data array
 */
export interface PaginatedApiResponse<T = any> {
  /** Indicates if the API request was successful */
  success: boolean;
  /** Human-readable message describing the response */
  message: string;
  /** Array of paginated items */
  data: T[];
  /** Pagination metadata */
  pagination: PaginationMetadata;
  /** Unique identifier for tracking the request (optional) */
  request_id?: string;
}

/**
 * Represents pagination metadata for paginated API responses.
 * Implements REQ-API-3: Pagination Metadata Structure
 */
export interface PaginationMetadata {
  /** Total number of items across all pages */
  total: number;
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages available */
  totalPages: number;
}

/**
 * Represents an API error response following the system's error response specification.
 * Implements REQ-API-4: Error Response Structure
 */
export interface ApiError {
  /** Error code identifying the type of error */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Detailed error information */
  details: ErrorDetails;
  /** Unique identifier for tracking the error */
  request_id: string;
}

/**
 * Represents detailed error information for specific fields.
 * Implements REQ-API-5: Field-level Error Details
 */
export interface ErrorDetails {
  /** The field that caused the error */
  field: string;
  /** The reason for the error */
  reason: string;
}

/**
 * Represents configuration options for API requests.
 * Implements REQ-API-6: API Request Configuration
 */
export interface ApiRequestConfig {
  /** Base URL for API requests */
  baseURL: string;
  /** Custom headers to be included in requests */
  headers: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout: number;
}