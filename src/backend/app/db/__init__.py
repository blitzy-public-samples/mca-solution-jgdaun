"""
Database Package Initialization Module

This module serves as the central point for database components, providing access to
SQLAlchemy's declarative base, session management, and database initialization functions.
It prevents circular dependencies through strategic imports and aggregates essential
database components for PostgreSQL 13.x integration.

Version Requirements:
- SQLAlchemy==1.4.22
- PostgreSQL==13.x
"""

# Import core database components
# These imports are strategically ordered to prevent circular dependencies
from app.db.base import Base  # Provides SQLAlchemy declarative base with configured metadata
from app.db.session import SessionLocal  # Provides thread-safe session factory with connection pooling
from app.db.init_db import init_db  # Provides database initialization function

# Re-export essential database components
# This allows other modules to import these components directly from app.db
__all__ = [
    "Base",  # SQLAlchemy declarative base for ORM models
    "SessionLocal",  # Thread-safe session factory for database operations
    "init_db"  # Database initialization function for core schema setup
]

# The database package provides:
# 1. Base: SQLAlchemy declarative base with configured metadata for consistent
#    constraint naming and PostgreSQL-specific features
# 2. SessionLocal: Thread-safe session factory with connection pooling and
#    retry logic for robust database operations
# 3. init_db: Database initialization function that sets up core schema
#    including Applications, Documents, Owners, and ProcessingLogs tables

# Note: This module implements the following requirements:
# - Database Connection Management from technology_stack/databases/primary_data_store
# - Database Initialization and Management from system_design/database_design/core_schema