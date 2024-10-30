"""
Document ORM Model Module

This module defines the SQLAlchemy ORM model for documents, implementing the core database schema
for document management and persistence. It handles document metadata, processing status, and
relationships with applications while ensuring data integrity and efficient querying.

Version Requirements:
- SQLAlchemy==1.4.22
"""

from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID, JSON
from app.db.base import Base
import uuid

class Document(Base):
    """
    SQLAlchemy ORM model for documents, representing the documents table in the database.
    
    This model implements the core schema design for document management, tracking document
    metadata, processing status, and maintaining relationships with applications.
    """
    
    # Define table name following PostgreSQL naming conventions
    __tablename__ = "documents"
    
    # Primary key using UUID for global uniqueness and security
    # Implements requirement from core_schema for unique document identification
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="Unique identifier for the document"
    )
    
    # Foreign key relationship with applications table
    # Implements the relationship defined in core_schema ERD
    application_id = Column(
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        comment="Reference to the parent application"
    )
    
    # Document type classification
    # Supports document processing flow requirements for classification
    type = Column(
        String(50),
        nullable=False,
        comment="Type of document (e.g., 'bank_statement', 'tax_return', 'id_proof')"
    )
    
    # Storage location for the document file
    # Implements storage requirements from document_processing_flow
    storage_path = Column(
        String(255),
        nullable=False,
        comment="S3 storage path or file location reference"
    )
    
    # Document classification result
    # Supports classification engine requirements from processing flow
    classification = Column(
        String(100),
        nullable=True,
        comment="Classified document category"
    )
    
    # Document upload timestamp
    # Tracks document lifecycle as per processing flow requirements
    uploaded_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        comment="Timestamp when document was uploaded"
    )
    
    # Processing status tracking
    # Implements status tracking requirements from document_processing_flow
    status = Column(
        String(20),
        nullable=False,
        default="pending",
        comment="Current processing status of the document"
    )
    
    # OCR confidence score
    # Implements OCR pipeline requirements for quality assessment
    confidence_score = Column(
        Float,
        nullable=True,
        comment="OCR confidence score between 0 and 1"
    )
    
    # Document metadata storage
    # Supports data extraction requirements from processing flow
    metadata = Column(
        JSON,
        nullable=True,
        comment="Extracted metadata and processing results"
    )
    
    # Audit timestamps
    # Implements data tracking requirements
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        comment="Timestamp when record was created"
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        comment="Timestamp when record was last updated"
    )

    def to_dict(self) -> dict:
        """
        Converts the document model instance to a dictionary representation.
        
        Returns:
            dict: Dictionary containing all document attributes in a serializable format
        """
        return {
            'id': str(self.id),
            'application_id': str(self.application_id),
            'type': self.type,
            'storage_path': self.storage_path,
            'classification': self.classification,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
            'status': self.status,
            'confidence_score': float(self.confidence_score) if self.confidence_score is not None else None,
            'metadata': self.metadata,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }