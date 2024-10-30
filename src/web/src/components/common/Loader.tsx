// React 18.2.0
import React from 'react';
// classnames 2.3.2 - Utility for conditional class name joining
import classNames from 'classnames';
// Import required CSS classes
import '../../styles/index.css';

interface LoaderProps {
  /**
   * When true, displays the loader with a full-screen overlay
   * @default false
   */
  overlay?: boolean;
  /**
   * Controls the size of the loader - 'small', 'medium', or 'large'
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Additional CSS classes to apply to the loader container
   */
  className?: string;
}

/**
 * A reusable loading indicator component that provides visual feedback during 
 * asynchronous operations across the application.
 * 
 * @component
 * @implements {React.FC<LoaderProps>}
 */
const Loader: React.FC<LoaderProps> = ({
  overlay = false,
  size = 'medium',
  className,
}) => {
  // Define size-specific dimensions and styles
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4',
  };

  // Base spinner classes
  const spinnerClasses = classNames(
    'inline-block rounded-full border-solid',
    'border-gray-200 border-t-primary',
    'animate-spin',
    sizeClasses[size],
  );

  // Container classes
  const containerClasses = classNames(
    'flex items-center justify-center',
    className
  );

  // If overlay is true, render with full-screen overlay
  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-50 flex items-center justify-center">
        <div className={containerClasses}>
          <div className={spinnerClasses} role="status" aria-label="Loading">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Regular loader without overlay
  return (
    <div className={containerClasses}>
      <div className={spinnerClasses} role="status" aria-label="Loading">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

// Default export for the Loader component
export default Loader;