#!/bin/bash

# Dollar Funding MCA Application Processing System Health Check Script
# Version: 1.0
# Dependencies:
# - curl v7.0
# - kubectl v1.21
# - aws-cli v2.2

# Set strict error handling
set -euo pipefail
IFS=$'\n\t'

# Global variables from specification
HEALTH_CHECK_RETRIES=${HEALTH_CHECK_RETRIES:-5}
HEALTH_CHECK_INTERVAL=${HEALTH_CHECK_INTERVAL:-10}
HEALTH_CHECK_TIMEOUT=${HEALTH_CHECK_TIMEOUT:-30}
LOG_DIR=${LOG_DIR:-"/var/log/health-checks"}
METRICS_ENDPOINT=${METRICS_ENDPOINT:-"/metrics"}

# Import health check functions from deploy.sh
source "$(dirname "$0")/deploy.sh"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging function
log() {
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "[${timestamp}] $1" | tee -a "${LOG_DIR}/health-check.log"
}

# Error handling function
handle_error() {
    log "${RED}Error occurred in script at line $1${NC}"
    exit 1
}

trap 'handle_error $LINENO' ERR

# Function: Log metrics to CloudWatch
# Implementation of log_health_metrics from specification
log_health_metrics() {
    local service_name=$1
    local metrics_data=$2
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Format metrics for CloudWatch
    local cloudwatch_data=$(cat <<EOF
{
    "MetricData": [
        {
            "MetricName": "ServiceHealth",
            "Value": ${metrics_data},
            "Unit": "Count",
            "Timestamp": "${timestamp}",
            "Dimensions": [
                {
                    "Name": "Service",
                    "Value": "${service_name}"
                },
                {
                    "Name": "Environment",
                    "Value": "${DEPLOY_ENV:-production}"
                }
            ]
        }
    ],
    "Namespace": "DollarFunding/ServiceHealth"
}
EOF
)
    
    # Push metrics to CloudWatch
    if aws cloudwatch put-metric-data --cli-input-json "$cloudwatch_data"; then
        log "${GREEN}Successfully logged metrics to CloudWatch for ${service_name}${NC}"
        
        # Log to ELK stack
        local log_entry="{\"timestamp\":\"${timestamp}\",\"service\":\"${service_name}\",\"metrics\":${metrics_data},\"type\":\"health_check\"}"
        echo "$log_entry" >> "${LOG_DIR}/metrics.json"
        return 0
    else
        log "${RED}Failed to log metrics to CloudWatch for ${service_name}${NC}"
        return 1
    fi
}

# Function: Check Prometheus metrics endpoint
check_prometheus_metrics() {
    local service_name=$1
    local namespace=$2
    local endpoint=$3
    
    log "Checking Prometheus metrics for ${service_name}"
    
    # Get service port from service.yaml configuration
    local metrics_port=$(kubectl get service "${service_name}" -n "${namespace}" \
        -o jsonpath='{.metadata.annotations.prometheus\.io/port}')
    
    # Attempt to access metrics endpoint
    if curl -s -f "http://${endpoint}:${metrics_port}${METRICS_ENDPOINT}" > /dev/null; then
        log "${GREEN}Prometheus metrics endpoint accessible for ${service_name}${NC}"
        return 0
    else
        log "${RED}Prometheus metrics endpoint inaccessible for ${service_name}${NC}"
        return 1
    fi
}

# Function: Perform comprehensive health check
# Implementation of perform_health_check from specification
perform_health_check() {
    local namespace=$1
    local service_url=$2
    local health_status=0
    
    log "Starting comprehensive health check for all services"
    
    # Create log directory if it doesn't exist
    mkdir -p "$LOG_DIR"
    
    # Check backend service health
    if check_backend_health "$namespace" "$service_url"; then
        log_health_metrics "backend-service" 1
    else
        log_health_metrics "backend-service" 0
        health_status=1
    fi
    
    # Check frontend service health
    if check_frontend_health "$namespace" "$service_url"; then
        log_health_metrics "frontend-service" 1
    else
        log_health_metrics "frontend-service" 0
        health_status=1
    fi
    
    # Check OCR service health
    local ocr_endpoint=$(kubectl get service ocr-service -n "$namespace" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    if curl -s -f "http://${ocr_endpoint}:8083/health" | grep -q '"status":"healthy"'; then
        log "${GREEN}OCR service health check passed${NC}"
        log_health_metrics "ocr-service" 1
    else
        log "${RED}OCR service health check failed${NC}"
        log_health_metrics "ocr-service" 0
        health_status=1
    fi
    
    # Check Prometheus metrics endpoints
    for service in backend-service frontend-service ocr-service; do
        local endpoint=$(kubectl get service "$service" -n "$namespace" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
        if ! check_prometheus_metrics "$service" "$namespace" "$endpoint"; then
            health_status=1
        fi
    done
    
    # Return overall health status
    return $health_status
}

# Main function
main() {
    local namespace=${1:-"default"}
    local service_url=${2:-""}
    
    # Verify required tools
    for tool in curl kubectl aws; do
        if ! command -v "$tool" &> /dev/null; then
            log "${RED}Required tool not found: ${tool}${NC}"
            exit 1
        fi
    done
    
    # Verify Kubernetes connection
    if ! kubectl cluster-info &>/dev/null; then
        log "${RED}Unable to connect to Kubernetes cluster${NC}"
        exit 1
    fi
    
    # Verify AWS credentials
    if ! aws sts get-caller-identity &>/dev/null; then
        log "${RED}Invalid AWS credentials${NC}"
        exit 1
    fi
    
    # Perform health check with retry logic
    local retry_count=0
    while [ $retry_count -lt $HEALTH_CHECK_RETRIES ]; do
        log "Performing health check (Attempt $((retry_count + 1))/$HEALTH_CHECK_RETRIES)"
        
        if perform_health_check "$namespace" "$service_url"; then
            log "${GREEN}All services are healthy${NC}"
            exit 0
        fi
        
        retry_count=$((retry_count + 1))
        [ $retry_count -lt $HEALTH_CHECK_RETRIES ] && sleep $HEALTH_CHECK_INTERVAL
    done
    
    log "${RED}Health check failed after $HEALTH_CHECK_RETRIES attempts${NC}"
    exit 1
}

# Script entry point
main "$@"