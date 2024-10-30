import { defineConfig } from 'vite'; // vite@2.9+
import react from '@vitejs/plugin-react'; // @vitejs/plugin-react@3.0+
import { resolve } from 'path';
import type { UserConfig } from 'vite';

// Import environment type definitions
import './src/vite-env.d.ts';

/**
 * Vite configuration for the Document Processing System frontend
 * Configured for optimal development and production builds with React 18+ and TypeScript
 * 
 * @see Technology Stack Requirements: React 18.2+, TailwindCSS 3.3+
 * @see Frontend Layer Configuration: Served through API Gateway and Load Balancer
 */
export default defineConfig(({ mode }): UserConfig => {
  // Determine if we're in production mode
  const isProduction = mode === 'production';

  return {
    // Base public path - configured for cloud deployment
    base: '/',

    // Configure plugins
    plugins: [
      react({
        // Enable Fast Refresh for React components
        fastRefresh: true,
        // Include runtime JSX transforms
        jsxRuntime: 'automatic',
        // Enable babel plugins for production optimization
        babel: {
          plugins: isProduction ? [
            ['transform-remove-console', { exclude: ['error', 'warn'] }]
          ] : []
        }
      })
    ],

    // Build configuration
    build: {
      // Output directory for production builds
      outDir: 'dist',
      // Assets directory within outDir
      assetsDir: 'assets',
      // Enable source maps for debugging
      sourcemap: true,
      // Production minification settings
      minify: isProduction,
      // Target modern browsers
      target: 'es2020',
      // Split CSS into chunks
      cssCodeSplit: true,
      // Set chunk size warning limit
      chunkSizeWarningLimit: 1000,
      // Rollup options
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor chunks for better caching
            vendor: ['react', 'react-dom', 'react-router-dom'],
            // Split Redux related code
            redux: ['@reduxjs/toolkit', 'react-redux']
          }
        }
      }
    },

    // Development server configuration
    server: {
      // Development port
      port: 3000,
      // Open browser on server start
      open: true,
      // Enable CORS for API requests
      cors: true,
      // Proxy configuration for API requests
      proxy: {
        '/api': {
          target: process.env.VITE_API_BASE_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },

    // Preview server configuration (for production builds)
    preview: {
      port: 3000
    },

    // Path resolution configuration
    resolve: {
      alias: {
        // Enable @ imports from src directory
        '@': resolve(__dirname, 'src')
      }
    },

    // Environment variable configuration
    envPrefix: 'VITE_',
    
    // Optimization configuration
    optimizeDeps: {
      // Include dependencies that need to be pre-bundled
      include: ['react', 'react-dom', 'react-router-dom', '@reduxjs/toolkit'],
      // Force exclude certain dependencies from pre-bundling
      exclude: ['@vitejs/plugin-react']
    },

    // CSS configuration
    css: {
      // Enable CSS modules
      modules: {
        // Configure CSS module class naming
        generateScopedName: isProduction
          ? '[hash:base64:8]'
          : '[name]__[local]__[hash:base64:5]'
      },
      // PostCSS configuration for TailwindCSS
      postcss: {
        plugins: [
          require('tailwindcss'),
          require('autoprefixer')
        ]
      }
    },

    // Enable type checking during build
    esbuild: {
      // Enable JSX preservation
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      // Keep names for better debugging
      keepNames: !isProduction
    }
  };
});