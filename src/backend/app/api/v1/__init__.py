"""
API Version 1 Router Initialization

This module initializes and configures the API version 1 router by combining all endpoint routers
for the backend application. Implements RESTful API standards with proper versioning and route
organization.

Version Requirements:
- fastapi==0.68.0
"""

# Third-party imports
from fastapi import APIRouter

# Internal imports - endpoint routers
from .endpoints.auth import router as auth_router
from .endpoints.users import router as users_router
from .endpoints.email import router as email_router
from .endpoints.documents import router as documents_router
from .endpoints.ocr import router as ocr_router
from .endpoints.webhooks import router as webhooks_router

# Initialize main v1 router with prefix and tags
# This implements the RESTful API versioning requirement from system_design/api_design/restful_endpoints
router = APIRouter(prefix='/api/v1', tags=['v1'])

# Include all endpoint routers
# This implements the API request flow requirement from system_components_architecture/sequence_diagrams/api_request_flow
router.include_router(
    auth_router,
    prefix="/auth",
    tags=["authentication"]
)

router.include_router(
    users_router,
    prefix="/users",
    tags=["users"]
)

router.include_router(
    email_router,
    prefix="/email",
    tags=["email"]
)

router.include_router(
    documents_router,
    prefix="/documents",
    tags=["documents"]
)

router.include_router(
    ocr_router,
    prefix="/ocr",
    tags=["ocr"]
)

router.include_router(
    webhooks_router,
    prefix="/webhooks",
    tags=["webhooks"]
)

# The combined router is exported and used by the main FastAPI application
# to provide a complete RESTful API with proper versioning and organization