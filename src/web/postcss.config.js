/**
 * PostCSS Configuration
 * Version: 8.4.0
 * 
 * This configuration file sets up PostCSS plugins for processing CSS:
 * - TailwindCSS (v3.0.0): Utility-first CSS framework for responsive UI components
 * - Autoprefixer (v10.4.0): Adds vendor prefixes for cross-browser compatibility
 */

// Import TailwindCSS configuration for theme and content paths
const { theme, content } = require('./tailwind.config.js');

// Export PostCSS configuration with required plugins
// Implements requirements from:
// - Frontend Layer Configuration: UI service styling and CSS transformations
// - User Interface Design: Dashboard layout responsive design and cross-browser compatibility
module.exports = {
  plugins: [
    // TailwindCSS plugin with imported configuration
    require('tailwindcss'),
    
    // Autoprefixer for cross-browser compatibility
    // Automatically adds vendor prefixes (-webkit, -moz, -ms, etc.)
    require('autoprefixer')({
      // Target the last 2 versions of each browser, browsers with >1% market share,
      // and ensure IE 11 support for enterprise environments
      overrideBrowserslist: [
        '> 1%',
        'last 2 versions',
        'not dead',
        'IE 11'
      ],
      // Enable grid prefixes for better CSS Grid support
      grid: true
    })
  ]
};