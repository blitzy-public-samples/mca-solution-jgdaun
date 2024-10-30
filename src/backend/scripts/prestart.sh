#!/bin/bash

# prestart.sh
# Version: 1.0
# This script performs pre-startup checks and initializations for the backend services
# Dependencies:
# - alembic==1.7.x
# - Python environment with required packages

# Source: system_architecture.overview and system_design.database_design.core_schema
# Import logging configuration for structured JSON logging
source "$(dirname "$0")/../app/core/logging.py"
source "$(dirname "$0")/../app/core/config.py"

# Set error handling
set -e
set -o pipefail

# Global variables
MAX_RETRIES=5
RETRY_DELAY=10
REQUIRED_ENV_VARS=(
    "ENVIRONMENT"
    "PROJECT_NAME"
    "SECRET_KEY"
    "DATABASE_URL"
    "MONGODB_URL"
    "REDIS_URL"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "AWS_REGION"
    "S3_BUCKET"
    "EMAIL_HOST"
    "EMAIL_PORT"
    "EMAIL_USERNAME"
    "EMAIL_PASSWORD"
    "CELERY_BROKER_URL"
    "LOG_LEVEL"
)

# Function to log messages with timestamp and level
log() {
    local level=$1
    local message=$2
    echo "{\"timestamp\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",\"level\":\"${level}\",\"message\":\"${message}\"}"
}

# Function to check if all required environment variables are set
check_env_vars() {
    log "INFO" "Checking environment variables..."
    local missing_vars=()
    
    for var in "${REQUIRED_ENV_VARS[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -ne 0 ]]; then
        log "ERROR" "Missing required environment variables: ${missing_vars[*]}"
        return 1
    fi
    
    # Additional environment-specific checks
    if [[ "$ENVIRONMENT" == "production" ]]; then
        if [[ -z "$SENTRY_DSN" ]]; then
            log "ERROR" "SENTRY_DSN is required in production environment"
            return 1
        fi
    fi
    
    log "INFO" "Environment variables check passed"
    return 0
}

# Function to check database connection
check_db_connection() {
    log "INFO" "Checking database connection..."
    local retries=0
    
    while [[ $retries -lt $MAX_RETRIES ]]; do
        if python -c "
from app.core.config import Config
from sqlalchemy import create_engine
engine = create_engine(Config().get_database_dsn())
connection = engine.connect()
connection.close()
        " 2>/dev/null; then
            log "INFO" "Database connection successful"
            return 0
        fi
        
        retries=$((retries + 1))
        log "WARN" "Database connection attempt $retries failed. Retrying in $RETRY_DELAY seconds..."
        sleep $RETRY_DELAY
    done
    
    log "ERROR" "Failed to connect to database after $MAX_RETRIES attempts"
    return 1
}

# Function to run database migrations
run_migrations() {
    log "INFO" "Running database migrations..."
    
    # Ensure alembic.ini exists
    if [[ ! -f "alembic.ini" ]]; then
        log "ERROR" "alembic.ini not found"
        return 1
    }
    
    # Run migrations
    if alembic upgrade head; then
        log "INFO" "Database migrations completed successfully"
        return 0
    else
        log "ERROR" "Database migrations failed"
        return 1
    fi
}

# Function to check Redis connection
check_redis_connection() {
    log "INFO" "Checking Redis connection..."
    local retries=0
    
    while [[ $retries -lt $MAX_RETRIES ]]; do
        if python -c "
import redis
from app.core.config import Config
redis_client = redis.from_url(Config().redis_url)
redis_client.ping()
        " 2>/dev/null; then
            log "INFO" "Redis connection successful"
            return 0
        fi
        
        retries=$((retries + 1))
        log "WARN" "Redis connection attempt $retries failed. Retrying in $RETRY_DELAY seconds..."
        sleep $RETRY_DELAY
    done
    
    log "ERROR" "Failed to connect to Redis after $MAX_RETRIES attempts"
    return 1
}

# Function to check S3 access
check_s3_access() {
    log "INFO" "Checking S3 bucket access..."
    
    if python -c "
import boto3
from app.core.config import Config
config = Config()
s3 = boto3.client(
    's3',
    aws_access_key_id=config.aws_access_key_id.get_secret_value(),
    aws_secret_access_key=config.aws_secret_access_key.get_secret_value(),
    region_name=config.aws_region
)
s3.head_bucket(Bucket=config.s3_bucket)
    " 2>/dev/null; then
        log "INFO" "S3 bucket access verified"
        return 0
    else
        log "ERROR" "Failed to access S3 bucket"
        return 1
    fi
}

# Function to check MongoDB connection
check_mongodb_connection() {
    log "INFO" "Checking MongoDB connection..."
    local retries=0
    
    while [[ $retries -lt $MAX_RETRIES ]]; do
        if python -c "
from pymongo import MongoClient
from app.core.config import Config
client = MongoClient(Config().get_mongodb_connection())
client.admin.command('ping')
        " 2>/dev/null; then
            log "INFO" "MongoDB connection successful"
            return 0
        fi
        
        retries=$((retries + 1))
        log "WARN" "MongoDB connection attempt $retries failed. Retrying in $RETRY_DELAY seconds..."
        sleep $RETRY_DELAY
    done
    
    log "ERROR" "Failed to connect to MongoDB after $MAX_RETRIES attempts"
    return 1
}

# Main function to perform all pre-startup checks
perform_prestart_checks() {
    local checks=(
        check_env_vars
        check_db_connection
        run_migrations
        check_redis_connection
        check_s3_access
        check_mongodb_connection
    )
    
    # Configure logging
    python -c "
from app.core.logging import setup_logging
setup_logging()
    "
    
    log "INFO" "Starting pre-startup checks..."
    
    # Run all checks
    for check in "${checks[@]}"; do
        if ! $check; then
            log "ERROR" "Pre-startup check '$check' failed"
            exit 1
        fi
    done
    
    log "INFO" "All pre-startup checks completed successfully"
    return 0
}

# Execute pre-startup checks
perform_prestart_checks