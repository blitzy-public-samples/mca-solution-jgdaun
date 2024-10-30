# Dollar Funding MCA Application Processing System - Production Environment Configuration
# Implements high-availability, multi-AZ infrastructure with disaster recovery capabilities
# Version: Terraform >= 1.0.0

# Import core configuration and variables
# Implements requirement: Production Environment Deployment
terraform {
  required_version = ">= 1.0.0"
  
  # Configure S3 backend for state management
  backend "s3" {
    bucket         = "dollar-funding-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

# Provider configuration for primary region (us-east-1)
provider "aws" {
  region = "us-east-1"
  
  default_tags {
    tags = {
      Environment = "production"
      Project     = "Dollar Funding MCA"
      ManagedBy   = "Terraform"
    }
  }
}

# Provider configuration for DR region (us-west-2)
provider "aws" {
  alias  = "dr"
  region = "us-west-2"
  
  default_tags {
    tags = {
      Environment = "production-dr"
      Project     = "Dollar Funding MCA"
      ManagedBy   = "Terraform"
    }
  }
}

# VPC Module - Production Configuration
# Implements requirement: High Availability Architecture
module "vpc" {
  source = "../../modules/vpc"
  
  vpc_cidr = "10.0.0.0/16"
  public_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnets = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  
  environment = "production"
  enable_nat_gateway = true
  single_nat_gateway = false
  enable_vpn_gateway = true
}

# ECS Module - Production Configuration
# Implements requirement: Compute Resource Configuration
module "ecs" {
  source = "../../modules/ecs"
  
  cluster_name = "dollar-funding-prod"
  instance_type = "t3.large"
  min_size = 3
  max_size = 10
  desired_capacity = 3
  
  vpc_id = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
}

# RDS Module - Production Configuration
module "rds" {
  source = "../../modules/rds"
  
  cluster_identifier = "dollar-funding-prod"
  engine = "aurora-postgresql"
  engine_version = "13.7"
  instance_class = "db.r5.large"
  instances = {
    1 = { instance_class = "db.r5.large" }
    2 = { instance_class = "db.r5.large" }
    3 = { instance_class = "db.r5.large" }
  }
  
  vpc_id = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  backup_retention_period = 35
  preferred_backup_window = "03:00-04:00"
}

# DocumentDB Module - Production Configuration
module "documentdb" {
  source = "../../modules/documentdb"
  
  cluster_identifier = "dollar-funding-prod"
  engine = "docdb"
  instance_class = "db.r5.large"
  instances = 3
  
  vpc_id = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  backup_retention_period = 35
}

# S3 Module - Production Configuration
module "s3" {
  source = "../../modules/s3"
  
  bucket_name = "dollar-funding-prod-documents"
  versioning_enabled = true
  lifecycle_rules = true
  
  replication_enabled = true
  replication_region = "us-west-2"
}

# CloudFront Module - Production Configuration
module "cloudfront" {
  source = "../../modules/cloudfront"
  
  origin_domain_name = module.s3.bucket_domain_name
  price_class = "PriceClass_All"
  geo_restrictions = []
  
  web_acl_id = module.waf.web_acl_id
}

# WAF Module - Production Configuration
module "waf" {
  source = "../../modules/waf"
  
  name = "dollar-funding-prod"
  ip_rate_limit = 2000
  scope = "REGIONAL"
}

# KMS Module - Production Configuration
module "kms" {
  source = "../../modules/kms"
  
  alias = "dollar-funding-prod"
  deletion_window_in_days = 30
  enable_key_rotation = true
}

# Route53 Module - Production Configuration
module "route53" {
  source = "../../modules/route53"
  
  domain_name = "dollarfunding.com"
  enable_dnssec = true
  
  failover_routing = true
  secondary_region = "us-west-2"
}

# SES Module - Production Configuration
module "ses" {
  source = "../../modules/ses"
  
  domain = "dollarfunding.com"
  enable_dkim = true
  enable_spf = true
}

# Production Infrastructure Outputs
output "vpc_id" {
  description = "Production VPC ID"
  value = module.vpc.vpc_id
}

output "ecs_cluster_name" {
  description = "Production ECS Cluster Name"
  value = module.ecs.cluster_name
}

output "rds_endpoint" {
  description = "Production RDS Endpoint"
  value = module.rds.rds_endpoint
  sensitive = true
}

output "documentdb_endpoint" {
  description = "Production DocumentDB Endpoint"
  value = module.documentdb.cluster_endpoint
  sensitive = true
}

output "s3_bucket_name" {
  description = "Production S3 Bucket Name"
  value = module.s3.bucket_name
}

output "cloudfront_distribution_id" {
  description = "Production CloudFront Distribution ID"
  value = module.cloudfront.distribution_id
}

output "waf_web_acl_id" {
  description = "Production WAF Web ACL ID"
  value = module.waf.web_acl_id
}

output "kms_key_id" {
  description = "Production KMS Key ID"
  value = module.kms.key_id
  sensitive = true
}

output "route53_zone_id" {
  description = "Production Route53 Zone ID"
  value = module.route53.zone_id
}

output "ses_identity_arn" {
  description = "Production SES Identity ARN"
  value = module.ses.identity_arn
}