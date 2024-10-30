/**
 * Status code constants for document processing states
 * These constants are used throughout the frontend application to maintain
 * consistent status representation across all components
 * 
 * Used in:
 * - StatusFilters component for filtering documents in the main dashboard
 * - ProcessingStatus component for displaying current document state
 * - Document management interfaces for state management
 */

// Status constants representing document processing pipeline states
// from initial receipt through completion or failure
export const STATUS_NEW = 'new' as const;
export const STATUS_PROCESSING = 'processing' as const;
export const STATUS_COMPLETE = 'complete' as const;
export const STATUS_FAILED = 'failed' as const;

/**
 * Type definition for document status values
 * Ensures type safety when using status constants throughout the application
 * Used for type checking in components, services, and state management
 */
export type DocumentStatus = 
  | typeof STATUS_NEW 
  | typeof STATUS_PROCESSING 
  | typeof STATUS_COMPLETE 
  | typeof STATUS_FAILED;

/**
 * Object containing all status codes for easy import and usage
 * Primarily used in:
 * - Dashboard status filters
 * - Document processing status displays
 * - API response handling
 * - State management
 */
export const STATUS_CODES = {
  STATUS_NEW,
  STATUS_PROCESSING,
  STATUS_COMPLETE,
  STATUS_FAILED
} as const;