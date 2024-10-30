"""
Document Service Module

This module implements the document service responsible for handling document-related operations
including creation, retrieval, validation, and storage management within the application.
Integrates with S3 for document storage and provides comprehensive error handling.

Version Requirements:
- boto3==1.18.0
- sqlalchemy==1.4.22
"""

import logging
from typing import Optional
from uuid import UUID
import os
from datetime import datetime

from sqlalchemy.exc import SQLAlchemyError
from botocore.exceptions import ClientError

from app.models.document import Document
from app.schemas.document import DocumentCreate
from app.utils.storage import upload_document_to_s3, retrieve_document_from_db
from app.utils.validation import validate_document_data
from app.core.config import Config

# Configure logging
logger = logging.getLogger(__name__)

# Constants for document processing
ALLOWED_STATUSES = ["pending", "processing", "processed", "failed", "error"]
VALID_CONFIDENCE_RANGE = (0.0, 1.0)

async def create_document(document_data: DocumentCreate, file_content: bytes) -> Document:
    """
    Creates a new document record in the database and uploads the document to S3
    with comprehensive validation and error handling.
    
    Args:
        document_data (DocumentCreate): Validated document metadata
        file_content (bytes): Binary content of the document file
        
    Returns:
        Document: The created document object with storage details
        
    Raises:
        ValidationError: If document data validation fails
        StorageError: If document upload to S3 fails
        DatabaseError: If database operation fails
    """
    try:
        # Step 1: Validate document data using business rules
        # Implements validation requirements from document_processing_flow
        validation_rules = {
            "type": {"type": "str", "required": True},
            "classification": {"type": "str", "required": True},
            "application_id": {"type": "uuid", "required": True}
        }
        validate_document_data(document_data.dict(), validation_rules)
        
        # Step 2: Create temporary file for S3 upload
        temp_file_path = f"/tmp/{document_data.id}.tmp"
        try:
            with open(temp_file_path, "wb") as temp_file:
                temp_file.write(file_content)
            
            # Step 3: Upload document to S3 and get storage URL
            # Implements storage requirements from document_processing_flow
            s3_url = upload_document_to_s3(
                file_path=temp_file_path,
                document_id=str(document_data.id)
            )
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
        
        # Step 4: Create Document object with storage details
        document = Document(
            id=document_data.id,
            application_id=document_data.application_id,
            type=document_data.type,
            storage_path=s3_url,
            classification=document_data.classification,
            status="pending",
            uploaded_at=datetime.utcnow(),
            metadata=document_data.metadata
        )
        
        # Step 5: Save document to database
        from app.db.session import SessionLocal
        db = SessionLocal()
        try:
            db.add(document)
            db.commit()
            db.refresh(document)
            
            logger.info(
                f"Successfully created document {document.id} "
                f"of type {document.type}"
            )
            return document
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error while creating document: {str(e)}")
            raise
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Error creating document: {str(e)}")
        raise

async def get_document(document_id: UUID) -> Optional[Document]:
    """
    Retrieves a document record from the database by its ID with error handling
    and validation.
    
    Args:
        document_id (UUID): Unique identifier of the document
        
    Returns:
        Optional[Document]: The retrieved document object if found
        
    Raises:
        ValueError: If document_id is invalid
        DatabaseError: If database operation fails
    """
    try:
        # Step 1: Validate document_id format
        if not isinstance(document_id, UUID):
            raise ValueError("Invalid document ID format")
        
        # Step 2: Retrieve document from database
        document = retrieve_document_from_db(document_id)
        
        if document is None:
            logger.warning(f"Document not found with ID: {document_id}")
            return None
        
        logger.info(f"Successfully retrieved document {document_id}")
        return document
        
    except Exception as e:
        logger.error(f"Error retrieving document {document_id}: {str(e)}")
        raise

async def update_document_status(
    document_id: UUID,
    status: str,
    confidence_score: Optional[float] = None
) -> Document:
    """
    Updates the processing status of a document with validation.
    
    Args:
        document_id (UUID): Document identifier
        status (str): New processing status
        confidence_score (Optional[float]): OCR confidence score
        
    Returns:
        Document: The updated document object
        
    Raises:
        ValueError: If status or confidence_score is invalid
        DocumentNotFound: If document doesn't exist
        DatabaseError: If update operation fails
    """
    try:
        # Step 1: Validate status
        if status not in ALLOWED_STATUSES:
            raise ValueError(
                f"Invalid status. Must be one of: {', '.join(ALLOWED_STATUSES)}"
            )
        
        # Step 2: Validate confidence score if provided
        if confidence_score is not None:
            if not (VALID_CONFIDENCE_RANGE[0] <= confidence_score <= VALID_CONFIDENCE_RANGE[1]):
                raise ValueError(
                    f"Confidence score must be between "
                    f"{VALID_CONFIDENCE_RANGE[0]} and {VALID_CONFIDENCE_RANGE[1]}"
                )
        
        # Step 3: Retrieve document
        document = await get_document(document_id)
        if not document:
            raise ValueError(f"Document not found with ID: {document_id}")
        
        # Step 4: Update document status and confidence score
        from app.db.session import SessionLocal
        db = SessionLocal()
        try:
            document.status = status
            if confidence_score is not None:
                document.confidence_score = confidence_score
            document.updated_at = datetime.utcnow()
            
            db.add(document)
            db.commit()
            db.refresh(document)
            
            logger.info(
                f"Successfully updated document {document_id} "
                f"status to {status}"
            )
            return document
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error while updating document status: {str(e)}")
            raise
        finally:
            db.close()
            
    except Exception as e:
        logger.error(
            f"Error updating document {document_id} status to {status}: {str(e)}"
        )
        raise