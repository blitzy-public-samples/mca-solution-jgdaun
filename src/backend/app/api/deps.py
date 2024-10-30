"""
FastAPI Dependency Injection Module

This module provides dependency injection functions for FastAPI routes,
implementing secure authentication, authorization, and database session management.

Version Requirements:
- fastapi==0.68.0
- sqlalchemy==1.4.22
"""

from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

# Internal imports
from app.core.security import verify_token
from app.core.config import Config
from app.db.session import get_db
from app.models.user import User

# Initialize configuration
config = Config()

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(verify_token)
) -> User:
    """
    Dependency function that retrieves and validates the current authenticated user.
    Implements secure authentication flow from security architecture requirements.

    Args:
        db: Database session dependency
        token: JWT token from request, validated by verify_token dependency

    Returns:
        User: Authenticated user object

    Raises:
        HTTPException: 401 if token invalid
        HTTPException: 404 if user not found
        HTTPException: 403 if user inactive
    """
    try:
        # Extract user_id from verified token payload
        user_id = token.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Query database for user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Verify user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user"
            )

        return user

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log unexpected errors and raise generic auth error
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency function that ensures the current user is an active superuser.
    Implements role-based access control from security requirements.

    Args:
        current_user: User object from get_current_user dependency

    Returns:
        User: Verified superuser object

    Raises:
        HTTPException: 403 if user is not a superuser
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user