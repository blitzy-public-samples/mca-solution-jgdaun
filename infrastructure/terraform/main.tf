# Dollar Funding MCA Application Processing System - Main Infrastructure Configuration
# Implements multi-region, high-availability architecture with comprehensive security and monitoring
# Version: Terraform >= 1.0.0

# Configure Terraform settings and required providers
terraform {
  required_version = ">= 1.0.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws" # version ~> 4.0
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random" # version ~> 3.0
      version = "~> 3.0"
    }
    local = {
      source  = "hashicorp/local" # version ~> 2.0
      version = "~> 2.0"
    }
  }

  # Configure remote state storage
  # Implements requirement: Infrastructure Deployment - State management
  backend "s3" {
    bucket         = "dollar-funding-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

# Configure AWS Provider for primary region
# Implements requirement: Infrastructure Deployment - Multi-region deployment
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "Dollar Funding MCA"
      ManagedBy   = "Terraform"
    }
  }
}

# Configure AWS Provider for DR region when enabled
# Implements requirement: System Architecture - Disaster Recovery
provider "aws" {
  alias  = "dr"
  region = "us-west-2"

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "Dollar Funding MCA"
      ManagedBy   = "Terraform"
      Role        = "DR"
    }
  }
  count = var.enable_dr ? 1 : 0
}

# Random string for unique resource naming
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# VPC Module - Primary Region
# Implements requirements: Network Architecture, High Availability
module "vpc" {
  source = "./modules/vpc"

  vpc_cidr_block             = var.vpc_cidr
  public_subnet_cidrs        = var.public_subnets
  private_app_subnet_cidrs   = slice(var.private_subnets, 0, 3)
  private_db_subnet_cidrs    = slice(var.private_subnets, 3, 6)
  private_monitoring_subnet_cidrs = slice(var.private_subnets, 6, 9)
}

# RDS Module - Primary Region
# Implements requirements: Storage Resources, Database Configuration
module "rds" {
  source = "./modules/rds"
  
  environment            = var.environment
  db_instance_type      = var.db_instance_type
  db_name               = var.db_name
  db_username           = var.db_username
  db_password           = var.db_password
  backup_retention_period = var.backup_retention_period
  monitoring_interval   = var.monitoring_interval

  depends_on = [module.vpc]
}

# S3 Module - Primary Region
# Implements requirements: Storage Resources, Document Storage
module "s3" {
  source = "./modules/s3"

  environment = var.environment
  bucket_prefix = "dollar-funding-mca-${var.environment}"
  versioning_enabled = true
  lifecycle_rules_enabled = true
}

# ECS Module - Primary Region
# Implements requirements: Compute Resources, Container Orchestration
module "ecs" {
  source = "./modules/ecs"

  environment = var.environment
  vpc_id = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_app_subnet_ids
  app_instance_type = var.app_instance_type
  processing_instance_type = var.processing_instance_type
  min_instances = var.min_instances
  max_instances = var.max_instances
}

# CloudFront Module - Global
# Implements requirements: Content Delivery, Edge Caching
module "cloudfront" {
  source = "./modules/cloudfront"

  environment = var.environment
  s3_bucket_domain = module.s3.bucket_domain_name
  waf_web_acl_id = module.waf.web_acl_id
}

# Route53 Module - Global
# Implements requirements: DNS Management, High Availability
module "route53" {
  source = "./modules/route53"

  environment = var.environment
  domain_name = "dollarfunding.com"
  cloudfront_distribution_domain = module.cloudfront.distribution_domain_name
}

# DR Region Resources (when enabled)
# Implements requirement: Disaster Recovery Configuration
module "vpc_dr" {
  source = "./modules/vpc"
  count  = var.enable_dr ? 1 : 0
  
  providers = {
    aws = aws.dr
  }

  vpc_cidr_block             = "172.16.0.0/16"
  public_subnet_cidrs        = ["172.16.1.0/24", "172.16.2.0/24"]
  private_app_subnet_cidrs   = ["172.16.3.0/24", "172.16.4.0/24"]
  private_db_subnet_cidrs    = ["172.16.5.0/24", "172.16.6.0/24"]
  private_monitoring_subnet_cidrs = ["172.16.7.0/24", "172.16.8.0/24"]
}

module "rds_dr" {
  source = "./modules/rds"
  count  = var.enable_dr ? 1 : 0
  
  providers = {
    aws = aws.dr
  }

  environment            = "${var.environment}-dr"
  db_instance_type      = var.db_instance_type
  db_name               = var.db_name
  db_username           = var.db_username
  db_password           = var.db_password
  backup_retention_period = var.backup_retention_period
  monitoring_interval   = var.monitoring_interval

  depends_on = [module.vpc_dr]
}

# Output values for other components
# Implements requirement: Infrastructure Outputs
output "vpc_id" {
  description = "ID of the primary VPC"
  value       = module.vpc.vpc_id
}

output "rds_endpoint" {
  description = "Endpoint of the primary RDS instance"
  value       = module.rds.endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "Name of the primary S3 bucket"
  value       = module.s3.bucket_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = module.cloudfront.distribution_id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

# Local variables for resource naming and tagging
locals {
  name_prefix = "dollar-funding-mca-${var.environment}"
  common_tags = {
    Environment = var.environment
    Project     = "Dollar Funding MCA"
    ManagedBy   = "Terraform"
    LastUpdated = timestamp()
  }
}