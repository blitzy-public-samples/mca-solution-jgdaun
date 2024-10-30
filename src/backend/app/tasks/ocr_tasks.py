"""
OCR Tasks Module

This module defines Celery tasks for asynchronous OCR processing of documents,
implementing the document processing pipeline with proper error handling,
retries, and status tracking.

Version Requirements:
- celery==5.1.2
- sqlalchemy==1.4.22
"""

from datetime import datetime
from typing import Dict, Optional
from uuid import UUID

from celery import Task
from sqlalchemy.orm import Session

# Internal imports
from app.core.celery_app import celery_app
from app.services.ocr_service import process_document
from app.models.document import Document
from app.utils.storage import upload_document_to_s3

# Global constants for task configuration
MAX_RETRIES = 3  # Maximum number of retry attempts
RETRY_BACKOFF = True  # Enable exponential backoff
RETRY_DELAY = 60  # Initial retry delay in seconds

class OCRTask(Task):
    """
    Base task class for OCR processing with automatic session management
    and error handling capabilities.
    """
    
    abstract = True
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """
        Handles task failure by updating document status and logging error.
        Implements error handling requirements from processing pipeline.
        """
        try:
            document_id = args[0] if args else None
            if document_id:
                # Get database session
                from app.db.session import SessionLocal
                db = SessionLocal()
                
                try:
                    # Update document status to failed
                    document = db.query(Document).filter(Document.id == document_id).first()
                    if document:
                        document.status = "failed"
                        document.metadata = {
                            **(document.metadata or {}),
                            "error": {
                                "timestamp": datetime.utcnow().isoformat(),
                                "task_id": task_id,
                                "error_type": type(exc).__name__,
                                "error_message": str(exc)
                            }
                        }
                        db.commit()
                finally:
                    db.close()
        except Exception as e:
            # Log any errors during failure handling
            self.logger.error(f"Error in failure handler: {str(e)}")
        
        super().on_failure(exc, task_id, args, kwargs, einfo)

@celery_app.task(
    bind=True,
    base=OCRTask,
    max_retries=MAX_RETRIES,
    retry_backoff=RETRY_BACKOFF,
    retry_delay=RETRY_DELAY,
    queue='ocr'
)
def ocr_task(self, document_id: UUID) -> Dict:
    """
    Asynchronously processes a document through OCR, updates its status,
    and manages storage with proper error handling and retries.
    
    Implements OCR processing requirements from system architecture and
    document processing flow specifications.
    
    Args:
        document_id (UUID): Unique identifier of the document to process
        
    Returns:
        Dict: Processing result containing S3 URL and confidence scores
        
    Raises:
        Exception: For various processing errors, triggering retry mechanism
    """
    # Get database session
    from app.db.session import SessionLocal
    db = SessionLocal()
    
    try:
        # Update document status to processing
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise ValueError(f"Document not found: {document_id}")
        
        document.status = "processing"
        document.metadata = {
            **(document.metadata or {}),
            "processing_started": datetime.utcnow().isoformat(),
            "task_id": self.request.id
        }
        db.commit()
        
        # Process document through OCR service
        # Implements OCR pipeline from processing_pipeline specification
        ocr_result = process_document(document_id)
        
        # Upload processed document to S3
        s3_url = upload_document_to_s3(
            document.storage_path,
            str(document_id)
        )
        
        # Update document status based on confidence score
        # Implements confidence scoring matrix from technical specifications
        confidence_score = ocr_result.confidence_score
        if confidence_score >= 0.95:
            status = "processed"
        elif confidence_score >= 0.70:
            status = "needs_review"
        else:
            status = "failed"
        
        # Update document record with results
        document.status = status
        document.confidence_score = confidence_score
        document.storage_path = s3_url
        document.metadata = {
            **(document.metadata or {}),
            "ocr_processing": {
                "completed_at": datetime.utcnow().isoformat(),
                "confidence_score": confidence_score,
                "status": status,
                "processing_details": ocr_result.metadata
            }
        }
        db.commit()
        
        # Return processing results
        return {
            "document_id": str(document_id),
            "status": status,
            "confidence_score": confidence_score,
            "s3_url": s3_url,
            "processing_details": ocr_result.metadata
        }
        
    except Exception as exc:
        # Handle specific error types
        if isinstance(exc, (ValueError, KeyError)):
            # Don't retry for validation errors
            raise exc
        
        # Update document status for retry
        try:
            if document:
                document.status = "retry_pending"
                document.metadata = {
                    **(document.metadata or {}),
                    "last_error": {
                        "timestamp": datetime.utcnow().isoformat(),
                        "error_type": type(exc).__name__,
                        "error_message": str(exc),
                        "retry_count": self.request.retries
                    }
                }
                db.commit()
        except Exception:
            pass
        
        # Implement exponential backoff retry
        retry_countdown = (RETRY_DELAY * (2 ** self.request.retries)
                         if RETRY_BACKOFF else RETRY_DELAY)
        
        # Raise exception for retry if attempts remain
        raise self.retry(
            exc=exc,
            countdown=retry_countdown,
            max_retries=MAX_RETRIES
        )
        
    finally:
        db.close()