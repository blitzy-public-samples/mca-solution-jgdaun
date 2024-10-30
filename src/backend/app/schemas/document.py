# Third-party imports
from pydantic import BaseModel, validator, constr, Field  # pydantic v1.8.2
from typing import Optional, Dict, Any
from datetime import datetime
import uuid
from uuid import UUID

# Constants for document validation
DOCUMENT_TYPES = ["bank_statement", "tax_return", "profit_loss", "balance_sheet", "invoice", "other"]
DOCUMENT_STATUSES = ["pending", "processing", "processed", "failed", "error"]
MAX_CLASSIFICATION_LENGTH = 100

class DocumentBase(BaseModel):
    """
    Base Pydantic model for document data validation with comprehensive field validation.
    Implements core document schema as defined in system_design.database_design.core_schema
    """
    # Required fields with validation
    id: UUID = Field(default_factory=uuid.uuid4)
    application_id: UUID
    type: str
    storage_path: str = Field(..., min_length=1)
    classification: str
    uploaded_at: datetime = Field(default_factory=lambda: datetime.utcnow())
    status: str = Field(default="pending")
    
    # Optional fields
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            UUID: str,
            datetime: lambda v: v.isoformat()
        }

    @validator('type')
    def validate_type(cls, value: str) -> str:
        """
        Validates document type against allowed types.
        Ensures document type aligns with supported document types in the system.
        """
        if not value:
            raise ValueError("Document type cannot be empty")
        
        value = value.lower()
        if value not in DOCUMENT_TYPES:
            raise ValueError(
                f"Invalid document type. Must be one of: {', '.join(DOCUMENT_TYPES)}"
            )
        return value

    @validator('status')
    def validate_status(cls, value: str) -> str:
        """
        Validates document status against allowed statuses.
        Ensures status transitions align with document processing flow.
        """
        if not value:
            raise ValueError("Document status cannot be empty")
        
        value = value.lower()
        if value not in DOCUMENT_STATUSES:
            raise ValueError(
                f"Invalid document status. Must be one of: {', '.join(DOCUMENT_STATUSES)}"
            )
        return value

    @validator('classification')
    def validate_classification(cls, value: str) -> str:
        """
        Validates document classification length and format.
        Ensures classification meets system requirements for document processing.
        """
        if not value:
            raise ValueError("Document classification cannot be empty")
            
        value = value.strip()
        if len(value) > MAX_CLASSIFICATION_LENGTH:
            raise ValueError(
                f"Classification length exceeds maximum allowed length of {MAX_CLASSIFICATION_LENGTH}"
            )
        return value

class DocumentCreate(DocumentBase):
    """
    Schema for creating a new document, inheriting from DocumentBase with specific creation requirements.
    Used in the initial document upload phase of the document processing flow.
    """
    id: Optional[UUID] = None  # Made optional for creation
    status: str = Field(default="pending")  # Default status for new documents
    confidence_score: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        schema_extra = {
            "example": {
                "application_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "type": "bank_statement",
                "storage_path": "documents/bank_statements/2023/",
                "classification": "monthly_statement",
            }
        }

class DocumentUpdate(DocumentBase):
    """
    Schema for updating an existing document with partial updates support.
    Supports document status updates during processing pipeline stages.
    """
    application_id: Optional[UUID] = None
    type: Optional[str] = None
    storage_path: Optional[str] = None
    classification: Optional[str] = None
    status: Optional[str] = None
    confidence_score: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        extra = "forbid"  # Prevent additional fields in updates

class DocumentInDB(DocumentBase):
    """
    Schema representing a document as stored in the database with all required fields.
    Includes system-managed timestamps and metadata for document tracking.
    """
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())
    updated_at: datetime = Field(default_factory=lambda: datetime.utcnow())

    class Config:
        orm_mode = True  # Enable ORM mode for database integration