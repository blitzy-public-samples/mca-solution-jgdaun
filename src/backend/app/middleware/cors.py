from typing import List, Optional
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware  # version: 0.14.2
from app.core.config import Config

# Global constants for CORS configuration
ALLOWED_METHODS: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
ALLOWED_HEADERS: List[str] = [
    "Authorization", 
    "Content-Type", 
    "X-API-Key", 
    "Accept", 
    "Origin", 
    "X-Requested-With"
]

def validate_origin(origin: str) -> bool:
    """
    Validates if a given origin is allowed based on configuration and environment.
    
    Args:
        origin (str): The origin to validate
        
    Returns:
        bool: True if origin is allowed, False otherwise
        
    Implementation of security requirement:
    - Strict origin validation in production environment
    - More permissive validation in development for localhost testing
    """
    config = Config()
    
    # Convert allowed_origins to strings for comparison
    allowed_origins = [str(origin) for origin in config.allowed_origins]
    
    # Production environment requires strict origin matching
    if config.environment == "production":
        return origin in allowed_origins
    
    # Development environment allows localhost origins
    if config.environment == "development":
        if origin.startswith("http://localhost:") or origin.startswith("http://127.0.0.1:"):
            return True
            
    return origin in allowed_origins

def setup_cors(app: FastAPI) -> None:
    """
    Configures CORS middleware for the FastAPI application with secure defaults
    and environment-specific settings.
    
    Args:
        app (FastAPI): The FastAPI application instance
        
    Implementation of security requirements:
    - Configurable allowed origins from Config
    - Strict CORS settings for production
    - Support for authenticated requests
    - Standard HTTP methods and headers
    - Preflight caching configuration
    """
    config = Config()
    
    # Convert AnyHttpUrl objects to strings for CORSMiddleware
    allowed_origins = [str(origin) for origin in config.allowed_origins]
    
    # Configure CORS settings based on environment
    if config.environment == "production":
        # Stricter settings for production
        cors_config = {
            "allow_origins": allowed_origins,
            "allow_credentials": True,
            "allow_methods": ALLOWED_METHODS,
            "allow_headers": ALLOWED_HEADERS,
            "max_age": 600,  # Cache preflight requests for 10 minutes
            "expose_headers": ["X-Rate-Limit", "X-Total-Count"],
            "allow_origin_regex": None  # No regex patterns in production
        }
    else:
        # More permissive settings for development
        cors_config = {
            "allow_origins": ["*"] if not allowed_origins else allowed_origins,
            "allow_credentials": True,
            "allow_methods": ALLOWED_METHODS,
            "allow_headers": ALLOWED_HEADERS,
            "max_age": 600,
            "expose_headers": ["X-Rate-Limit", "X-Total-Count"],
            "allow_origin_regex": r"http://(localhost|127\.0\.0\.1):\d+"
        }
    
    # Add CORSMiddleware to the FastAPI application
    app.add_middleware(
        CORSMiddleware,
        **cors_config
    )