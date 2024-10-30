"""
Tasks Module Initializer

This module serves as the central hub for all asynchronous task operations in the application,
aggregating and exposing task-related functionalities for email processing, document handling,
OCR operations, and webhook notifications.

Version Requirements:
- celery==5.1.2
"""

# Import task functions from respective modules
from .email_tasks import (  # type: ignore
    process_email_task,
    send_notification_email_task as send_email_task
)
from .document_tasks import process_document_task  # type: ignore
from .ocr_tasks import ocr_task  # type: ignore
from .webhook_tasks import process_webhook_event  # type: ignore

# Export all task functions
# This provides a unified interface for task execution across the application
__all__ = [
    # Email processing tasks
    'process_email_task',      # Handles incoming email processing
    'send_email_task',         # Handles outgoing notification emails
    
    # Document processing tasks
    'process_document_task',   # Handles document validation and storage
    
    # OCR processing tasks
    'ocr_task',               # Handles OCR operations on documents
    
    # Webhook processing tasks
    'process_webhook_event'    # Handles webhook notifications
]

# Task version information for compatibility checking
TASK_VERSIONS = {
    'email_tasks': '1.0.0',
    'document_tasks': '1.0.0',
    'ocr_tasks': '1.0.0',
    'webhook_tasks': '1.0.0'
}

# Implements "Asynchronous Task Management" requirement from system_architecture.component_details.processing_pipeline
# by centralizing all task imports and providing a unified interface for task execution

# Implements "Processing Pipeline Integration" requirement from system_components_architecture.data_flow_diagrams.document_processing_flow
# by aggregating document processing, OCR, and notification tasks into a cohesive pipeline