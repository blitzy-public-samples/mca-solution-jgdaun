/**
 * LoginForm Component
 * Implements JWT-based authentication with secure credential handling and validation
 * 
 * Requirements implemented:
 * - API Authentication (system_design/api_design/api_authentication)
 * - Authentication Flow (security_considerations/authentication_and_authorization/authentication_flow)
 */

import React, { useState, useEffect } from 'react'; // v18.2.0
import useAuth from '../../hooks/useAuth';
import { login } from '../../services/auth';
import { validateEmail } from '../../utils/validation';
import Input from '../common/Input';
import Button from '../common/Button';

interface FormState {
  email: string;
  password: string;
}

interface ValidationErrors {
  email?: string;
  password?: string;
  general?: string;
}

/**
 * LoginForm component that handles user authentication
 * Provides email/password input with validation and secure submission
 */
const LoginForm: React.FC = () => {
  // Form state management
  const [formData, setFormData] = useState<FormState>({
    email: '',
    password: ''
  });

  // Validation and loading states
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Authentication hook
  const { error: authError } = useAuth();

  // Clear general error when form data changes
  useEffect(() => {
    if (isSubmitted) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  }, [formData, isSubmitted]);

  /**
   * Validates form data and returns validation errors
   * @returns Object containing validation errors if any
   */
  const validateForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    return newErrors;
  };

  /**
   * Handles input change events
   * @param field - The form field being updated
   * @param value - The new value for the field
   */
  const handleInputChange = (field: keyof FormState) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field-specific error
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  /**
   * Handles form submission
   * Validates input and triggers authentication process
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Attempt login
    try {
      setIsLoading(true);
      await login(formData.email, formData.password);
    } catch (error) {
      setErrors({
        general: error instanceof Error 
          ? error.message 
          : 'An error occurred during login. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-6 p-8 bg-white rounded-lg shadow-md"
      noValidate
    >
      {/* Form title */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Please sign in to your account
        </p>
      </div>

      {/* Email input */}
      <Input
        id="email"
        name="email"
        type="email"
        label="Email address"
        value={formData.email}
        onChange={handleInputChange('email')}
        error={errors.email}
        required
        validationRule={{
          type: 'email',
          message: 'Please enter a valid email address'
        }}
        disabled={isLoading}
      />

      {/* Password input */}
      <Input
        id="password"
        name="password"
        type="password"
        label="Password"
        value={formData.password}
        onChange={handleInputChange('password')}
        error={errors.password}
        required
        validationRule={{
          type: 'required',
          message: 'Password is required'
        }}
        disabled={isLoading}
      />

      {/* Error messages */}
      {(errors.general || authError) && (
        <div 
          className="p-3 text-sm text-red-600 bg-red-50 rounded-md"
          role="alert"
        >
          {errors.general || authError}
        </div>
      )}

      {/* Submit button */}
      <Button
        label="Sign in"
        onClick={handleSubmit}
        loading={isLoading}
        disabled={isLoading}
        variant="primary"
        className="w-full"
      />

      {/* Additional links */}
      <div className="text-center text-sm">
        <a 
          href="/forgot-password"
          className="text-blue-600 hover:text-blue-700 font-medium"
          tabIndex={isLoading ? -1 : 0}
        >
          Forgot your password?
        </a>
      </div>
    </form>
  );
};

export default LoginForm;