"""
Webhook ORM Model Module

This module defines the SQLAlchemy ORM model for webhooks, managing webhook event records
in PostgreSQL. It tracks webhook deliveries, their payloads, and processing status for
application events.

Version Requirements:
- SQLAlchemy==1.4.22
"""

from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.sql import func
import uuid

from app.db.base import Base

class Webhook(Base):
    """
    ORM model for webhooks, representing webhook delivery records in the database.
    Tracks webhook events, their payloads, and delivery status for application events.
    
    Implements requirements from:
    - Webhook ORM Model (system_design.database_design.core_schema)
    - Webhook Payload Structure (system_design.api_design.webhook_payload_structure)
    """
    
    __tablename__ = "webhooks"

    # Primary key using UUID for global uniqueness and security
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
        nullable=False,
        comment="Unique identifier for the webhook record"
    )

    # Reference to the application this webhook is associated with
    application_id = Column(
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Reference to the associated application"
    )

    # Event type (e.g., 'application.processed', 'document.uploaded')
    event = Column(
        String(100),
        nullable=False,
        index=True,
        comment="Type of webhook event being delivered"
    )

    # Webhook payload containing event data
    payload = Column(
        JSON,
        nullable=False,
        comment="JSON payload of the webhook event"
    )

    # Destination URL for webhook delivery
    url = Column(
        String(500),
        nullable=False,
        comment="Destination URL for webhook delivery"
    )

    # Delivery status tracking
    delivered = Column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        comment="Flag indicating if webhook was successfully delivered"
    )

    # Retry tracking for failed deliveries
    retry_count = Column(
        Integer,
        default=0,
        nullable=False,
        comment="Number of delivery retry attempts"
    )

    # Current status of the webhook
    status = Column(
        String(50),
        default="pending",
        nullable=False,
        index=True,
        comment="Current status of the webhook (pending, success, failed)"
    )

    # Additional metadata for webhook processing
    metadata = Column(
        JSON,
        nullable=True,
        comment="Additional metadata about webhook processing"
    )

    # Timestamps for tracking
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Timestamp when webhook record was created"
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        comment="Timestamp when webhook record was last updated"
    )

    delivered_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp when webhook was successfully delivered"
    )

    def __repr__(self):
        """String representation of the webhook record"""
        return f"<Webhook(id={self.id}, event={self.event}, status={self.status})>"