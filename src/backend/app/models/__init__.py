"""
Models Package Initialization

This file serves as the entry point for the models package, aggregating all SQLAlchemy ORM models
for easy import and use across the application. It provides a centralized location for importing
all database models, ensuring consistent access to data models throughout the system.

Version Requirements:
- SQLAlchemy==1.4.22
"""

# Import all models to make them available when importing from models package
from app.models.user import User, UserRole
from app.models.document import Document
from app.models.email import Email, EMAIL_STATUS_CHOICES
from app.models.webhook import Webhook

# Re-export models and constants for easy access
__all__ = [
    # User-related exports
    'User',
    'UserRole',
    
    # Document-related exports
    'Document',
    
    # Email-related exports
    'Email',
    'EMAIL_STATUS_CHOICES',
    
    # Webhook-related exports
    'Webhook'
]

# This init file implements the following requirements:
# 1. Core Schema Aggregation (system_design.database_design.core_schema)
#    - Aggregates all core ORM models in one place for easy access
#    - Ensures consistent model availability across the application
#
# 2. Database Model Integration (system_architecture.component_details.application_services)
#    - Provides unified access point for all database models
#    - Supports the application services layer's data persistence needs