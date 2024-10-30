# Use Python 3.9 slim base image as specified in external dependencies
FROM python:3.9-slim

# Set maintainer and version labels
LABEL maintainer="Development Team <devteam@example.com>"
LABEL version="0.1.0"
LABEL description="Dollar Funding MCA Application Processing System Backend"

# Set environment variables for Python and application configuration
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV WORKERS=4

# Install system dependencies and Tesseract OCR
# Note: Using --no-install-recommends to minimize image size
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Required for building Python packages
    build-essential \
    # Required for downloading Poetry
    curl \
    # Required for document OCR processing as per technical spec
    tesseract-ocr=4.1.1* \
    # Cleanup apt cache to reduce image size
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Poetry version 1.1.11 as specified in external dependencies
RUN curl -sSL https://install.python-poetry.org | python3 - --version 1.1.11

# Copy dependency files first to leverage Docker cache
COPY pyproject.toml poetry.lock /app/

# Configure Poetry and install production dependencies
RUN poetry config virtualenvs.create false \
    && poetry install --no-dev --no-interaction --no-ansi

# Copy application code
COPY . /app/

# Make scripts executable
RUN chmod +x /app/scripts/*.sh

# Set resource limits as per technical specification
# Configuring ulimit for optimal performance
RUN echo "ulimit -n 65535" >> /etc/security/limits.conf

# Expose the application port
EXPOSE 8000

# Configure healthcheck as per monitoring requirements
# Interval: 30s, Timeout: 30s, Start period: 5s, Retries: 3
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Set the entrypoint script
ENTRYPOINT ["/app/scripts/start.sh"]

# Default command to start the application with uvicorn
# Using 4 workers as specified in the environment variables
CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]