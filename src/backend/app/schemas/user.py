"""
User Schema Module

This module defines Pydantic schemas for user-related operations, ensuring data validation
and serialization for user entities with role-based access control.

Version Requirements:
- pydantic==1.8.2
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, constr

from app.models.user import UserRole

# Base user schema with common fields
class UserBase(BaseModel):
    """
    Base Pydantic schema for user data with common fields.
    Implements core user data validation requirements from database schema.
    """
    # Email field with validation
    email: EmailStr

    # Full name with length constraints
    full_name: constr(min_length=2, max_length=100)

    # Account status flags
    is_active: bool = True
    is_superuser: bool = False

    # Role-based access control
    role: UserRole = UserRole.viewer

    class Config:
        """Pydantic model configuration"""
        use_enum_values = True
        orm_mode = True

class UserCreate(UserBase):
    """
    Pydantic schema for creating new users.
    Implements user creation requirements from API specification.
    """
    # Password field with validation rules
    password: constr(min_length=8, max_length=100)

class UserUpdate(BaseModel):
    """
    Pydantic schema for updating existing users.
    Implements user update requirements from API specification.
    All fields are optional to support partial updates.
    """
    email: Optional[EmailStr] = None
    full_name: Optional[constr(min_length=2, max_length=100)] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None
    password: Optional[constr(min_length=8, max_length=100)] = None

    class Config:
        """Pydantic model configuration"""
        use_enum_values = True
        orm_mode = True

class UserInDB(UserBase):
    """
    Pydantic schema for user data as stored in the database.
    Implements database schema requirements for user entities.
    """
    # System fields
    id: UUID
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        """Pydantic model configuration"""
        orm_mode = True