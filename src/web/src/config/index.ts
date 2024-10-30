/**
 * Central Configuration Index
 * Initializes and exports essential application configurations including API client setup,
 * theme management, and global application settings.
 * 
 * Requirements implemented:
 * - User Interface Design - Main Dashboard Components
 * - API Authentication
 * - System Architecture Components - Frontend Layer
 * 
 * @version 1.0.0
 */

import { configureAxios } from './api';
import { initializeTheme, getThemeColors } from './theme';

// Global application version and environment settings
// Implements frontend layer configuration requirements
export const APP_VERSION = process.env.REACT_APP_VERSION || '1.0.0';
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Initializes all application configurations
 * - Sets up API client with authentication and rate limiting
 * - Configures theme for consistent UI styling
 * - Establishes global error handlers
 * - Configures environment-specific settings
 */
export const initializeApp = (): void => {
  try {
    // Initialize API configuration with authentication
    // Implements API Authentication requirements
    configureAxios();

    // Initialize theme configuration
    // Implements UI Design requirements for dashboard components
    initializeTheme();

    // Configure global error handlers
    window.onerror = (message, source, lineno, colno, error) => {
      // Log errors in production, console in development
      if (IS_PRODUCTION) {
        // Could integrate with error tracking service here
        console.error('Global error:', {
          message,
          source,
          lineno,
          colno,
          error,
          version: APP_VERSION
        });
      } else {
        console.warn('Development error:', message);
      }
      return false;
    };

    // Configure unhandled promise rejection handler
    window.onunhandledrejection = (event) => {
      if (IS_PRODUCTION) {
        console.error('Unhandled promise rejection:', event.reason);
      } else {
        console.warn('Unhandled promise rejection (dev):', event.reason);
      }
    };

    // Environment-specific configurations
    if (IS_PRODUCTION) {
      // Disable console logs in production
      console.log = () => {};
      console.debug = () => {};
    } else {
      // Development-specific settings
      console.info(`Running in development mode - Version ${APP_VERSION}`);
    }

  } catch (error) {
    console.error('Failed to initialize application:', error);
    // In production, might want to show a user-friendly error page
    if (IS_PRODUCTION) {
      document.body.innerHTML = '<div>Application failed to initialize. Please try refreshing the page.</div>';
    }
    throw error; // Re-throw to prevent app from running in broken state
  }
};

// Export configured API client
// Implements API Authentication requirements
export { configureAxios };

// Export theme configuration
// Implements UI Design requirements for consistent styling
export { initializeTheme, getThemeColors };