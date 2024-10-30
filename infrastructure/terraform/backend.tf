# Backend Configuration for Terraform State Management
# AWS Provider Version: ~> 4.0

# Implements requirement: Infrastructure State Management - Secure and consistent state storage
terraform {
  backend "s3" {
    # Primary state bucket configuration
    bucket = "terraform-state-bucket"
    key    = "infrastructure/terraform/state"
    region = "us-east-1"
    
    # Enable encryption at rest using AWS KMS
    encrypt = true
    
    # State locking using DynamoDB
    dynamodb_table = "terraform-lock"
    
    # Access control configuration
    acl = "private"
    
    # Enable versioning for state history
    versioning = true
    
    # Server-side encryption configuration using KMS
    # Implements requirement: Data Security - Encryption of sensitive data at rest
    server_side_encryption_configuration {
      rule {
        apply_server_side_encryption_by_default {
          sse_algorithm     = "aws:kms"
          kms_master_key_id = "alias/terraform-bucket-key"
        }
      }
    }

    # Cross-region replication configuration for disaster recovery
    # Implements requirement: Disaster Recovery - Multi-region state storage
    replication_configuration {
      role = "arn:aws:iam::ACCOUNT_ID:role/terraform-state-replication-role"
      rules {
        id     = "terraform-state-replication"
        status = "Enabled"
        
        destination {
          bucket            = "arn:aws:s3:::terraform-state-bucket-dr"
          storage_class     = "STANDARD"
          replica_kms_key_id = "arn:aws:kms:us-west-2:ACCOUNT_ID:key/terraform-bucket-key-dr"
        }
      }
    }
  }
}

# Note: This backend configuration ensures:
# - State files are encrypted at rest using KMS
# - State locking prevents concurrent modifications
# - Versioning enables state history tracking
# - Cross-region replication provides disaster recovery capability
# - Private ACL ensures secure access control