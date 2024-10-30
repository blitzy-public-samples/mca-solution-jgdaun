"""
Authentication Service Module

This module provides comprehensive authentication services for the backend application,
implementing secure user authentication, token management, and session handling.

Version Requirements:
- fastapi==0.68.0
- python-jose[cryptography]==3.3.0
- datetime==builtin
"""

from datetime import datetime
from typing import Dict, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import generate_token, verify_token, PasswordHasher
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.schemas.user import UserSchema

# Initialize password hasher
password_hasher = PasswordHasher()

async def login_user(user_data: UserSchema) -> Dict:
    """
    Authenticates a user and returns a JWT token with role-based claims.
    Implements authentication flow requirements from security architecture.

    Args:
        user_data (UserSchema): User credentials including email and password

    Returns:
        Dict: Dictionary containing JWT token and user information

    Raises:
        HTTPException: 401 if authentication fails
    """
    try:
        # Create new database session
        db = SessionLocal()

        try:
            # Retrieve user from database
            user = db.query(User).filter(
                User.email == user_data.email,
                User.is_active == True
            ).first()

            # Validate user exists and is active
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )

            # Verify password
            if not user.check_password(user_data.password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )

            # Update last login timestamp
            user.last_login = datetime.utcnow()

            # Generate JWT token with user claims
            token = generate_token(
                user_id=str(user.id),
                additional_claims={
                    "role": str(user.role),
                    "is_superuser": user.is_superuser,
                    "email": user.email
                }
            )

            # Commit session to update last login
            db.commit()

            # Return token and user information
            return {
                "access_token": token,
                "token_type": "bearer",
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": str(user.role),
                    "is_superuser": user.is_superuser,
                    "last_login": user.last_login.isoformat() if user.last_login else None
                }
            }

        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            # Log and convert other exceptions to HTTP 500
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Authentication error: {str(e)}"
            )
        finally:
            # Ensure session is closed
            db.close()

    except Exception as e:
        # Handle session creation errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection error: {str(e)}"
        )

async def get_current_user(token: str) -> User:
    """
    Retrieves and validates the current authenticated user from JWT token.
    Implements token validation requirements from security architecture.

    Args:
        token (str): JWT token from request header

    Returns:
        User: Authenticated user object with role information

    Raises:
        HTTPException: 401 if token is invalid or user not found
    """
    try:
        # Verify JWT token
        payload = verify_token(token)
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )

        # Create new database session
        db = SessionLocal()

        try:
            # Fetch user from database
            user = db.query(User).filter(
                User.id == user_id,
                User.is_active == True
            ).first()

            # Validate user exists and is active
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found or inactive"
                )

            return user

        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            # Log and convert other exceptions to HTTP 500
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"User retrieval error: {str(e)}"
            )
        finally:
            # Ensure session is closed
            db.close()

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Handle token verification errors
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation error: {str(e)}"
        )