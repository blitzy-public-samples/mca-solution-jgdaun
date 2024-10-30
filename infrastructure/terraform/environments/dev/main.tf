# Dollar Funding MCA Application Processing System - Development Environment
# AWS Provider Version: ~> 4.0
# Implements requirements for development environment infrastructure deployment in us-east-2

# Terraform configuration block
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
  
  # Implements requirement: Infrastructure State Management
  backend "s3" {
    bucket         = "terraform-state-bucket-dev"
    key            = "dev/terraform.tfstate"
    region         = "us-east-2"
    encrypt        = true
    dynamodb_table = "terraform-lock-dev"
    acl            = "private"
  }
}

# Local variables for environment configuration
locals {
  environment = "dev"
  region      = "us-east-2"
  tags = {
    Environment = "dev"
    Project     = "Dollar Funding MCA"
    ManagedBy   = "Terraform"
  }
}

# Provider configuration for development environment
# Implements requirement: Infrastructure Deployment - AWS cloud deployment
provider "aws" {
  region = local.region
  default_tags {
    tags = local.tags
  }
}

# VPC Module Configuration
# Implements requirement: High Availability Architecture - Multi-AZ deployment
module "vpc" {
  source = "../../modules/vpc"

  vpc_cidr         = var.vpc_cidr
  public_subnets   = var.public_subnets
  private_subnets  = var.private_subnets
  environment      = local.environment
  region           = local.region
}

# KMS Module Configuration
# Implements requirement: Cloud Services Configuration - KMS
module "kms" {
  source = "../../modules/kms"

  environment = local.environment
  region      = local.region
}

# S3 Module Configuration
# Implements requirement: Cloud Services Configuration - S3
module "s3" {
  source = "../../modules/s3"

  environment = local.environment
  kms_key_id  = module.kms.key_id
}

# RDS Module Configuration
# Implements requirement: Cloud Services Configuration - RDS (PostgreSQL)
module "rds" {
  source = "../../modules/rds"

  environment          = local.environment
  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnet_ids
  instance_type       = var.db_instance_type
  multi_az            = false  # Dev environment uses single AZ
  kms_key_id          = module.kms.key_id
  backup_retention    = 7      # 7 days retention for dev
}

# DocumentDB Module Configuration
# Implements requirement: Cloud Services Configuration - DocumentDB
module "documentdb" {
  source = "../../modules/documentdb"

  environment     = local.environment
  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.private_subnet_ids
  instance_type  = "db.t3.medium"  # Dev-appropriate instance size
  instance_count = 1               # Single instance for dev
}

# ECS Module Configuration
# Implements requirement: Cloud Services Configuration - ECS (Fargate)
module "ecs" {
  source = "../../modules/ecs"

  environment         = local.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids
  
  app_instance_type        = var.app_instance_type
  processing_instance_type = var.processing_instance_type
  min_instances           = 1  # Minimum instances for dev
  max_instances           = 2  # Maximum instances for dev
}

# SES Module Configuration
# Implements requirement: Cloud Services Configuration - SES
module "ses" {
  source = "../../modules/ses"

  environment = local.environment
  domain      = "dev.dollarfunding.com"
}

# CloudFront Module Configuration
# Implements requirement: Cloud Services Configuration - CloudFront
module "cloudfront" {
  source = "../../modules/cloudfront"

  environment      = local.environment
  s3_bucket_id     = module.s3.bucket_id
  domain_name      = "dev.dollarfunding.com"
}

# WAF Module Configuration
# Implements requirement: Cloud Services Configuration - WAF
module "waf" {
  source = "../../modules/waf"

  environment = local.environment
  cloudfront_distribution_id = module.cloudfront.distribution_id
}

# Route53 Module Configuration
# Implements requirement: Infrastructure Deployment - DNS configuration
module "route53" {
  source = "../../modules/route53"

  environment = local.environment
  domain_name = "dev.dollarfunding.com"
  cloudfront_domain_name = module.cloudfront.domain_name
  cloudfront_zone_id    = module.cloudfront.hosted_zone_id
}

# Outputs
# Implements requirement: Infrastructure Deployment - Resource information exposure
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = module.vpc.private_subnet_ids
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.endpoint
  sensitive   = true
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = module.cloudfront.distribution_id
}