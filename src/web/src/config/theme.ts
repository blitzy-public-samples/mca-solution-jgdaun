// @ts-check
import '../styles/tailwind.css'; // Tailwind CSS v3.0.0

/**
 * Theme colors configuration for the application
 * Implements UI design requirements for consistent styling across dashboard components
 */
export const THEME_COLORS = {
  primary: '#1D4ED8',
  secondary: '#9333EA',
  background: '#F3F4F6',
  text: '#111827',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  gray: {
    '50': '#F9FAFB',
    '100': '#F3F4F6',
    '200': '#E5E7EB',
    '300': '#D1D5DB',
    '400': '#9CA3AF',
    '500': '#6B7280',
    '600': '#4B5563',
    '700': '#374151',
    '800': '#1F2937',
    '900': '#111827'
  }
} as const;

/**
 * Theme configuration including typography, spacing, borders, and shadows
 * Ensures consistent component styling across the dashboard layout
 */
export const THEME_CONFIG = {
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    base: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '2.5rem',
    '3xl': '3rem'
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    default: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    default: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  }
} as const;

/**
 * Initializes theme settings for the application
 * Implements dashboard layout requirements for header, main content, and application details sections
 */
export const initializeTheme = (): void => {
  // Apply theme colors as CSS variables
  const root = document.documentElement;
  Object.entries(THEME_COLORS).forEach(([key, value]) => {
    if (typeof value === 'string') {
      root.style.setProperty(`--color-${key}`, value);
    } else if (typeof value === 'object') {
      Object.entries(value).forEach(([subKey, subValue]) => {
        root.style.setProperty(`--color-${key}-${subKey}`, subValue);
      });
    }
  });

  // Apply typography settings
  document.body.style.fontFamily = THEME_CONFIG.typography.fontFamily;

  // Apply base font size
  root.style.fontSize = THEME_CONFIG.typography.fontSize.base;

  // Initialize responsive breakpoints for mobile-first design
  const breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  };

  Object.entries(breakpoints).forEach(([key, value]) => {
    root.style.setProperty(`--breakpoint-${key}`, value);
  });
};

/**
 * Returns the theme colors configuration
 * Used by dashboard components for consistent color application
 */
export const getThemeColors = (): typeof THEME_COLORS => {
  return THEME_COLORS;
};

/**
 * Returns the complete theme configuration
 * Used for styling dashboard layout and components
 */
export const getThemeConfig = (): typeof THEME_CONFIG => {
  return THEME_CONFIG;
};