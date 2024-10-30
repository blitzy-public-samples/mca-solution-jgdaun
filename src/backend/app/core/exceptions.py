# Standard library imports
import uuid
from typing import Dict, Optional

# Internal imports
from .config import Config
from .logging import get_logger

# Initialize logger
logger = get_logger(__name__)

# Error codes mapping as defined in the specification
ERROR_CODES = {
    'VALIDATION_ERROR': '400',
    'AUTHENTICATION_ERROR': '401',
    'AUTHORIZATION_ERROR': '403',
    'NOT_FOUND': '404',
    'CONFLICT': '409',
    'INTERNAL_ERROR': '500',
    'SERVICE_UNAVAILABLE': '503'
}

def format_error_response(message: str, code: str, details: Optional[Dict] = None) -> dict:
    """
    Formats an error response according to the API specification.
    
    Args:
        message (str): Human-readable error message
        code (str): Error code from ERROR_CODES
        details (Optional[Dict]): Additional error details
        
    Returns:
        dict: A formatted error response following the API specification
    """
    # Generate unique request ID for error tracking
    request_id = str(uuid.uuid4())
    
    # Create base error response
    error_response = {
        "error": {
            "code": code,
            "message": message,
            "request_id": request_id
        }
    }
    
    # Add details if provided
    if details:
        error_response["error"]["details"] = details
        
    return error_response

class CustomException(Exception):
    """
    Base class for custom exceptions in the application with standardized error response formatting.
    Implements error handling requirements from system design specification.
    """
    
    def __init__(self, message: str, code: str, details: Optional[Dict] = None):
        """
        Initialize the CustomException with message, error code, and optional details.
        
        Args:
            message (str): Human-readable error message
            code (str): Error code from ERROR_CODES
            details (Optional[Dict]): Additional error details
        """
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details
        self.request_id = str(uuid.uuid4())
        
        # Log the exception with correlation ID for tracking
        logger.error(
            f"Exception occurred: {message}",
            extra={
                "error_code": code,
                "request_id": self.request_id,
                "details": details
            }
        )
    
    def to_dict(self) -> dict:
        """
        Converts the exception to a dictionary format following the API error response specification.
        
        Returns:
            dict: A dictionary containing the error details following the API specification
        """
        return format_error_response(
            message=self.message,
            code=self.code,
            details=self.details
        )

class ValidationException(CustomException):
    """Exception for validation errors with predefined error code."""
    
    def __init__(self, message: str, details: Optional[Dict] = None):
        """
        Initialize ValidationException with message and optional details.
        
        Args:
            message (str): Human-readable validation error message
            details (Optional[Dict]): Additional validation error details
        """
        super().__init__(
            message=message,
            code=ERROR_CODES['VALIDATION_ERROR'],
            details=details
        )

class AuthenticationException(CustomException):
    """Exception for authentication failures with predefined error code."""
    
    def __init__(self, message: str, details: Optional[Dict] = None):
        """
        Initialize AuthenticationException with message and optional details.
        
        Args:
            message (str): Human-readable authentication error message
            details (Optional[Dict]): Additional authentication error details
        """
        super().__init__(
            message=message,
            code=ERROR_CODES['AUTHENTICATION_ERROR'],
            details=details
        )

class AuthorizationException(CustomException):
    """Exception for authorization failures with predefined error code."""
    
    def __init__(self, message: str, details: Optional[Dict] = None):
        """
        Initialize AuthorizationException with message and optional details.
        
        Args:
            message (str): Human-readable authorization error message
            details (Optional[Dict]): Additional authorization error details
        """
        super().__init__(
            message=message,
            code=ERROR_CODES['AUTHORIZATION_ERROR'],
            details=details
        )

class NotFoundException(CustomException):
    """Exception for resource not found errors with predefined error code."""
    
    def __init__(self, message: str, details: Optional[Dict] = None):
        """
        Initialize NotFoundException with message and optional details.
        
        Args:
            message (str): Human-readable not found error message
            details (Optional[Dict]): Additional not found error details
        """
        super().__init__(
            message=message,
            code=ERROR_CODES['NOT_FOUND'],
            details=details
        )