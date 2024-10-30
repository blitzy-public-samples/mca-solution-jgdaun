/**
 * Route Constants
 * This file centralizes all route path definitions for the frontend application
 * to ensure consistent navigation and routing throughout the application.
 * 
 * Requirements implemented:
 * - User Interface Design - Main Dashboard Components
 * - Dashboard Layout
 */

import { APPLICATIONS, DOCUMENTS, WEBHOOKS } from './api';

/**
 * Authentication Routes
 * Routes related to user authentication and account management
 */
export const LOGIN_ROUTE = '/login';
export const REGISTER_ROUTE = '/register';
export const FORGOT_PASSWORD_ROUTE = '/forgot-password';
export const RESET_PASSWORD_ROUTE = '/reset-password';

/**
 * Main Application Routes
 * Primary navigation routes for the application dashboard and main features
 */
export const HOME_ROUTE = '/';
export const DASHBOARD_ROUTE = '/dashboard';

/**
 * Document Management Routes
 * Routes for document listing and detailed views
 * Aligned with DOCUMENTS API endpoints for consistency
 */
export const DOCUMENTS_ROUTE = '/documents';
export const DOCUMENT_DETAILS_ROUTE = '/documents/:id';

/**
 * Webhook Management Routes
 * Routes for webhook configuration and monitoring
 * Aligned with WEBHOOKS API endpoints for consistency
 */
export const WEBHOOKS_ROUTE = '/webhooks';
export const WEBHOOK_DETAILS_ROUTE = '/webhooks/:id';

/**
 * Settings Routes
 * Routes for various application settings and user preferences
 * Based on the dashboard layout specification
 */
export const SETTINGS_ROUTE = '/settings';
export const PROFILE_ROUTE = '/settings/profile';
export const SECURITY_ROUTE = '/settings/security';
export const NOTIFICATIONS_ROUTE = '/settings/notifications';

/**
 * Analytics and Reporting Routes
 * Routes for accessing application analytics and reports
 * Specified in main dashboard components
 */
export const REPORTS_ROUTE = '/reports';

/**
 * Error and Fallback Routes
 * Routes for handling undefined paths and error states
 */
export const NOT_FOUND_ROUTE = '*';

/**
 * Consolidated Routes Object
 * Exports all routes as a single object for convenient imports
 * All routes are made read-only to prevent accidental modifications
 */
export const ROUTES = Object.freeze({
    HOME_ROUTE,
    LOGIN_ROUTE,
    REGISTER_ROUTE,
    FORGOT_PASSWORD_ROUTE,
    RESET_PASSWORD_ROUTE,
    DASHBOARD_ROUTE,
    DOCUMENTS_ROUTE,
    DOCUMENT_DETAILS_ROUTE,
    WEBHOOKS_ROUTE,
    WEBHOOK_DETAILS_ROUTE,
    SETTINGS_ROUTE,
    REPORTS_ROUTE,
    PROFILE_ROUTE,
    SECURITY_ROUTE,
    NOTIFICATIONS_ROUTE,
    NOT_FOUND_ROUTE
});