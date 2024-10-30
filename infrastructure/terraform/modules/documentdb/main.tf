# AWS Provider version ~> 4.0
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Local variables for resource naming and tagging
locals {
  name_prefix = "dollar-funding-mca"
  common_tags = {
    Project     = "Dollar Funding MCA"
    Environment = terraform.workspace
    ManagedBy   = "Terraform"
  }
}

# Security group for DocumentDB cluster
# Implements requirement: Network Security - Secure access control for DocumentDB
resource "aws_security_group" "docdb" {
  name_prefix = "${local.name_prefix}-docdb-"
  description = "Security group for DocumentDB cluster"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = var.allowed_security_groups
    description     = "Allow MongoDB protocol access from application layer"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-docdb-sg"
    }
  )
}

# DocumentDB cluster parameter group
# Implements requirement: Data Security - Secure configuration for DocumentDB
resource "aws_docdb_cluster_parameter_group" "main" {
  family      = "docdb4.0"
  name_prefix = "${local.name_prefix}-"
  description = "DocumentDB cluster parameter group for ${local.name_prefix}"

  parameter {
    name  = "tls"
    value = "enabled"
  }

  parameter {
    name  = "audit_logs"
    value = "enabled"
  }

  tags = local.common_tags
}

# DocumentDB subnet group
resource "aws_docdb_subnet_group" "main" {
  name_prefix = "${local.name_prefix}-"
  description = "DocumentDB subnet group for ${local.name_prefix}"
  subnet_ids  = var.private_db_subnet_ids

  tags = local.common_tags
}

# DocumentDB cluster
# Implements requirements: DocumentDB Cluster Deployment and Data Security
resource "aws_docdb_cluster" "main" {
  cluster_identifier              = "${local.name_prefix}-docdb-cluster"
  engine                         = "docdb"
  engine_version                 = var.engine_version
  master_username               = var.master_username
  master_password               = var.master_password
  backup_retention_period        = var.backup_retention_period
  preferred_backup_window        = var.preferred_backup_window
  preferred_maintenance_window   = var.preferred_maintenance_window
  skip_final_snapshot           = var.skip_final_snapshot
  final_snapshot_identifier     = "${local.name_prefix}-final-snapshot"
  deletion_protection           = var.deletion_protection
  apply_immediately             = var.apply_immediately
  storage_encrypted             = var.storage_encrypted
  kms_key_id                    = var.kms_key_id
  vpc_security_group_ids        = [aws_security_group.docdb.id]
  db_subnet_group_name          = aws_docdb_subnet_group.main.name
  db_cluster_parameter_group_name = aws_docdb_cluster_parameter_group.main.name
  port                          = 27017

  tags = local.common_tags
}

# DocumentDB cluster instances
resource "aws_docdb_cluster_instance" "instances" {
  count              = var.instance_count
  identifier_prefix  = "${local.name_prefix}-docdb-${count.index + 1}-"
  cluster_identifier = aws_docdb_cluster.main.id
  instance_class     = var.instance_class

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-docdb-instance-${count.index + 1}"
    }
  )
}

# Variables
variable "vpc_id" {
  description = "ID of the VPC where DocumentDB will be deployed"
  type        = string
}

variable "private_db_subnet_ids" {
  description = "List of private database subnet IDs"
  type        = list(string)
}

variable "allowed_security_groups" {
  description = "List of security group IDs allowed to access DocumentDB"
  type        = list(string)
  default     = []
}

variable "master_username" {
  description = "Username for the master DB user"
  type        = string
  sensitive   = true
}

variable "master_password" {
  description = "Password for the master DB user"
  type        = string
  sensitive   = true
}

variable "instance_class" {
  description = "Instance class for DocumentDB cluster instances"
  type        = string
  default     = "db.r5.large"
}

variable "engine_version" {
  description = "DocumentDB engine version"
  type        = string
  default     = "4.0.0"
}

variable "backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "preferred_backup_window" {
  description = "Daily time range during which backups happen"
  type        = string
  default     = "03:00-04:00"
}

variable "preferred_maintenance_window" {
  description = "Weekly time range during which maintenance can occur"
  type        = string
  default     = "mon:04:00-mon:05:00"
}

variable "skip_final_snapshot" {
  description = "Whether to skip final snapshot when destroying the cluster"
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Whether to enable deletion protection"
  type        = bool
  default     = true
}

variable "apply_immediately" {
  description = "Whether to apply changes immediately or during maintenance window"
  type        = bool
  default     = false
}

variable "storage_encrypted" {
  description = "Whether to encrypt the storage"
  type        = bool
  default     = true
}

variable "kms_key_id" {
  description = "KMS key ID for storage encryption"
  type        = string
  default     = null
}

variable "instance_count" {
  description = "Number of cluster instances"
  type        = number
  default     = 3
}

# Outputs
output "endpoint" {
  description = "The DNS address of the DocumentDB cluster"
  value       = aws_docdb_cluster.main.endpoint
}

output "reader_endpoint" {
  description = "A read-only endpoint for the DocumentDB cluster"
  value       = aws_docdb_cluster.main.reader_endpoint
}

output "port" {
  description = "The port on which the DocumentDB cluster accepts connections"
  value       = aws_docdb_cluster.main.port
}

output "security_group_id" {
  description = "ID of the security group created for DocumentDB"
  value       = aws_security_group.docdb.id
}