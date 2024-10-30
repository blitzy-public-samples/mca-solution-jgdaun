# Stage 1: Builder stage
FROM python:3.9-slim as builder

# Set working directory
WORKDIR /app

# Install system dependencies required for building Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry - Version pinned to 1.4.2 as per specification
RUN pip install poetry==1.4.2

# Copy dependency files
COPY src/backend/pyproject.toml src/backend/poetry.lock /app/

# Configure poetry to not create virtual environment and install dependencies
RUN poetry config virtualenvs.create false \
    && poetry install --no-dev --no-interaction --no-ansi

# Stage 2: Final stage
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies and Tesseract OCR
# Version pinned to 4.1.1 as per specification
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr=4.1.1-2 \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder stage
COPY --from=builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY src/backend /app

# Create non-root user for security
RUN useradd -m appuser && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Set environment variables
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    WORKERS=4

# Expose the application port
EXPOSE 8000

# Health check configuration
# Checks the /health endpoint every 30 seconds
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Set the entrypoint script
CMD ["./scripts/start.sh"]