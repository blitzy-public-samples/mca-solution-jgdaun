// React 18.2.0
import React from 'react';
// classnames 2.3.2 - Utility for conditional class name joining
import classNames from 'classnames';

// Interface defining the structure of an option in the select component
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Props interface for the Select component
export interface SelectProps {
  options: SelectOption[];
  onChange: (value: string) => void;
  defaultValue?: string;
  className?: string;
  id?: string;
  name?: string;
  'aria-label'?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * A customizable select component that follows WAI-ARIA guidelines and uses Tailwind CSS for styling.
 * This component is used throughout the dashboard for status filters and other dropdown selections.
 * 
 * @param props - The props that conform to the SelectProps interface
 * @returns A styled and accessible select element
 */
export const Select = ({
  options,
  onChange,
  defaultValue = '',
  className = '',
  id,
  name,
  'aria-label': ariaLabel,
  disabled = false,
  required = false,
}: SelectProps): JSX.Element => {
  // Combine default Tailwind classes with any custom classes passed via props
  const selectClasses = classNames(
    // Base styles
    'block w-full rounded-md',
    // Border and background styles
    'border-gray-300 bg-white',
    // Text styles
    'text-base text-gray-900',
    // Focus states
    'focus:border-blue-500 focus:ring-blue-500 focus:ring-1',
    // Disabled state
    disabled && 'bg-gray-100 cursor-not-allowed opacity-75',
    // Custom classes
    className
  );

  /**
   * Handle the change event of the select element
   * @param event - The change event from the select element
   */
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <select
      id={id}
      name={name}
      className={selectClasses}
      onChange={handleChange}
      defaultValue={defaultValue}
      aria-label={ariaLabel}
      disabled={disabled}
      required={required}
      // Additional ARIA attributes for accessibility
      role="combobox"
      aria-required={required}
      aria-disabled={disabled}
    >
      {/* Default empty option if no default value is provided */}
      {!defaultValue && (
        <option value="" disabled>
          Select an option
        </option>
      )}
      
      {/* Map through and render all provided options */}
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};