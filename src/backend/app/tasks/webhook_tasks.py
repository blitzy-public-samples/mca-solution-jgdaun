"""
Webhook Tasks Module

Implements Celery tasks for asynchronous webhook event processing, including validation,
delivery, and retry logic for webhook notifications. Ensures reliable delivery of
application events to external systems.

Version Requirements:
- celery==5.1.2
"""

import logging
from datetime import datetime
from typing import Dict
from uuid import UUID

from app.core.celery_app import celery_app
from app.services.webhook_service import trigger_webhook
from app.models.webhook import Webhook
from app.utils.validation import validate_document_data
from app.db.session import SessionLocal

# Initialize logging
logger = logging.getLogger(__name__)

# Global constants from specification
WEBHOOK_QUEUE = 'webhooks'
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds

@celery_app.task(
    queue=WEBHOOK_QUEUE,
    bind=True,
    max_retries=MAX_RETRIES,
    default_retry_delay=RETRY_DELAY
)
def process_webhook_event(self, webhook_id: UUID, payload: Dict) -> bool:
    """
    Processes a webhook event asynchronously, validating the payload and triggering
    the webhook with retry logic.
    
    Implements requirements:
    - Asynchronous Webhook Task Processing
    - Webhook Event Delivery
    - Output Processing Pipeline
    
    Args:
        webhook_id (UUID): ID of the webhook to process
        payload (Dict): Event payload to be delivered
        
    Returns:
        bool: True if webhook was processed successfully, False otherwise
        
    Raises:
        Retry: If webhook delivery fails but retries are available
    """
    logger.info(f"Processing webhook event for webhook_id: {webhook_id}")
    
    db = SessionLocal()
    try:
        # Retrieve webhook from database
        webhook = db.query(Webhook).filter(Webhook.id == webhook_id).first()
        if not webhook:
            logger.error(f"Webhook {webhook_id} not found")
            return False
            
        # Validate payload structure against webhook event type
        try:
            validate_document_data(payload, webhook.event)
        except Exception as e:
            logger.error(f"Payload validation failed for webhook {webhook_id}: {str(e)}")
            webhook.status = "failed"
            webhook.metadata = {
                "error": "Payload validation failed",
                "details": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
            db.commit()
            return False
            
        # Update webhook status to processing
        webhook.status = "processing"
        webhook.updated_at = datetime.utcnow()
        db.commit()
        
        # Enrich payload with metadata
        processing_start = datetime.utcnow()
        enriched_payload = {
            **payload,
            "metadata": {
                "processing_time": 0.0,  # Will be updated after processing
                "version": "1.0",
                "retry_count": self.request.retries,
                "task_id": self.request.id
            }
        }
        
        # Attempt to trigger webhook
        success = trigger_webhook(webhook, enriched_payload)
        
        # Calculate processing time
        processing_time = (datetime.utcnow() - processing_start).total_seconds()
        
        if success:
            # Update webhook status to delivered
            webhook.status = "delivered"
            webhook.delivered = True
            webhook.delivered_at = datetime.utcnow()
            webhook.metadata = {
                "processing_time": processing_time,
                "last_delivery": datetime.utcnow().isoformat(),
                "retry_count": self.request.retries
            }
            db.commit()
            
            logger.info(f"Successfully processed webhook {webhook_id}")
            return True
            
        else:
            # Update retry count and status
            webhook.retry_count += 1
            webhook.status = "failed"
            webhook.metadata = {
                "error": "Webhook delivery failed",
                "retry_count": webhook.retry_count,
                "last_attempt": datetime.utcnow().isoformat(),
                "processing_time": processing_time
            }
            db.commit()
            
            # Retry if not exceeded max retries
            if webhook.retry_count < MAX_RETRIES:
                logger.info(f"Retrying webhook {webhook_id}, attempt {webhook.retry_count}")
                # Exponential backoff: 5s, 25s, 125s
                retry_delay = RETRY_DELAY * (5 ** self.request.retries)
                raise self.retry(
                    exc=Exception(f"Webhook delivery failed, retrying in {retry_delay}s"),
                    countdown=retry_delay
                )
                
            logger.error(f"Webhook {webhook_id} failed after {MAX_RETRIES} retries")
            return False
            
    except Exception as e:
        logger.error(f"Error processing webhook {webhook_id}: {str(e)}")
        # Update webhook status to failed
        if webhook:
            webhook.status = "failed"
            webhook.metadata = {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
            db.commit()
        return False
        
    finally:
        db.close()