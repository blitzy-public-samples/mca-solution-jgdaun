"""
User Model Module

This module defines the SQLAlchemy ORM model for user entities, implementing
role-based access control and secure password management.

Version Requirements:
- SQLAlchemy==1.4.22
- uuid==builtin
"""

from datetime import datetime
import uuid
from typing import Dict, Optional

from sqlalchemy import Column, String, Boolean, Integer, Enum, DateTime
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base
from app.core.security import PasswordHasher

# Define UserRole enum for RBAC
# Implements role-based access control requirements from security architecture
UserRole = Enum(
    'admin',     # Full system access
    'processor', # Can process applications and view documents
    'viewer',    # Read-only access
    name='user_role'
)

class User(Base):
    """
    User ORM model representing application users with role-based access control.
    Implements user data model requirements from database schema specification.
    """
    __tablename__ = 'users'

    # Primary key and identification
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)

    # Authentication and authorization fields
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    role = Column(UserRole, nullable=False, default='viewer')
    hashed_password = Column(String(512), nullable=False)

    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    def __init__(self, **kwargs):
        """
        Initializes a new User instance with default values.
        Implements constructor requirements from specification.
        """
        super().__init__(**kwargs)
        # Set default values if not provided
        self.id = kwargs.get('id', uuid.uuid4())
        self.is_active = kwargs.get('is_active', True)
        self.is_superuser = kwargs.get('is_superuser', False)
        self.role = kwargs.get('role', 'viewer')
        self.created_at = kwargs.get('created_at', datetime.utcnow())

    def set_password(self, password: str) -> None:
        """
        Securely hashes and sets the user's password.
        Implements password security requirements from security architecture.

        Args:
            password (str): Plain text password to hash and store
        """
        # Validate password requirements
        if not password or len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")

        # Create password hasher and hash password
        hasher = PasswordHasher()
        self.hashed_password = hasher.hash_password(password)

    def check_password(self, password: str) -> bool:
        """
        Verifies a password against the stored hash.
        Implements password verification requirements from security architecture.

        Args:
            password (str): Password to verify

        Returns:
            bool: True if password matches, False otherwise
        """
        if not self.hashed_password:
            return False

        hasher = PasswordHasher()
        return hasher.verify_password(password, self.hashed_password)

    def to_dict(self) -> Dict:
        """
        Converts user model to dictionary representation, excluding sensitive data.
        Implements data serialization requirements from API specification.

        Returns:
            Dict: User data dictionary without sensitive information
        """
        return {
            'id': str(self.id),
            'email': self.email,
            'full_name': self.full_name,
            'is_active': self.is_active,
            'is_superuser': self.is_superuser,
            'role': str(self.role.name if self.role else None),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

    def has_permission(self, permission: str) -> bool:
        """
        Checks if user has permission for a specific action based on their role.
        Implements RBAC requirements from security architecture.

        Args:
            permission (str): Permission to check

        Returns:
            bool: True if user has permission, False otherwise
        """
        # Superusers have all permissions
        if self.is_superuser:
            return True

        # Define role-based permission matrix
        permission_matrix = {
            'admin': [
                'manage_users',
                'configure_system',
                'view_audit_logs',
                'process_applications',
                'view_documents',
                'view_applications',
                'download_reports'
            ],
            'processor': [
                'process_applications',
                'view_documents',
                'view_applications',
                'download_reports'
            ],
            'viewer': [
                'view_applications',
                'download_reports'
            ]
        }

        # Check if user's role has the requested permission
        return (
            self.role is not None and
            self.role.name in permission_matrix and
            permission in permission_matrix[self.role.name]
        )