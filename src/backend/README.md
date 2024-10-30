# Dollar Funding MCA Application Processing System - Backend Services

## Overview

This repository contains the backend services for the Dollar Funding MCA Application Processing System, a microservices-based application deployed on AWS cloud infrastructure. The system processes merchant cash advance applications through automated document processing, OCR, and data extraction pipelines.

## System Architecture

The backend consists of the following microservices:
- Email Service: Handles incoming application emails and attachments
- Document Service: Manages document storage and processing workflows
- OCR Service: Performs optical character recognition on documents
- Webhook Service: Manages external integrations and notifications
- UI Service: Serves the frontend application

## Technology Stack

### Core Technologies
- FastAPI (v0.68.0): High-performance API framework
- SQLAlchemy (v1.4.23): ORM for database operations
- Celery (v5.1.2): Distributed task queue
- Pydantic (v1.8.2): Data validation and settings
- Alembic (v1.7.1): Database migrations

### Infrastructure
- AWS Services:
  - ECS/EKS for container orchestration
  - RDS for PostgreSQL
  - S3 for document storage
  - SQS/Redis for message queues
  - CloudWatch for monitoring

## Getting Started

### Prerequisites
- Python 3.9+
- Docker and Docker Compose
- AWS CLI configured with appropriate permissions
- PostgreSQL 13+
- Redis 6+

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd src/backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install poetry
poetry install
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Database Setup

1. Initialize the database:
```bash
alembic upgrade head
```

2. Create initial data:
```bash
python scripts/create_superuser.py
```

### Running the Application

#### Development Mode
```bash
# Start the backend API
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Start Celery workers
celery -A app.core.celery_app worker -l info -Q default,document_processing,ocr,webhooks
```

#### Docker Deployment
```bash
# Build and start services
docker-compose up --build
```

## Project Structure

```
src/backend/
├── alembic/              # Database migrations
├── app/
│   ├── api/             # API endpoints and routing
│   ├── core/            # Core application components
│   ├── db/              # Database models and sessions
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic schemas
│   ├── services/        # Business logic services
│   ├── tasks/           # Celery tasks
│   └── utils/           # Utility functions
├── scripts/             # Deployment and maintenance scripts
├── tests/               # Test suites
├── .env.example         # Environment variables template
├── docker-compose.yml   # Docker composition
├── Dockerfile          # Container definition
└── pyproject.toml      # Dependencies and build config
```

## API Documentation

Once running, API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Development Workflow

### Code Style
- Follow PEP 8 guidelines
- Use type hints
- Document functions and classes
- Run pre-commit hooks before committing

### Testing
```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app tests/
```

### Database Migrations
```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## Deployment

### Production Deployment
1. Build Docker images:
```bash
docker build -t mca-backend:latest .
```

2. Push to container registry:
```bash
docker tag mca-backend:latest <registry>/mca-backend:latest
docker push <registry>/mca-backend:latest
```

3. Deploy using Kubernetes:
```bash
kubectl apply -f infrastructure/k8s/
```

### Health Checks
- API Health: `GET /api/v1/health`
- Worker Health: `celery -A app.core.celery_app status`
- Database Health: `GET /api/v1/health/db`

## Monitoring

### Metrics and Logging
- Application logs: CloudWatch Logs
- Metrics: Prometheus/Grafana
- Tracing: AWS X-Ray
- Error tracking: Sentry

### Alert Configuration
- CPU/Memory thresholds
- API response times
- Queue processing delays
- Error rate spikes

## Security

### Authentication
- JWT-based authentication
- Role-based access control (RBAC)
- API key authentication for webhooks

### Data Protection
- TLS encryption in transit
- S3 server-side encryption
- Database encryption at rest
- Sensitive data masking

## Support

For support and bug reports:
1. Check existing issues
2. Create a new issue with:
   - Environment details
   - Steps to reproduce
   - Expected vs actual behavior

## License

[License details here]