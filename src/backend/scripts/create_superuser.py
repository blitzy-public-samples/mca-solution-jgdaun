#!/usr/bin/env python3
"""
Script for creating a superuser account with administrative privileges.
Implements secure user creation with role-based access control.

Version Requirements:
- argparse==builtin
- uuid==builtin
"""

import argparse
import uuid
import sys
from typing import Optional

# Internal imports - using relative imports as per specification
from ..app.core.config import Config
from ..app.core.security import PasswordHasher
from ..app.models.user import User, UserRole
from ..app.db.session import create_session

# Script description from globals
DESCRIPTION = "Create a superuser account with administrative privileges."

def parse_arguments() -> argparse.Namespace:
    """
    Parses command line arguments for superuser creation.
    
    Returns:
        argparse.Namespace: Parsed arguments containing email and password
    """
    parser = argparse.ArgumentParser(description=DESCRIPTION)
    
    # Add required email argument with validation
    parser.add_argument(
        '--email',
        required=True,
        help='Email address for the superuser account',
        type=str
    )
    
    # Add required password argument
    parser.add_argument(
        '--password',
        required=True,
        help='Password for the superuser account (minimum 8 characters)',
        type=str
    )
    
    # Add optional full name argument
    parser.add_argument(
        '--full-name',
        required=False,
        help='Full name of the superuser',
        type=str,
        default='System Administrator'
    )
    
    return parser.parse_args()

def create_superuser(email: str, password: str, full_name: Optional[str] = None) -> None:
    """
    Creates a superuser with the provided email and password.
    Implements user creation requirements from database schema and RBAC specifications.
    
    Args:
        email (str): Email address for the superuser account
        password (str): Password for the superuser account
        full_name (Optional[str]): Full name of the superuser
    
    Raises:
        ValueError: If password doesn't meet security requirements
        Exception: If database operations fail
    """
    # Validate password length requirement
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    
    # Generate unique identifier for the superuser
    user_id = uuid.uuid4()
    
    # Create new User instance with superuser privileges
    user = User(
        id=user_id,
        email=email,
        full_name=full_name or 'System Administrator',
        is_active=True,
        is_superuser=True,
        role=UserRole.admin  # Set highest privilege level
    )
    
    # Set password using secure hashing
    user.set_password(password)
    
    # Create database session and save user
    with create_session() as session:
        try:
            # Check if user with email already exists
            existing_user = session.query(User).filter(User.email == email).first()
            if existing_user:
                raise ValueError(f"User with email {email} already exists")
            
            # Add user to session and commit transaction
            session.add(user)
            session.commit()
            
            print(f"""
Superuser created successfully:
- ID: {user_id}
- Email: {email}
- Role: {user.role.name}
- Superuser: {user.is_superuser}
""")
            
        except Exception as e:
            session.rollback()
            print(f"Error creating superuser: {str(e)}", file=sys.stderr)
            raise

def main() -> None:
    """
    Main entry point for the superuser creation script.
    Implements error handling and user feedback requirements.
    """
    try:
        # Parse command line arguments
        args = parse_arguments()
        
        # Create superuser with provided credentials
        create_superuser(
            email=args.email,
            password=args.password,
            full_name=args.full_name
        )
        
    except ValueError as ve:
        print(f"Validation error: {str(ve)}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()