# Standard library imports
from typing import Callable
import logging

# Third-party imports
from fastapi import Request, HTTPException  # fastapi==0.68.0
from starlette.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware

# Internal imports
from app.core.security import verify_token
from app.core.exceptions import AuthenticationException
from app.api.deps import get_current_user

# Initialize logger
logger = logging.getLogger(__name__)

# Define paths that don't require authentication
EXCLUDED_PATHS = ['/docs', '/redoc', '/openapi.json', '/auth/login', '/auth/register']

class AuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware for handling authentication and authorization using JWT tokens.
    Implements the authentication flow defined in the technical specification.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process each request to ensure proper authentication before accessing protected resources.
        
        Args:
            request (Request): The incoming request
            call_next (Callable): The next middleware or route handler
            
        Returns:
            Response: The response after authentication checks
            
        Implementation of requirements from:
        - system_architecture.security_architecture.authentication_&_authorization
        - security_considerations.authentication_and_authorization.authentication_flow
        """
        try:
            # Check if path is excluded from authentication
            if request.url.path in EXCLUDED_PATHS:
                logger.debug(f"Skipping authentication for excluded path: {request.url.path}")
                return await call_next(request)

            # Extract token from Authorization header
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                logger.warning("Missing or invalid Authorization header")
                raise AuthenticationException(
                    message="Missing or invalid authentication token",
                    details={"header": "Authorization header must be 'Bearer <token>'"}
                )

            # Extract the token
            token = auth_header.split(' ')[1]
            
            try:
                # Verify token format and signature
                # Implementation of security_considerations.authentication_and_authorization.authentication_flow
                token_payload = verify_token(token)
                
                # Get current user from token
                db = request.state.db  # Database session from db middleware
                user = await get_current_user(db=db, token=token_payload)
                
                # Add user context to request state for downstream handlers
                request.state.user = user
                
                # Add correlation ID for request tracking
                request.state.correlation_id = token_payload.get("jti", "")
                
                logger.info(
                    "Request authenticated successfully",
                    extra={
                        "user_id": user.id,
                        "path": request.url.path,
                        "correlation_id": request.state.correlation_id
                    }
                )
                
                # Process the authenticated request
                response = await call_next(request)
                
                # Add security headers to response
                response.headers['X-Content-Type-Options'] = 'nosniff'
                response.headers['X-Frame-Options'] = 'DENY'
                response.headers['X-XSS-Protection'] = '1; mode=block'
                
                return response

            except AuthenticationException as auth_ex:
                logger.warning(
                    "Authentication failed",
                    extra={
                        "error": str(auth_ex),
                        "path": request.url.path
                    }
                )
                raise HTTPException(
                    status_code=401,
                    detail=auth_ex.to_dict(),
                    headers={"WWW-Authenticate": "Bearer"}
                )

        except HTTPException:
            raise
            
        except Exception as e:
            # Log unexpected errors
            logger.error(
                "Unexpected error in auth middleware",
                extra={
                    "error": str(e),
                    "path": request.url.path
                },
                exc_info=True
            )
            raise HTTPException(
                status_code=500,
                detail="Internal server error during authentication"
            )

# Initialize the middleware function
auth_middleware = AuthMiddleware