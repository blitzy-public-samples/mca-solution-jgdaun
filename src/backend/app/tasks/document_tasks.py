"""
Document Tasks Module

This module implements asynchronous Celery tasks for document processing, handling the complete
document lifecycle including creation, storage, validation, and status updates.
Integrates with S3 storage and implements robust error handling with retries.

Version Requirements:
- celery==5.1.2
- tenacity==8.0.1
"""

import logging
from uuid import UUID
from typing import Dict, Optional
from celery import Task
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)

from app.core.celery_app import celery_app
from app.models.document import Document
from app.services.document_service import create_document
from app.utils.storage import upload_document_to_s3

# Configure logging
logger = logging.getLogger(__name__)

# Define document processing statuses
DOCUMENT_STATUSES = {
    'PENDING': 'pending',
    'PROCESSING': 'processing',
    'COMPLETED': 'completed',
    'FAILED': 'failed'
}

# Configure retry settings for resilient processing
RETRY_SETTINGS = {
    'max_attempts': 3,
    'wait_exponential_multiplier': 1000,  # milliseconds
    'wait_exponential_max': 10000  # milliseconds
}

class DocumentProcessingTask(Task):
    """Base task class for document processing with error handling."""
    
    abstract = True

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """
        Handles task failure by updating document status and logging error details.
        Implements error handling requirements from processing pipeline.
        """
        try:
            document_id = args[0] if args else kwargs.get('document_id')
            if document_id:
                # Update document status to FAILED
                update_document_status.delay(
                    document_id=document_id,
                    status=DOCUMENT_STATUSES['FAILED'],
                    error_details={'error': str(exc), 'task_id': task_id}
                )
        except Exception as e:
            logger.error(f"Error in failure handler: {str(e)}")
        finally:
            super().on_failure(exc, task_id, args, kwargs, einfo)

@celery_app.task(
    bind=True,
    base=DocumentProcessingTask,
    max_retries=3,
    name='tasks.process_document'
)
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry=retry_if_exception_type((IOError, ConnectionError))
)
def process_document(
    self,
    document_id: UUID,
    file_content: bytes,
    metadata: Dict
) -> Document:
    """
    Asynchronously processes a document by creating a record, uploading to S3,
    and updating its status with proper error handling and retries.
    
    Implements document processing flow requirements from technical specification.
    
    Args:
        document_id (UUID): Unique identifier for the document
        file_content (bytes): Binary content of the document
        metadata (Dict): Document metadata including type, classification, etc.
        
    Returns:
        Document: The processed document object with updated status and storage details
        
    Raises:
        Exception: For unrecoverable processing errors after retries are exhausted
    """
    logger.info(f"Starting document processing for ID: {document_id}")
    
    try:
        # Step 1: Update initial status to PROCESSING
        update_document_status.delay(
            document_id=document_id,
            status=DOCUMENT_STATUSES['PROCESSING']
        )
        
        # Step 2: Validate document metadata and content
        if not metadata or not file_content:
            raise ValueError("Invalid document metadata or content")
        
        # Step 3: Generate unique S3 file path
        s3_path = f"documents/{document_id}/{metadata.get('type', 'unknown')}"
        
        # Step 4: Upload document to S3 with retry mechanism
        try:
            storage_url = upload_document_to_s3(
                file_path=file_content,
                document_id=str(document_id)
            )
            metadata['storage_url'] = storage_url
        except Exception as e:
            logger.error(f"S3 upload failed for document {document_id}: {str(e)}")
            raise
        
        # Step 5: Create document record with validated data
        try:
            document = create_document(
                document_data={
                    'id': document_id,
                    'type': metadata.get('type'),
                    'classification': metadata.get('classification'),
                    'application_id': metadata.get('application_id'),
                    'metadata': metadata
                },
                file_content=file_content
            )
        except Exception as e:
            logger.error(f"Document creation failed for ID {document_id}: {str(e)}")
            raise
        
        # Step 6: Update status to COMPLETED
        update_document_status.delay(
            document_id=document_id,
            status=DOCUMENT_STATUSES['COMPLETED']
        )
        
        logger.info(f"Successfully processed document {document_id}")
        return document
        
    except Exception as e:
        logger.error(f"Document processing failed for ID {document_id}: {str(e)}")
        # Update status to FAILED and retry if attempts remain
        update_document_status.delay(
            document_id=document_id,
            status=DOCUMENT_STATUSES['FAILED'],
            error_details={'error': str(e)}
        )
        raise self.retry(exc=e)

@celery_app.task(
    bind=True,
    name='tasks.update_document_status'
)
def update_document_status(
    self,
    document_id: UUID,
    status: str,
    error_details: Optional[Dict] = None
) -> bool:
    """
    Updates the processing status of a document with proper error handling.
    
    Implements status tracking requirements from document processing flow.
    
    Args:
        document_id (UUID): Document identifier
        status (str): New processing status
        error_details (Optional[Dict]): Error information if status is FAILED
        
    Returns:
        bool: True if status update successful, False otherwise
    """
    logger.info(f"Updating status for document {document_id} to {status}")
    
    try:
        # Step 1: Validate status
        if status not in DOCUMENT_STATUSES.values():
            raise ValueError(f"Invalid status: {status}")
        
        # Step 2: Retrieve document record
        from app.db.session import SessionLocal
        db = SessionLocal()
        try:
            document = db.query(Document).filter(Document.id == document_id).first()
            if not document:
                raise ValueError(f"Document not found: {document_id}")
            
            # Step 3: Update status and error details
            document.status = status
            if error_details and status == DOCUMENT_STATUSES['FAILED']:
                document.metadata = {
                    **(document.metadata or {}),
                    'error_details': error_details
                }
            
            # Step 4: Commit changes
            db.commit()
            logger.info(f"Successfully updated document {document_id} status to {status}")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"Database error updating document {document_id} status: {str(e)}")
            raise
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Failed to update document {document_id} status: {str(e)}")
        return False