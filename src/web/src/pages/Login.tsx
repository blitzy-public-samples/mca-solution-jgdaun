/**
 * Login Page Component
 * Implements the authentication entry point with JWT token-based authentication
 * 
 * Requirements implemented:
 * - API Authentication (system_design/api_design/api_authentication)
 * - Authentication Flow (security_considerations/authentication_and_authorization/authentication_flow)
 */

import React, { useEffect } from 'react'; // v18.2.0
import { Navigate } from 'react-router-dom'; // ^6.0.0
import LoginForm from '../components/auth/LoginForm';
import useAuth from '../hooks/useAuth';

/**
 * LoginPage component that serves as the authentication entry point
 * Handles authentication state and redirects authenticated users
 */
const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect authenticated users to dashboard
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and branding section */}
        <div className="text-center">
          <img
            className="mx-auto h-12 w-auto"
            src="/assets/images/logo.svg"
            alt="Application logo"
          />
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          // Login form component
          <LoginForm />
        )}

        {/* Registration link */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;