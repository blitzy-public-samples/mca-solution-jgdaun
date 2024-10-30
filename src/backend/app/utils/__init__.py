"""
Backend Application Utilities Package

This package provides a centralized module for importing utility functions and classes
used across the backend application. It aggregates essential utilities for validation,
security, storage, and email operations while ensuring proper dependency management
and access control.

Version: 1.0.0
"""

# Import validation utilities
from app.utils.validation import (
    validate_request_data,
    validate_user_data,
    validate_document_data
)

# Import security utilities
from app.utils.security import (
    hash_password,
    check_password,
    enhance_security_checks,
    blacklist_token
)

# Import storage utilities
from app.utils.storage import (
    upload_file_to_s3,
    download_file_from_s3
)

# Import email utilities
from app.utils.email import (
    send_email,
    process_incoming_email
)

# Define package exports
__all__ = [
    # Validation utilities
    'validate_request_data',
    'validate_user_data',
    'validate_document_data',
    
    # Security utilities
    'hash_password',
    'check_password',
    'enhance_security_checks',
    'blacklist_token',
    
    # Storage utilities
    'upload_file_to_s3',
    'download_file_from_s3',
    
    # Email utilities
    'send_email',
    'process_incoming_email'
]

# Package metadata
__version__ = '1.0.0'
__author__ = 'Document Processing System Team'
__description__ = 'Core utilities package for the backend application'

"""
This module implements the following requirements:

1. Utility Aggregation (system_architecture/component_details.application_services):
   - Provides a centralized module for importing utility functions and classes
   - Aggregates essential utilities from validation, security, storage, and email modules
   - Ensures proper dependency management through explicit imports

2. Security Implementation (system_architecture/security_architecture/authentication_&_authorization):
   - Exposes security utility functions for authentication and authorization
   - Includes password hashing, token management, and security enhancement functions
   - Implements role-based access control through security checks

The module follows these design principles:
- Single responsibility: Each imported utility serves a specific purpose
- Encapsulation: Internal implementation details are hidden from the package users
- Clear interface: All exported functions are explicitly listed in __all__
- Version tracking: Package version is clearly specified for dependency management
"""