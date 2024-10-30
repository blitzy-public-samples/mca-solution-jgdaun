// React v17.0.2
import React from 'react';
// classnames v2.3.1
import classNames from 'classnames';
import { primary, secondary, success, warning, error } from '../../config/theme';

/**
 * Interface defining the props accepted by the Badge component
 * Implements status indicators for application processing states and document classifications
 */
interface BadgeProps {
  /** Text to be displayed inside the badge */
  label: string;
  /** Visual style variant of the badge */
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  /** Size of the badge */
  size: 'sm' | 'md' | 'lg';
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * A reusable Badge component that provides visual status indicators and labels
 * across the dashboard interface.
 * 
 * @implements Main Dashboard Components - Status indicators for application processing states
 * @implements Dashboard Layout - Visual hierarchy indicators for Application List
 */
const Badge: React.FC<BadgeProps> = ({ 
  label, 
  variant = 'primary', 
  size = 'md', 
  className 
}) => {
  // Map variant prop to corresponding theme color
  const variantColorMap = {
    primary,
    secondary,
    success,
    warning,
    error
  };

  // Define size-specific styles using Tailwind CSS classes
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  // Base styles that apply to all badges
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full';

  // Variant-specific styles for background and text colors
  const variantStyles = {
    primary: `bg-${variantColorMap.primary}/10 text-${variantColorMap.primary}`,
    secondary: `bg-${variantColorMap.secondary}/10 text-${variantColorMap.secondary}`,
    success: `bg-${variantColorMap.success}/10 text-${variantColorMap.success}`,
    warning: `bg-${variantColorMap.warning}/10 text-${variantColorMap.warning}`,
    error: `bg-${variantColorMap.error}/10 text-${variantColorMap.error}`
  };

  // Combine all styles using classnames utility
  const badgeStyles = classNames(
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    // Allow custom classes to override default styles
    className
  );

  return (
    <span className={badgeStyles}>
      {label}
    </span>
  );
};

export default Badge;