# Gunicorn configuration file for production deployment
# gunicorn==20.1.0
# uvicorn==0.15.0

import multiprocessing
from app.core.config import Config
from app.core.logging import setup_logging

# Binding host and port configuration
# Requirement: Application Deployment - Configure server binding for high availability
bind = Config.host + ':' + str(Config.port)

# Worker configuration
# Requirement: Application Deployment - Ensure efficient resource utilization on AWS EC2 t3.large instances
workers = multiprocessing.cpu_count() * 2 + 1  # Optimal workers based on CPU cores
worker_class = 'uvicorn.workers.UvicornWorker'  # Using ASGI worker for FastAPI
worker_connections = 1000  # Maximum concurrent connections per worker

# Timeout configuration
# Requirement: Application Deployment - Handle long-running requests appropriately
timeout = 60  # Seconds to wait before killing a worker
keepalive = 2  # Seconds to wait for requests on a Keep-Alive connection
graceful_timeout = 30  # Seconds to wait before force-killing workers

# Worker lifecycle configuration
# Requirement: Application Deployment - Ensure worker processes are recycled regularly
max_requests = 10000  # Restart workers after handling this many requests
max_requests_jitter = 1000  # Add randomness to max_requests to prevent all workers from restarting at once

# Logging configuration
# Requirement: Application Monitoring - Implement comprehensive logging with CloudWatch and ELK stack
loglevel = Config.log_level
accesslog = '-'  # Log to stdout for container compatibility
errorlog = '-'  # Log to stderr for container compatibility
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(L)s'

def on_starting(server):
    """
    Hook function executed when Gunicorn starts.
    Requirement: Application Monitoring - Configure structured JSON logging with CloudWatch integration
    """
    # Configure structured JSON logging with CloudWatch integration
    setup_logging()
    
    # Log server startup information
    import logging
    logger = logging.getLogger("gunicorn.error")
    logger.info(
        "Starting Gunicorn server",
        extra={
            "environment": Config.environment,
            "workers": workers,
            "worker_class": worker_class,
            "bind_address": bind
        }
    )
    
    # Initialize X-Ray tracing in production
    if Config.environment == "production":
        from aws_xray_sdk.core import xray_recorder
        xray_recorder.configure(
            service="backend-api",
            sampling=True,
            context_missing='LOG_ERROR'
        )

def post_worker_init(worker):
    """
    Hook function executed after a worker is initialized.
    Requirement: Application Monitoring - Initialize worker-specific monitoring metrics
    """
    import logging
    logger = logging.getLogger("gunicorn.error")
    
    # Configure worker-specific logging
    logger.info(
        "Worker initialized",
        extra={
            "worker_id": worker.pid,
            "worker_connections": worker_connections,
            "max_requests": max_requests
        }
    )
    
    # Initialize worker-specific CloudWatch metrics
    if Config.environment == "production":
        import boto3
        cloudwatch = boto3.client(
            'cloudwatch',
            aws_access_key_id=Config.aws_access_key_id.get_secret_value(),
            aws_secret_access_key=Config.aws_secret_access_key.get_secret_value(),
            region_name=Config.aws_region
        )
        
        cloudwatch.put_metric_data(
            Namespace='Backend/Gunicorn',
            MetricData=[{
                'MetricName': 'WorkerStartup',
                'Value': 1,
                'Unit': 'Count',
                'Dimensions': [
                    {'Name': 'WorkerId', 'Value': str(worker.pid)},
                    {'Name': 'Environment', 'Value': Config.environment}
                ]
            }]
        )

def worker_exit(server, worker):
    """
    Hook function executed when a worker exits.
    Requirement: Application Monitoring - Clean up worker resources and send final metrics
    """
    import logging
    logger = logging.getLogger("gunicorn.error")
    
    # Log worker exit event
    logger.info(
        "Worker exiting",
        extra={
            "worker_id": worker.pid,
            "requests_handled": worker.requests_handled
        }
    )
    
    # Send final metrics before worker shutdown
    if Config.environment == "production":
        import boto3
        cloudwatch = boto3.client(
            'cloudwatch',
            aws_access_key_id=Config.aws_access_key_id.get_secret_value(),
            aws_secret_access_key=Config.aws_secret_access_key.get_secret_value(),
            region_name=Config.aws_region
        )
        
        cloudwatch.put_metric_data(
            Namespace='Backend/Gunicorn',
            MetricData=[{
                'MetricName': 'WorkerShutdown',
                'Value': 1,
                'Unit': 'Count',
                'Dimensions': [
                    {'Name': 'WorkerId', 'Value': str(worker.pid)},
                    {'Name': 'Environment', 'Value': Config.environment},
                    {'Name': 'RequestsHandled', 'Value': str(worker.requests_handled)}
                ]
            }]
        )