/**
 * Main entry point for the React application
 * Implements requirements from:
 * - Frontend Layer Configuration (system_architecture.component_details.frontend_layer)
 * - User Interface Design (system_design.user_interface_design.dashboard_layout)
 */

// React and ReactDOM - v18.2.0
import React from 'react';
import ReactDOM from 'react-dom/client';

// Redux Provider - v8.0.5
import { Provider } from 'react-redux';

// Error Boundary - v4.0.0
import { ErrorBoundary } from 'react-error-boundary';

// Internal imports
import App from './App';
import { configureAppStore } from './store';
import { initializeTheme } from './config/theme';

// Initialize theme settings for consistent styling
initializeTheme();

// Configure Redux store with required slices and middleware
const store = configureAppStore();

/**
 * Error fallback component for the ErrorBoundary
 * Provides a user-friendly error display with reload option
 */
const ErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
      An unexpected error occurred
    </h2>
    <pre className="text-sm text-red-600 bg-red-50 p-4 rounded-lg">
      {error.message}
    </pre>
    <button
      onClick={() => window.location.reload()}
      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Reload Application
    </button>
  </div>
);

// Get the root element for React rendering
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found in the DOM');
}

// Create React root and render the application
const root = ReactDOM.createRoot(rootElement);

// Render the application with proper provider wrapping
root.render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Provider store={store}>
        <App />
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Enable hot module replacement in development
if (import.meta.hot) {
  import.meta.hot.accept();
}