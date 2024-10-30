# Dollar Funding MCA Application Processing System

A comprehensive microservices-based application for automating Merchant Cash Advance (MCA) application processing, deployed on AWS cloud infrastructure.

## System Overview

The Dollar Funding MCA Application Processing System is an enterprise-grade, cloud-native solution designed to automate the processing of Merchant Cash Advance applications through the following core components:

### Core Components

1. **Email Processing Subsystem**
   - Monitors submissions@dollarfunding.com
   - Processes incoming broker submissions
   - Extracts and validates attachments
   - Manages email metadata storage

2. **Document Processing Pipeline**
   - Advanced OCR engine for text extraction
   - Machine learning-based document classification
   - Intelligent form field recognition
   - PDF processing and storage management

3. **Data Management Layer**
   - PostgreSQL for structured application data
   - MongoDB for document metadata
   - S3-compatible object storage for documents
   - Encrypted data storage with field-level security

4. **Integration Layer**
   - RESTful API endpoints
   - Webhook notification system
   - Real-time status updates
   - Secure authentication mechanisms

5. **User Interface**
   - Web-based dashboard
   - Document viewer
   - Configuration management
   - Status monitoring

## Prerequisites

### Backend Requirements
- Python 3.9+
- PostgreSQL 13.0+
- MongoDB 5.0+
- Redis 6.2+
- AWS Account with appropriate permissions

### Frontend Requirements
- Node.js 16+
- npm or yarn package manager

## Technology Stack

### Backend
- FastAPI (v0.68.0) - API Framework
- PostgreSQL (v13.0) - Primary Database
- MongoDB (v5.0) - Document Storage
- Redis (v6.2) - Caching and Message Queue
- Celery - Asynchronous Task Processing
- AWS Services (S3, SES, etc.)

### Frontend
- React (v18.2.0) - UI Framework
- React DOM (v18.2.0) - DOM Manipulation
- Redux - State Management
- TypeScript - Type Safety
- Tailwind CSS - Styling

## Setup Instructions

### Backend Setup

1. Clone the repository
```bash
git clone [repository-url]
cd [repository-name]/src/backend
```

2. Create and activate virtual environment
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows
```

3. Install dependencies
```bash
pip install -r requirements.txt
```

4. Configure environment variables
```bash
cp .env.example .env
# Edit .env file with your configuration
```

5. Run database migrations
```bash
alembic upgrade head
```

6. Start development server
```bash
uvicorn main:app --reload
```

### Frontend Setup

1. Navigate to frontend directory
```bash
cd src/web
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env file with your configuration
```

4. Start development server
```bash
npm run dev
```

## Development Guidelines

### Coding Standards
- Follow PEP 8 for Python code
- Use ESLint and Prettier for TypeScript/React code
- Write unit tests for all new features
- Document all public APIs and functions

### Git Workflow
- Use feature branches for development
- Follow conventional commits specification
- Require code review before merging
- Maintain clean commit history

## Deployment Instructions

### Infrastructure Setup

1. Configure AWS credentials
```bash
aws configure
```

2. Apply Terraform configurations
```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

3. Setup Kubernetes cluster
```bash
cd infrastructure/k8s
kubectl apply -f .
```

### Application Deployment

1. Build Docker images
```bash
docker-compose build
```

2. Deploy using Kubernetes manifests
```bash
kubectl apply -f infrastructure/k8s/
```

3. Configure environment variables
```bash
kubectl create configmap app-config --from-env-file=.env
```

4. Verify deployment
```bash
kubectl get pods
kubectl get services
```

## Monitoring and Logging

- Prometheus for metrics collection
- Grafana for visualization
- ELK Stack for log aggregation
- DataDog for APM and infrastructure monitoring

## Security Features

- Role-based access control (RBAC)
- JWT-based authentication
- Data encryption at rest and in transit
- Regular security audits and penetration testing
- Automated security scanning in CI/CD pipeline

## License

[License Type] - See LICENSE file for details

## Support

For support and questions, please contact:
- Technical Support: [email]
- Documentation: [link]
- Issue Tracker: [link]