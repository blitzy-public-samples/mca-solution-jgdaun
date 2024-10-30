#!/bin/bash

# This script manages Celery worker processes for handling asynchronous tasks
# across multiple specialized queues with monitoring and error handling.
# Dependencies: celery_app.py (v5.1.2)

# Set default environment variables if not provided
WORKER_CONCURRENCY=${CELERY_WORKER_CONCURRENCY:-4}
LOG_LEVEL=${CELERY_LOG_LEVEL:-INFO}
MAX_TASKS_PER_CHILD=10000
WORKER_PREFETCH_MULTIPLIER=4
WORKER_QUEUES="default,document_processing,ocr,webhooks"

# Function to handle graceful shutdown
handle_shutdown() {
    echo "Received shutdown signal. Initiating graceful shutdown..."
    # Stop accepting new tasks
    celery -A app.core.celery_app control shutdown

    # Wait for current tasks to complete (max 30 seconds)
    local timeout=30
    local counter=0
    while [ $counter -lt $timeout ]; do
        if ! pgrep -f "celery" > /dev/null; then
            echo "All workers have completed their tasks."
            break
        fi
        sleep 1
        ((counter++))
    done

    # Force kill if workers haven't stopped
    if [ $counter -eq $timeout ]; then
        echo "Timeout reached. Force killing remaining workers..."
        pkill -9 -f "celery"
    fi

    exit 0
}

# Function to start the worker process
start_worker() {
    # Set up signal handlers for graceful shutdown
    trap 'handle_shutdown' SIGTERM SIGINT SIGQUIT

    # Configure worker logging
    export PYTHONUNBUFFERED=1

    # Start Celery worker with configured settings
    celery -A app.core.celery_app worker \
        --loglevel="${LOG_LEVEL}" \
        --concurrency="${WORKER_CONCURRENCY}" \
        --queues="${WORKER_QUEUES}" \
        --max-tasks-per-child="${MAX_TASKS_PER_CHILD}" \
        --prefetch-multiplier="${WORKER_PREFETCH_MULTIPLIER}" \
        --hostname="worker@%h" \
        --events \
        --pidfile="/tmp/celery-%n.pid" \
        --logfile="/var/log/celery/worker-%n.log" \
        --statedb="/var/run/celery/worker.state" \
        --time-limit=3600 \
        --soft-time-limit=3300 \
        --max-memory-per-child=512000 \
        --pool=prefork \
        --autoscale="${WORKER_CONCURRENCY}",2 \
        --without-gossip \
        --without-mingle \
        --optimization=fair \
        --enable-remote-control \
        --task-events \
        --heartbeat-interval=30 \
        --maxtasksperchild="${MAX_TASKS_PER_CHILD}" \
        --detach

    # Check if worker started successfully
    if [ $? -ne 0 ]; then
        echo "Failed to start Celery worker"
        exit 1
    fi

    # Monitor worker process
    while true; do
        if ! pgrep -f "celery" > /dev/null; then
            echo "Worker process died unexpectedly. Restarting..."
            start_worker
        fi
        sleep 5
    done
}

# Create required directories
mkdir -p /var/log/celery /var/run/celery

# Set proper permissions
chmod 755 /var/log/celery /var/run/celery

# Start the worker process
start_worker