"""
API Package Initialization Module

This module initializes and configures the FastAPI application with all necessary middleware
and dependencies including authentication, rate limiting, CORS, and database connections.

Version Requirements:
- fastapi==0.95.0
- slowapi==0.1.4
- starlette==0.26.1
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from typing import Dict, Optional

# Internal imports
from app.core.config import Config
from app.db.session import get_db
from app.api.deps import get_current_user

# Initialize configuration
config = Config()

# Initialize rate limiter
# Implementation addresses Rate Limiting requirement from system_design.api_design.rate_limiting
rate_limiter = Limiter(key_func=get_remote_address)

# Initialize FastAPI application with OpenAPI documentation configuration
app = FastAPI(
    title='Document Processing API',
    version='1.0.0',
    docs_url='/api/v1/docs',
    openapi_url='/api/v1/openapi.json',
    redoc_url='/api/v1/redoc'
)

def configure_cors(app: FastAPI) -> None:
    """
    Configures CORS middleware with security settings from configuration.
    Implementation addresses security requirements for cross-origin requests.

    Args:
        app: FastAPI application instance
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in config.allowed_origins],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "X-Requested-With"
        ],
        expose_headers=[
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset"
        ]
    )

def configure_rate_limiting(app: FastAPI) -> None:
    """
    Sets up tiered rate limiting based on user subscription plan.
    Implementation addresses Rate Limiting requirement from system_design.api_design.rate_limiting.

    Args:
        app: FastAPI application instance
    """
    # Add rate limiting middleware
    app.state.limiter = rate_limiter
    app.add_middleware(SlowAPIMiddleware)

    # Configure tier-based rate limits
    @app.middleware("http")
    async def rate_limit_by_tier(request: Request, call_next):
        try:
            # Get current user from request if authenticated
            user = None
            try:
                user = await get_current_user(request)
            except HTTPException:
                # Use basic tier limits for unauthenticated requests
                pass

            # Set rate limit based on user tier
            tier_limits = {
                "basic": "100/minute",
                "premium": "500/minute",
                "enterprise": "2000/minute"
            }
            
            limit = tier_limits.get(
                user.subscription_tier if user else "basic",
                tier_limits["basic"]
            )
            
            # Apply rate limit
            await rate_limiter.hit(request, limit)
            response = await call_next(request)
            return response

        except RateLimitExceeded as e:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded",
                    "limit": str(e.limit),
                    "reset": str(e.reset)
                }
            )

def create_app() -> FastAPI:
    """
    Creates and configures the FastAPI application instance with all necessary middleware
    and routes. Implementation addresses API Initialization requirement.

    Returns:
        FastAPI: Configured FastAPI application instance
    """
    # Configure CORS
    configure_cors(app)

    # Configure rate limiting
    configure_rate_limiting(app)

    # Add exception handlers
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        """Custom HTTP exception handler with detailed error responses"""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail,
                "code": exc.status_code,
                "path": request.url.path
            }
        )

    # Include API v1 router
    from app.api.v1 import api_router
    app.include_router(api_router, prefix="/api/v1")

    # Add startup event handler
    @app.on_event("startup")
    async def startup_event():
        """Initializes database connection pool and verifies connectivity"""
        # Verify database connection
        db = next(get_db())
        try:
            # Test database connection
            db.execute("SELECT 1")
        finally:
            db.close()

    return app

# Create the FastAPI application instance
app = create_app()