/**
 * Main entry point for the React application
 * Implements core frontend architecture and dashboard layout requirements
 * 
 * Requirements implemented:
 * - Frontend Architecture (system_architecture.component_details.frontend_layer)
 * - Dashboard Layout (system_design.user_interface_design.dashboard_layout)
 * - Authentication Flow (security_considerations.authentication_and_authorization.authentication_flow)
 */

import React, { Suspense, useEffect } from 'react'; // ^18.2.0
import { Provider } from 'react-redux'; // ^8.0.5
import { CssBaseline } from '@mui/material'; // ^5.11.0
import { ErrorBoundary } from 'react-error-boundary'; // ^4.0.0

// Internal imports
import AppRoutes from './routes/index';
import { configureAppStore } from './store/index';
import { initializeTheme } from './config/theme';
import useAuth from './hooks/useAuth';

// Initialize Redux store
const store = configureAppStore();

/**
 * Error fallback component for the ErrorBoundary
 */
const ErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
      Something went wrong
    </h2>
    <pre className="text-sm text-red-600 bg-red-50 p-4 rounded-lg">
      {error.message}
    </pre>
    <button
      onClick={() => window.location.reload()}
      className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
    >
      Reload Application
    </button>
  </div>
);

/**
 * Loading fallback component for Suspense
 */
const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

/**
 * AuthenticationWrapper component to handle auth state
 */
const AuthenticationWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingFallback />;
  }

  return <>{children}</>;
};

/**
 * Main App component that initializes the application
 * Implements the core frontend architecture with proper provider wrapping
 */
const App: React.FC = () => {
  // Initialize theme on component mount
  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Provider store={store}>
        <CssBaseline />
        <Suspense fallback={<LoadingFallback />}>
          <AuthenticationWrapper>
            <AppRoutes />
          </AuthenticationWrapper>
        </Suspense>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;