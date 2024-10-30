"""
Email ORM Model Module

This module defines the SQLAlchemy ORM model for email data, enabling database operations
related to email processing and storage within the application.

Version Requirements:
- SQLAlchemy==1.4.22
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Float, ARRAY
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.db.base import Base

# Global constants for email validation and constraints
EMAIL_STATUS_CHOICES = ['pending', 'processing', 'processed', 'failed']
EMAIL_SUBJECT_MAX_LENGTH = 256
EMAIL_BODY_MAX_LENGTH = 65536

class Email(Base):
    """
    SQLAlchemy ORM model for storing and managing email data in the database.
    Implements the email schema with validation rules and processing metadata.
    
    This model supports the email processing pipeline by providing structured storage
    for incoming emails and their processing status.
    """
    
    __tablename__ = 'emails'
    
    # Primary key using UUID for distributed system compatibility
    # and to prevent sequential ID enumeration
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment='Unique identifier for the email record'
    )
    
    # Email sender with validation enforced at API/service layer
    sender = Column(
        String(255),
        nullable=False,
        index=True,
        comment='Email address of the sender'
    )
    
    # Email recipient with validation enforced at API/service layer
    recipient = Column(
        String(255),
        nullable=False,
        index=True,
        comment='Email address of the recipient'
    )
    
    # Email subject with length constraint
    subject = Column(
        String(EMAIL_SUBJECT_MAX_LENGTH),
        nullable=False,
        comment='Subject line of the email'
    )
    
    # Email body with length constraint
    body = Column(
        String(EMAIL_BODY_MAX_LENGTH),
        nullable=False,
        comment='Main content/body of the email'
    )
    
    # Processing status with predefined choices
    status = Column(
        String(50),
        nullable=False,
        default='pending',
        index=True,
        comment='Current processing status of the email'
    )
    
    # Array of attachment file paths in cloud storage
    attachments = Column(
        ARRAY(String),
        nullable=True,
        default=[],
        comment='List of file paths to email attachments in storage'
    )
    
    # OCR confidence score for processed attachments
    processing_confidence = Column(
        Float,
        nullable=True,
        comment='Confidence score from OCR processing (0.0 to 1.0)'
    )
    
    # Timestamp when email was received by the system
    received_at = Column(
        DateTime,
        nullable=False,
        server_default='now()',
        comment='Timestamp when email was received'
    )
    
    # Standard timestamps for record tracking
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        comment='Timestamp when record was created'
    )
    
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        comment='Timestamp when record was last updated'
    )
    
    def __init__(self, **kwargs):
        """
        Initialize an Email instance with the provided attributes.
        Sets default values and performs basic validation.
        """
        super().__init__(**kwargs)
        
        # Ensure status is one of the valid choices
        if self.status and self.status not in EMAIL_STATUS_CHOICES:
            raise ValueError(f"Status must be one of: {', '.join(EMAIL_STATUS_CHOICES)}")
        
        # Initialize empty attachments list if not provided
        if self.attachments is None:
            self.attachments = []
        
        # Set current timestamp for received_at if not provided
        if self.received_at is None:
            self.received_at = datetime.utcnow()
    
    def __repr__(self):
        """String representation of the Email instance."""
        return f"<Email(id={self.id}, subject='{self.subject[:30]}...', status='{self.status}')>"