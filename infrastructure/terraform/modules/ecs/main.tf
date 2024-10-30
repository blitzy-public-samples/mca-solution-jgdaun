# Dollar Funding MCA Application Processing System - ECS Module
# AWS Provider version ~> 4.0

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Local variables for resource naming and configuration
locals {
  name_prefix = "${var.environment}-mca"
  common_tags = {
    Environment = var.environment
    Project     = "MCA Application Processing"
    ManagedBy   = "Terraform"
  }

  # Service definitions with their configurations
  services = {
    email = {
      name           = "email-service"
      container_port = 8000
      cpu           = 2048
      memory        = 4096
      instance_type = var.app_service_instance_type
    }
    document = {
      name           = "document-service"
      container_port = 8001
      cpu           = 2048
      memory        = 4096
      instance_type = var.app_service_instance_type
    }
    ocr = {
      name           = "ocr-service"
      container_port = 8002
      cpu           = 4096
      memory        = 8192
      instance_type = var.processing_service_instance_type
    }
    webhook = {
      name           = "webhook-service"
      container_port = 8003
      cpu           = 2048
      memory        = 4096
      instance_type = var.app_service_instance_type
    }
    ui = {
      name           = "ui-service"
      container_port = 80
      cpu           = 1024
      memory        = 2048
      instance_type = var.app_service_instance_type
    }
  }
}

# ECS Cluster
# Implements requirement: Compute Resources - ECS cluster for microservices deployment
resource "aws_ecs_cluster" "main" {
  name = "${local.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-cluster"
    }
  )
}

# ECS Capacity Providers
# Implements requirement: Auto-scaling and high availability across multiple AZs
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

# Security Groups
resource "aws_security_group" "ecs_tasks" {
  name_prefix = "${local.name_prefix}-ecs-tasks-"
  description = "Security group for ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-ecs-tasks-sg"
    }
  )
}

resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-alb-sg"
    }
  )
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = var.private_app_subnet_ids

  enable_deletion_protection = true
  enable_http2              = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-alb"
    }
  )
}

# Task Execution Role
resource "aws_iam_role" "ecs_task_execution" {
  name = "${local.name_prefix}-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
    "arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess"
  ]

  tags = local.common_tags
}

# Service Task Definitions and Services
resource "aws_ecs_task_definition" "services" {
  for_each = local.services

  family                   = "${local.name_prefix}-${each.value.name}"
  requires_compatibilities = ["FARGATE"]
  network_mode            = "awsvpc"
  cpu                     = each.value.cpu
  memory                  = each.value.memory
  execution_role_arn      = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([
    {
      name  = each.value.name
      image = "${var.ecr_repository_url}/${each.value.name}:latest"
      portMappings = [
        {
          containerPort = each.value.container_port
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "DB_HOST"
          value = var.rds_endpoint
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${local.name_prefix}/${each.value.name}"
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-${each.value.name}-task"
    }
  )
}

# ECS Services
resource "aws_ecs_service" "services" {
  for_each = local.services

  name            = "${local.name_prefix}-${each.value.name}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.services[each.key].arn
  desired_count   = each.value.name == "ocr" ? var.min_processing_instances : var.min_app_instances

  launch_type = "FARGATE"

  network_configuration {
    subnets          = var.private_app_subnet_ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.services[each.key].arn
    container_name   = each.value.name
    container_port   = each.value.container_port
  }

  deployment_controller {
    type = "ECS"
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-${each.value.name}-service"
    }
  )

  lifecycle {
    ignore_changes = [desired_count]
  }
}

# Target Groups for Services
resource "aws_lb_target_group" "services" {
  for_each = local.services

  name        = "${local.name_prefix}-${each.value.name}-tg"
  port        = each.value.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 3
    interval            = 30
    matcher            = "200"
    path               = "/health"
    port               = "traffic-port"
    protocol           = "HTTP"
    timeout            = 5
    unhealthy_threshold = 3
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-${each.value.name}-tg"
    }
  )
}

# Auto Scaling
resource "aws_appautoscaling_target" "services" {
  for_each = local.services

  max_capacity       = each.value.name == "ocr" ? var.max_processing_instances : var.max_app_instances
  min_capacity       = each.value.name == "ocr" ? var.min_processing_instances : var.min_app_instances
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.services[each.key].name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  for_each = local.services

  name               = "${local.name_prefix}-${each.value.name}-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.services[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.services[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.services[each.key].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "services" {
  for_each = local.services

  name              = "/ecs/${local.name_prefix}/${each.value.name}"
  retention_in_days = 30

  tags = local.common_tags
}

# Data source for current region
data "aws_region" "current" {}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where ECS cluster will be deployed"
  type        = string
}

variable "private_app_subnet_ids" {
  description = "List of private subnet IDs for application tier"
  type        = list(string)
}

variable "rds_endpoint" {
  description = "RDS instance endpoint"
  type        = string
}

variable "app_service_instance_type" {
  description = "EC2 instance type for application services"
  type        = string
  default     = "t3.large"
}

variable "processing_service_instance_type" {
  description = "EC2 instance type for processing services"
  type        = string
  default     = "c5.2xlarge"
}

variable "min_app_instances" {
  description = "Minimum number of instances for application services"
  type        = number
  default     = 3
}

variable "max_app_instances" {
  description = "Maximum number of instances for application services"
  type        = number
  default     = 10
}

variable "min_processing_instances" {
  description = "Minimum number of instances for processing services"
  type        = number
  default     = 2
}

variable "max_processing_instances" {
  description = "Maximum number of instances for processing services"
  type        = number
  default     = 8
}

variable "ecr_repository_url" {
  description = "ECR repository URL for container images"
  type        = string
}

# Outputs
output "cluster_id" {
  description = "ECS cluster ID"
  value       = aws_ecs_cluster.main.id
}

output "service_arns" {
  description = "List of ECS service ARNs"
  value       = [for service in aws_ecs_service.services : service.id]
}

output "task_definition_arns" {
  description = "List of task definition ARNs"
  value       = [for td in aws_ecs_task_definition.services : td.arn]
}