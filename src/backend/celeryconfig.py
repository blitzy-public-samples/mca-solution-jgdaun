# Version information for external dependencies:
# celery==5.1.2
# kombu==5.1.0

from app.core.celery_app import celery_app
from app.core.config import Config
from app.core.logging import setup_logging

# Configure Celery application with comprehensive settings
def configure_celery():
    """
    Configures the Celery application with comprehensive settings for task queues,
    worker behavior, monitoring, and error handling.
    Implements asynchronous task processing requirements from system architecture.
    """
    # Configure broker and result backend URLs
    celery_app.conf.broker_url = Config.celery_broker_url
    celery_app.conf.result_backend = Config.redis_url

    # Configure task serialization
    celery_app.conf.task_serializer = 'json'
    celery_app.conf.result_serializer = 'json'
    celery_app.conf.accept_content = ['json']
    celery_app.conf.timezone = 'UTC'
    celery_app.conf.enable_utc = True

    # Configure task queues for different processing types
    celery_app.conf.task_queues = {
        'default': {
            'exchange': 'default',
            'routing_key': 'default'
        },
        'document_processing': {
            'exchange': 'document',
            'routing_key': 'document.process'
        },
        'ocr': {
            'exchange': 'ocr',
            'routing_key': 'ocr.process'
        },
        'webhooks': {
            'exchange': 'webhooks',
            'routing_key': 'webhook.notify'
        }
    }

    # Configure task routing based on task module paths
    celery_app.conf.task_routes = {
        'app.tasks.document_tasks.*': {'queue': 'document_processing'},
        'app.tasks.ocr_tasks.*': {'queue': 'ocr'},
        'app.tasks.webhook_tasks.*': {'queue': 'webhooks'}
    }

    # Configure default queue settings
    celery_app.conf.task_default_queue = 'default'
    celery_app.conf.task_default_exchange = 'default'
    celery_app.conf.task_default_routing_key = 'default'

    # Configure worker settings for optimal performance
    celery_app.conf.worker_prefetch_multiplier = 1  # Prevent worker from prefetching multiple tasks
    celery_app.conf.worker_max_tasks_per_child = 1000  # Restart worker after 1000 tasks
    celery_app.conf.worker_max_memory_per_child = 400000  # 400MB memory limit per worker

    # Configure task execution time limits
    celery_app.conf.task_time_limit = 3600  # 1 hour hard limit
    celery_app.conf.task_soft_time_limit = 3300  # 55 minutes soft limit

    # Configure broker connection settings
    celery_app.conf.broker_connection_retry = True
    celery_app.conf.broker_connection_max_retries = 5

    # Configure result backend settings
    celery_app.conf.result_expires = 3600  # Results expire after 1 hour

    # Configure task tracking and monitoring
    celery_app.conf.task_track_started = True
    celery_app.conf.task_publish_retry = True
    celery_app.conf.task_publish_retry_policy = {
        'max_retries': 3,
        'interval_start': 0,
        'interval_step': 0.2,
        'interval_max': 0.5
    }

    # Configure structured JSON logging
    setup_logging()

# Initialize Celery configuration
configure_celery()