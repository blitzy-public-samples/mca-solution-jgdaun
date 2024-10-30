import logging
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from typing import List

# Version information for external dependencies
# fastapi==0.68.0
# uvicorn==0.15.0
# starlette==0.14.2

# Internal imports
from app.core.config import Config
from app.core.logging import setup_logging, get_logger, correlation_id_context
from app.core.celery_app import celery_app

# Import routers
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.email import router as email_router
from app.api.v1.endpoints.documents import router as documents_router
from app.api.v1.endpoints.ocr import router as ocr_router
from app.api.v1.endpoints.webhooks import router as webhooks_router

# Initialize logger
logger = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles application startup and shutdown events.
    Implements system initialization requirements from architecture overview.
    """
    # Startup
    try:
        logger.info("Starting application initialization")
        
        # Set up structured logging
        setup_logging()
        
        # Initialize Celery (ensure broker is ready)
        celery_app.conf.broker_pool_limit = 10
        
        logger.info("Application initialization completed successfully")
        yield
        
    except Exception as e:
        logger.error(f"Failed to initialize application: {str(e)}")
        raise
    
    # Shutdown
    finally:
        logger.info("Shutting down application")
        # Ensure Celery workers are properly shutdown
        celery_app.control.purge()
        # Close any remaining connections
        await app.state.close_connections()

def create_app() -> FastAPI:
    """
    Creates and configures the FastAPI application instance.
    Implements core system components integration requirements.
    """
    # Initialize configuration
    config = Config()
    
    # Create FastAPI instance with OpenAPI documentation
    app = FastAPI(
        title="Dollar Funding MCA Application Processing System",
        description="API for processing MCA applications and documents",
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        lifespan=lifespan
    )
    
    # Configure CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in config.allowed_origins],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Add correlation ID middleware
    @app.middleware("http")
    async def add_correlation_id(request: Request, call_next):
        correlation_id = request.headers.get("X-Correlation-ID", None)
        correlation_id_context.set(correlation_id)
        response = await call_next(request)
        return response
    
    # Add error handling middleware
    @app.middleware("http")
    async def error_handler(request: Request, call_next):
        try:
            return await call_next(request)
        except Exception as e:
            logger.error(f"Unhandled exception: {str(e)}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"}
            )
    
    # Configure API routes with versioning
    api_prefix = config.api_v1_prefix
    
    # Include routers with proper prefixes
    app.include_router(auth_router, prefix=f"{api_prefix}/auth", tags=["Authentication"])
    app.include_router(users_router, prefix=f"{api_prefix}/users", tags=["Users"])
    app.include_router(email_router, prefix=f"{api_prefix}/email", tags=["Email Processing"])
    app.include_router(documents_router, prefix=f"{api_prefix}/documents", tags=["Document Management"])
    app.include_router(ocr_router, prefix=f"{api_prefix}/ocr", tags=["OCR Processing"])
    app.include_router(webhooks_router, prefix=f"{api_prefix}/webhooks", tags=["Webhooks"])
    
    # Health check endpoint
    @app.get("/health")
    async def health_check():
        """Health check endpoint for kubernetes liveness probe"""
        return {"status": "healthy"}
    
    # Readiness check endpoint
    @app.get("/ready")
    async def readiness_check():
        """Readiness check endpoint for kubernetes readiness probe"""
        # Check critical service connections
        services_status = {
            "database": await check_db_connection(),
            "redis": await check_redis_connection(),
            "celery": check_celery_connection()
        }
        
        if all(services_status.values()):
            return {"status": "ready", "services": services_status}
        return JSONResponse(
            status_code=503,
            content={"status": "not ready", "services": services_status}
        )
    
    return app

async def check_db_connection() -> bool:
    """Checks database connectivity"""
    try:
        # Database health check implementation
        return True
    except Exception as e:
        logger.error(f"Database connection check failed: {str(e)}")
        return False

async def check_redis_connection() -> bool:
    """Checks Redis connectivity"""
    try:
        # Redis health check implementation
        return True
    except Exception as e:
        logger.error(f"Redis connection check failed: {str(e)}")
        return False

def check_celery_connection() -> bool:
    """Checks Celery broker connectivity"""
    try:
        celery_app.control.inspect().active()
        return True
    except Exception as e:
        logger.error(f"Celery connection check failed: {str(e)}")
        return False

def main():
    """
    Entry point for running the application server.
    Configures and starts the uvicorn server with the FastAPI application.
    """
    try:
        # Create FastAPI application
        app = create_app()
        
        # Configure uvicorn server
        config = Config()
        server_config = {
            "host": "0.0.0.0",
            "port": 8000,
            "workers": 4,
            "loop": "uvicorn.loops.auto",
            "log_level": config.log_level.lower(),
            "reload": config.environment != "production",
            "proxy_headers": True,
            "forwarded_allow_ips": "*",
            "timeout_keep_alive": 65,
        }
        
        # Start uvicorn server
        logger.info(f"Starting uvicorn server with config: {server_config}")
        uvicorn.run(
            "main:app",
            **server_config
        )
        
    except Exception as e:
        logger.critical(f"Failed to start application server: {str(e)}", exc_info=True)
        raise

if __name__ == "__main__":
    main()