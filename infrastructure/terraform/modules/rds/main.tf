# Dollar Funding MCA Application Processing System - RDS Module
# Implements PostgreSQL 13.x RDS instances with Multi-AZ deployment and enhanced monitoring
# Version: AWS Provider ~> 4.0

# Create DB subnet group for RDS instance
# Implements requirement: High Availability Architecture - Multi-AZ deployment
resource "aws_db_subnet_group" "default" {
  name        = "${var.environment}-mca-db-subnet-group"
  description = "Subnet group for MCA PostgreSQL RDS instance"
  subnet_ids  = data.aws_subnets.private.ids

  tags = {
    Name        = "${var.environment}-mca-db-subnet-group"
    Environment = var.environment
    Project     = "MCA Application Processing"
    Terraform   = "true"
  }
}

# Create security group for RDS instance
# Implements requirement: Security Architecture - Network Security
resource "aws_security_group" "rds_sg" {
  name        = "${var.environment}-mca-rds-sg"
  description = "Security group for MCA PostgreSQL RDS instance"
  vpc_id      = data.aws_vpc.main.id

  # Allow inbound PostgreSQL traffic from application security group
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [data.aws_security_group.app_sg.id]
    description     = "PostgreSQL access from application servers"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "${var.environment}-mca-rds-sg"
    Environment = var.environment
    Project     = "MCA Application Processing"
    Terraform   = "true"
  }
}

# Create IAM role for RDS enhanced monitoring
# Implements requirement: System Architecture - Monitoring & Logging
resource "aws_iam_role" "rds_monitoring_role" {
  name = "${var.environment}-mca-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  managed_policy_arns = ["arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"]

  tags = {
    Environment = var.environment
    Project     = "MCA Application Processing"
    Terraform   = "true"
  }
}

# Create parameter group for PostgreSQL 13
# Implements requirement: Database Configuration - PostgreSQL 13.x settings
resource "aws_db_parameter_group" "postgres13" {
  family = "postgres13"
  name   = "${var.environment}-mca-postgres13-params"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_checkpoints"
    value = "1"
  }

  parameter {
    name  = "log_lock_waits"
    value = "1"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"  # Log queries taking more than 1 second
  }

  tags = {
    Environment = var.environment
    Project     = "MCA Application Processing"
    Terraform   = "true"
  }
}

# Create RDS instance
# Implements requirements: Primary Data Store - PostgreSQL 13.x deployment
resource "aws_db_instance" "db_instance" {
  identifier = "${var.environment}-mca-postgres"
  
  # Instance specifications
  allocated_storage       = 20
  max_allocated_storage  = 100
  storage_type           = "gp3"
  storage_encrypted      = true
  
  # Engine configuration
  engine                = "postgres"
  engine_version        = "13.3"
  instance_class        = var.db_instance_type
  
  # Database configuration
  name                  = var.db_name
  username              = var.db_username
  password              = var.db_password
  parameter_group_name  = aws_db_parameter_group.postgres13.name
  
  # High availability configuration
  multi_az             = true
  availability_zone    = data.aws_availability_zones.available.names[0]
  
  # Backup configuration
  backup_retention_period   = var.backup_retention_period
  backup_window            = "03:00-04:00"
  maintenance_window       = "Mon:04:00-Mon:05:00"
  
  # Monitoring configuration
  monitoring_interval         = var.monitoring_interval
  monitoring_role_arn        = aws_iam_role.rds_monitoring_role.arn
  performance_insights_enabled = true
  performance_insights_retention_period = 7
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  
  # Network configuration
  db_subnet_group_name    = aws_db_subnet_group.default.name
  vpc_security_group_ids  = [aws_security_group.rds_sg.id]
  
  # Lifecycle configuration
  skip_final_snapshot     = false
  final_snapshot_identifier = "${var.environment}-mca-postgres-final"
  deletion_protection     = true
  auto_minor_version_upgrade = true

  tags = {
    Environment = var.environment
    Project     = "MCA Application Processing"
    Terraform   = "true"
  }
}

# Create read replica for scaling read operations
# Implements requirement: Primary Data Store - Read replicas
resource "aws_db_instance" "read_replica" {
  count               = var.environment == "prod" ? 1 : 0
  identifier          = "${var.environment}-mca-postgres-replica"
  instance_class      = var.db_instance_type
  replicate_source_db = aws_db_instance.db_instance.identifier
  
  storage_encrypted   = true
  monitoring_interval = var.monitoring_interval
  monitoring_role_arn = aws_iam_role.rds_monitoring_role.arn
  
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  
  auto_minor_version_upgrade = true
  
  tags = {
    Environment = var.environment
    Project     = "MCA Application Processing"
    Terraform   = "true"
    Role        = "ReadReplica"
  }
}

# Output values for other modules
output "endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.db_instance.endpoint
}

output "port" {
  description = "RDS instance port"
  value       = aws_db_instance.db_instance.port
}

output "identifier" {
  description = "RDS instance identifier"
  value       = aws_db_instance.db_instance.identifier
}

# Data sources
data "aws_vpc" "main" {
  tags = {
    Environment = var.environment
    Project     = "MCA Application Processing"
  }
}

data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
  
  tags = {
    Tier = "private"
  }
}

data "aws_security_group" "app_sg" {
  vpc_id = data.aws_vpc.main.id
  
  tags = {
    Name        = "${var.environment}-mca-app-sg"
    Environment = var.environment
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}