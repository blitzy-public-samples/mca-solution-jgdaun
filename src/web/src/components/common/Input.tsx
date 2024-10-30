/**
 * @file Input.tsx
 * A reusable, accessible, and type-safe input component that provides consistent styling,
 * validation, and error handling capabilities across the application.
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'; // v18.2.0
import classNames from 'classnames'; // v2.3.2
import { validateEmail } from '../../utils/validation';

// Types for validation rules
type ValidationRule = {
  type: 'email' | 'required' | 'custom';
  message?: string;
  validator?: (value: string) => boolean;
};

// Props interface for the Input component
interface InputProps {
  id: string;
  name: string;
  type: string;
  placeholder?: string;
  value: string;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
  className?: string;
  validationRule?: ValidationRule;
}

/**
 * Custom hook for handling input validation logic
 * @param value - Current input value
 * @param rule - Validation rule to apply
 * @returns Validation result containing isValid and errorMessage
 */
const useInputValidation = (value: string, rule?: ValidationRule) => {
  const validate = useCallback(() => {
    if (!rule) return { isValid: true, errorMessage: '' };

    switch (rule.type) {
      case 'email':
        return {
          isValid: validateEmail(value),
          errorMessage: rule.message || 'Please enter a valid email address'
        };
      case 'required':
        return {
          isValid: value.trim().length > 0,
          errorMessage: rule.message || 'This field is required'
        };
      case 'custom':
        return {
          isValid: rule.validator ? rule.validator(value) : true,
          errorMessage: rule.message || 'Invalid input'
        };
      default:
        return { isValid: true, errorMessage: '' };
    }
  }, [value, rule]);

  const [validation, setValidation] = useState(validate());

  useEffect(() => {
    setValidation(validate());
  }, [value, validate]);

  return validation;
};

/**
 * Input component that renders an accessible, validated input field with error handling
 * Implements standardized input fields for user interaction within dashboard components
 */
const Input: React.FC<InputProps> = ({
  id,
  name,
  type,
  placeholder,
  value,
  label,
  error,
  required = false,
  disabled = false,
  onChange,
  onBlur,
  className,
  validationRule
}) => {
  // Create ref for input element
  const inputRef = useRef<HTMLInputElement>(null);

  // Get validation status
  const { isValid, errorMessage } = useInputValidation(value, validationRule);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  // Handle blur event
  const handleBlur = () => {
    if (onBlur) {
      onBlur();
    }
  };

  // Focus input when error occurs
  useEffect(() => {
    if (error && inputRef.current) {
      inputRef.current.focus();
    }
  }, [error]);

  // Generate unique IDs for accessibility
  const errorId = `${id}-error`;
  const labelId = `${id}-label`;

  return (
    <div className={classNames('flex flex-col gap-1', className)}>
      {/* Label */}
      {label && (
        <label
          id={labelId}
          htmlFor={id}
          className={classNames(
            'text-sm font-medium text-gray-700',
            disabled && 'text-gray-400'
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          aria-invalid={!isValid || !!error}
          aria-describedby={(!isValid || error) ? errorId : undefined}
          aria-labelledby={label ? labelId : undefined}
          className={classNames(
            'w-full px-4 py-2 border rounded-md shadow-sm text-sm',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'transition duration-150 ease-in-out',
            {
              'border-gray-300 focus:border-blue-500 focus:ring-blue-500': isValid && !error,
              'border-red-300 focus:border-red-500 focus:ring-red-500': (!isValid || error),
              'bg-gray-50 text-gray-500 cursor-not-allowed': disabled,
              'pr-10': !isValid || error // Space for error icon
            }
          )}
        />

        {/* Error icon */}
        {(!isValid || error) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Error message */}
      {(error || (!isValid && errorMessage)) && (
        <p
          id={errorId}
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {error || errorMessage}
        </p>
      )}
    </div>
  );
};

export default Input;