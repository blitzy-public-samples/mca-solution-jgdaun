"""
Email Tasks Module

This module defines Celery tasks for asynchronous email processing operations including
sending and receiving emails with proper error handling, retries, and logging capabilities.

Version Requirements:
- celery==5.1.2
"""

from typing import Dict, List, Optional, Any
from celery.exceptions import MaxRetriesExceededError
from celery.utils.log import get_task_logger

# Internal imports
from app.core.celery_app import celery_app
from app.services.email_service import send_email_service, process_email_service

# Initialize logger for email tasks
logger = get_task_logger(__name__)

@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=300,
    queue='default',
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=3600,
    retry_jitter=True
)
def send_email_task(
    self,
    recipient: str,
    subject: str,
    body: str,
    attachments: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    A Celery task to send an email asynchronously with retries and error handling.
    Implements the asynchronous email sending requirements from the processing pipeline.

    Args:
        recipient (str): Email address of the recipient
        subject (str): Email subject line
        body (str): Email body content
        attachments (Optional[List[str]]): List of file paths to attach

    Returns:
        Dict[str, Any]: A dictionary containing the email send status, tracking ID,
                       and any error messages
    """
    try:
        # Log task initiation with task ID
        logger.info(
            "Starting email send task",
            extra={
                "task_id": self.request.id,
                "recipient": recipient,
                "subject": subject,
                "has_attachments": bool(attachments)
            }
        )

        # Call the email service function
        result = await send_email_service(
            recipient=recipient,
            subject=subject,
            body=body,
            attachments=attachments
        )

        # Log successful task completion
        logger.info(
            "Email send task completed successfully",
            extra={
                "task_id": self.request.id,
                "email_id": result.get("email_id"),
                "status": result.get("status")
            }
        )

        return {
            "task_id": self.request.id,
            "status": "success",
            "email_id": result.get("email_id"),
            "message": "Email sent successfully",
            "timestamp": result.get("timestamp")
        }

    except Exception as exc:
        # Log retry attempt
        logger.warning(
            f"Email send task failed, attempting retry {self.request.retries + 1}/3",
            extra={
                "task_id": self.request.id,
                "error": str(exc),
                "retry_count": self.request.retries
            },
            exc_info=True
        )

        try:
            # Attempt to retry the task
            self.retry(exc=exc)
        except MaxRetriesExceededError:
            # Log final failure after all retries exhausted
            logger.error(
                "Email send task failed permanently after max retries",
                extra={
                    "task_id": self.request.id,
                    "recipient": recipient,
                    "final_error": str(exc)
                }
            )
            raise

@celery_app.task(
    bind=True,
    max_retries=2,
    default_retry_delay=180,
    queue='document_processing',
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=1800,
    retry_jitter=True
)
def process_email_task(self, raw_email: str) -> Dict[str, Any]:
    """
    A Celery task to process an incoming email asynchronously with attachment handling.
    Implements the email processing requirements from the processing pipeline.

    Args:
        raw_email (str): Raw email content to process

    Returns:
        Dict[str, Any]: A dictionary containing the processed email content, metadata,
                       attachments, and processing status
    """
    try:
        # Log task initiation
        logger.info(
            "Starting email processing task",
            extra={
                "task_id": self.request.id,
                "content_length": len(raw_email)
            }
        )

        # Call the email processing service
        result = await process_email_service(raw_email=raw_email)

        # Log successful processing
        logger.info(
            "Email processing task completed successfully",
            extra={
                "task_id": self.request.id,
                "email_id": result.get("email_id"),
                "attachments_count": result.get("processed_data", {}).get("attachments_count", 0)
            }
        )

        return {
            "task_id": self.request.id,
            "status": "success",
            "email_id": result.get("email_id"),
            "processed_data": result.get("processed_data"),
            "message": "Email processed successfully"
        }

    except Exception as exc:
        # Log retry attempt
        logger.warning(
            f"Email processing task failed, attempting retry {self.request.retries + 1}/2",
            extra={
                "task_id": self.request.id,
                "error": str(exc),
                "retry_count": self.request.retries
            },
            exc_info=True
        )

        try:
            # Attempt to retry the task
            self.retry(exc=exc)
        except MaxRetriesExceededError:
            # Log final failure after all retries exhausted
            logger.error(
                "Email processing task failed permanently after max retries",
                extra={
                    "task_id": self.request.id,
                    "final_error": str(exc)
                }
            )
            raise

# Export the task functions
__all__ = ['send_email_task', 'process_email_task']