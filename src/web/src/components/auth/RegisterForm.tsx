/**
 * RegisterForm Component
 * Implements the user registration form interface with secure registration flow,
 * email and password validation, and integration with authentication service.
 * 
 * Requirements implemented:
 * - API Authentication (system_design/api_design/api_authentication)
 * - Authentication Flow (security_considerations/authentication_and_authorization/authentication_flow)
 */

import React, { useState, useEffect } from 'react'; // v18.2.0
import { validateEmail } from '../../utils/validation';
import { register } from '../../services/auth';
import useAuth from '../../hooks/useAuth';
import Input from '../common/Input';
import Button from '../common/Button';

// Password validation constants
const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
}

interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

/**
 * RegisterForm component that handles user registration with validation
 * and secure authentication flow.
 */
const RegisterForm: React.FC = () => {
  // Form state management
  const [formData, setFormData] = useState<FormState>({
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Validation and UI state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Get authentication context
  const { isAuthenticated } = useAuth();

  /**
   * Validates password against security requirements
   * @param password - Password to validate
   * @returns Validation error message or empty string if valid
   */
  const validatePassword = (password: string): string => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
    }
    if (!PASSWORD_REGEX.test(password)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
    }
    return '';
  };

  /**
   * Validates all form fields
   * @returns Object containing validation errors
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
    const passwordError = validatePassword(formData.password);
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (passwordError) {
      newErrors.password = passwordError;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  /**
   * Handles input field changes
   * @param field - Form field name
   * @param value - New field value
   */
  const handleInputChange = (field: keyof FormState) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  /**
   * Handles form submission
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

    setIsLoading(true);
    setErrors({});

    try {
      // Attempt to register user
      await register(formData.email, formData.password);
      
      // Clear form after successful registration
      setFormData({
        email: '',
        password: '',
        confirmPassword: ''
      });
      setIsSubmitted(false);
    } catch (error) {
      // Handle registration errors
      setErrors({
        general: error instanceof Error 
          ? error.message 
          : 'An error occurred during registration. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setFormData({
        email: '',
        password: '',
        confirmPassword: ''
      });
      setErrors({});
      setIsSubmitted(false);
    }
  }, [isAuthenticated]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      setFormData({
        email: '',
        password: '',
        confirmPassword: ''
      });
      setErrors({});
      setIsSubmitted(false);
    };
  }, []);

  return (
    <form 
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-6"
      noValidate
    >
      {/* General error message */}
      {errors.general && (
        <div 
          className="p-4 bg-red-50 border border-red-200 rounded-md"
          role="alert"
        >
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      {/* Email input */}
      <Input
        id="email"
        name="email"
        type="email"
        label="Email Address"
        value={formData.email}
        onChange={handleInputChange('email')}
        error={isSubmitted ? errors.email : undefined}
        placeholder="Enter your email address"
        required
        validationRule={{
          type: 'email',
          message: 'Please enter a valid email address'
        }}
      />

      {/* Password input */}
      <Input
        id="password"
        name="password"
        type="password"
        label="Password"
        value={formData.password}
        onChange={handleInputChange('password')}
        error={isSubmitted ? errors.password : undefined}
        placeholder="Enter your password"
        required
        validationRule={{
          type: 'custom',
          validator: (value) => validatePassword(value) === '',
          message: validatePassword(formData.password)
        }}
      />

      {/* Confirm password input */}
      <Input
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        label="Confirm Password"
        value={formData.confirmPassword}
        onChange={handleInputChange('confirmPassword')}
        error={isSubmitted ? errors.confirmPassword : undefined}
        placeholder="Confirm your password"
        required
        validationRule={{
          type: 'custom',
          validator: (value) => value === formData.password,
          message: 'Passwords do not match'
        }}
      />

      {/* Submit button */}
      <Button
        label="Register"
        onClick={handleSubmit}
        loading={isLoading}
        disabled={isLoading}
        className="w-full"
        variant="primary"
        size="large"
      />
    </form>
  );
};

export default RegisterForm;