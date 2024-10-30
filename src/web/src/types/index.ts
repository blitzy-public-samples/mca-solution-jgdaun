/**
 * @file Type Definitions Index
 * This file serves as the central entry point for all TypeScript types and interfaces
 * used throughout the frontend application. It consolidates and re-exports type definitions
 * to ensure type safety and consistency across the system.
 */

// Import types from API module
// Implements REQ-API-1: Standard API Response Structure
export type {
  ApiResponse,
  PaginatedApiResponse,
  PaginationMetadata,
  ApiError,
  ErrorDetails,
  ApiRequestConfig
} from './api';

// Import types from Document module
// Implements REQ-DOC-1: Document Status Tracking
// Implements REQ-DOC-2: Document Metadata Structure
// Implements REQ-DOC-3: Document Data Model
export type {
  Document,
  DocumentMetadata
} from './document';

export { DocumentStatus } from './document';

// Import types from User module
// Implements REQ-SEC-1: Role-Based Access Control
// Implements REQ-SEC-2: Role-Based Permissions
// Implements REQ-SEC-3: User Data Structure
export type {
  User,
  UserPermissions,
  UserApiResponse,
  UserListApiResponse
} from './user';

export {
  UserRole,
  DEFAULT_ROLE_PERMISSIONS,
  isValidUserRole,
  getRolePermissions
} from './user';

// Import types from Webhook module
// Implements system_design.api_design.webhook_payload_structure specification
export type {
  WebhookPayload,
  WebhookData,
  WebhookMetadata,
  WebhookResponse,
  WebhookListResponse
} from './webhook';

/**
 * Type guard to check if a response is paginated
 * @param response - The API response to check
 * @returns boolean indicating if the response is paginated
 */
export function isPaginatedResponse<T>(
  response: ApiResponse<T> | PaginatedApiResponse<T>
): response is PaginatedApiResponse<T> {
  return 'pagination' in response;
}

/**
 * Type guard to check if a response contains an error
 * @param response - The API response to check
 * @returns boolean indicating if the response contains an error
 */
export function isErrorResponse(
  response: ApiResponse<any> | ApiError
): response is ApiError {
  return 'code' in response && 'details' in response;
}