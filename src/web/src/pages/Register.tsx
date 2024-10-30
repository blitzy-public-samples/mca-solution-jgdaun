/**
 * Register Page Component
 * Implements the user registration page with secure registration flow,
 * form validation, and JWT-based authentication.
 * 
 * Requirements implemented:
 * - API Authentication (system_design/api_design/api_authentication)
 * - Authentication Flow (security_considerations/authentication_and_authorization/authentication_flow)
 */

import React, { useState, useEffect } from 'react'; // v18.2.0
import { useNavigate } from 'react-router-dom'; // v6.4.0
import RegisterForm from '../components/auth/RegisterForm';
import useAuth from '../hooks/useAuth';
import { validateEmail } from '../utils/validation';

/**
 * RegisterPage component that manages the registration flow and user feedback
 */
const RegisterPage: React.FC = () => {
  // Navigation hook for redirecting after registration
  const navigate = useNavigate();
  
  // Authentication context
  const { isAuthenticated } = useAuth();
  
  // Local state for registration status
  const [registrationStatus, setRegistrationStatus] = useState<{
    success: boolean;
    message: string | null;
  }>({
    success: false,
    message: null
  });

  /**
   * Handles successful registration
   * Implements the post-registration flow from authentication_flow specification
   */
  const handleRegistrationSuccess = () => {
    setRegistrationStatus({
      success: true,
      message: 'Registration successful! Redirecting to dashboard...'
    });

    // Redirect to dashboard after a brief delay
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  /**
   * Handles registration errors
   * @param error - Error message from registration attempt
   */
  const handleRegistrationError = (error: string) => {
    setRegistrationStatus({
      success: false,
      message: error
    });
  };

  // Redirect authenticated users away from registration page
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Reset registration status when component unmounts
  useEffect(() => {
    return () => {
      setRegistrationStatus({
        success: false,
        message: null
      });
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <a
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              sign in to your existing account
            </a>
          </p>
        </div>

        {/* Status Messages */}
        {registrationStatus.message && (
          <div
            className={`p-4 rounded-md ${
              registrationStatus.success
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
            role="alert"
          >
            <p className="text-sm font-medium">
              {registrationStatus.message}
            </p>
          </div>
        )}

        {/* Registration Form */}
        <RegisterForm
          onSuccess={handleRegistrationSuccess}
          onError={handleRegistrationError}
        />

        {/* Privacy Policy and Terms */}
        <div className="text-center text-xs text-gray-500 mt-4">
          <p>
            By registering, you agree to our{' '}
            <a
              href="/terms"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="/privacy"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;