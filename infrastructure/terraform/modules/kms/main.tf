# AWS Provider version >= 4.0 required for KMS functionality
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0"
    }
  }
}

# Input variables for the module
variable "environment" {
  description = "The deployment environment (dev/staging/prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod"
  }
}

variable "key_administrators" {
  description = "List of IAM ARNs that can administer the KMS key"
  type        = list(string)
}

# Local variables for policy and tag configuration
locals {
  # Standard tags to be applied to all resources
  tags = {
    Environment = var.environment
    Purpose     = "data-encryption"
    ManagedBy   = "terraform"
  }

  # KMS key policy document
  key_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow Key Administrators"
        Effect = "Allow"
        Principal = {
          AWS = var.key_administrators
        }
        Action = [
          "kms:Create*",
          "kms:Describe*",
          "kms:Enable*",
          "kms:List*",
          "kms:Put*",
          "kms:Update*",
          "kms:Revoke*",
          "kms:Disable*",
          "kms:Get*",
          "kms:Delete*",
          "kms:ScheduleKeyDeletion",
          "kms:CancelKeyDeletion"
        ]
        Resource = "*"
      }
    ]
  })
}

# Get current AWS account information
data "aws_caller_identity" "current" {}

# Create KMS key for data encryption
# Implements requirement: Data Security - AES-256 encryption at rest
resource "aws_kms_key" "data_encryption_key" {
  description              = "KMS key for data encryption in ${var.environment} environment"
  deletion_window_in_days  = 30
  key_usage               = "ENCRYPT_DECRYPT"
  customer_master_key_spec = "SYMMETRIC_DEFAULT"  # AES-256 symmetric key
  enable_key_rotation     = true                 # Automatic key rotation every 365 days
  is_enabled             = true
  policy                 = local.key_policy

  # Hardware security module backing for enhanced security
  # Implements requirement: Encryption Implementation with HSM backing
  multi_region = false  # Single-region key for better security control

  tags = local.tags
}

# Create an alias for the KMS key
resource "aws_kms_alias" "data_encryption_key_alias" {
  name          = "alias/${var.environment}/data-encryption"
  target_key_id = aws_kms_key.data_encryption_key.key_id
}

# Output the KMS key ID and ARN for use by other modules
output "kms_key_id" {
  description = "The ID of the KMS key"
  value       = aws_kms_key.data_encryption_key.id
}

output "kms_key_arn" {
  description = "The ARN of the KMS key"
  value       = aws_kms_key.data_encryption_key.arn
}