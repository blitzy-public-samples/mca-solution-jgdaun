# Dollar Funding MCA Application Processing System - Infrastructure Variables
# Implements requirements for multi-region, high-availability deployment with comprehensive
# security and monitoring configurations

# Region Configuration
# Implements requirement: Infrastructure Deployment - Multi-region support
variable "primary_region" {
  description = "Primary AWS region for deploying resources"
  type        = string
  default     = "us-east-1"
}

variable "dr_region" {
  description = "Disaster recovery AWS region"
  type        = string
  default     = "us-west-2"
}

# Environment Configuration
# Implements requirement: Infrastructure Deployment - Environment segregation
variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod"
  }
}

# Network Configuration
# Implements requirement: High Availability Architecture - Multi-AZ deployment
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block"
  }
}

variable "public_subnets" {
  description = "CIDR blocks for public subnets across multiple AZs"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnets" {
  description = "CIDR blocks for private subnets across multiple AZs"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
}

variable "availability_zones" {
  description = "List of availability zones for multi-AZ deployment"
  type        = list(string)
  validation {
    condition     = length(var.availability_zones) >= 2
    error_message = "At least two availability zones must be specified for high availability"
  }
}

# Compute Configuration
# Implements requirement: Cloud Services Configuration - EC2 instance specifications
variable "app_instance_type" {
  description = "EC2 instance type for application servers"
  type        = string
  default     = "t3.large"
}

variable "processing_instance_type" {
  description = "EC2 instance type for OCR processing servers with GPU support"
  type        = string
  default     = "c5.2xlarge"
}

# Auto Scaling Configuration
# Implements requirement: High Availability Architecture - Auto-scaling configuration
variable "min_instances" {
  description = "Minimum number of instances per service in auto-scaling group"
  type        = number
  default     = 3
  validation {
    condition     = var.min_instances >= 2
    error_message = "Minimum instances must be at least 2 for high availability"
  }
}

variable "max_instances" {
  description = "Maximum number of instances in auto-scaling group"
  type        = number
  default     = 10
  validation {
    condition     = var.max_instances > var.min_instances
    error_message = "Maximum instances must be greater than minimum instances"
  }
}

# Database Configuration
# Implements requirement: Cloud Services Configuration - RDS specifications
variable "db_instance_type" {
  description = "RDS instance type"
  type        = string
  default     = "db.t3.large"
}

variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]*$", var.db_name))
    error_message = "Database name must start with a letter and contain only alphanumeric characters and underscores"
  }
}

variable "db_username" {
  description = "Master username for PostgreSQL database"
  type        = string
  sensitive   = true
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]*$", var.db_username))
    error_message = "Database username must start with a letter and contain only alphanumeric characters and underscores"
  }
}

variable "db_password" {
  description = "Master password for PostgreSQL database"
  type        = string
  sensitive   = true
  validation {
    condition     = length(var.db_password) >= 16
    error_message = "Database password must be at least 16 characters long"
  }
}

# Disaster Recovery Configuration
# Implements requirement: Infrastructure Deployment - DR configuration
variable "enable_dr" {
  description = "Enable disaster recovery configuration"
  type        = bool
  default     = true
}

# Security Configuration
# Implements requirement: Cloud Services Configuration - Security settings
variable "kms_key_deletion_window" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 30
  validation {
    condition     = var.kms_key_deletion_window >= 7 && var.kms_key_deletion_window <= 30
    error_message = "KMS key deletion window must be between 7 and 30 days"
  }
}

# Backup Configuration
# Implements requirement: Cloud Services Configuration - Backup settings
variable "backup_retention_period" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 30
  validation {
    condition     = var.backup_retention_period >= 7
    error_message = "Backup retention period must be at least 7 days"
  }
}

# Monitoring Configuration
# Implements requirement: Cloud Services Configuration - Monitoring settings
variable "monitoring_interval" {
  description = "Monitoring interval in seconds for enhanced monitoring"
  type        = number
  default     = 60
  validation {
    condition     = contains([0, 1, 5, 10, 15, 30, 60], var.monitoring_interval)
    error_message = "Monitoring interval must be one of: 0, 1, 5, 10, 15, 30, 60"
  }
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 90
  validation {
    condition     = var.log_retention_days >= 30
    error_message = "Log retention period must be at least 30 days"
  }
}