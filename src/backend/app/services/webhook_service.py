"""
Webhook Service Module

Implements core webhook service for managing webhook registrations, updates, and event delivery.
Handles secure communication with external systems for real-time event notifications.

Version Requirements:
- requests==2.26.0
- tenacity==8.0.1
"""

import logging
from typing import Dict, Optional
from uuid import UUID
from datetime import datetime

import requests
from tenacity import retry, stop_after_attempt, wait_fixed

from app.models.webhook import Webhook
from app.schemas.webhook import WebhookCreate
from app.core.config import Config
from app.core.security import generate_token
from app.utils.validation import validate_document_data

# Initialize logging
logger = logging.getLogger(__name__)

# Global constants from specification
WEBHOOK_TIMEOUT = 30  # Seconds
MAX_RETRIES = 3
RETRY_DELAY = 5  # Seconds

def register_webhook(webhook_data: WebhookCreate, db) -> Webhook:
    """
    Registers a new webhook with the provided configuration.
    
    Args:
        webhook_data (WebhookCreate): Validated webhook configuration data
        db (SessionLocal): Database session
        
    Returns:
        Webhook: The registered webhook object
        
    Raises:
        ValidationError: If webhook data is invalid
        ConnectionError: If webhook URL is not accessible
    """
    logger.info(f"Registering new webhook for event: {webhook_data.event}")
    
    try:
        # Validate webhook URL is accessible
        response = requests.head(
            webhook_data.url,
            timeout=WEBHOOK_TIMEOUT,
            allow_redirects=True
        )
        response.raise_for_status()
        
        # Create new webhook instance
        webhook = Webhook(
            event=webhook_data.event,
            url=webhook_data.url,
            status="pending",
            retry_count=0,
            application_id=webhook_data.application_id,
            metadata=webhook_data.metadata.dict()
        )
        
        # Add to database
        db.add(webhook)
        db.commit()
        db.refresh(webhook)
        
        logger.info(f"Successfully registered webhook with ID: {webhook.id}")
        return webhook
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to validate webhook URL: {str(e)}")
        raise ConnectionError(f"Webhook URL validation failed: {str(e)}")
    
    except Exception as e:
        logger.error(f"Failed to register webhook: {str(e)}")
        db.rollback()
        raise

def update_webhook(webhook_id: UUID, webhook_data: WebhookCreate, db) -> Webhook:
    """
    Updates an existing webhook with new configuration data.
    
    Args:
        webhook_id (UUID): ID of the webhook to update
        webhook_data (WebhookCreate): New webhook configuration data
        db (SessionLocal): Database session
        
    Returns:
        Webhook: The updated webhook object
        
    Raises:
        ValueError: If webhook not found
        ConnectionError: If new webhook URL is not accessible
    """
    logger.info(f"Updating webhook {webhook_id}")
    
    # Retrieve existing webhook
    webhook = db.query(Webhook).filter(Webhook.id == webhook_id).first()
    if not webhook:
        raise ValueError(f"Webhook {webhook_id} not found")
    
    try:
        # If URL changed, validate new URL
        if webhook_data.url != webhook.url:
            response = requests.head(
                webhook_data.url,
                timeout=WEBHOOK_TIMEOUT,
                allow_redirects=True
            )
            response.raise_for_status()
            
            # Reset retry count for new URL
            webhook.retry_count = 0
        
        # Update webhook attributes
        webhook.event = webhook_data.event
        webhook.url = webhook_data.url
        webhook.metadata = webhook_data.metadata.dict()
        webhook.updated_at = datetime.utcnow()
        
        # Commit changes
        db.commit()
        db.refresh(webhook)
        
        logger.info(f"Successfully updated webhook {webhook_id}")
        return webhook
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to validate new webhook URL: {str(e)}")
        raise ConnectionError(f"Webhook URL validation failed: {str(e)}")
    
    except Exception as e:
        logger.error(f"Failed to update webhook {webhook_id}: {str(e)}")
        db.rollback()
        raise

@retry(stop=stop_after_attempt(MAX_RETRIES), wait=wait_fixed(RETRY_DELAY))
def trigger_webhook(webhook: Webhook, payload: Dict) -> bool:
    """
    Triggers a webhook event by sending data to the registered endpoint with retry logic.
    
    Args:
        webhook (Webhook): The webhook to trigger
        payload (Dict): Event payload to send
        
    Returns:
        bool: True if webhook was successfully triggered
        
    Raises:
        ValidationError: If payload validation fails
        RequestException: If webhook delivery fails after retries
    """
    logger.info(f"Triggering webhook {webhook.id} for event {webhook.event}")
    
    try:
        # Validate payload against webhook event type
        validate_document_data(payload, webhook.event)
        
        # Generate secure token for webhook authentication
        token = generate_token(
            str(webhook.id),
            {"event": webhook.event}
        )
        
        # Prepare headers with authentication and content type
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "X-Webhook-Event": webhook.event,
            "X-Webhook-ID": str(webhook.id)
        }
        
        # Format payload according to specification
        formatted_payload = {
            "event": webhook.event,
            "application_id": str(webhook.application_id),
            "timestamp": datetime.utcnow().isoformat(),
            "data": payload,
            "metadata": {
                "processing_time": 0.0,  # Will be updated after delivery
                "version": "1.0"
            }
        }
        
        # Record start time for processing duration
        start_time = datetime.utcnow()
        
        # Send webhook request
        response = requests.post(
            webhook.url,
            json=formatted_payload,
            headers=headers,
            timeout=WEBHOOK_TIMEOUT
        )
        response.raise_for_status()
        
        # Calculate processing time
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        # Update webhook status and metadata
        webhook.status = "delivered"
        webhook.delivered_at = datetime.utcnow()
        webhook.metadata.update({
            "last_delivery": {
                "timestamp": datetime.utcnow().isoformat(),
                "processing_time": processing_time,
                "status_code": response.status_code
            }
        })
        
        logger.info(f"Successfully delivered webhook {webhook.id}")
        return True
        
    except requests.exceptions.RequestException as e:
        # Update retry count and status
        webhook.retry_count += 1
        webhook.status = "failed"
        webhook.metadata.update({
            "last_error": {
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e),
                "retry_count": webhook.retry_count
            }
        })
        
        logger.error(f"Webhook delivery failed for {webhook.id}: {str(e)}")
        
        # Raise for retry if under max attempts
        if webhook.retry_count < MAX_RETRIES:
            raise
        return False
        
    except Exception as e:
        logger.error(f"Webhook processing error for {webhook.id}: {str(e)}")
        webhook.status = "failed"
        webhook.metadata.update({
            "last_error": {
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e)
            }
        })
        raise