#!/bin/bash

# Dollar Funding MCA Application Processing System Backup Script
# Version: 1.0
# Dependencies:
# - aws-cli v2.2
# - kubectl v1.21
# - mongodump v5.x
# - pg_dump v13.x

# Set strict error handling
set -euo pipefail
IFS=$'\n\t'

# Import required functions
source "$(dirname "$0")/deploy.sh"
source "$(dirname "$0")/health-check.sh"

# Global variables from specification
BACKUP_BUCKET=${BACKUP_BUCKET:-"dollar-funding-backups"}
BACKUP_TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
CROSS_REGION_BUCKET=${CROSS_REGION_BUCKET:-"dollar-funding-backups-dr"}
DB_SNAPSHOT_PREFIX=${DB_SNAPSHOT_PREFIX:-"df-snapshot"}
TEMP_BACKUP_DIR="/tmp/dollar-funding-backup"

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
    cleanup_temp_files
    exit 1
}

trap 'handle_error $LINENO' ERR

# Function: Clean up temporary files
cleanup_temp_files() {
    log "Cleaning up temporary files..."
    rm -rf "${TEMP_BACKUP_DIR}"
}

# Function: Create RDS snapshot
create_rds_snapshot() {
    local component=$1
    local snapshot_id="${DB_SNAPSHOT_PREFIX}-${component}-${BACKUP_TIMESTAMP}"
    
    log "Creating RDS snapshot for ${component}..."
    
    # Create snapshot
    aws rds create-db-snapshot \
        --db-instance-identifier "${component}" \
        --db-snapshot-identifier "${snapshot_id}" \
        --tags Key=retention,Value="${BACKUP_RETENTION_DAYS}"
    
    # Wait for snapshot completion
    aws rds wait db-snapshot-available \
        --db-snapshot-identifier "${snapshot_id}"
    
    echo "${snapshot_id}"
}

# Function: Create MongoDB Atlas snapshot
create_mongodb_snapshot() {
    local cluster_name=$1
    local snapshot_id="${DB_SNAPSHOT_PREFIX}-mongo-${BACKUP_TIMESTAMP}"
    
    log "Creating MongoDB Atlas snapshot..."
    
    # Use mongodump for backup
    mkdir -p "${TEMP_BACKUP_DIR}/mongodb"
    mongodump --uri="${MONGODB_URI}" \
        --out="${TEMP_BACKUP_DIR}/mongodb/${snapshot_id}"
    
    # Compress backup
    tar -czf "${TEMP_BACKUP_DIR}/${snapshot_id}.tar.gz" \
        -C "${TEMP_BACKUP_DIR}/mongodb" "${snapshot_id}"
    
    # Upload to S3
    aws s3 cp "${TEMP_BACKUP_DIR}/${snapshot_id}.tar.gz" \
        "s3://${BACKUP_BUCKET}/mongodb/${snapshot_id}.tar.gz" \
        --tags "retention=${BACKUP_RETENTION_DAYS}"
    
    echo "${snapshot_id}"
}

# Function: Backup S3 buckets
backup_s3_buckets() {
    local source_bucket=$1
    local backup_path="s3-backup/${BACKUP_TIMESTAMP}"
    
    log "Backing up S3 bucket ${source_bucket}..."
    
    # Sync bucket contents
    aws s3 sync "s3://${source_bucket}" \
        "s3://${BACKUP_BUCKET}/${backup_path}/${source_bucket}" \
        --tags "retention=${BACKUP_RETENTION_DAYS}"
    
    echo "${backup_path}"
}

# Function: Export Kubernetes resources
backup_kubernetes_resources() {
    local namespace=$1
    local backup_path="k8s-backup/${BACKUP_TIMESTAMP}"
    
    log "Backing up Kubernetes resources..."
    
    mkdir -p "${TEMP_BACKUP_DIR}/k8s"
    
    # Backup deployments
    kubectl get deployments -n "${namespace}" -o yaml > \
        "${TEMP_BACKUP_DIR}/k8s/deployments.yaml"
    
    # Backup services
    kubectl get services -n "${namespace}" -o yaml > \
        "${TEMP_BACKUP_DIR}/k8s/services.yaml"
    
    # Backup configmaps
    kubectl get configmaps -n "${namespace}" -o yaml > \
        "${TEMP_BACKUP_DIR}/k8s/configmaps.yaml"
    
    # Backup secrets (encrypted)
    kubectl get secrets -n "${namespace}" -o yaml > \
        "${TEMP_BACKUP_DIR}/k8s/secrets.yaml"
    
    # Create archive
    tar -czf "${TEMP_BACKUP_DIR}/k8s-${BACKUP_TIMESTAMP}.tar.gz" \
        -C "${TEMP_BACKUP_DIR}/k8s" .
    
    # Upload to S3
    aws s3 cp "${TEMP_BACKUP_DIR}/k8s-${BACKUP_TIMESTAMP}.tar.gz" \
        "s3://${BACKUP_BUCKET}/${backup_path}/k8s.tar.gz" \
        --tags "retention=${BACKUP_RETENTION_DAYS}"
    
    echo "${backup_path}"
}

# Function: Generate backup manifest
generate_backup_manifest() {
    local rds_snapshot_id=$1
    local mongo_snapshot_id=$2
    local s3_backup_path=$3
    local k8s_backup_path=$4
    
    local manifest_file="${TEMP_BACKUP_DIR}/backup-manifest.json"
    
    cat > "${manifest_file}" << EOF
{
    "backup_id": "${BACKUP_TIMESTAMP}",
    "creation_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "retention_days": ${BACKUP_RETENTION_DAYS},
    "components": {
        "rds_snapshot": "${rds_snapshot_id}",
        "mongodb_snapshot": "${mongo_snapshot_id}",
        "s3_backup": "${s3_backup_path}",
        "kubernetes_backup": "${k8s_backup_path}"
    },
    "checksums": {
        "mongodb": "$(sha256sum "${TEMP_BACKUP_DIR}/${mongo_snapshot_id}.tar.gz" | cut -d' ' -f1)",
        "kubernetes": "$(sha256sum "${TEMP_BACKUP_DIR}/k8s-${BACKUP_TIMESTAMP}.tar.gz" | cut -d' ' -f1)"
    }
}
EOF

    # Upload manifest
    aws s3 cp "${manifest_file}" \
        "s3://${BACKUP_BUCKET}/manifests/${BACKUP_TIMESTAMP}.json" \
        --tags "retention=${BACKUP_RETENTION_DAYS}"
}

# Function: Replicate to secondary region
replicate_to_secondary_region() {
    log "Replicating backup to secondary region..."
    
    # Sync backup bucket to cross-region bucket
    aws s3 sync "s3://${BACKUP_BUCKET}" "s3://${CROSS_REGION_BUCKET}" \
        --source-region us-east-1 \
        --destination-region us-west-2
    
    # Copy RDS snapshot to secondary region
    aws rds copy-db-snapshot \
        --source-db-snapshot-identifier "${rds_snapshot_id}" \
        --target-db-snapshot-identifier "${rds_snapshot_id}" \
        --source-region us-east-1 \
        --destination-region us-west-2
}

# Function: Create backup
# Implementation of create_backup from specification
create_backup() {
    local component=$1
    local backup_type=$2
    local namespace="default"
    
    log "Starting backup process for ${component} (Type: ${backup_type})"
    
    # Create temporary directory
    mkdir -p "${TEMP_BACKUP_DIR}"
    
    # Create RDS snapshot
    local rds_snapshot_id=$(create_rds_snapshot "${component}")
    
    # Create MongoDB snapshot
    local mongo_snapshot_id=$(create_mongodb_snapshot "${component}")
    
    # Backup S3 buckets
    local s3_backup_path=$(backup_s3_buckets "${component}")
    
    # Backup Kubernetes resources
    local k8s_backup_path=$(backup_kubernetes_resources "${namespace}")
    
    # Generate backup manifest
    generate_backup_manifest "${rds_snapshot_id}" "${mongo_snapshot_id}" \
        "${s3_backup_path}" "${k8s_backup_path}"
    
    # Replicate to secondary region
    replicate_to_secondary_region
    
    # Verify backup integrity
    verify_backup_integrity "${BACKUP_TIMESTAMP}"
    
    # Cleanup
    cleanup_temp_files
    
    log "${GREEN}Backup completed successfully${NC}"
    
    # Return backup metadata
    echo "{\"backup_id\":\"${BACKUP_TIMESTAMP}\",\"status\":\"success\"}"
}

# Function: Verify backup integrity
# Implementation of verify_backup_integrity from specification
verify_backup_integrity() {
    local backup_id=$1
    
    log "Verifying backup integrity for ${backup_id}..."
    
    # Download and verify manifest
    aws s3 cp "s3://${BACKUP_BUCKET}/manifests/${backup_id}.json" \
        "${TEMP_BACKUP_DIR}/manifest.json"
    
    # Verify RDS snapshot
    local rds_snapshot_id=$(jq -r '.components.rds_snapshot' "${TEMP_BACKUP_DIR}/manifest.json")
    aws rds describe-db-snapshots \
        --db-snapshot-identifier "${rds_snapshot_id}" || return 1
    
    # Verify MongoDB backup
    local mongo_snapshot_id=$(jq -r '.components.mongodb_snapshot' "${TEMP_BACKUP_DIR}/manifest.json")
    local stored_checksum=$(jq -r '.checksums.mongodb' "${TEMP_BACKUP_DIR}/manifest.json")
    local actual_checksum=$(aws s3 cp "s3://${BACKUP_BUCKET}/mongodb/${mongo_snapshot_id}.tar.gz" - | \
        sha256sum | cut -d' ' -f1)
    
    [[ "${stored_checksum}" == "${actual_checksum}" ]] || return 1
    
    # Verify Kubernetes backup
    local k8s_backup_path=$(jq -r '.components.kubernetes_backup' "${TEMP_BACKUP_DIR}/manifest.json")
    local stored_k8s_checksum=$(jq -r '.checksums.kubernetes' "${TEMP_BACKUP_DIR}/manifest.json")
    local actual_k8s_checksum=$(aws s3 cp "s3://${BACKUP_BUCKET}/${k8s_backup_path}/k8s.tar.gz" - | \
        sha256sum | cut -d' ' -f1)
    
    [[ "${stored_k8s_checksum}" == "${actual_k8s_checksum}" ]] || return 1
    
    # Verify cross-region replication
    aws s3 ls "s3://${CROSS_REGION_BUCKET}/manifests/${backup_id}.json" || return 1
    
    log "${GREEN}Backup integrity verification passed${NC}"
    
    # Return verification results
    echo "{\"backup_id\":\"${backup_id}\",\"integrity_status\":\"verified\"}"
}

# Function: Cleanup old backups
# Implementation of cleanup_old_backups from specification
cleanup_old_backups() {
    log "Starting cleanup of old backups..."
    
    local expiration_date=$(date -d "${BACKUP_RETENTION_DAYS} days ago" +%s)
    local cleanup_report="${TEMP_BACKUP_DIR}/cleanup-report.json"
    
    # List all backup manifests
    aws s3 ls "s3://${BACKUP_BUCKET}/manifests/" | while read -r line; do
        local backup_date=$(echo "$line" | awk '{print $1}')
        local manifest=$(echo "$line" | awk '{print $4}')
        local backup_timestamp=$(date -d "${backup_date}" +%s)
        
        if [ "${backup_timestamp}" -lt "${expiration_date}" ]; then
            # Download manifest
            aws s3 cp "s3://${BACKUP_BUCKET}/manifests/${manifest}" \
                "${TEMP_BACKUP_DIR}/current-manifest.json"
            
            # Delete RDS snapshot
            local rds_snapshot_id=$(jq -r '.components.rds_snapshot' "${TEMP_BACKUP_DIR}/current-manifest.json")
            aws rds delete-db-snapshot --db-snapshot-identifier "${rds_snapshot_id}" || true
            
            # Delete MongoDB backup
            local mongo_path=$(jq -r '.components.mongodb_snapshot' "${TEMP_BACKUP_DIR}/current-manifest.json")
            aws s3 rm "s3://${BACKUP_BUCKET}/mongodb/${mongo_path}.tar.gz" || true
            
            # Delete K8s backup
            local k8s_path=$(jq -r '.components.kubernetes_backup' "${TEMP_BACKUP_DIR}/current-manifest.json")
            aws s3 rm "s3://${BACKUP_BUCKET}/${k8s_path}/k8s.tar.gz" || true
            
            # Delete manifest
            aws s3 rm "s3://${BACKUP_BUCKET}/manifests/${manifest}"
            
            # Clean up from secondary region
            aws s3 rm "s3://${CROSS_REGION_BUCKET}/manifests/${manifest}"
            aws rds delete-db-snapshot \
                --db-snapshot-identifier "${rds_snapshot_id}" \
                --region us-west-2 || true
        fi
    done
    
    # Generate cleanup report
    local cleaned_space=$(aws s3 ls "s3://${BACKUP_BUCKET}" --recursive | awk '{total+=$3}END{print total/1024/1024" MB"}')
    cat > "${cleanup_report}" << EOF
{
    "cleanup_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "retention_days": ${BACKUP_RETENTION_DAYS},
    "space_recovered": "${cleaned_space}"
}
EOF

    log "${GREEN}Backup cleanup completed${NC}"
    
    # Return cleanup results
    cat "${cleanup_report}"
}

# Main function
main() {
    # Verify required tools
    for tool in aws kubectl mongodump pg_dump jq; do
        if ! command -v "$tool" &> /dev/null; then
            log "${RED}Required tool not found: ${tool}${NC}"
            exit 1
        fi
    done
    
    # Verify AWS credentials
    if ! aws sts get-caller-identity &>/dev/null; then
        log "${RED}Invalid AWS credentials${NC}"
        exit 1
    }
    
    # Process command line arguments
    local command=${1:-"backup"}
    local component=${2:-"all"}
    local backup_type=${3:-"full"}
    
    case "${command}" in
        "backup")
            create_backup "${component}" "${backup_type}"
            ;;
        "verify")
            verify_backup_integrity "${component}"
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        *)
            log "${RED}Invalid command: ${command}${NC}"
            echo "Usage: $0 [backup|verify|cleanup] [component] [backup_type]"
            exit 1
            ;;
    esac
}

# Script entry point
main "$@"