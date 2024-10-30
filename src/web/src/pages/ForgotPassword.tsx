/**
 * ForgotPassword Page Component
 * Implements the Forgot Password page with secure password reset request functionality
 * 
 * Requirements implemented:
 * - User Interface Design (system_design/user_interface_design/application_details_view)
 * - Authentication Flow (security_considerations/authentication_and_authorization/authentication_flow)
 */

import React, { useEffect } from 'react'; // v18.2.0
import { useNavigate } from 'react-router-dom'; // v6.4.0
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import useAuth from '../hooks/useAuth';
import { configureAxios } from '../config/api';

// Configure axios instance with authentication and rate limiting
const api = configureAxios();

/**
 * ForgotPasswordPage component that provides the interface for users to request
 * password resets with proper validation and error handling
 */
const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Don't render the form while checking authentication status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Logo and page header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          className="mx-auto h-12 w-auto"
          src="/logo.svg"
          alt="Application Logo"
        />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <button
            onClick={() => navigate('/login')}
            className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline transition ease-in-out duration-150"
          >
            return to login
          </button>
        </p>
      </div>

      {/* Main content area */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Password reset form component */}
          <ForgotPasswordForm />
        </div>
      </div>

      {/* Footer section */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Need help?{' '}
          <a
            href="/support"
            className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline transition ease-in-out duration-150"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;