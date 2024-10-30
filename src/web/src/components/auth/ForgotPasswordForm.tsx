/**
 * ForgotPasswordForm Component
 * Implements the password reset request functionality with email validation and error handling
 * 
 * Requirements implemented:
 * - User Interface Design (system_design/user_interface_design/application_details_view)
 * - Authentication Flow (security_considerations/authentication_and_authorization/authentication_flow)
 */

import React, { useState } from 'react'; // v18.2.0
import useAuth from '../../hooks/useAuth';
import { validateEmail } from '../../utils/validation';
import { requestPasswordReset } from '../../services/auth';
import Input from '../common/Input';
import Button from '../common/Button';

const ForgotPasswordForm: React.FC = () => {
  // State management for form
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Get auth context
  const { isLoading: authLoading } = useAuth();

  /**
   * Handles email input changes
   * Clears any existing errors when user starts typing
   */
  const handleEmailChange = (value: string) => {
    setEmail(value);
    setError('');
    setSuccess(false);
  };

  /**
   * Validates email input using RFC 5322 compliant validation
   * @returns boolean indicating if email is valid
   */
  const validateEmailInput = (): boolean => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  /**
   * Handles form submission for password reset request
   * Implements the password reset flow from authentication_flow specification
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setError('');
    setSuccess(false);
    
    // Validate email
    if (!validateEmailInput()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Request password reset
      await requestPasswordReset(email.trim());
      
      // Show success message
      setSuccess(true);
      setEmail('');
      
    } catch (err) {
      // Handle specific error cases
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred while requesting password reset. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-6"
      noValidate
    >
      {/* Form title */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Forgot Password
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
      </div>

      {/* Email input field */}
      <Input
        id="email"
        name="email"
        type="email"
        label="Email Address"
        value={email}
        onChange={handleEmailChange}
        placeholder="Enter your email address"
        error={error}
        required
        disabled={loading || authLoading}
        validationRule={{
          type: 'email',
          message: 'Please enter a valid email address'
        }}
      />

      {/* Success message */}
      {success && (
        <div
          className="p-4 rounded-md bg-green-50 text-green-800"
          role="alert"
        >
          <p className="text-sm">
            If an account exists with this email address, you will receive password reset instructions shortly.
          </p>
        </div>
      )}

      {/* Submit button */}
      <Button
        label="Reset Password"
        onClick={handleSubmit}
        loading={loading || authLoading}
        disabled={loading || authLoading}
        className="w-full"
        variant="primary"
        size="large"
      />

      {/* Back to login link */}
      <div className="text-center">
        <a
          href="/login"
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          Back to Login
        </a>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;