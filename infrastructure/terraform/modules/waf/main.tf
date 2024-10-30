# AWS Provider version ~> 4.0
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Variables based on JSON specification globals
variable "environment" {
  description = "Deployment environment (dev/staging/prod)"
  type        = string
}

variable "rate_limit_threshold" {
  description = "Rate limit threshold for requests"
  type        = number
  default     = 2000
}

variable "block_period_seconds" {
  description = "Block period in seconds for rate-limited requests"
  type        = number
  default     = 300
}

variable "ip_rate_limit" {
  description = "Rate limit per IP address"
  type        = number
  default     = 2000
}

variable "geo_match_statement" {
  description = "Geographic match statement configuration"
  type = object({
    country_codes = list(string)
  })
  default = {
    country_codes = ["US", "CA"]
  }
}

# Local variables for resource naming and tagging
locals {
  name_prefix = "dollar-funding-mca"
  common_tags = {
    Environment = var.environment
    Project     = "Dollar Funding MCA"
    ManagedBy   = "Terraform"
  }
}

# WAF Web ACL for API and UI Protection
# Implements requirement: Network Security - WAF rules to protect APIs and UI from common web exploits
resource "aws_wafv2_web_acl" "main" {
  name        = "${local.name_prefix}-waf-${var.environment}"
  description = "WAF rules for Dollar Funding MCA Application"
  scope       = "REGIONAL"

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

  # SQL Injection Prevention
  rule {
    name     = "AWS-AWSManagedRulesSQLiRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "AWSManagedRulesSQLiRuleSetMetric"
      sampled_requests_enabled  = true
    }
  }

  # Cross-Site Scripting Prevention
  rule {
    name     = "AWS-AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3

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

  # IP Rate Limiting Rule
  rule {
    name     = "IPRateLimiting"
    priority = 4

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.ip_rate_limit
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "IPRateLimitingMetric"
      sampled_requests_enabled  = true
    }
  }

  # Geographic Access Control
  rule {
    name     = "GeoRestriction"
    priority = 5

    action {
      allow {}
    }

    statement {
      geo_match_statement {
        country_codes = var.geo_match_statement.country_codes
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "GeoRestrictionMetric"
      sampled_requests_enabled  = true
    }
  }

  # Custom Rule for API Rate Limiting
  rule {
    name     = "APIRateLimiting"
    priority = 6

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.rate_limit_threshold
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "APIRateLimitingMetric"
      sampled_requests_enabled  = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name               = "${local.name_prefix}-waf-metrics-${var.environment}"
    sampled_requests_enabled  = true
  }

  tags = local.common_tags
}

# IP Set for managing blocked IP addresses
resource "aws_wafv2_ip_set" "blocked_ips" {
  name               = "${local.name_prefix}-blocked-ips-${var.environment}"
  description        = "IP set for blocked addresses"
  scope              = "REGIONAL"
  ip_address_version = "IPV4"
  addresses          = []  # Empty by default, managed through AWS Console or API

  tags = local.common_tags
}

# Regex Pattern Set for custom rule matching
resource "aws_wafv2_regex_pattern_set" "custom_patterns" {
  name        = "${local.name_prefix}-regex-patterns-${var.environment}"
  description = "Regex patterns for custom WAF rules"
  scope       = "REGIONAL"

  regular_expression {
    regex_string = "^/api/v[0-9]+/"  # Match API version patterns
  }

  tags = local.common_tags
}

# WAF Web ACL Association with CloudFront
resource "aws_wafv2_web_acl_association" "cloudfront" {
  resource_arn = var.cloudfront_distribution_id
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# Variables for dependencies
variable "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for WAF association"
  type        = string
}

variable "route53_zone_id" {
  description = "Route53 zone ID for DNS management"
  type        = string
}

# Outputs as specified in JSON specification
output "waf_web_acl_id" {
  description = "WAF Web ACL ID and ARN"
  value = {
    web_acl_id = aws_wafv2_web_acl.main.id
    arn        = aws_wafv2_web_acl.main.arn
  }
}

output "waf_ip_set_id" {
  description = "WAF IP Set ID"
  value = {
    ip_set_id = aws_wafv2_ip_set.blocked_ips.id
  }
}