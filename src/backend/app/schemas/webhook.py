# Third-party imports
from pydantic import BaseModel, Field, validator  # pydantic v1.9.0
from uuid import UUID
from datetime import datetime

# Define webhook event and status choices as constants
WEBHOOK_EVENT_CHOICES = ['application.processed', 'document.uploaded', 'email.received']
WEBHOOK_STATUS_CHOICES = ['pending', 'delivered', 'failed']

class WebhookMetadata(BaseModel):
    """Schema for webhook metadata information.
    
    Attributes:
        processing_time (float): Time taken to process the webhook event in seconds
        version (str): Version of the webhook payload schema
    """
    processing_time: float = Field(..., description="Processing time in seconds")
    version: str = Field(..., description="Webhook payload schema version")

class WebhookData(BaseModel):
    """Schema for webhook payload data.
    
    Attributes:
        status (str): Processing status of the application
        confidence_score (float): OCR confidence score between 0 and 1
        merchant_name (str): Name of the merchant
        ein (str): Employer Identification Number
        requested_amount (float): Amount requested in the application
        document_count (int): Number of documents in the application
    """
    status: str = Field(..., description="Processing status")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="OCR confidence score")
    merchant_name: str = Field(..., description="Merchant name")
    ein: str = Field(..., description="Employer Identification Number")
    requested_amount: float = Field(..., gt=0, description="Requested funding amount")
    document_count: int = Field(..., ge=0, description="Number of documents")

class WebhookBase(BaseModel):
    """Base Pydantic model for webhook data validation.
    
    Attributes:
        id (UUID): Unique identifier for the webhook
        event (str): Type of webhook event
        application_id (UUID): Associated application ID
        timestamp (datetime): Event timestamp
        data (WebhookData): Webhook payload data
        metadata (WebhookMetadata): Webhook metadata
        status (str): Webhook delivery status
    """
    id: UUID = Field(..., description="Unique webhook identifier")
    event: str = Field(..., description="Webhook event type")
    application_id: UUID = Field(..., description="Associated application ID")
    timestamp: datetime = Field(default_factory=lambda: datetime.utcnow(), description="Event timestamp")
    data: WebhookData
    metadata: WebhookMetadata
    status: str = Field(..., description="Webhook delivery status")

    @validator('event')
    def validate_event(cls, value: str) -> str:
        """Validates webhook event against allowed events.
        
        Args:
            value (str): Event type to validate
            
        Returns:
            str: Validated event type
            
        Raises:
            ValueError: If event type is not in allowed choices
        """
        if value not in WEBHOOK_EVENT_CHOICES:
            raise ValueError(f"Event must be one of {WEBHOOK_EVENT_CHOICES}")
        return value

    @validator('status')
    def validate_status(cls, value: str) -> str:
        """Validates webhook status against allowed statuses.
        
        Args:
            value (str): Status to validate
            
        Returns:
            str: Validated status
            
        Raises:
            ValueError: If status is not in allowed choices
        """
        if value not in WEBHOOK_STATUS_CHOICES:
            raise ValueError(f"Status must be one of {WEBHOOK_STATUS_CHOICES}")
        return value

class WebhookCreate(WebhookBase):
    """Schema for creating a new webhook, inheriting from WebhookBase.
    
    Makes id optional and sets default values for event and status.
    """
    id: UUID | None = None
    event: str = Field(default='application.processed', description="Webhook event type")
    status: str = Field(default='pending', description="Initial webhook status")

    class Config:
        schema_extra = {
            "example": {
                "event": "application.processed",
                "application_id": "123e4567-e89b-12d3-a456-426614174000",
                "data": {
                    "status": "complete",
                    "confidence_score": 0.95,
                    "merchant_name": "Example Corp",
                    "ein": "12-3456789",
                    "requested_amount": 50000.00,
                    "document_count": 3
                },
                "metadata": {
                    "processing_time": 1.5,
                    "version": "1.0"
                },
                "status": "pending"
            }
        }

class WebhookInDB(WebhookBase):
    """Schema representing a webhook as stored in the database, matching ProcessingLogs entity.
    
    Attributes:
        created_at (datetime): Timestamp when webhook was created
        updated_at (datetime): Timestamp when webhook was last updated
        retry_count (int): Number of delivery attempts
        error_message (str): Error message if delivery failed
    """
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow(), description="Creation timestamp")
    updated_at: datetime = Field(default_factory=lambda: datetime.utcnow(), description="Last update timestamp")
    retry_count: int = Field(default=0, ge=0, description="Number of delivery attempts")
    error_message: str | None = Field(default=None, description="Error message if delivery failed")

    class Config:
        orm_mode = True