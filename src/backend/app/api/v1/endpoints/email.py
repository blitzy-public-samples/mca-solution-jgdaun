"""
Email Endpoints Module

This module implements secure RESTful API endpoints for email operations including sending,
receiving, and processing emails within the backend application.

Version Requirements:
- fastapi==0.68.0
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import JSONResponse

# Internal imports
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.email import EmailCreate
from app.services.email_service import send_email_service, process_email_service
from app.core.logging import get_logger

# Initialize router with prefix and tags
router = APIRouter(prefix='/api/v1/email', tags=['email'])

# Initialize logger
logger = get_logger(__name__)

@router.post('/send', status_code=202)
async def send_email_endpoint(
    email_data: EmailCreate,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Handles the sending of emails through the email service with proper validation
    and error handling.

    Args:
        email_data: Validated email data using EmailCreate schema
        current_user: Authenticated user from dependency

    Returns:
        Dict[str, Any]: Response containing email send status, tracking ID, and timestamp

    Raises:
        HTTPException: 400 if validation fails
        HTTPException: 503 if email service is unavailable
    """
    try:
        # Log the email send request
        logger.info(
            "Email send request received",
            extra={
                "user_id": str(current_user.id),
                "recipient": email_data.recipient,
                "subject": email_data.subject
            }
        )

        # Call email service to handle sending
        result = await send_email_service(
            recipient=email_data.recipient,
            subject=email_data.subject,
            body=email_data.body,
            attachments=None  # Attachments handling can be added based on requirements
        )

        # Return success response with tracking details
        return JSONResponse(
            status_code=status.HTTP_202_ACCEPTED,
            content={
                "status": "accepted",
                "message": "Email queued for delivery",
                "tracking_id": result.get("email_id"),
                "timestamp": result.get("timestamp")
            }
        )

    except ValidationException as ve:
        # Handle validation errors
        logger.error(
            f"Email validation failed",
            extra={
                "user_id": str(current_user.id),
                "error": str(ve)
            }
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )

    except CustomException as ce:
        # Handle service-specific errors
        logger.error(
            f"Email service error",
            extra={
                "user_id": str(current_user.id),
                "error": str(ce)
            }
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service temporarily unavailable"
        )

    except Exception as e:
        # Handle unexpected errors
        logger.error(
            f"Unexpected error in send_email_endpoint",
            extra={
                "user_id": str(current_user.id),
                "error": str(e)
            }
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post('/process', status_code=202)
async def process_email_endpoint(
    raw_email: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Processes incoming emails securely and stores the processed data with proper validation.
    Implements the email processing flow from system architecture requirements.

    Args:
        raw_email: Raw email content to process
        current_user: Authenticated user from dependency

    Returns:
        Dict[str, Any]: Response containing processed email data, metadata, and status

    Raises:
        HTTPException: 400 if email format is invalid
        HTTPException: 422 if processing fails
    """
    try:
        # Log the processing request
        logger.info(
            "Email processing request received",
            extra={
                "user_id": str(current_user.id),
                "content_length": len(raw_email)
            }
        )

        # Basic validation of raw email format
        if not raw_email or len(raw_email.strip()) == 0:
            raise ValidationException("Empty email content")

        # Call email service to process the raw email
        result = await process_email_service(raw_email)

        # Return success response with processed data
        return JSONResponse(
            status_code=status.HTTP_202_ACCEPTED,
            content={
                "status": "accepted",
                "message": "Email processing initiated",
                "email_id": result.get("email_id"),
                "metadata": {
                    "received_at": result.get("processed_data", {}).get("received_at"),
                    "sender": result.get("processed_data", {}).get("sender"),
                    "subject": result.get("processed_data", {}).get("subject"),
                    "attachments_count": result.get("processed_data", {}).get("attachments_count", 0)
                },
                "processing_status": result.get("processed_data", {}).get("processing_status")
            }
        )

    except ValidationException as ve:
        # Handle validation errors
        logger.error(
            f"Email format validation failed",
            extra={
                "user_id": str(current_user.id),
                "error": str(ve)
            }
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )

    except CustomException as ce:
        # Handle processing errors
        logger.error(
            f"Email processing error",
            extra={
                "user_id": str(current_user.id),
                "error": str(ce)
            }
        )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email processing failed"
        )

    except Exception as e:
        # Handle unexpected errors
        logger.error(
            f"Unexpected error in process_email_endpoint",
            extra={
                "user_id": str(current_user.id),
                "error": str(e)
            }
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )