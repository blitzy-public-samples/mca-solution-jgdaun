# AWS Provider Configuration for Dollar Funding MCA Application Processing System
# Version: ~> 4.0 (hashicorp/aws)

# Terraform configuration block specifying required providers and version constraints
terraform {
  # Implements requirement: Infrastructure Deployment - Multi-region deployment architecture
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
  required_version = ">= 1.0.0"
}

# Local variables for environment configuration
locals {
  # Primary region for production workload (us-east-1)
  primary_region = "us-east-1"
  
  # DR region for failover capability (us-west-2)
  dr_region = "us-west-2"
  
  # Environment name (production, staging, development)
  environment = "production"
}

# Primary AWS Provider Configuration
# Implements requirement: Cloud Services Configuration - Configuration of AWS services
provider "aws" {
  region  = local.primary_region
  profile = local.environment

  # Default tags applied to all resources in primary region
  default_tags {
    tags = {
      Environment         = local.environment
      Project            = "DollarFunding-MCA"
      ManagedBy          = "Terraform"
      Service            = "MCA-Processing"
      CostCenter         = "Technology"
      DataClassification = "Confidential"
    }
  }
}

# Disaster Recovery AWS Provider Configuration
# Implements requirement: High Availability - Microservices architecture deployed across multiple availability zones
provider "aws" {
  alias   = "dr"
  region  = local.dr_region
  profile = local.environment

  # Default tags applied to all resources in DR region
  default_tags {
    tags = {
      Environment         = local.environment
      Project            = "DollarFunding-MCA"
      ManagedBy          = "Terraform"
      Service            = "MCA-Processing-DR"
      CostCenter         = "Technology"
      DataClassification = "Confidential"
    }
  }
}