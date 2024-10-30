/**
 * Constants Index
 * This file serves as a central hub for exporting all constants used throughout the frontend application.
 * It aggregates and re-exports constants for API endpoints, routes, status codes, and other configuration values
 * to ensure consistency and maintainability across the application.
 * 
 * Requirements implemented:
 * - User Interface Design - Main Dashboard Components (system_design/user_interface_design/main_dashboard_components)
 * - RESTful Endpoints (system_design/api_design/restful_endpoints)
 * - Document Processing Flow (system_components_architecture/data_flow_diagrams/document_processing_flow)
 */

// Import API-related constants
import {
  API_VERSION,
  API_ENDPOINTS,
  AUTH,
  USERS,
  APPLICATIONS,
  DOCUMENTS,
  WEBHOOKS,
  EMAIL,
  OCR
} from './api';

// Import route constants
import {
  HOME_ROUTE,
  LOGIN_ROUTE,
  REGISTER_ROUTE,
  DASHBOARD_ROUTE,
  DOCUMENTS_ROUTE,
  DOCUMENT_DETAILS_ROUTE,
  WEBHOOKS_ROUTE,
  SETTINGS_ROUTE,
  REPORTS_ROUTE
} from './routes';

// Import status code constants
import {
  STATUS_NEW,
  STATUS_PROCESSING,
  STATUS_COMPLETE,
  STATUS_FAILED
} from './status';

// Re-export API version and endpoints
export {
  API_VERSION,
  AUTH,
  USERS,
  APPLICATIONS,
  DOCUMENTS,
  WEBHOOKS,
  EMAIL,
  OCR
};

// Re-export route constants for consistent navigation
export {
  HOME_ROUTE,
  LOGIN_ROUTE,
  REGISTER_ROUTE,
  DASHBOARD_ROUTE,
  DOCUMENTS_ROUTE,
  DOCUMENT_DETAILS_ROUTE,
  WEBHOOKS_ROUTE,
  SETTINGS_ROUTE,
  REPORTS_ROUTE
};

// Re-export status codes for document processing states
export {
  STATUS_NEW,
  STATUS_PROCESSING,
  STATUS_COMPLETE,
  STATUS_FAILED
};

/**
 * Consolidated exports object containing all constants
 * This provides a single point of access for all application constants
 * while maintaining the ability to import individual constants as needed
 */
export const Constants = Object.freeze({
  // API-related constants
  API: {
    VERSION: API_VERSION,
    ENDPOINTS: API_ENDPOINTS
  },

  // Route constants for application navigation
  ROUTES: {
    HOME: HOME_ROUTE,
    LOGIN: LOGIN_ROUTE,
    REGISTER: REGISTER_ROUTE,
    DASHBOARD: DASHBOARD_ROUTE,
    DOCUMENTS: DOCUMENTS_ROUTE,
    DOCUMENT_DETAILS: DOCUMENT_DETAILS_ROUTE,
    WEBHOOKS: WEBHOOKS_ROUTE,
    SETTINGS: SETTINGS_ROUTE,
    REPORTS: REPORTS_ROUTE
  },

  // Status codes for document processing states
  STATUS: {
    NEW: STATUS_NEW,
    PROCESSING: STATUS_PROCESSING,
    COMPLETE: STATUS_COMPLETE,
    FAILED: STATUS_FAILED
  }
}) as const;

// Default export for convenient importing of all constants
export default Constants;