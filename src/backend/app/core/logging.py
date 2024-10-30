import logging
import logging.config
import json
from typing import Optional
import watchtower  # watchtower==3.0.1
from pythonjsonlogger import jsonlogger  # python-json-logger==2.0.7
from aws_xray_sdk.core import xray_recorder  # aws-xray-sdk==2.12.0
from aws_xray_sdk.core import patch_all
from contextvars import ContextVar
from .config import Config

# Initialize correlation ID context
correlation_id_context: ContextVar[Optional[str]] = ContextVar('correlation_id', default=None)

# Global variables from specification
LOG_LEVEL = Config.log_level

DEFAULT_LOG_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            'class': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(timestamp)s %(level)s %(name)s %(pathname)s %(lineno)d %(message)s %(trace_id)s %(correlation_id)s'
        }
    },
    'filters': {
        'correlation_id': {
            '()': 'app.core.logging.CorrelationIdFilter'
        }
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
            'filters': ['correlation_id'],
            'stream': 'ext://sys.stdout'
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'formatter': 'json',
            'filters': ['correlation_id'],
            'filename': 'logs/app.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5
        }
    },
    'root': {
        'level': 'INFO',
        'handlers': ['console', 'file']
    }
}

class LoggingError(Exception):
    """Custom exception class for logging-related errors."""
    def __init__(self, message: str):
        super().__init__(message)

class CorrelationIdFilter(logging.Filter):
    """Logging filter that adds correlation ID to log records for request tracing."""
    
    def __init__(self):
        super().__init__()
    
    def filter(self, record: logging.LogRecord) -> bool:
        """
        Adds correlation ID to the log record.
        
        Args:
            record (logging.LogRecord): The log record to be filtered
            
        Returns:
            bool: Always returns True to include the record
        """
        try:
            correlation_id = correlation_id_context.get()
            record.correlation_id = correlation_id if correlation_id else 'no-correlation-id'
            # Add X-Ray trace ID if available
            if xray_recorder.current_segment():
                record.trace_id = xray_recorder.current_segment().trace_id
            else:
                record.trace_id = 'no-trace-id'
        except Exception:
            record.correlation_id = 'error-getting-correlation-id'
            record.trace_id = 'error-getting-trace-id'
        return True

def setup_logging() -> None:
    """
    Configures the logging settings for the application using the specified configuration.
    Implements monitoring & logging requirements from system architecture.
    """
    try:
        # Configure basic logging with JSON formatter
        logging.config.dictConfig(DEFAULT_LOG_CONFIG)
        root_logger = logging.getLogger()
        root_logger.setLevel(LOG_LEVEL)

        # Initialize X-Ray tracing if in production
        if Config.environment == 'production':
            try:
                xray_recorder.configure(
                    service='backend-api',
                    context_missing='LOG_ERROR',
                    daemon_address='127.0.0.1:2000',
                    sampling=True
                )
                patch_all()
            except Exception as e:
                raise LoggingError(f"Failed to configure X-Ray tracing: {str(e)}")

            # Add CloudWatch handler in production
            add_cloudwatch_handler()

    except Exception as e:
        raise LoggingError(f"Failed to setup logging: {str(e)}")

def get_logger(name: str) -> logging.Logger:
    """
    Creates and returns a configured logger instance for a given module.
    
    Args:
        name (str): The name of the module requesting the logger
        
    Returns:
        logging.Logger: A configured logger instance
    """
    logger = logging.getLogger(name)
    
    # Ensure logging has been configured
    if not logger.handlers and not logging.getLogger().handlers:
        setup_logging()
    
    # Add correlation ID filter if not already present
    has_correlation_filter = any(
        isinstance(filter_, CorrelationIdFilter) 
        for filter_ in logger.filters
    )
    if not has_correlation_filter:
        logger.addFilter(CorrelationIdFilter())
    
    return logger

def add_cloudwatch_handler() -> None:
    """
    Adds AWS CloudWatch handler to the root logger in production.
    Implements CloudWatch integration requirement from monitoring & logging architecture.
    """
    try:
        # Create CloudWatch handler with AWS credentials
        cloudwatch_handler = watchtower.CloudWatchLogHandler(
            log_group_name=f"{Config.project_name}-logs",
            log_stream_name=f"{Config.environment}-stream",
            aws_access_key_id=Config.aws_access_key_id.get_secret_value(),
            aws_secret_access_key=Config.aws_secret_access_key.get_secret_value(),
            aws_region_name=Config.aws_region,
            create_log_group=True
        )

        # Set JSON formatter for CloudWatch logs
        cloudwatch_handler.setFormatter(
            jsonlogger.JsonFormatter(
                '%(timestamp)s %(level)s %(name)s %(message)s %(trace_id)s %(correlation_id)s'
            )
        )

        # Add handler to root logger
        root_logger = logging.getLogger()
        root_logger.addHandler(cloudwatch_handler)

    except Exception as e:
        raise LoggingError(f"Failed to configure CloudWatch logging: {str(e)}")