"""
Schema Module Entry Point

This module serves as the central point for all Pydantic schema definitions used throughout
the application. It consolidates schema models for data validation, serialization, and API
documentation, ensuring consistent data handling across the application.

Version Requirements:
- pydantic==1.8.2
"""

# Re-export user-related schemas
from app.schemas.user import (  # type: ignore
    UserBase,
    UserCreate,
    UserUpdate,
    UserInDB,
)

# Re-export document-related schemas
from app.schemas.document import (  # type: ignore
    DocumentBase,
    DocumentCreate,
    DocumentUpdate,
    DocumentInDB,
)

# Re-export email-related schemas
from app.schemas.email import (  # type: ignore
    EmailBase,
    EmailCreate,
    EmailInDB,
)

# Re-export OCR-related schemas
from app.schemas.ocr import (  # type: ignore
    OCRBase,
    OCRCreate,
    OCRInDB,
)

# Re-export webhook-related schemas
from app.schemas.webhook import (  # type: ignore
    WebhookBase,
    WebhookCreate,
    WebhookInDB,
    WebhookData,
    WebhookMetadata,
)

# Define all available schemas for easy access
__all__ = [
    # User schemas
    "UserBase",
    "UserCreate", 
    "UserUpdate",
    "UserInDB",
    
    # Document schemas
    "DocumentBase",
    "DocumentCreate",
    "DocumentUpdate",
    "DocumentInDB",
    
    # Email schemas
    "EmailBase",
    "EmailCreate",
    "EmailInDB",
    
    # OCR schemas
    "OCRBase",
    "OCRCreate",
    "OCRInDB",
    
    # Webhook schemas
    "WebhookBase",
    "WebhookCreate",
    "WebhookInDB",
    "WebhookData",
    "WebhookMetadata",
]