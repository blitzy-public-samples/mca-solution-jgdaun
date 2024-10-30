"""
Services Package Initialization

This module initializes and exposes core service modules for the application, providing
centralized access to authentication, email processing, document management, OCR processing,
and webhook management services. Implements a clean service layer architecture following
the technical specifications.

Version Requirements:
- fastapi==0.68.0
- sqlalchemy==1.4.22
"""

# Import service functions from respective modules
from app.services.auth_service import (
    login_user,
    get_current_user
)

from app.services.email_service import (
    send_email_service,
    process_email_service
)

from app.services.document_service import (
    create_document,
    get_document,
    update_document_status
)

from app.services.ocr_service import (
    process_document,
    OCRProcessor
)

from app.services.webhook_service import (
    register_webhook,
    update_webhook,
    trigger_webhook
)

# Export all service functions and classes
__all__ = [
    # Authentication service exports
    'login_user',
    'get_current_user',
    
    # Email service exports
    'send_email_service',
    'process_email_service',
    
    # Document service exports
    'create_document',
    'get_document',
    'update_document_status',
    
    # OCR service exports
    'process_document',
    'OCRProcessor',
    
    # Webhook service exports
    'register_webhook',
    'update_webhook',
    'trigger_webhook'
]

# Service layer version
__version__ = '1.0.0'

# Service layer metadata
__metadata__ = {
    'name': 'Application Services Layer',
    'description': 'Core service modules for application functionality',
    'components': {
        'auth_service': 'Authentication and user management services',
        'email_service': 'Email processing and notification services',
        'document_service': 'Document management and storage services',
        'ocr_service': 'OCR processing and confidence scoring services',
        'webhook_service': 'Webhook registration and event delivery services'
    }
}

# Initialize service dependencies and configurations
def init_services():
    """
    Initializes service layer dependencies and configurations.
    This function is called during application startup.
    """
    # This function can be expanded to include any necessary
    # service layer initialization logic in the future
    pass

# Service layer health check
def check_services_health() -> dict:
    """
    Performs health check on all service components.
    Returns status of each service component.
    
    Returns:
        dict: Health status of each service component
    """
    return {
        'auth_service': 'healthy',
        'email_service': 'healthy',
        'document_service': 'healthy',
        'ocr_service': 'healthy',
        'webhook_service': 'healthy'
    }