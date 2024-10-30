# Third-party imports with versions
from starlette.middleware.base import BaseHTTPMiddleware  # starlette==0.27.0
import logging
import time
import uuid
from typing import Callable, Dict, Any

# Internal imports
from app.core.logging import setup_logging, get_logger
from app.core.config import Config

# Initialize logger for this module
logger = get_logger(__name__)

def log_request(request: Any, request_id: str) -> None:
    """
    Logs the details of an incoming API request with correlation ID and request context.
    
    Args:
        request: The incoming request object
        request_id: Unique identifier for the request
        
    Implementation of monitoring & logging requirements for request tracking.
    """
    try:
        # Extract request metadata
        headers = dict(request.headers)
        # Remove sensitive information from headers
        if 'authorization' in headers:
            headers['authorization'] = '[REDACTED]'
        if 'cookie' in headers:
            headers['cookie'] = '[REDACTED]'

        # Prepare request data for logging
        request_data = {
            'request_id': request_id,
            'method': request.method,
            'url': str(request.url),
            'client_host': request.client.host if request.client else None,
            'headers': headers,
            'path_params': dict(request.path_params),
            'query_params': dict(request.query_params)
        }

        # Log request details in JSON format
        logger.info(
            'Incoming request',
            extra={
                'request_data': request_data,
                'event_type': 'request_received'
            }
        )
    except Exception as e:
        logger.error(
            f'Error logging request: {str(e)}',
            extra={
                'request_id': request_id,
                'error': str(e),
                'event_type': 'request_log_error'
            }
        )

def log_response(response: Any, request_id: str, duration_ms: float) -> None:
    """
    Logs the details of an outgoing API response with performance metrics.
    
    Args:
        response: The outgoing response object
        request_id: Unique identifier for the request
        duration_ms: Request processing duration in milliseconds
        
    Implementation of monitoring & logging requirements for response tracking.
    """
    try:
        # Extract response headers
        headers = dict(response.headers)
        
        # Prepare response data for logging
        response_data = {
            'request_id': request_id,
            'status_code': response.status_code,
            'headers': headers,
            'duration_ms': duration_ms
        }

        # Determine log level based on status code
        if response.status_code >= 500:
            log_level = logging.ERROR
        elif response.status_code >= 400:
            log_level = logging.WARNING
        else:
            log_level = logging.INFO

        # Log response details in JSON format
        logger.log(
            log_level,
            'Outgoing response',
            extra={
                'response_data': response_data,
                'event_type': 'response_sent'
            }
        )
    except Exception as e:
        logger.error(
            f'Error logging response: {str(e)}',
            extra={
                'request_id': request_id,
                'error': str(e),
                'event_type': 'response_log_error'
            }
        )

class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware class for handling request/response logging with performance tracking 
    and distributed tracing.
    
    Implementation of monitoring & logging requirements from system architecture.
    """
    
    def __init__(self, app: Any) -> None:
        """
        Initializes the logging middleware with configuration.
        
        Args:
            app: The ASGI application
        """
        super().__init__(app)
        self.logger = logger
        self.config = Config()

    async def dispatch(self, request: Any, call_next: Callable) -> Any:
        """
        Handles the ASGI request/response cycle with logging.
        
        Args:
            request: The incoming request
            call_next: The next middleware in the chain
            
        Returns:
            The processed response
            
        Implementation of request/response logging with performance tracking.
        """
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        
        # Add request ID to request state for access in route handlers
        request.state.request_id = request_id
        
        # Start request timing
        start_time = time.time()
        
        try:
            # Log incoming request
            log_request(request, request_id)
            
            # Process request through middleware chain
            response = await call_next(request)
            
            # Calculate request duration
            duration_ms = (time.time() - start_time) * 1000
            
            # Add request ID and duration to response headers
            response.headers['X-Request-ID'] = request_id
            response.headers['X-Response-Time'] = f"{duration_ms:.2f}ms"
            
            # Log response with timing information
            log_response(response, request_id, duration_ms)
            
            # Add performance monitoring headers if enabled
            if self.config.environment != 'development':
                response.headers['Server-Timing'] = f"total;dur={duration_ms:.2f}"
            
            return response
            
        except Exception as e:
            # Log error details
            self.logger.error(
                'Unhandled error in request processing',
                extra={
                    'request_id': request_id,
                    'error': str(e),
                    'error_type': type(e).__name__,
                    'event_type': 'request_error'
                },
                exc_info=True
            )
            
            # Re-raise the exception for error middleware to handle
            raise