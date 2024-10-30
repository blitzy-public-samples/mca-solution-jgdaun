"""
Authentication Endpoints Module

This module implements secure authentication endpoints for the backend application,
handling user login, token management, and user verification following OAuth2 standards.

Version Requirements:
- fastapi==0.68.0
- python-jose[cryptography]==3.3.0
"""

# Third-party imports
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# Internal imports
from app.core.security import generate_token, verify_token
from app.services.auth_service import login_user
from app.api.deps import get_current_user
from app.schemas.user import UserBase, UserCreate, UserInDB

# Initialize router with prefix and tags
router = APIRouter(prefix="/auth", tags=["authentication"])

# Initialize OAuth2 password bearer scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/login", response_model=dict, status_code=status.HTTP_200_OK)
async def login(user_data: UserCreate) -> dict:
    """
    Authenticates a user and returns a JWT token with role-based claims.
    Implements authentication flow requirements from security architecture.

    Args:
        user_data (UserCreate): User credentials including email and password

    Returns:
        dict: Dictionary containing JWT access token and token type

    Raises:
        HTTPException: 401 if authentication fails
        HTTPException: 500 if server error occurs
    """
    try:
        # Authenticate user and generate token using auth service
        auth_response = await login_user(user_data)

        # Return token response
        return {
            "access_token": auth_response["access_token"],
            "token_type": auth_response["token_type"],
            "user": auth_response["user"]
        }

    except HTTPException:
        # Re-raise HTTP exceptions from auth service
        raise
    except Exception as e:
        # Log and raise server error for unexpected exceptions
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication error: {str(e)}"
        )

@router.get("/users/me", response_model=UserInDB)
async def get_authenticated_user(
    token: str = Depends(oauth2_scheme)
) -> UserInDB:
    """
    Retrieves the current authenticated user based on JWT token.
    Implements token validation requirements from security architecture.

    Args:
        token (str): JWT token from request header via OAuth2 scheme

    Returns:
        UserInDB: The authenticated user object with role information

    Raises:
        HTTPException: 401 if token is invalid
        HTTPException: 404 if user not found
        HTTPException: 500 if server error occurs
    """
    try:
        # Get current user using dependency
        current_user = await get_current_user(token)

        # Convert to Pydantic model and return
        return UserInDB.from_orm(current_user)

    except HTTPException:
        # Re-raise HTTP exceptions from dependencies
        raise
    except Exception as e:
        # Log and raise server error for unexpected exceptions
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving user: {str(e)}"
        )

@router.post("/verify", response_model=dict)
async def verify_auth_token(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Verifies a JWT authentication token and returns its claims.
    Implements token verification requirements from security architecture.

    Args:
        token (str): JWT token from request header via OAuth2 scheme

    Returns:
        dict: Dictionary containing token verification status and claims

    Raises:
        HTTPException: 401 if token is invalid or expired
        HTTPException: 500 if server error occurs
    """
    try:
        # Verify token and extract claims
        token_claims = verify_token(token)

        # Return verification response
        return {
            "valid": True,
            "claims": {
                "user_id": token_claims.get("sub"),
                "role": token_claims.get("role"),
                "is_superuser": token_claims.get("is_superuser"),
                "email": token_claims.get("email"),
                "exp": token_claims.get("exp")
            }
        }

    except HTTPException:
        # Re-raise HTTP exceptions from token verification
        raise
    except Exception as e:
        # Log and raise server error for unexpected exceptions
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token verification error: {str(e)}"
        )