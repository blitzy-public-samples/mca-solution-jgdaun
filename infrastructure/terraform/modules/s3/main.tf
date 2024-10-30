# AWS Provider version ~> 4.0
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Input variables
variable "active_bucket_name" {
  description = "Name of the S3 bucket for active documents"
  type        = string
}

variable "archive_bucket_name" {
  description = "Name of the S3 bucket for archived documents"
  type        = string
}

variable "replication_region" {
  description = "AWS region for cross-region replication"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev/staging/prod)"
  type        = string
}

variable "versioning_enabled" {
  description = "Enable versioning on S3 buckets"
  type        = bool
  default     = true
}

variable "archive_transition_days" {
  description = "Number of days after which objects should transition to IA storage"
  type        = number
  default     = 90
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local variables for resource naming and tagging
locals {
  common_tags = {
    Environment = var.environment
    Project     = "Dollar Funding MCA"
    ManagedBy   = "Terraform"
  }
}

# Active Documents S3 Bucket
# Implements requirement: Document Storage - S3 Standard for active documents
resource "aws_s3_bucket" "active" {
  bucket = var.active_bucket_name
  tags   = local.common_tags
}

# Archive Documents S3 Bucket
# Implements requirement: Document Storage - S3 IA for archived documents
resource "aws_s3_bucket" "archive" {
  provider = aws.replication
  bucket   = var.archive_bucket_name
  tags     = local.common_tags
}

# Versioning configuration for active bucket
# Implements requirement: Document Storage - Versioning enabled
resource "aws_s3_bucket_versioning" "active" {
  bucket = aws_s3_bucket.active.id
  versioning_configuration {
    status = var.versioning_enabled ? "Enabled" : "Suspended"
  }
}

# Versioning configuration for archive bucket
resource "aws_s3_bucket_versioning" "archive" {
  provider = aws.replication
  bucket   = aws_s3_bucket.archive.id
  versioning_configuration {
    status = var.versioning_enabled ? "Enabled" : "Suspended"
  }
}

# Server-side encryption configuration for active bucket
# Implements requirement: Data Security - AES-256 encryption at rest
resource "aws_s3_bucket_server_side_encryption_configuration" "active" {
  bucket = aws_s3_bucket.active.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_id
      sse_algorithm     = "aws:kms"
    }
  }
}

# Server-side encryption configuration for archive bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "archive" {
  provider = aws.replication
  bucket   = aws_s3_bucket.archive.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_id
      sse_algorithm     = "aws:kms"
    }
  }
}

# Lifecycle configuration for active bucket
# Implements requirement: Document Storage - Transition to IA storage
resource "aws_s3_bucket_lifecycle_configuration" "active" {
  bucket = aws_s3_bucket.active.id

  rule {
    id     = "archive_old_documents"
    status = "Enabled"

    transition {
      days          = var.archive_transition_days
      storage_class = "STANDARD_IA"
    }
  }
}

# Cross-region replication configuration
# Implements requirement: Document Storage - Cross-region replication
resource "aws_s3_bucket_replication_configuration" "active" {
  depends_on = [aws_s3_bucket_versioning.active]

  role   = aws_iam_role.replication.arn
  bucket = aws_s3_bucket.active.id

  rule {
    id     = "document_replication"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.archive.arn
      storage_class = "STANDARD_IA"

      encryption_configuration {
        replica_kms_key_id = var.kms_key_arn
      }
    }

    source_selection_criteria {
      sse_kms_encrypted_objects {
        status = "Enabled"
      }
    }
  }
}

# Block public access
# Implements requirement: Data Security - Prevent public access
resource "aws_s3_bucket_public_access_block" "active" {
  bucket = aws_s3_bucket.active.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "archive" {
  provider = aws.replication
  bucket   = aws_s3_bucket.archive.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM role for replication
resource "aws_iam_role" "replication" {
  name = "s3-bucket-replication-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })
}

# IAM policy for replication
resource "aws_iam_role_policy" "replication" {
  name = "s3-bucket-replication-policy"
  role = aws_iam_role.replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.active.arn
        ]
      },
      {
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Effect = "Allow"
        Resource = [
          "${aws_s3_bucket.active.arn}/*"
        ]
      },
      {
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Effect = "Allow"
        Resource = [
          "${aws_s3_bucket.archive.arn}/*"
        ]
      },
      {
        Action = [
          "kms:Decrypt"
        ]
        Effect = "Allow"
        Resource = [
          var.kms_key_arn
        ]
        Condition = {
          StringLike = {
            "kms:ViaService" : "s3.${data.aws_region.current.name}.amazonaws.com"
          }
        }
      },
      {
        Action = [
          "kms:Encrypt"
        ]
        Effect = "Allow"
        Resource = [
          var.kms_key_arn
        ]
        Condition = {
          StringLike = {
            "kms:ViaService" : "s3.${var.replication_region}.amazonaws.com"
          }
        }
      }
    ]
  })
}

# Provider configuration for replication region
provider "aws" {
  alias  = "replication"
  region = var.replication_region
}

# Outputs as specified in JSON specification
output "active_bucket" {
  value = {
    id  = aws_s3_bucket.active.id
    arn = aws_s3_bucket.active.arn
  }
  description = "Active documents S3 bucket identifiers"
}

output "archive_bucket" {
  value = {
    id  = aws_s3_bucket.archive.id
    arn = aws_s3_bucket.archive.arn
  }
  description = "Archived documents S3 bucket identifiers"
}