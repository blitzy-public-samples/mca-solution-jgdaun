"""
Email Service Module

This module implements the service layer for email-related operations, providing high-level
business logic for sending and processing emails with proper validation, error handling,
and logging.

Version Requirements:
- smtplib (builtin)
- email (builtin)
- typing (builtin)
"""

from typing import Dict, List, Optional, Any
from datetime import datetime

# Internal imports
from app.core.config import Config
from app.core.exceptions import CustomException, ValidationException
from app.core.logging import get_logger
from app.models.email import Email
from app.schemas.email import EmailCreate, EmailInDB
from app.utils.email import send_email, process_incoming_email, validate_email_format

# Initialize logger for email service
logger = get_logger(__name__)

async def send_email_service(
    recipient: str,
    subject: str,
    body: str,
    attachments: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Service function that handles email sending with validation, error handling, and logging.
    Implements the email sending requirements from the system specification.
    
    Args:
        recipient (str): Email address of the recipient
        subject (str): Email subject line
        body (str): Email body content
        attachments (Optional[List[str]]): List of file paths to attach
        
    Returns:
        Dict[str, Any]: A dictionary containing the email send status and any error messages
        
    Raises:
        ValidationException: If email validation fails
        CustomException: If email sending fails
    """
    try:
        # Log the email send attempt
        logger.info(
            f"Attempting to send email",
            extra={
                "recipient": recipient,
                "subject": subject,
                "has_attachments": bool(attachments)
            }
        )
        
        # Validate recipient email format
        if not validate_email_format(recipient):
            error_msg = f"Invalid recipient email format: {recipient}"
            logger.error(error_msg)
            raise ValidationException(message=error_msg, code="400")
        
        # Create email data for validation
        email_data = EmailCreate(
            sender=Config.email_username,
            recipient=recipient,
            subject=subject,
            body=body,
            status="pending"
        )
        
        # Send email using utility function
        send_success = send_email(
            recipient=recipient,
            subject=subject,
            body=body,
            attachments=attachments
        )
        
        if not send_success:
            error_msg = f"Failed to send email to {recipient}"
            logger.error(error_msg)
            raise CustomException(message=error_msg, code="500")
        
        # Create and store Email model instance
        email_record = Email(
            sender=Config.email_username,
            recipient=recipient,
            subject=subject,
            body=body,
            status="processed",
            attachments=attachments if attachments else [],
            received_at=datetime.utcnow()
        )
        
        # TODO: Implement database session handling
        # await db.add(email_record)
        # await db.commit()
        # await db.refresh(email_record)
        
        # Log successful email send
        logger.info(
            f"Email sent successfully",
            extra={
                "recipient": recipient,
                "subject": subject,
                "email_id": str(email_record.id)
            }
        )
        
        # Return success response
        return {
            "status": "success",
            "message": "Email sent successfully",
            "email_id": str(email_record.id),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except ValidationException as ve:
        logger.error(f"Validation error in send_email_service: {str(ve)}")
        raise
    except CustomException as ce:
        logger.error(f"Custom error in send_email_service: {str(ce)}")
        raise
    except Exception as e:
        error_msg = f"Unexpected error in send_email_service: {str(e)}"
        logger.error(error_msg)
        raise CustomException(message=error_msg, code="500")

async def process_email_service(raw_email: str) -> Dict[str, Any]:
    """
    Service function that handles incoming email processing with validation and storage.
    Implements the email processing requirements from the system specification.
    
    Args:
        raw_email (str): Raw email content to process
        
    Returns:
        Dict[str, Any]: A dictionary containing the processed email content, metadata,
                       and processing status
        
    Raises:
        ValidationException: If email processing or validation fails
        CustomException: If email storage fails
    """
    try:
        # Log the processing attempt
        logger.info("Starting email processing")
        
        # Process the raw email using utility function
        processed_data = process_incoming_email(raw_email)
        
        # Validate processed data using schema
        email_data = EmailCreate(
            sender=processed_data["sender"],
            recipient=processed_data["recipient"],
            subject=processed_data["subject"],
            body=processed_data["body"],
            status="processing"
        )
        
        # Create Email model instance
        email_record = Email(
            sender=email_data.sender,
            recipient=email_data.recipient,
            subject=email_data.subject,
            body=email_data.body,
            status="processing",
            attachments=processed_data.get("attachments", []),
            received_at=datetime.utcnow()
        )
        
        # TODO: Implement database session handling
        # await db.add(email_record)
        # await db.commit()
        # await db.refresh(email_record)
        
        # Update status to processed
        email_record.status = "processed"
        # await db.commit()
        
        # Log successful processing
        logger.info(
            f"Email processed successfully",
            extra={
                "email_id": str(email_record.id),
                "sender": email_record.sender,
                "attachments_count": len(email_record.attachments)
            }
        )
        
        # Return processed data
        return {
            "status": "success",
            "message": "Email processed successfully",
            "email_id": str(email_record.id),
            "processed_data": {
                "sender": email_record.sender,
                "recipient": email_record.recipient,
                "subject": email_record.subject,
                "received_at": email_record.received_at.isoformat(),
                "attachments_count": len(email_record.attachments),
                "processing_status": email_record.status
            }
        }
        
    except ValidationException as ve:
        logger.error(f"Validation error in process_email_service: {str(ve)}")
        raise
    except Exception as e:
        error_msg = f"Unexpected error in process_email_service: {str(e)}"
        logger.error(error_msg)
        raise CustomException(message=error_msg, code="500")