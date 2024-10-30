"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}

"""
# Version requirements:
# alembic==1.7.5
# SQLAlchemy==1.4.22
# mako==1.1.4

from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

# Import Base and metadata for model references
from app.db.base import Base, metadata
# Import database configuration for connection settings
from app.core.config import Config

# Revision identifiers used by Alembic
revision = ${repr(up_revision)}
down_revision = ${repr(down_revision)}
branch_labels = ${repr(branch_labels)}
depends_on = ${repr(depends_on)}

# Get database connection settings
config = Config()
database_url = config.get_database_dsn()

def upgrade() -> None:
    """
    Implements the forward migration operations.
    
    This function defines schema changes using SQLAlchemy operations:
    - CREATE TABLE statements
    - ALTER TABLE operations
    - CREATE INDEX commands
    - Data migrations if required
    - New constraints or foreign keys
    
    Note: Operations are executed in transaction-safe manner
    """
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    """
    Implements the rollback operations for this migration.
    
    This function defines reverse schema changes:
    - DROP TABLE operations
    - Remove indexes
    - Revert ALTER TABLE changes
    - Restore previous constraints
    - Cleanup any migrated data
    
    Note: Operations are executed in transaction-safe manner
    """
    ${downgrades if downgrades else "pass"}

# Helper functions for complex migrations
def _execute_sql(sql: str) -> None:
    """
    Executes raw SQL with proper connection handling.
    Useful for complex migrations that can't be expressed with Alembic operations.
    """
    connection = op.get_bind()
    connection.execute(sql)

def _get_table_names() -> list:
    """Returns list of existing table names for validation."""
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    return inspector.get_table_names()

def _table_has_column(table_name: str, column_name: str) -> bool:
    """
    Checks if a table has a specific column.
    Useful for conditional column operations.
    """
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    has_column = False
    for col in inspector.get_columns(table_name):
        if col['name'] == column_name:
            has_column = True
            break
    return has_column

def _create_index_safe(index_name: str, table_name: str, columns: list, 
                      unique: bool = False, **kw) -> None:
    """
    Creates an index if it doesn't exist.
    Implements safe index creation with proper error handling.
    """
    try:
        op.create_index(index_name, table_name, columns, unique=unique, **kw)
    except sa.exc.ProgrammingError as e:
        if "already exists" not in str(e):
            raise

def _drop_index_safe(index_name: str, table_name: str) -> None:
    """
    Drops an index if it exists.
    Implements safe index removal with proper error handling.
    """
    try:
        op.drop_index(index_name, table_name)
    except sa.exc.ProgrammingError as e:
        if "does not exist" not in str(e):
            raise

def _add_constraint_safe(constraint_name: str, table_name: str, condition: str) -> None:
    """
    Adds a constraint if it doesn't exist.
    Implements safe constraint creation with proper error handling.
    """
    try:
        op.execute(f"ALTER TABLE {table_name} ADD CONSTRAINT {constraint_name} CHECK ({condition})")
    except sa.exc.ProgrammingError as e:
        if "already exists" not in str(e):
            raise