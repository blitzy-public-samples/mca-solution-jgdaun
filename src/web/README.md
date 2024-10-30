# Dollar Funding MCA Application Processing System - Frontend

## Overview

This is the web frontend for the Dollar Funding MCA Application Processing System, built with React 18 and TypeScript. The application provides a modern, responsive interface for managing MCA (Merchant Cash Advance) applications, document processing, and workflow management.

## Prerequisites

- Node.js >= 16.x
- npm >= 8.x
- Git

## Tech Stack

- React 18.2.0
- Redux Toolkit 1.9.0
- Material-UI 5.11.0
- TypeScript 4.9.0
- React Router 6.x
- TailwindCSS 3.x

## Quick Start

1. Clone the repository
```bash
git clone <repository-url>
cd src/web
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
VITE_API_URL=<api-gateway-url>
VITE_AUTH_DOMAIN=<auth-domain>
VITE_ENVIRONMENT=<environment>
```

4. Start development server
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Development Guidelines

### Coding Standards
- Follows Airbnb React/JSX Style Guide
- Use TypeScript for all new code
- Maintain consistent component structure
- Write JSDoc comments for all functions
- Follow Material-UI theming guidelines

### Git Workflow
1. Create feature branch from `develop`
2. Make changes and commit following conventional commits
3. Submit pull request for review
4. Merge after approval and passing CI checks

### Testing Requirements
- Unit tests required for all components
- Integration tests for critical user flows
- Maintain minimum 80% code coverage
- Run full test suite before PR submission

## Project Structure

```
src/
├── assets/          # Static assets (images, icons)
├── components/      # Reusable UI components
├── config/          # App configuration
├── constants/       # Constants and enums
├── hooks/          # Custom React hooks
├── pages/          # Page components
├── routes/         # Routing configuration
├── services/       # API services
├── store/          # Redux store and slices
├── styles/         # Global styles
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## Building for Production

1. Create production build:
```bash
npm run build
```

2. Verify the build:
```bash
npm run preview
```

## Deployment

### Production Build Process
1. Run tests and linting
```bash
npm run test
npm run lint
```

2. Create production build
```bash
npm run build
```

3. Deploy to AWS infrastructure:
```bash
# Build artifacts will be deployed to S3 and distributed via CloudFront
npm run deploy:prod
```

### Environment Variables

Production deployments require the following environment variables:

- `VITE_API_URL`: API Gateway endpoint URL
- `VITE_AUTH_DOMAIN`: Authentication domain
- `VITE_ENVIRONMENT`: Deployment environment (prod/staging/dev)

### Deployment Steps

1. Build application
2. Run test suite
3. Deploy to AWS S3
4. Invalidate CloudFront cache

## Architecture Overview

The frontend application is built on React 18 with the following key architectural features:

- Code-splitting with React.lazy() for optimized loading
- Redux Toolkit for state management
- Material-UI theming system
- React Router for navigation
- Error boundary implementation
- Suspense for loading states

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Contributing

1. Follow the Git workflow guidelines
2. Ensure all tests pass
3. Update documentation as needed
4. Submit PR with detailed description

## Troubleshooting

Common issues and solutions:

1. Build failures
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules: `rm -rf node_modules`
   - Reinstall dependencies: `npm install`

2. Development server issues
   - Check environment variables
   - Verify API endpoint accessibility
   - Clear browser cache

## Security

- All API requests must use HTTPS
- Implement proper CORS policies
- Follow security best practices for React
- Regular dependency updates
- Security scanning in CI/CD pipeline

## License

See LICENSE file in the root directory.