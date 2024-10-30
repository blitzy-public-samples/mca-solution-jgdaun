from celery import Celery
from celery.signals import setup_logging as celery_setup_logging
from kombu import Exchange, Queue
from typing import Dict, List
from .config import Config
from .logging import setup_logging

# Version information for external dependencies
# celery==5.1.2
# kombu==5.1.0

# Define task queues with their purposes
CELERY_TASK_QUEUES = {
    'default': 'Default queue for miscellaneous tasks',
    'document_processing': 'Queue for document processing tasks',
    'ocr': 'Queue for OCR processing tasks',
    'webhooks': 'Queue for webhook notification tasks'
}

def configure_task_queues(app: Celery) -> None:
    """
    Configures task queues and routing for different types of processing tasks.
    Implements queue management requirements from processing pipeline architecture.
    """
    # Define exchanges
    default_exchange = Exchange('default', type='direct')
    processing_exchange = Exchange('processing', type='direct')

    # Configure queues with their exchanges
    queues: List[Queue] = [
        Queue('default', default_exchange, routing_key='default',
              queue_arguments={'x-max-priority': 10}),
        Queue('document_processing', processing_exchange, routing_key='document_processing',
              queue_arguments={'x-max-priority': 8}),
        Queue('ocr', processing_exchange, routing_key='ocr',
              queue_arguments={'x-max-priority': 5}),
        Queue('webhooks', default_exchange, routing_key='webhooks',
              queue_arguments={'x-max-priority': 3})
    ]

    # Configure task routes
    task_routes: Dict[str, Dict[str, str]] = {
        'app.tasks.document_tasks.*': {'queue': 'document_processing'},
        'app.tasks.ocr_tasks.*': {'queue': 'ocr'},
        'app.tasks.webhook_tasks.*': {'queue': 'webhooks'},
    }

    # Set Celery configuration
    app.conf.task_queues = queues
    app.conf.task_routes = task_routes
    
    # Configure rate limits per queue
    app.conf.task_annotations = {
        'app.tasks.document_tasks.*': {'rate_limit': '100/m'},
        'app.tasks.ocr_tasks.*': {'rate_limit': '50/m'},
        'app.tasks.webhook_tasks.*': {'rate_limit': '200/m'}
    }

    # Configure dead letter queues
    app.conf.task_reject_on_worker_lost = True
    app.conf.task_acks_late = True

def init_celery() -> Celery:
    """
    Initializes and configures the Celery application with task queues,
    worker settings, and monitoring integration.
    
    Returns:
        Celery: Configured Celery application instance
    """
    app = Celery('backend_app')

    # Configure broker and result backend from Config
    app.conf.broker_url = Config.celery_broker_url
    app.conf.result_backend = Config.redis_url

    # Configure task serialization
    app.conf.task_serializer = 'json'
    app.conf.result_serializer = 'json'
    app.conf.accept_content = ['json']
    app.conf.timezone = 'UTC'

    # Configure task execution settings
    app.conf.task_track_started = True
    app.conf.task_time_limit = 3600  # 1 hour
    app.conf.task_soft_time_limit = 3300  # 55 minutes
    app.conf.worker_prefetch_multiplier = 1
    app.conf.worker_max_tasks_per_child = 1000
    app.conf.worker_concurrency = 4

    # Enable task events for monitoring
    app.conf.task_send_sent_event = True
    app.conf.worker_send_task_events = True

    # Configure task error handling and retries
    app.conf.task_default_retry_delay = 300  # 5 minutes
    app.conf.task_max_retries = 3

    # Configure SSL/TLS settings if in production
    if Config.environment == 'production':
        app.conf.broker_use_ssl = {
            'ssl_cert_reqs': 'CERT_REQUIRED',
            'ssl_ca_certs': '/etc/ssl/certs/ca-certificates.crt'
        }

    # Set up task queues
    configure_task_queues(app)

    # Configure logging
    @celery_setup_logging.connect
    def setup_celery_logging(**kwargs):
        setup_logging()

    return app

# Initialize the Celery application
celery_app = init_celery()

# Export the celery app instance
__all__ = ['celery_app']