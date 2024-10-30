#!/bin/bash

# Dollar Funding MCA Application Processing System Deployment Script
# Version: 1.0
# Dependencies:
# - kubectl v1.21
# - aws-cli v2.2
# - curl v7.0

# Set strict error handling
set -euo pipefail
IFS=$'\n\t'

# Global variables from specification
DEPLOY_ENV=${DEPLOY_ENV:-"production"}
BACKUP_DIR=${BACKUP_DIR:-"/tmp/k8s-backups"}
HEALTH_CHECK_RETRIES=${HEALTH_CHECK_RETRIES:-5}
HEALTH_CHECK_INTERVAL=${HEALTH_CHECK_INTERVAL:-10}
ROLLBACK_TIMEOUT=${ROLLBACK_TIMEOUT:-300}

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging function
log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Error handling function
handle_error() {
    log "${RED}Error occurred in script at line $1${NC}"
    exit 1
}

trap 'handle_error $LINENO' ERR

# Function: Check backend health
# Implementation of check_backend_health from specification
check_backend_health() {
    local namespace=$1
    local service_url=$2
    local retry_count=0
    
    while [ $retry_count -lt $HEALTH_CHECK_RETRIES ]; do
        log "Checking backend health (Attempt $((retry_count + 1))/$HEALTH_CHECK_RETRIES)"
        
        # Get service endpoint
        local endpoint=$(kubectl get service backend-service -n "$namespace" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
        
        # Check health endpoint
        if curl -s -f "http://${endpoint}/health" | grep -q '"status":"healthy"'; then
            log "${GREEN}Backend health check passed${NC}"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    log "${RED}Backend health check failed after $HEALTH_CHECK_RETRIES attempts${NC}"
    return 1
}

# Function: Check frontend health
# Implementation of check_frontend_health from specification
check_frontend_health() {
    local namespace=$1
    local service_url=$2
    local retry_count=0
    
    while [ $retry_count -lt $HEALTH_CHECK_RETRIES ]; do
        log "Checking frontend health (Attempt $((retry_count + 1))/$HEALTH_CHECK_RETRIES)"
        
        # Get service endpoint
        local endpoint=$(kubectl get service frontend-service -n "$namespace" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
        
        # Check ready endpoint
        if curl -s -f "http://${endpoint}/ready" | grep -q '"status":"ready"'; then
            log "${GREEN}Frontend health check passed${NC}"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    log "${RED}Frontend health check failed after $HEALTH_CHECK_RETRIES attempts${NC}"
    return 1
}

# Function: Backup deployment
# Implementation of backup_deployment from specification
backup_deployment() {
    local namespace=$1
    local component=$2
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="${BACKUP_DIR}/${component}_${timestamp}"
    
    log "Creating backup for ${component} deployment"
    
    # Create backup directory
    mkdir -p "$backup_path"
    
    # Export current configurations
    kubectl get deployment "${component}-deployment" -n "$namespace" -o yaml > "${backup_path}/deployment.yaml"
    kubectl get service "${component}-service" -n "$namespace" -o yaml > "${backup_path}/service.yaml"
    kubectl get configmap application-config -n "$namespace" -o yaml > "${backup_path}/configmap.yaml"
    kubectl get secret "${component}-secrets" -n "$namespace" -o yaml > "${backup_path}/secrets.yaml"
    
    log "${GREEN}Backup created at ${backup_path}${NC}"
    echo "$backup_path"
}

# Function: Restore deployment
# Implementation of restore_deployment from specification
restore_deployment() {
    local namespace=$1
    local backup_path=$2
    
    log "${YELLOW}Initiating deployment restoration from ${backup_path}${NC}"
    
    # Verify backup files exist
    if [ ! -d "$backup_path" ]; then
        log "${RED}Backup directory not found: ${backup_path}${NC}"
        return 1
    fi
    
    # Apply backup configurations
    kubectl apply -f "${backup_path}/deployment.yaml" -n "$namespace"
    kubectl apply -f "${backup_path}/service.yaml" -n "$namespace"
    kubectl apply -f "${backup_path}/configmap.yaml" -n "$namespace"
    kubectl apply -f "${backup_path}/secrets.yaml" -n "$namespace"
    
    # Wait for pods to be ready
    kubectl rollout status deployment/backend-deployment -n "$namespace" --timeout="${ROLLBACK_TIMEOUT}s"
    kubectl rollout status deployment/frontend-deployment -n "$namespace" --timeout="${ROLLBACK_TIMEOUT}s"
    
    log "${GREEN}Deployment restored successfully${NC}"
    return 0
}

# Function: Deploy backend
# Implementation of deploy_backend from specification
deploy_backend() {
    local namespace=$1
    local backup_path=""
    
    log "Starting backend deployment"
    
    # Create backup
    backup_path=$(backup_deployment "$namespace" "backend")
    
    # Apply new backend deployment
    kubectl apply -f infrastructure/k8s/backend-deployment.yaml -n "$namespace"
    kubectl apply -f infrastructure/k8s/configmap.yaml -n "$namespace"
    kubectl apply -f infrastructure/k8s/secrets.yaml -n "$namespace"
    
    # Wait for new pods
    if ! kubectl rollout status deployment/backend-deployment -n "$namespace" --timeout=300s; then
        log "${RED}Backend deployment failed. Initiating rollback...${NC}"
        restore_deployment "$namespace" "$backup_path"
        return 1
    fi
    
    # Health check
    if ! check_backend_health "$namespace" "backend-service"; then
        log "${RED}Backend health check failed. Initiating rollback...${NC}"
        restore_deployment "$namespace" "$backup_path"
        return 1
    fi
    
    # Update service
    kubectl apply -f infrastructure/k8s/service.yaml -n "$namespace"
    
    log "${GREEN}Backend deployment completed successfully${NC}"
    return 0
}

# Function: Deploy frontend
# Implementation of deploy_frontend from specification
deploy_frontend() {
    local namespace=$1
    local backup_path=""
    
    log "Starting frontend deployment"
    
    # Create backup
    backup_path=$(backup_deployment "$namespace" "frontend")
    
    # Apply new frontend deployment
    kubectl apply -f infrastructure/k8s/frontend-deployment.yaml -n "$namespace"
    kubectl apply -f infrastructure/k8s/configmap.yaml -n "$namespace"
    kubectl apply -f infrastructure/k8s/secrets.yaml -n "$namespace"
    
    # Wait for new pods
    if ! kubectl rollout status deployment/frontend-deployment -n "$namespace" --timeout=300s; then
        log "${RED}Frontend deployment failed. Initiating rollback...${NC}"
        restore_deployment "$namespace" "$backup_path"
        return 1
    fi
    
    # Health check
    if ! check_frontend_health "$namespace" "frontend-service"; then
        log "${RED}Frontend health check failed. Initiating rollback...${NC}"
        restore_deployment "$namespace" "$backup_path"
        return 1
    fi
    
    # Update service
    kubectl apply -f infrastructure/k8s/service.yaml -n "$namespace"
    
    log "${GREEN}Frontend deployment completed successfully${NC}"
    return 0
}

# Main deployment function
main() {
    local namespace="default"
    
    # Validate environment
    if [[ ! "$DEPLOY_ENV" =~ ^(production|staging|development)$ ]]; then
        log "${RED}Invalid deployment environment: ${DEPLOY_ENV}${NC}"
        exit 1
    fi
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Verify kubectl connection
    if ! kubectl cluster-info &>/dev/null; then
        log "${RED}Unable to connect to Kubernetes cluster${NC}"
        exit 1
    }
    
    # Verify AWS credentials
    if ! aws sts get-caller-identity &>/dev/null; then
        log "${RED}Invalid AWS credentials${NC}"
        exit 1
    }
    
    log "Starting deployment process for ${YELLOW}${DEPLOY_ENV}${NC} environment"
    
    # Deploy backend services
    if ! deploy_backend "$namespace"; then
        log "${RED}Backend deployment failed${NC}"
        exit 1
    fi
    
    # Deploy frontend services
    if ! deploy_frontend "$namespace"; then
        log "${RED}Frontend deployment failed${NC}"
        exit 1
    }
    
    log "${GREEN}Deployment completed successfully${NC}"
}

# Script entry point
main "$@"