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
variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC for private hosted zone association"
  type        = string
}

# Local variables for resource naming and tagging
locals {
  public_zone_tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "dollar-funding-mca"
  }

  private_zone_tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "dollar-funding-mca"
    Type        = "private"
  }
}

# Public hosted zone for external DNS resolution
# Implements requirement: Network Architecture - DNS management using AWS Route 53
resource "aws_route53_zone" "public" {
  name = var.domain_name

  tags = local.public_zone_tags

  comment = "Public hosted zone for ${var.domain_name}"
}

# Private hosted zone for internal DNS resolution within VPC
resource "aws_route53_zone" "private" {
  name = "internal.${var.domain_name}"

  vpc {
    vpc_id = var.vpc_id
  }

  tags = local.private_zone_tags

  comment = "Private hosted zone for internal VPC DNS resolution"
}

# Route53 health check for application endpoint
resource "aws_route53_health_check" "app_health" {
  fqdn              = "api.${var.domain_name}"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"

  tags = merge(local.public_zone_tags, {
    Name = "app-health-check"
  })
}

# DNS resolver endpoint for hybrid DNS resolution
resource "aws_route53_resolver_endpoint" "outbound" {
  name      = "outbound-resolver"
  direction = "OUTBOUND"

  security_group_ids = [aws_security_group.resolver.id]

  ip_address {
    subnet_id = data.aws_subnet.private_selected.id
  }

  tags = merge(local.private_zone_tags, {
    Name = "outbound-resolver"
  })
}

# Security group for Route53 resolver endpoint
resource "aws_security_group" "resolver" {
  name_prefix = "route53-resolver-"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.private_zone_tags, {
    Name = "route53-resolver-sg"
  })
}

# Data source to get a private subnet for resolver endpoint
data "aws_subnet" "private_selected" {
  vpc_id = var.vpc_id
  filter {
    name   = "tag:Type"
    values = ["Application"]
  }
  state = "available"
}

# Default A record for the application
resource "aws_route53_record" "app" {
  zone_id = aws_route53_zone.public.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id               = var.alb_zone_id
    evaluate_target_health = true
  }
}

# Health check based failover record for API
resource "aws_route53_record" "api_failover_primary" {
  zone_id = aws_route53_zone.public.zone_id
  name    = "api-failover.${var.domain_name}"
  type    = "A"

  failover_routing_policy {
    type = "PRIMARY"
  }

  set_identifier = "primary"
  health_check_id = aws_route53_health_check.app_health.id

  alias {
    name                   = var.primary_alb_dns_name
    zone_id               = var.primary_alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "api_failover_secondary" {
  zone_id = aws_route53_zone.public.zone_id
  name    = "api-failover.${var.domain_name}"
  type    = "A"

  failover_routing_policy {
    type = "SECONDARY"
  }

  set_identifier = "secondary"

  alias {
    name                   = var.secondary_alb_dns_name
    zone_id               = var.secondary_alb_zone_id
    evaluate_target_health = true
  }
}

# Variables for ALB integration
variable "alb_dns_name" {
  description = "DNS name of the application load balancer"
  type        = string
}

variable "alb_zone_id" {
  description = "Zone ID of the application load balancer"
  type        = string
}

variable "primary_alb_dns_name" {
  description = "DNS name of the primary application load balancer"
  type        = string
}

variable "primary_alb_zone_id" {
  description = "Zone ID of the primary application load balancer"
  type        = string
}

variable "secondary_alb_dns_name" {
  description = "DNS name of the secondary application load balancer"
  type        = string
}

variable "secondary_alb_zone_id" {
  description = "Zone ID of the secondary application load balancer"
  type        = string
}

# Outputs as specified in the JSON specification
output "public_zone_id" {
  description = "The ID of the public Route 53 zone"
  value       = aws_route53_zone.public.zone_id
}

output "private_zone_id" {
  description = "The ID of the private Route 53 zone"
  value       = aws_route53_zone.private.zone_id
}

output "nameservers" {
  description = "The nameservers for the public zone"
  value       = aws_route53_zone.public.name_servers
}