# Use Python 3.9 slim base image as specified in dependencies
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies including Tesseract OCR and build essentials
# Required for OCR processing and Python package compilation
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libpq-dev \
    python3-dev \
    build-essential \
    # Additional dependencies for image processing
    libtesseract-dev \
    libleptonica-dev \
    pkg-config \
    # Clean up apt cache to reduce image size
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt /app/

# Install Python dependencies
# Versions specified as per external dependencies in JSON spec
RUN pip install --no-cache-dir -r requirements.txt \
    pytesseract==0.3.8 \
    Pillow==8.2.0 \
    numpy==1.21.0 \
    celery==5.1.2 \
    sqlalchemy==1.4.22

# Copy application code
# Copying specific directories as per dockerfile_instructions
COPY ./src/backend/app /app/app
COPY ./src/backend/alembic.ini /app/
COPY ./src/backend/migrations /app/migrations

# Set Python path for proper module imports
ENV PYTHONPATH=/app

# Set OCR-specific environment variables from dockerfile_instructions
ENV OCR_ENGINE=pytesseract
ENV AUTO_APPROVE_THRESHOLD=0.95
ENV MANUAL_REVIEW_THRESHOLD=0.70

# Configure Tesseract path for OCR service
ENV TESSDATA_PREFIX=/usr/share/tesseract-ocr/4.00/tessdata

# Set up health check for the OCR service
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD celery -A app.tasks.ocr_tasks inspect ping || exit 1

# Start Celery worker with OCR queue as specified in dockerfile_instructions
CMD ["celery", "-A", "app.tasks.ocr_tasks", "worker", "--loglevel=info", "--queue=ocr"]