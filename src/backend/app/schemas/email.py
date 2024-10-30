# Third-party imports
from pydantic import BaseModel, EmailStr, Field  # pydantic v1.8.2
from uuid import UUID  # uuid v3.8
from datetime import datetime  # datetime v3.8

# Global constants for email validation and constraints
EMAIL_STATUS_CHOICES = ['pending', 'processing', 'processed', 'failed']
EMAIL_SUBJECT_MAX_LENGTH = 256
EMAIL_BODY_MAX_LENGTH = 65536

class EmailBase(BaseModel):
    """Base Pydantic model for email data validation and serialization.
    
    Implements core email fields with validation rules according to the system's
    email processing requirements.
    """
    sender: EmailStr = Field(
        ...,  # Required field
        description="Email address of the sender",
        example="sender@example.com"
    )
    recipient: EmailStr = Field(
        ...,
        description="Email address of the recipient",
        example="recipient@example.com"
    )
    subject: str = Field(
        ...,
        max_length=EMAIL_SUBJECT_MAX_LENGTH,
        description="Email subject line",
        example="New Document Submission"
    )
    body: str = Field(
        ...,
        max_length=EMAIL_BODY_MAX_LENGTH,
        description="Email body content",
        example="Please find attached documents for processing."
    )
    status: str = Field(
        default='pending',
        description="Current status of email processing",
        example="pending"
    )

    class Config:
        """Configuration class for EmailBase model with example values and validation settings."""
        schema_extra = {
            "example": {
                "sender": "sender@example.com",
                "recipient": "processing@system.com",
                "subject": "Document Processing Request",
                "body": "Please process the attached documents.",
                "status": "pending"
            }
        }
        validate_assignment = True

    @validator('status')
    def validate_status(cls, v):
        """Validates that the status is one of the allowed choices."""
        if v not in EMAIL_STATUS_CHOICES:
            raise ValueError(f'Status must be one of {EMAIL_STATUS_CHOICES}')
        return v

class EmailCreate(EmailBase):
    """Schema for creating new email records.
    
    Inherits from EmailBase and sets default status as 'pending'.
    Used for initial email creation in the system.
    """
    status: str = Field(
        default='pending',
        description="Initial status for new emails",
    )

class EmailInDB(EmailBase):
    """Schema for email records as stored in database.
    
    Extends EmailBase with additional fields required for database storage
    and processing tracking.
    """
    id: UUID = Field(
        ...,
        description="Unique identifier for the email record"
    )
    received_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when email was received"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when record was created"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when record was last updated"
    )
    attachments: list[str] = Field(
        default_factory=list,
        description="List of attachment file paths"
    )
    processing_confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Confidence score of email processing"
    )

    class Config:
        """Configuration class for EmailInDB model enabling ORM mode."""
        orm_mode = True
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "sender": "sender@example.com",
                "recipient": "processing@system.com",
                "subject": "Document Processing Request",
                "body": "Please process the attached documents.",
                "status": "processing",
                "received_at": "2023-01-01T00:00:00Z",
                "created_at": "2023-01-01T00:00:00Z",
                "updated_at": "2023-01-01T00:00:00Z",
                "attachments": ["/storage/attachments/doc1.pdf"],
                "processing_confidence": 0.95
            }
        }