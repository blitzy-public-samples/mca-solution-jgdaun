// @ts-check

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Specify content sources for Tailwind to scan for classes
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html'
  ],

  // Theme customization for the dashboard and components as per UI design specifications
  theme: {
    extend: {
      // Custom color palette for consistent branding and status indicators
      colors: {
        primary: '#1D4ED8',    // Primary brand color for main actions and highlights
        secondary: '#9333EA',  // Secondary color for complementary elements
        background: '#F3F4F6', // Default background color
        text: '#111827',       // Default text color
        // Status colors for document processing states
        status: {
          new: '#10B981',        // Green for new documents
          processing: '#F59E0B',  // Amber for in-progress
          complete: '#059669',    // Emerald for completed
          failed: '#DC2626'       // Red for failed
        },
        // Navigation-specific colors
        navigation: {
          active: '#2563EB',    // Current selected item
          hover: '#3B82F6',     // Hover state
          inactive: '#6B7280'   // Unselected items
        }
      },

      // Typography configuration
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],     // Primary font for UI
        mono: ['JetBrains Mono', 'monospace']           // Monospace for technical content
      },

      // Font size scale
      fontSize: {
        'xs': '0.75rem',    // 12px
        'sm': '0.875rem',   // 14px
        'base': '1rem',     // 16px
        'lg': '1.125rem',   // 18px
        'xl': '1.25rem',    // 20px
        '2xl': '1.5rem',    // 24px
        '3xl': '1.875rem',  // 30px
        '4xl': '2.25rem'    // 36px
      },

      // Spacing scale for consistent layout
      spacing: {
        '0': '0px',
        '1': '0.25rem',   // 4px
        '2': '0.5rem',    // 8px
        '3': '0.75rem',   // 12px
        '4': '1rem',      // 16px
        '5': '1.25rem',   // 20px
        '6': '1.5rem',    // 24px
        '8': '2rem',      // 32px
        '10': '2.5rem',   // 40px
        '12': '3rem',     // 48px
        '16': '4rem'      // 64px
      },

      // Border radius for components
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',      // 2px
        'default': '0.25rem',  // 4px
        'md': '0.375rem',      // 6px
        'lg': '0.5rem',        // 8px
        'xl': '0.75rem',       // 12px
        '2xl': '1rem',         // 16px
        'full': '9999px'       // Circular
      },

      // Box shadow utilities for depth and elevation
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'default': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
      }
    }
  },

  // Plugins for additional functionality
  plugins: [
    require('@tailwindcss/forms'),        // Enhanced form input styling
    require('@tailwindcss/typography'),   // Prose styling for content
    require('@tailwindcss/aspect-ratio')  // Aspect ratio utilities
  ]
};