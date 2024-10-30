"""
Database Migrations Module Initialization

This module initializes the database migrations framework using Alembic,
providing version control for database schema changes and ensuring proper
database structure management.

Version Requirements:
- alembic==1.7.5
"""

# Import required functions from migrations.env module for both offline and online migrations
from migrations.env import run_migrations_offline, run_migrations_online
# Import Base for ORM model metadata
from app.db.base import Base

# Define migrations module version for tracking schema versions
VERSION = '1.0.0'

# Export the version for external use
__all__ = ['VERSION']

# The migrations module provides:
# 1. Database schema version control through Alembic
# 2. Support for both offline (SQL generation) and online (direct DB updates) migrations
# 3. Integration with SQLAlchemy ORM models through Base metadata
# 4. Proper handling of core application tables:
#    - Applications
#    - Documents
#    - Owners
#    - ProcessingLogs

# Note: This module works in conjunction with alembic.ini and migrations/env.py
# to manage database schema changes and ensure data integrity during updates.