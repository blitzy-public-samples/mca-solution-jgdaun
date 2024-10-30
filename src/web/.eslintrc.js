// ESLint configuration for React 18.2+ and TypeScript
// Version requirements based on package.json dependencies
// eslint v8.40.0
// @typescript-eslint/parser v5.59.0
// @typescript-eslint/eslint-plugin v5.59.0
// eslint-plugin-react v7.32.0
// eslint-plugin-react-hooks v4.6.0
// eslint-plugin-import v2.27.0
// eslint-plugin-jsx-a11y v6.7.0
// eslint-plugin-prettier v4.2.0
// eslint-config-prettier v8.8.0

module.exports = {
  // Use recommended configurations and plugins
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'plugin:jsx-a11y/recommended',
    'prettier', // Must be last to override other configs
  ],

  // Configure TypeScript parser
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },

  // Enable required plugins
  plugins: [
    'react',
    'react-hooks',
    '@typescript-eslint',
    'import',
    'jsx-a11y',
    'prettier',
  ],

  // Define environment
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },

  // Configure settings
  settings: {
    react: {
      version: '18.2',
    },
    'import/resolver': {
      typescript: {},
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },

  // Define rules
  rules: {
    // Prettier integration
    'prettier/prettier': ['error', {}, { usePrettierrc: true }],

    // React specific rules
    'react/prop-types': 'off', // Using TypeScript for prop validation
    'react/react-in-jsx-scope': 'off', // Not needed in React 18+
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // TypeScript specific rules
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caseInsensitive: true,
      },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // Import rules
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', ['parent', 'sibling'], 'index'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-unresolved': 'error',
    'import/no-cycle': 'error',
    'import/no-unused-modules': 'error',

    // Accessibility rules
    'jsx-a11y/anchor-is-valid': [
      'error',
      {
        components: ['Link'],
        specialLink: ['to'],
      },
    ],
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/no-static-element-interactions': 'error',

    // General best practices
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'warn',
    'no-alert': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
  },

  // Override rules for specific files
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'react-hooks/rules-of-hooks': 'off',
      },
    },
    {
      files: ['vite.config.ts', 'tailwind.config.js', 'postcss.config.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'import/no-default-export': 'off',
      },
    },
  ],

  // Ignore patterns
  ignorePatterns: [
    'dist',
    'build',
    'coverage',
    'node_modules',
    '*.config.js',
    'vite-env.d.ts',
  ],
};