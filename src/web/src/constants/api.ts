/**
 * API Constants
 * This file centralizes all API endpoint definitions for the frontend application
 * to ensure consistency and maintainability across the codebase.
 * 
 * Requirements implemented:
 * - RESTful Endpoints (system_design/api_design/restful_endpoints)
 * - API Authentication (system_design/api_design/api_authentication)
 */

/**
 * Base API version for all endpoints
 * Used to ensure consistent versioning across the application
 */
export const API_VERSION = '/api/v1';

/**
 * API endpoint constants organized by domain/feature
 * Each section contains related endpoints for specific functionality
 */
export const API_ENDPOINTS = {
  /**
   * Authentication-related endpoints
   * Handles user authentication flows including login, registration,
   * password management, and session management
   */
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
    REFRESH_TOKEN: '/api/v1/auth/refresh',
    LOGOUT: '/api/v1/auth/logout',
  },

  /**
   * User management endpoints
   * Handles user profile and settings management
   */
  USERS: {
    BASE: '/api/v1/users',
    PROFILE: '/api/v1/users/profile',
    SETTINGS: '/api/v1/users/settings',
  },

  /**
   * Application management endpoints
   * Handles CRUD operations for applications and their associated documents
   */
  APPLICATIONS: {
    BASE: '/api/v1/applications',
    DETAILS: '/api/v1/applications/:id',
    DOCUMENTS: '/api/v1/applications/:id/documents',
    STATUS: '/api/v1/applications/:id/status',
  },

  /**
   * Document management endpoints
   * Handles document operations including upload, download, processing, and validation
   */
  DOCUMENTS: {
    BASE: '/api/v1/documents',
    DETAILS: '/api/v1/documents/:id',
    DOWNLOAD: '/api/v1/documents/:id/download',
    PROCESS: '/api/v1/documents/:id/process',
    VALIDATE: '/api/v1/documents/:id/validate',
  },

  /**
   * Webhook management endpoints
   * Handles webhook configuration, monitoring, and testing
   */
  WEBHOOKS: {
    BASE: '/api/v1/webhooks',
    DETAILS: '/api/v1/webhooks/:id',
    LOGS: '/api/v1/webhooks/:id/logs',
    TEST: '/api/v1/webhooks/:id/test',
  },

  /**
   * Email management endpoints
   * Handles email configuration, templates, and logging
   */
  EMAIL: {
    BASE: '/api/v1/email',
    SETTINGS: '/api/v1/email/settings',
    TEMPLATES: '/api/v1/email/templates',
    LOGS: '/api/v1/email/logs',
  },

  /**
   * OCR (Optical Character Recognition) endpoints
   * Handles document processing status, results, and confidence scores
   */
  OCR: {
    BASE: '/api/v1/ocr',
    STATUS: '/api/v1/ocr/:id/status',
    RESULTS: '/api/v1/ocr/:id/results',
    CONFIDENCE: '/api/v1/ocr/:id/confidence',
  },
} as const;

// Type-safe, readonly API endpoints to prevent accidental modifications
Object.freeze(API_ENDPOINTS);