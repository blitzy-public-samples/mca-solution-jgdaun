/// <reference types="vite/client" />

/**
 * Type declarations for Vite environment variables used throughout the frontend application
 * This ensures type safety and proper IntelliSense support for all environment variables
 * 
 * @remarks
 * - All environment variables must be prefixed with VITE_ to be exposed to the client
 * - Values are injected at build time from .env files
 */

interface ImportMetaEnv {
  /**
   * Base URL for API requests
   * Used for configuring axios/fetch base URL in api.ts
   * @example 'https://api.example.com/v1'
   */
  readonly VITE_API_BASE_URL: string;

  /**
   * Application title used in HTML title and UI components
   * @example 'Document Processing System'
   */
  readonly VITE_APP_TITLE: string;

  /**
   * API request timeout in milliseconds
   * Used to configure axios/fetch timeout settings
   * @example 30000
   */
  readonly VITE_API_TIMEOUT: number;

  /**
   * Application version for tracking builds and releases
   * @example '1.0.0'
   */
  readonly VITE_APP_VERSION: string;

  /**
   * Current environment name for conditional logic and feature flags
   * Used to enable/disable features based on environment
   */
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production';

  /**
   * Feature flag for enabling mock API responses
   * Used during development and testing
   */
  readonly VITE_ENABLE_MOCK_API: boolean;
}

/**
 * Extends the ImportMeta interface to include our custom env variables
 * This provides proper typing when using import.meta.env
 */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Make the ImportMetaEnv available globally
declare global {
  interface Window {
    env: ImportMetaEnv;
  }
}

// Export the ImportMetaEnv interface for use in other files
export type { ImportMetaEnv };