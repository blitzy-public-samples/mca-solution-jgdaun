# Stage 1: Build environment
# Use Node.js 16 Alpine as base image for smaller size and better security
FROM node:16-alpine AS builder

# Set production environment for optimized builds
ENV NODE_ENV=production

# Add additional security by running as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Install Python and build dependencies needed for node-gyp
# This is required for some npm packages that need to be built from source
RUN apk add --no-cache python3 make g++

# Copy package files first for better layer caching
COPY src/web/package*.json ./

# Install dependencies using npm ci for deterministic builds
# Using --only=production to exclude devDependencies
# Using --no-audit to speed up the installation
RUN npm ci --only=production --no-audit

# Copy TypeScript configuration
COPY src/web/tsconfig.json ./
COPY src/web/vite.config.ts ./
COPY src/web/postcss.config.js ./
COPY src/web/tailwind.config.js ./

# Copy source code
COPY src/web/src ./src
COPY src/web/public ./public
COPY src/web/index.html ./

# Build the application
# The build script is defined in package.json
RUN npm run build

# Stage 2: Production environment
FROM nginx:1.23-alpine

# Add nginx user for running nginx as non-root
RUN adduser -D -S -h /var/cache/nginx -s /sbin/nologin -G www-data nginx

# Copy custom nginx configuration
COPY infrastructure/docker/nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Set correct permissions for nginx user
RUN chown -R nginx:www-data /usr/share/nginx/html && \
    chown -R nginx:www-data /var/cache/nginx && \
    chown -R nginx:www-data /var/log/nginx && \
    chown -R nginx:www-data /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:www-data /var/run/nginx.pid

# Create directory for health check
RUN mkdir -p /usr/share/nginx/html/health && \
    echo "OK" > /usr/share/nginx/html/health/index.html && \
    chown -R nginx:www-data /usr/share/nginx/html/health

# Switch to non-root user
USER nginx

# Expose port 80
EXPOSE 80

# Configure health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/health/ || exit 1

# Use nginx as entrypoint
ENTRYPOINT ["nginx", "-g", "daemon off;"]

# Set build arguments as environment variables
ARG API_BASE_URL
ENV VITE_API_BASE_URL=${API_BASE_URL}

# Add labels for better container management
LABEL maintainer="DevOps Team" \
      version="1.0" \
      description="Frontend container for Document Processing System" \
      org.opencontainers.image.source="https://github.com/yourusername/document-processing-system"