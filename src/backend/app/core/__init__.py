# Core initialization module for backend application
# External dependencies versions:
# - pyjwt==2.4.0
# - celery==5.2.7
# - redis==4.5.4

import logging
import json
from datetime import datetime, timedelta
import jwt  # pyjwt 2.4.0
from celery import Celery  # celery 5.2.7
import redis  # redis 4.5.4
from logging.handlers import RotatingFileHandler

# Initialize global logger
logger = logging.getLogger(__name__)

# Initialize global Celery instance
celery_app = Celery('app')

class CoreException(Exception):
    """Base exception class for core module errors with proper error handling"""
    
    def __init__(self, message: str, details: dict = None):
        """Initialize core exception with message and optional details
        
        Args:
            message: Error message
            details: Additional error context
        """
        super().__init__(message)
        self.message = message
        self.details = details or {}
        logger.error(f"CoreException: {message}", extra={"details": self.details})
    
    def __str__(self) -> str:
        """String representation of the exception
        
        Returns:
            Formatted exception message with details
        """
        if self.details:
            return f"{self.message} - Details: {json.dumps(self.details)}"
        return self.message

def setup_basic_logging():
    """Sets up basic logging configuration for the application
    
    Implements the logging requirements from system_architecture.monitoring_&_logging
    """
    # Define JSON log formatter
    class JsonFormatter(logging.Formatter):
        def format(self, record):
            log_data = {
                'timestamp': self.formatTime(record),
                'level': record.levelname,
                'service': 'backend-api',
                'message': record.getMessage(),
                'module': record.module
            }
            if hasattr(record, 'details'):
                log_data['details'] = record.details
            return json.dumps(log_data)

    # Configure basic logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Create console handler with JSON formatting
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(JsonFormatter())
    
    # Create rotating file handler for persistent logging
    file_handler = RotatingFileHandler(
        'logs/app.log',
        maxBytes=10485760,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(JsonFormatter())
    
    # Get root logger and add handlers
    root_logger = logging.getLogger()
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)

def create_token(payload: dict, secret_key: str) -> str:
    """Creates a JWT token with provided payload following security best practices
    
    Implements JWT token requirements from security_considerations.authentication_and_authorization.authentication_methods
    
    Args:
        payload: Token payload containing claims
        secret_key: Secret key for token signing
        
    Returns:
        Generated JWT token string
        
    Raises:
        CoreException: If payload validation fails
    """
    try:
        # Validate required claims
        required_claims = ['sub', 'type']
        for claim in required_claims:
            if claim not in payload:
                raise CoreException(
                    f"Missing required claim: {claim}",
                    {'payload': payload, 'missing_claim': claim}
                )
        
        # Add standard JWT claims
        now = datetime.utcnow()
        payload.update({
            'iat': now,
            'exp': now + timedelta(hours=1),  # 1 hour expiration
            'iss': 'backend-api'
        })
        
        # Generate token with HS256 algorithm
        token = jwt.encode(
            payload,
            secret_key,
            algorithm='HS256'
        )
        
        return token
        
    except Exception as e:
        raise CoreException(
            "Failed to create JWT token",
            {'error': str(e), 'payload': payload}
        )

def initialize_celery() -> Celery:
    """Initializes the Celery application with Redis broker and proper configurations
    
    Returns:
        Configured Celery application instance
    """
    # Configure Celery application
    celery_app.conf.update(
        broker_url='redis://redis:6379/0',
        result_backend='redis://redis:6379/0',
        task_serializer='json',
        result_serializer='json',
        accept_content=['json'],
        enable_utc=True,
        task_track_started=True,
        task_time_limit=3600,  # 1 hour task timeout
        result_expires=86400,  # Results expire in 24 hours
        worker_prefetch_multiplier=1,
        worker_max_tasks_per_child=1000,
        task_routes={
            'app.tasks.*': {'queue': 'default'},
            'app.tasks.ocr_tasks.*': {'queue': 'ocr'},
            'app.tasks.email_tasks.*': {'queue': 'email'},
            'app.tasks.webhook_tasks.*': {'queue': 'webhook'}
        }
    )
    
    # Enable task events for monitoring
    celery_app.conf.task_send_sent_event = True
    celery_app.conf.worker_send_task_events = True
    
    # Configure task message signing for security
    celery_app.conf.task_serializer = 'json'
    celery_app.conf.task_compression = 'gzip'
    
    return celery_app

# Initialize logging on module import
setup_basic_logging()