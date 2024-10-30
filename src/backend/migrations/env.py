# Version Requirements:
# alembic==1.7.5
# sqlalchemy==1.4.22

import os
from logging.config import fileConfig
import logging
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# Import Base and metadata from app.db.base
from app.db.base import Base
# Import Config class for database configuration
from app.core.config import Config
# Import logging setup function
from app.core.logging import setup_logging
# Import SessionLocal for database session management
from app.db.session import SessionLocal

# Initialize logging for migrations
setup_logging()
logger = logging.getLogger("alembic.env")

# Alembic Config object, which provides access to the values within the .ini file
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Add your model's MetaData object here for 'autogenerate' support
# This includes all models registered with Base.metadata
# Implements Database Schema Management requirement
target_metadata = Base.metadata

def get_url():
    """
    Gets database URL from Config instance.
    Implements secure database connection handling.
    """
    try:
        return Config().get_database_dsn()
    except Exception as e:
        logger.error(f"Failed to get database URL: {str(e)}")
        raise

def run_migrations_offline():
    """
    Run migrations in 'offline' mode.
    
    This configures the context with just a URL and not an Engine,
    though an Engine is acceptable here as well. By skipping the Engine creation
    we don't even need a DBAPI to be available.
    
    Calls to context.execute() here emit the given string to the script output.
    """
    # Set up logging for offline migrations
    setup_logging()
    logger.info("Running migrations in offline mode")
    
    try:
        url = get_url()
        context.configure(
            url=url,
            target_metadata=target_metadata,
            literal_binds=True,
            dialect_opts={"paramstyle": "named"},
            # Include schemas for PostgreSQL
            include_schemas=True,
            # Compare type modifications
            compare_type=True,
            # Compare server default values
            compare_server_default=True
        )

        with context.begin_transaction():
            context.run_migrations()
            logger.info("Offline migrations completed successfully")
            
    except Exception as e:
        logger.error(f"Error during offline migrations: {str(e)}")
        raise

def run_migrations_online():
    """
    Run migrations in 'online' mode.
    
    In this scenario we need to create an Engine and associate a connection with the context.
    Implements database connection management and migration execution with proper error handling.
    """
    # Set up logging for online migrations
    setup_logging()
    logger.info("Running migrations in online mode")
    
    try:
        # Configure SQLAlchemy URL
        configuration = config.get_section(config.config_ini_section)
        configuration["sqlalchemy.url"] = get_url()
        
        # Create SQLAlchemy engine with connection pooling
        connectable = engine_from_config(
            configuration,
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,  # Disable connection pooling for migrations
        )

        with connectable.connect() as connection:
            context.configure(
                connection=connection,
                target_metadata=target_metadata,
                # Include schemas for PostgreSQL
                include_schemas=True,
                # Compare type modifications
                compare_type=True,
                # Compare server default values
                compare_server_default=True,
                # Enable transaction per migration
                transaction_per_migration=True,
                # Lock timeout (in seconds)
                lock_timeout=60
            )

            with context.begin_transaction():
                context.run_migrations()
                logger.info("Online migrations completed successfully")
                
    except Exception as e:
        logger.error(f"Error during online migrations: {str(e)}")
        raise
    
    finally:
        # Ensure all connections are properly closed
        if 'connectable' in locals():
            connectable.dispose()

# Check if we are running in offline or online mode
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()