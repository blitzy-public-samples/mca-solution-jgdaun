"""
User Management API Endpoints Module

This module implements secure RESTful API endpoints for user management operations including
registration, authentication, profile management, and role-based access control following OAuth2 standards with JWT.

Version Requirements:
- fastapi==0.68.0
- sqlalchemy==1.4.22
- pydantic==1.8.2
"""

from typing import Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Internal imports
from app.api.deps import get_current_user, get_db
from app.schemas.user import UserBase, UserCreate, UserUpdate, UserInDB
from app.services.auth_service import login_user
from app.models.user import User, UserRole

# Initialize router
router = APIRouter()

@router.post("/register", response_model=UserInDB, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
) -> UserInDB:
    """
    Creates a new user account with proper validation and role assignment.
    Implements user registration requirements from API specification.

    Args:
        user_data: Validated user creation data
        db: Database session dependency

    Returns:
        UserInDB: Newly created user data

    Raises:
        HTTPException: 400 if email already exists
        HTTPException: 422 if validation fails
    """
    # Check if email already exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    try:
        # Create new user instance
        user = User(
            email=user_data.email,
            full_name=user_data.full_name,
            role=user_data.role,
            is_active=True,
            is_superuser=False
        )

        # Set and hash password
        user.set_password(user_data.password)

        # Save to database
        db.add(user)
        db.commit()
        db.refresh(user)

        # Return created user data
        return UserInDB.from_orm(user)

    except ValueError as e:
        # Handle password validation errors
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )

@router.post("/login", status_code=status.HTTP_200_OK)
async def login(credentials: UserBase) -> Dict:
    """
    Authenticates user credentials and returns JWT token.
    Implements authentication flow from security architecture.

    Args:
        credentials: User login credentials

    Returns:
        Dict: JWT token and user information

    Raises:
        HTTPException: 401 if authentication fails
    """
    try:
        # Authenticate user and generate token
        return await login_user(credentials)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login error: {str(e)}"
        )

@router.get("/me", response_model=UserInDB)
async def get_user_profile(
    current_user: User = Depends(get_current_user)
) -> UserInDB:
    """
    Retrieves the current user's profile data.
    Implements user profile requirements from API specification.

    Args:
        current_user: Authenticated user from token

    Returns:
        UserInDB: Current user's profile data
    """
    return UserInDB.from_orm(current_user)

@router.put("/me", response_model=UserInDB)
async def update_user_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> UserInDB:
    """
    Updates the current user's profile information.
    Implements user profile update requirements from API specification.

    Args:
        user_data: Validated update data
        current_user: Authenticated user from token
        db: Database session dependency

    Returns:
        UserInDB: Updated user profile data

    Raises:
        HTTPException: 400 if email already exists
        HTTPException: 422 if validation fails
    """
    try:
        # Check if email is being updated and already exists
        if user_data.email and user_data.email != current_user.email:
            if db.query(User).filter(User.email == user_data.email).first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            current_user.email = user_data.email

        # Update other fields if provided
        if user_data.full_name:
            current_user.full_name = user_data.full_name

        if user_data.password:
            current_user.set_password(user_data.password)

        # Only allow role updates if user is superuser
        if user_data.role and current_user.is_superuser:
            current_user.role = user_data.role

        # Save changes
        db.commit()
        db.refresh(current_user)

        return UserInDB.from_orm(current_user)

    except ValueError as e:
        # Handle password validation errors
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating profile: {str(e)}"
        )