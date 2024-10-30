# AWS Provider version ~> 4.0
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Variables
variable "environment" {
  description = "Deployment environment (dev/staging/prod)"
  type        = string
}

variable "price_class" {
  description = "CloudFront distribution price class"
  type        = string
  default     = "PriceClass_100"
}

variable "ssl_support_method" {
  description = "SSL support method for CloudFront distribution"
  type        = string
  default     = "sni-only"
}

variable "minimum_protocol_version" {
  description = "Minimum TLS protocol version"
  type        = string
  default     = "TLSv1.2_2021"
}

# Data sources
data "aws_region" "current" {}

# Local variables for resource naming and tagging
locals {
  name_prefix = "dollar-funding-mca"
  common_tags = {
    Environment = var.environment
    Project     = "Dollar Funding MCA"
    ManagedBy   = "Terraform"
  }
}

# Origin Access Identity for S3 bucket access
# Implements requirement: Network Security - Secure origin access to S3 buckets
resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "Origin Access Identity for ${local.name_prefix}-${var.environment}"
}

# WAF Web ACL for CloudFront
# Implements requirement: Network Security - WAF rules and security controls
resource "aws_wafv2_web_acl" "cloudfront" {
  name        = "${local.name_prefix}-cloudfront-waf-${var.environment}"
  description = "WAF Web ACL for CloudFront distribution"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # AWS Managed Rules - Common Rule Set
  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "AWSManagedRulesCommonRuleSetMetric"
      sampled_requests_enabled  = true
    }
  }

  # AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "AWS-AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "AWSManagedRulesKnownBadInputsRuleSetMetric"
      sampled_requests_enabled  = true
    }
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 3

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "RateLimitRuleMetric"
      sampled_requests_enabled  = true
    }
  }

  # Geo-restriction rule
  rule {
    name     = "GeoRestrictionRule"
    priority = 4

    action {
      block {}
    }

    statement {
      geo_match_statement {
        country_codes = ["IR", "KP", "RU"]
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "GeoRestrictionRuleMetric"
      sampled_requests_enabled  = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name               = "CloudFrontWAFMetric"
    sampled_requests_enabled  = true
  }

  tags = local.common_tags
}

# CloudFront Distribution
# Implements requirement: Network Architecture - CloudFront distributions for content delivery
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${local.name_prefix} distribution for ${var.environment}"
  price_class         = var.price_class
  web_acl_id          = aws_wafv2_web_acl.cloudfront.arn
  aliases             = ["cdn.${data.aws_route53_zone.public.name}"]
  default_root_object = "index.html"

  # Origin configuration for S3
  origin {
    domain_name = data.aws_s3_bucket.active.bucket_regional_domain_name
    origin_id   = "S3-${data.aws_s3_bucket.active.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }

  # Default cache behavior
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${data.aws_s3_bucket.active.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  # SSL/TLS configuration
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cdn.arn
    ssl_support_method       = var.ssl_support_method
    minimum_protocol_version = var.minimum_protocol_version
  }

  # Geo restrictions
  restrictions {
    geo_restriction {
      restriction_type = "blacklist"
      locations        = ["IR", "KP", "RU"]
    }
  }

  # Custom error responses
  custom_error_response {
    error_code         = 403
    response_code      = 404
    response_page_path = "/404.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/404.html"
  }

  tags = local.common_tags

  depends_on = [aws_acm_certificate_validation.cdn]
}

# ACM Certificate for CloudFront
resource "aws_acm_certificate" "cdn" {
  provider          = aws.us-east-1  # CloudFront requires certificates in us-east-1
  domain_name       = "cdn.${data.aws_route53_zone.public.name}"
  validation_method = "DNS"

  tags = local.common_tags

  lifecycle {
    create_before_destroy = true
  }
}

# DNS validation record for ACM certificate
resource "aws_route53_record" "cdn_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cdn.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = data.aws_route53_zone.public.zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60
}

# Certificate validation
resource "aws_acm_certificate_validation" "cdn" {
  provider                = aws.us-east-1
  certificate_arn         = aws_acm_certificate.cdn.arn
  validation_record_fqdns = [for record in aws_route53_record.cdn_validation : record.fqdn]
}

# CloudFront DNS record
resource "aws_route53_record" "cdn" {
  zone_id = data.aws_route53_zone.public.zone_id
  name    = "cdn.${data.aws_route53_zone.public.name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id               = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# WAF Web ACL Association
resource "aws_wafv2_web_acl_association" "cloudfront" {
  resource_arn = aws_cloudfront_distribution.main.arn
  web_acl_arn  = aws_wafv2_web_acl.cloudfront.arn
}

# Data sources for dependencies
data "aws_route53_zone" "public" {
  zone_id = var.public_zone_id
}

data "aws_s3_bucket" "active" {
  bucket = var.active_bucket_id
}

# Provider configuration for ACM certificates
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}

# Variables for dependencies
variable "public_zone_id" {
  description = "Route53 public zone ID"
  type        = string
}

variable "active_bucket_id" {
  description = "S3 bucket ID for active content"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for security group associations"
  type        = string
}

# Outputs as specified in JSON specification
output "cloudfront_distribution_id" {
  description = "CloudFront distribution details"
  value = {
    distribution_id = aws_cloudfront_distribution.main.id
    domain_name     = aws_cloudfront_distribution.main.domain_name
  }
}

output "cloudfront_waf_web_acl_id" {
  description = "WAF Web ACL ID for CloudFront"
  value = {
    web_acl_id = aws_wafv2_web_acl.cloudfront.id
  }
}

output "origin_access_identity" {
  description = "CloudFront Origin Access Identity ARN"
  value = {
    iam_arn = aws_cloudfront_origin_access_identity.main.iam_arn
  }
}