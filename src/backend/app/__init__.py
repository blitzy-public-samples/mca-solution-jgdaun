"""
Backend Application Initialization Module

This module serves as the main initializer for the backend application, setting up core components
including FastAPI configuration, logging, task processing, and database connections in accordance
with the microservices architecture.

Version Requirements:
- fastapi==0.95.0
- celery==5.1.2
- python-json-logger==2.0.7
- watchtower==3.0.1
"""

import logging
from fastapi import FastAPI
from .core.config import Config
from .core.logging import setup_logging
from .core.celery_app import celery_app
from .api import app as fastapi_app

# Initialize configuration
config = Config()

# Initialize logger for this module
logger = logging.getLogger(__name__)

def initialize_app() -> FastAPI:
    """
    Initializes the backend application by setting up all core components and configurations.
    Implementation addresses Application Initialization requirement from system_architecture.component_details.application_services.

    Returns:
        FastAPI: The configured FastAPI application instance
    """
    try:
        # Set up structured logging with CloudWatch integration
        # Implementation addresses Logging Setup requirement from system_architecture.monitoring_&_logging
        setup_logging()
        logger.info("Logging system initialized successfully")

        # Initialize Celery for task processing
        # Implementation addresses Task Processing requirement from system_architecture.component_details.processing_pipeline
        if celery_app.conf.broker_url:
            logger.info("Celery task processing initialized successfully")
        else:
            logger.error("Failed to initialize Celery - broker URL not configured")
            raise RuntimeError("Celery initialization failed")

        # Configure FastAPI application
        # Implementation addresses API configuration from system_architecture.component_details.application_services
        app = fastapi_app
        logger.info("FastAPI application configured successfully")

        # Log successful initialization
        logger.info(
            "Backend application initialized successfully",
            extra={
                "environment": config.environment,
                "debug_mode": config.debug,
                "api_version": "v1"
            }
        )

        return app

    except Exception as e:
        logger.error(
            f"Failed to initialize backend application: {str(e)}",
            exc_info=True,
            extra={
                "environment": config.environment,
                "error_type": type(e).__name__
            }
        )
        raise

# Initialize the application
app = initialize_app()

# Export the FastAPI and Celery instances
# These exports are used by other modules to access the configured instances
__all__ = ['app', 'celery_app']