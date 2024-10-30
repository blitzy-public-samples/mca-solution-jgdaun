"""
API V1 Endpoints Initialization Module

This module serves as the central configuration point for all API v1 endpoints,
implementing a modular API structure with proper route prefixing and router aggregation.

Version Requirements:
- fastapi==0.68.0
"""

# Third-party imports
from fastapi import APIRouter

# Import routers from endpoint modules
from .auth import router as auth_router
from .users import router as users_router
from .email import router as email_router
from .documents import router as documents_router
from .ocr import router as ocr_router
from .webhooks import router as webhooks_router

# Initialize main v1 API router with prefix
# Implements RESTful API Endpoints requirement by aggregating all endpoints under /api/v1
api_router = APIRouter(prefix='/api/v1')

# Include all endpoint routers with appropriate tags and prefixes
# Implements API Request Flow requirement by properly organizing and connecting endpoint routers
api_router.include_router(
    auth_router,
    prefix="/auth",
    tags=["authentication"]
)

api_router.include_router(
    users_router,
    prefix="/users",
    tags=["users"]
)

api_router.include_router(
    email_router,
    prefix="/email",
    tags=["email"]
)

api_router.include_router(
    documents_router,
    prefix="/documents",
    tags=["documents"]
)

api_router.include_router(
    ocr_router,
    prefix="/ocr",
    tags=["ocr"]
)

api_router.include_router(
    webhooks_router,
    prefix="/webhooks",
    tags=["webhooks"]
)

# Export the aggregated router for use in the main FastAPI application
__all__ = ["api_router"]