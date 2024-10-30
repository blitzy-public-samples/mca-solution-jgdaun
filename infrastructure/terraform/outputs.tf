# Terraform outputs for Dollar Funding MCA Application Processing System
# These outputs expose critical infrastructure values for cross-module references
# and external system integration

# VPC and Network Outputs
# Implements requirement: High Availability Architecture - Multi-AZ deployment
output "vpc_id" {
  description = "ID of the VPC where the infrastructure is deployed"
  value       = data.aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets for load balancers and public-facing resources"
  value       = data.aws_subnets.public.ids
}

output "private_subnet_ids" {
  description = "IDs of private subnets for application and data tiers"
  value       = data.aws_subnets.private.ids
}

# Database Outputs
# Implements requirement: Cloud Services Configuration - RDS configuration exposure
output "rds_endpoint" {
  description = "Connection endpoint for the RDS PostgreSQL database"
  value       = module.rds.endpoint
  sensitive   = true
}

output "rds_port" {
  description = "Port number for RDS PostgreSQL database connections"
  value       = module.rds.port
}

# Storage Outputs
# Implements requirement: Cloud Services Configuration - S3 configuration
output "s3_bucket_name" {
  description = "Name of the S3 bucket for document storage"
  value       = module.s3.bucket_name
}

# Container Service Outputs
# Implements requirement: Infrastructure Deployment - ECS service details
output "ecs_cluster_name" {
  description = "Name of the ECS cluster running the application containers"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "Name of the ECS service running the application"
  value       = module.ecs.service_name
}

# Content Delivery Outputs
# Implements requirement: Cloud Services Configuration - CloudFront distribution
output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution for content delivery"
  value       = module.cloudfront.distribution_id
}

output "app_url" {
  description = "Public URL of the application through CloudFront"
  value       = module.cloudfront.domain_name
}

# Security Outputs
# Implements requirement: Cloud Services Configuration - KMS key exposure
output "kms_key_id" {
  description = "ID of the KMS key used for encryption"
  value       = module.kms.key_id
  sensitive   = true
}

# Email Service Outputs
# Implements requirement: Cloud Services Configuration - SES configuration
output "ses_domain_identity" {
  description = "Verified SES domain identity for email processing"
  value       = module.ses.domain_identity
}

# Region Configuration Outputs
# Implements requirement: Infrastructure Deployment - Multi-region support
output "primary_region" {
  description = "AWS region for primary deployment"
  value       = local.primary_region
}

output "dr_region" {
  description = "AWS region for disaster recovery"
  value       = local.dr_region
}

# Environment Information
output "environment" {
  description = "Current deployment environment (production, staging, development)"
  value       = local.environment
}