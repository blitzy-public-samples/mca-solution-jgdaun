// React 18.2.0
import React from 'react';
// classnames 2.3.2
import classNames from 'classnames';
import { getThemeColors, getThemeConfig } from '../../config/theme';
import Loader from './Loader';

interface ButtonProps {
  /** Text content of the button */
  label: string;
  /** Callback function triggered on button click */
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show loading state */
  loading?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * A reusable Button component that provides consistent styling, loading states,
 * and interaction patterns across the application.
 * 
 * @implements Main Dashboard Components requirement for standardized action buttons
 * @implements Frontend Layer requirement for core UI component
 */
const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  className,
}) => {
  const colors = getThemeColors();
  const theme = getThemeConfig();

  // Size-specific styles
  const sizeStyles = {
    small: {
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      fontSize: theme.typography.fontSize.sm,
      borderRadius: theme.borderRadius.default,
    },
    medium: {
      padding: `${theme.spacing.sm} ${theme.spacing.base}`,
      fontSize: theme.typography.fontSize.base,
      borderRadius: theme.borderRadius.md,
    },
    large: {
      padding: `${theme.spacing.base} ${theme.spacing.lg}`,
      fontSize: theme.typography.fontSize.lg,
      borderRadius: theme.borderRadius.lg,
    },
  };

  // Variant-specific styles
  const variantStyles = {
    primary: {
      backgroundColor: colors.primary,
      color: colors.gray['50'],
      hoverBg: '#1E40AF', // Darker shade of primary
      activeBg: '#1E3A8A', // Even darker shade
      disabledBg: colors.gray['300'],
    },
    secondary: {
      backgroundColor: colors.secondary,
      color: colors.gray['50'],
      hoverBg: '#7E22CE', // Darker shade of secondary
      activeBg: '#6B21A8', // Even darker shade
      disabledBg: colors.gray['300'],
    },
    outline: {
      backgroundColor: 'transparent',
      color: colors.primary,
      border: `2px solid ${colors.primary}`,
      hoverBg: colors.gray['100'],
      activeBg: colors.gray['200'],
      disabledBorder: colors.gray['300'],
    },
  };

  // Combine all classes based on props
  const buttonClasses = classNames(
    // Base styles
    'inline-flex items-center justify-center',
    'font-semibold transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:cursor-not-allowed',
    
    // Variant-specific styles
    {
      // Primary variant
      'bg-primary hover:bg-primary-dark active:bg-primary-darker disabled:bg-gray-300':
        variant === 'primary',
      'text-white': variant === 'primary' || variant === 'secondary',
      
      // Secondary variant
      'bg-secondary hover:bg-secondary-dark active:bg-secondary-darker disabled:bg-gray-300':
        variant === 'secondary',
      
      // Outline variant
      'border-2 border-primary hover:bg-gray-100 active:bg-gray-200 disabled:border-gray-300':
        variant === 'outline',
      'text-primary disabled:text-gray-400': variant === 'outline',
    },
    
    // Size-specific styles
    {
      'text-sm px-3 py-1.5': size === 'small',
      'text-base px-4 py-2': size === 'medium',
      'text-lg px-6 py-3': size === 'large',
    },
    
    // Loading state styles
    {
      'opacity-75': loading,
    },
    
    // Additional custom classes
    className
  );

  // Handle click event
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!loading && !disabled) {
      onClick(event);
    }
  };

  return (
    <button
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      style={{
        ...sizeStyles[size],
        ...(variant === 'outline' && {
          borderColor: disabled ? variantStyles.outline.disabledBorder : variantStyles.outline.border,
        }),
      }}
    >
      {/* Loading spinner */}
      {loading && (
        <span className="mr-2">
          <Loader size="small" />
        </span>
      )}
      
      {/* Button label */}
      <span className={loading ? 'opacity-75' : ''}>
        {label}
      </span>
    </button>
  );
};

export default Button;