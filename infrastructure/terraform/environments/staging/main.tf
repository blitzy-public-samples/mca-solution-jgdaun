# Dollar Funding MCA Application Processing System - Staging Environment Infrastructure
# Implements pre-production testing environment with similar architecture to production
# but with reduced redundancy and cost-optimized resources.
# Version: Terraform >= 1.0.0

# Configure Terraform settings and required providers
terraform {
  required_version = ">= 1.0.0"
  
  # Configure remote state storage for staging environment
  # Implements requirement: Infrastructure Deployment - State management
  backend "s3" {
    bucket         = "dollar-funding-terraform-state-staging"
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock-staging"
  }
}

# Configure provider with staging-specific settings
provider "aws" {
  # AWS Provider version ~> 4.0
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = "staging"
      Project     = "Dollar Funding MCA"
      ManagedBy   = "Terraform"
    }
  }
}

# Local variables for staging environment
locals {
  environment = "staging"
  
  # Staging-specific VPC configuration
  vpc_cidr = "10.1.0.0/16"
  public_subnets = ["10.1.1.0/24", "10.1.2.0/24"]
  private_subnets = ["10.1.10.0/24", "10.1.11.0/24"]
  availability_zones = ["us-east-1a", "us-east-1b"]

  # Staging-specific instance sizing
  app_instance_type = "t3.large"        # As per compute resources specification
  processing_instance_type = "c5.2xlarge" # For OCR processing
  min_instances = 2                      # Reduced redundancy for staging
  max_instances = 4                      # Cost optimization for staging

  # Database configuration
  db_instance_type = "db.t3.large"
  db_name = "dollar_funding_staging"
  
  # Monitoring and backup settings
  backup_retention_period = 7    # Reduced retention for staging
  monitoring_interval = 60       # Standard monitoring interval
}

# VPC Module - Staging Region
# Implements requirements: Network Architecture, Pre-production Testing Environment
module "vpc" {
  source = "../../modules/vpc"

  vpc_cidr = local.vpc_cidr
  public_subnets = local.public_subnets
  private_subnets = local.private_subnets
  availability_zones = local.availability_zones
  environment = local.environment
}

# RDS Module - Staging Database
# Implements requirements: Storage Resources, Database Configuration
module "rds" {
  source = "../../modules/rds"
  
  environment = local.environment
  db_instance_type = local.db_instance_type
  db_name = local.db_name
  db_username = var.db_username
  db_password = var.db_password
  backup_retention_period = local.backup_retention_period
  monitoring_interval = local.monitoring_interval
  vpc_id = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  depends_on = [module.vpc]
}

# S3 Module - Document Storage
# Implements requirements: Storage Resources, Document Storage
module "s3" {
  source = "../../modules/s3"

  environment = local.environment
  bucket_prefix = "dollar-funding-mca-staging"
  versioning_enabled = true
  lifecycle_rules_enabled = true
}

# ECS Module - Container Orchestration
# Implements requirements: Compute Resources, Container Orchestration
module "ecs" {
  source = "../../modules/ecs"

  environment = local.environment
  vpc_id = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  app_instance_type = local.app_instance_type
  processing_instance_type = local.processing_instance_type
  min_instances = local.min_instances
  max_instances = local.max_instances
}

# CloudFront Module - Content Delivery
# Implements requirements: Content Delivery, Edge Caching
module "cloudfront" {
  source = "../../modules/cloudfront"

  environment = local.environment
  s3_bucket_domain = module.s3.bucket_domain_name
  domain_name = "staging.dollarfunding.com"
}

# Route53 Module - DNS Management
# Implements requirements: DNS Management
module "route53" {
  source = "../../modules/route53"

  environment = local.environment
  domain_name = "staging.dollarfunding.com"
  cloudfront_distribution_domain = module.cloudfront.distribution_domain_name
}

# Output values for other components
# Implements requirement: Infrastructure Outputs
output "vpc_id" {
  description = "ID of the staging VPC"
  value       = module.vpc.vpc_id
}

output "rds_endpoint" {
  description = "Endpoint of the staging RDS instance"
  value       = module.rds.endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "Name of the staging S3 bucket"
  value       = module.s3.bucket_name
}

output "cloudfront_distribution_id" {
  description = "ID of the staging CloudFront distribution"
  value       = module.cloudfront.distribution_id
}

output "ecs_cluster_name" {
  description = "Name of the staging ECS cluster"
  value       = module.ecs.cluster_name
}