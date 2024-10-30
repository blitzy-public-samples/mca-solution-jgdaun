"""
Database Base Configuration Module

This module provides the SQLAlchemy declarative base for all ORM models in the application.
It establishes the foundation for database schema management and ensures consistent model
metadata across the application.

Version Requirements:
- SQLAlchemy==1.4.22
"""

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import MetaData

# Define naming convention for database constraints to ensure consistency
# across migrations and database instances
# This follows SQLAlchemy and PostgreSQL best practices for constraint naming
convention = {
    "ix": "ix_%(column_0_label)s",  # Index naming convention
    "uq": "uq_%(table_name)s_%(column_0_name)s",  # Unique constraint naming convention
    "ck": "ck_%(table_name)s_%(constraint_name)s",  # Check constraint naming convention
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",  # Foreign key naming convention
    "pk": "pk_%(table_name)s"  # Primary key naming convention
}

# Create metadata instance with the naming convention
# This ensures consistent constraint naming across all models
metadata = MetaData(naming_convention=convention)

# Create the declarative base class
# This will be used as the base class for all ORM models in the application
Base = declarative_base(metadata=metadata)

# The Base class provides:
# 1. Consistent metadata configuration across all models
# 2. Standardized constraint naming conventions
# 3. Central point for model registration
# 4. Integration with PostgreSQL 13.x specific features