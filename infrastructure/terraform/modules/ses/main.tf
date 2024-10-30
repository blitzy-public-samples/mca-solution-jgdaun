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
  description = "Domain name for SES configuration"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "route53_zone_id" {
  description = "Route53 zone ID for DNS record creation"
  type        = string
}

# Local variables for resource naming and tagging
locals {
  mail_from_domain = "mail.${var.domain_name}"
  
  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "dollar-funding-mca"
  }
}

# Create SES domain identity
# Implements requirement: Email Processing - Setup of AWS SES for handling email sending and receiving
resource "aws_ses_domain_identity" "main" {
  domain = var.domain_name
}

# Verify domain ownership through Route53
resource "aws_route53_record" "ses_verification" {
  zone_id = var.route53_zone_id
  name    = "_amazonses.${var.domain_name}"
  type    = "TXT"
  ttl     = "600"
  records = [aws_ses_domain_identity.main.verification_token]
}

# Configure DKIM for the domain
# Implements requirement: Email Security - Implementation of DKIM for email authentication
resource "aws_ses_domain_dkim" "main" {
  domain = aws_ses_domain_identity.main.domain
}

# Create DKIM DNS records
resource "aws_route53_record" "dkim" {
  count   = 3
  zone_id = var.route53_zone_id
  name    = "${element(aws_ses_domain_dkim.main.dkim_tokens, count.index)}._domainkey.${var.domain_name}"
  type    = "CNAME"
  ttl     = "600"
  records = ["${element(aws_ses_domain_dkim.main.dkim_tokens, count.index)}.dkim.amazonses.com"]
}

# Configure custom MAIL FROM domain
# Implements requirement: Email Processing - Configuration of mail-from domains for secure email processing
resource "aws_ses_domain_mail_from" "main" {
  domain           = aws_ses_domain_identity.main.domain
  mail_from_domain = local.mail_from_domain
}

# Create MX record for MAIL FROM domain
resource "aws_route53_record" "mail_from_mx" {
  zone_id = var.route53_zone_id
  name    = local.mail_from_domain
  type    = "MX"
  ttl     = "600"
  records = ["10 feedback-smtp.${data.aws_region.current.name}.amazonses.com"]

  depends_on = [aws_ses_domain_mail_from.main]
}

# Create SPF record for MAIL FROM domain
# Implements requirement: Email Security - Implementation of SPF records for email authentication
resource "aws_route53_record" "mail_from_spf" {
  zone_id = var.route53_zone_id
  name    = local.mail_from_domain
  type    = "TXT"
  ttl     = "600"
  records = ["v=spf1 include:amazonses.com -all"]
}

# Create SES receipt rule set for email receiving
resource "aws_ses_receipt_rule_set" "main" {
  rule_set_name = "${var.environment}-email-rules"
}

# Activate the rule set
resource "aws_ses_active_receipt_rule_set" "main" {
  rule_set_name = aws_ses_receipt_rule_set.main.rule_set_name
}

# Get current AWS region
data "aws_region" "current" {}

# Outputs as specified in the JSON specification
output "domain_identity_arn" {
  description = "The ARN of the SES domain identity"
  value       = aws_ses_domain_identity.main.arn
}

output "dkim_tokens" {
  description = "The DKIM tokens for the domain"
  value       = aws_ses_domain_dkim.main.dkim_tokens
}

output "mail_from_domain" {
  description = "The configured MAIL FROM domain"
  value       = aws_ses_domain_mail_from.main.mail_from_domain
}