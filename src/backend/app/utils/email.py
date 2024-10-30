"""
Email Utility Module

This module implements email-related operations including sending, receiving, parsing,
and processing emails within the backend application. It provides secure SMTP communication
and robust email content processing with comprehensive error handling.

Version Requirements:
- smtplib (builtin)
- email (builtin)
- typing (builtin)
"""

import smtplib
import re
from email import message_from_string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from typing import Dict, List, Optional, Any
import ssl

# Internal imports
from app.core.config import Config
from app.core.exceptions import ValidationException, NotFoundException
from app.core.logging import get_logger
from app.models.email import Email
from app.schemas.email import EmailSchema

# Initialize logger
logger = get_logger(__name__)

# RFC 5322 compliant email regex pattern
EMAIL_REGEX = r"""(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])"""

def validate_email_format(email_address: str) -> bool:
    """
    Validates email address format using RFC 5322 compliant regex pattern.
    
    Args:
        email_address (str): Email address to validate
        
    Returns:
        bool: True if email format is valid, False otherwise
    """
    try:
        if not email_address:
            return False
        return bool(re.match(EMAIL_REGEX, email_address, re.IGNORECASE))
    except Exception as e:
        logger.error(f"Error validating email format: {str(e)}")
        return False

def send_email(
    recipient: str,
    subject: str,
    body: str,
    attachments: Optional[List[str]] = None
) -> bool:
    """
    Sends an email using SMTP with SSL/TLS encryption and proper error handling.
    
    Args:
        recipient (str): Recipient email address
        subject (str): Email subject line
        body (str): Email body content
        attachments (Optional[List[str]]): List of file paths to attach
        
    Returns:
        bool: True if email was sent successfully, False otherwise
        
    Raises:
        ValidationException: If recipient email format is invalid
    """
    try:
        # Validate recipient email format
        if not validate_email_format(recipient):
            raise ValidationException(f"Invalid recipient email format: {recipient}")
            
        # Create MIME message
        msg = MIMEMultipart()
        msg['From'] = Config.email_username
        msg['To'] = recipient
        msg['Subject'] = subject
        
        # Add body
        msg.attach(MIMEText(body, 'plain'))
        
        # Add attachments if provided
        if attachments:
            for attachment_path in attachments:
                try:
                    with open(attachment_path, 'rb') as f:
                        part = MIMEApplication(f.read(), Name=attachment_path.split('/')[-1])
                        part['Content-Disposition'] = f'attachment; filename="{attachment_path.split("/")[-1]}"'
                        msg.attach(part)
                except FileNotFoundError:
                    logger.error(f"Attachment not found: {attachment_path}")
                    raise NotFoundException(f"Attachment file not found: {attachment_path}")
                except Exception as e:
                    logger.error(f"Error processing attachment {attachment_path}: {str(e)}")
                    raise ValidationException(f"Error processing attachment: {str(e)}")
        
        # Create secure SSL/TLS context
        context = ssl.create_default_context()
        
        # Connect to SMTP server using SSL/TLS
        with smtplib.SMTP(Config.email_host, Config.email_port) as server:
            server.starttls(context=context)
            server.login(Config.email_username, Config.email_password.get_secret_value())
            server.send_message(msg)
            
        logger.info(f"Email sent successfully to {recipient}")
        return True
        
    except ValidationException as ve:
        logger.error(f"Validation error sending email: {str(ve)}")
        raise
    except NotFoundException as nf:
        logger.error(f"Not found error sending email: {str(nf)}")
        raise
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        return False

def process_incoming_email(raw_email: str) -> Dict[str, Any]:
    """
    Processes an incoming email by extracting content, validating data, and storing in database.
    
    Args:
        raw_email (str): Raw email content to process
        
    Returns:
        Dict[str, Any]: Dictionary containing processed email content and metadata
        
    Raises:
        ValidationException: If email parsing or validation fails
    """
    try:
        # Parse raw email
        email_message = message_from_string(raw_email)
        
        # Extract headers
        sender = email_message['From']
        recipient = email_message['To']
        subject = email_message['Subject']
        date = email_message['Date']
        
        # Validate sender and recipient
        if not validate_email_format(sender) or not validate_email_format(recipient):
            raise ValidationException("Invalid sender or recipient email format")
        
        # Extract body (plain text preferred, fallback to HTML)
        if email_message.is_multipart():
            for part in email_message.walk():
                if part.get_content_type() == "text/plain":
                    body = part.get_payload(decode=True).decode()
                    break
                elif part.get_content_type() == "text/html":
                    body = part.get_payload(decode=True).decode()
        else:
            body = email_message.get_payload(decode=True).decode()
        
        # Process attachments
        attachments = []
        if email_message.is_multipart():
            for part in email_message.walk():
                if part.get_content_maintype() == 'multipart':
                    continue
                if part.get('Content-Disposition') is None:
                    continue
                    
                filename = part.get_filename()
                if filename:
                    # TODO: Implement attachment storage logic
                    # For now, just store the filename
                    attachments.append(filename)
        
        # Create email data dictionary
        email_data = {
            "sender": sender,
            "recipient": recipient,
            "subject": subject,
            "body": body,
            "received_at": date,
            "attachments": attachments,
            "status": "pending",
            "processing_confidence": 0.0
        }
        
        # Validate using schema
        validated_data = EmailSchema(**email_data)
        
        # Create Email model instance and store in database
        email_model = Email(**validated_data.dict())
        # TODO: Implement database storage logic
        
        logger.info(f"Successfully processed incoming email from {sender}")
        return email_data
        
    except ValidationException as ve:
        logger.error(f"Validation error processing email: {str(ve)}")
        raise
    except Exception as e:
        logger.error(f"Error processing incoming email: {str(e)}")
        raise ValidationException(f"Error processing incoming email: {str(e)}")