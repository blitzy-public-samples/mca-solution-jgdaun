# Third-party imports
from pydantic import BaseModel, validator, Field  # v1.8.2
from typing import Optional, Dict, List
from datetime import datetime
from uuid import UUID

# Internal imports
from app.schemas.document import DocumentBase

# Constants for OCR validation based on technical specifications
OCR_STATUS_CHOICES = ['pending', 'processing', 'processed', 'failed']
MIN_CONFIDENCE_SCORE = 0.0
MAX_CONFIDENCE_SCORE = 1.0
AUTO_APPROVE_THRESHOLD = 0.95  # Auto-approve threshold from confidence scoring matrix
MANUAL_REVIEW_THRESHOLD = 0.70  # Manual review threshold from confidence scoring matrix

@pydantic.config(arbitrary_types_allowed=True)
class OCRBase(BaseModel):
    """
    Base Pydantic model for OCR data validation with comprehensive field validation 
    and confidence scoring based on the OCR confidence scoring matrix.
    """
    # Required fields
    id: UUID = Field(default_factory=uuid.uuid4)
    document_id: UUID = Field(..., description="Reference to the processed document")
    extracted_text: str = Field(..., min_length=1)
    confidence_score: float = Field(..., description="Overall confidence score of OCR extraction")
    status: str = Field(default='pending')
    
    # Optional fields
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Additional metadata about OCR processing"
    )
    field_scores: Optional[List[Dict[str, float]]] = Field(
        default_factory=list,
        description="Individual confidence scores for extracted fields"
    )

    @validator('status')
    def validate_status(cls, value: str) -> str:
        """
        Validates OCR status against allowed statuses.
        Ensures status aligns with OCR processing workflow states.
        """
        if not value:
            raise ValueError("OCR status cannot be empty")
        
        value = value.lower()
        if value not in OCR_STATUS_CHOICES:
            raise ValueError(
                f"Invalid OCR status. Must be one of: {', '.join(OCR_STATUS_CHOICES)}"
            )
        return value

    @validator('confidence_score')
    def validate_confidence_score(cls, value: float) -> float:
        """
        Validates confidence score is within acceptable range and rounds to 4 decimal places.
        Implements validation based on OCR confidence scoring matrix from technical specifications.
        """
        if value < MIN_CONFIDENCE_SCORE or value > MAX_CONFIDENCE_SCORE:
            raise ValueError(
                f"Confidence score must be between {MIN_CONFIDENCE_SCORE} and {MAX_CONFIDENCE_SCORE}"
            )
        
        # Round to 4 decimal places for consistency
        return round(value, 4)

class OCRCreate(OCRBase):
    """
    Schema for creating a new OCR record, inheriting from OCRBase with specific creation requirements.
    Used during initial OCR processing of documents.
    """
    id: Optional[UUID] = None  # Made optional for creation
    status: str = Field(default='pending')  # Default status for new OCR records
    metadata: Dict[str, Any] = Field(default_factory=dict)
    field_scores: List[Dict[str, float]] = Field(default_factory=list)

class OCRInDB(OCRBase):
    """
    Schema representing an OCR record as stored in the database with timestamps 
    and processing metadata. Includes all fields required for database storage.
    """
    # Database-specific timestamp fields
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())
    updated_at: datetime = Field(default_factory=lambda: datetime.utcnow())
    processed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    class Config:
        orm_mode = True  # Enable ORM mode for database integration
        allow_population_by_field_name = True  # Allow population by field name for flexibility