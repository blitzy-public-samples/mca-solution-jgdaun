// React 18.2.0
import React, { useState, useEffect, ReactNode } from 'react';
// classnames 2.3.2
import classNames from 'classnames';
import Button from './Button';
import Loader from './Loader';
import { capitalizeFirstLetter } from '../../utils/format';

interface CardProps {
  /** Title displayed in the card header */
  title: string;
  /** Content to be rendered inside the card */
  children: ReactNode;
  /** Optional callback for closing/removing the card */
  onClose?: () => void;
  /** Controls the loading state of the card */
  isLoading?: boolean;
  /** Additional CSS classes to apply to the card */
  className?: string;
  /** Visual style variant of the card */
  variant?: 'default' | 'primary' | 'secondary' | 'outline';
}

/**
 * A reusable Card component that provides a consistent interface for displaying
 * content in a card layout across the application.
 * 
 * @implements Main Dashboard Components requirement for card-based content display
 * @implements Dashboard Layout requirement for organizing application content
 */
const Card: React.FC<CardProps> = ({
  title,
  children,
  onClose,
  isLoading = false,
  className,
  variant = 'default'
}) => {
  // State for managing card visibility
  const [isVisible, setIsVisible] = useState(true);

  // Effect to handle visibility changes
  useEffect(() => {
    if (!isVisible && onClose) {
      onClose();
    }
  }, [isVisible, onClose]);

  // Early return if card is not visible
  if (!isVisible) {
    return null;
  }

  // Variant-specific styles
  const variantStyles = {
    default: 'bg-white border border-gray-200',
    primary: 'bg-primary-50 border border-primary-200',
    secondary: 'bg-secondary-50 border border-secondary-200',
    outline: 'bg-white border-2 border-gray-300'
  };

  // Shadow and hover effects based on variant
  const shadowStyles = {
    default: 'shadow-sm hover:shadow-md',
    primary: 'shadow-sm hover:shadow-primary/10',
    secondary: 'shadow-sm hover:shadow-secondary/10',
    outline: 'shadow-none hover:shadow-sm'
  };

  // Combine all classes for the card container
  const cardClasses = classNames(
    // Base styles
    'rounded-lg transition-all duration-200',
    'flex flex-col',
    
    // Responsive styles
    'w-full',
    'sm:max-w-full',
    'md:max-w-2xl',
    'lg:max-w-4xl',
    
    // Variant-specific styles
    variantStyles[variant],
    shadowStyles[variant],
    
    // Loading state styles
    {
      'opacity-75 pointer-events-none': isLoading,
    },
    
    // Additional custom classes
    className
  );

  // Header styles
  const headerClasses = classNames(
    'flex items-center justify-between',
    'px-6 py-4',
    'border-b border-gray-200',
    {
      'bg-gray-50': variant === 'default',
      'bg-primary-100/50': variant === 'primary',
      'bg-secondary-100/50': variant === 'secondary',
      'bg-gray-50': variant === 'outline'
    }
  );

  // Title styles
  const titleClasses = classNames(
    'text-lg font-semibold',
    {
      'text-gray-900': variant === 'default' || variant === 'outline',
      'text-primary-900': variant === 'primary',
      'text-secondary-900': variant === 'secondary'
    }
  );

  return (
    <div 
      className={cardClasses}
      role="article"
      aria-busy={isLoading}
    >
      {/* Card Header */}
      <div className={headerClasses}>
        <h3 className={titleClasses}>
          {capitalizeFirstLetter(title)}
        </h3>
        
        {/* Close button if onClose is provided */}
        {onClose && (
          <Button
            label="Close"
            onClick={() => setIsVisible(false)}
            variant="outline"
            size="small"
            className="ml-4"
          />
        )}
      </div>

      {/* Card Content */}
      <div className="relative p-6">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
            <Loader size="medium" />
          </div>
        )}
        
        {/* Main content */}
        <div className={classNames('space-y-4', {
          'opacity-50': isLoading
        })}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Card;