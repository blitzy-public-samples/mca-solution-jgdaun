"""
Database Session Management Module

This module handles SQLAlchemy session management for PostgreSQL database interactions,
implementing connection pooling, retry logic, and thread-safe session handling.

Version Requirements:
- SQLAlchemy==1.4.22
"""

from contextlib import contextmanager
from typing import Generator
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.exc import SQLAlchemyError, OperationalError
from sqlalchemy.engine import Engine
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import Config
from app.db.base import Base

# Configure logging
logger = logging.getLogger(__name__)

# Create database engine with connection pooling and health check
# Implementation addresses Database Connection Management requirement
engine = create_engine(
    Config().get_database_dsn(),
    # Enable connection health checks before usage
    pool_pre_ping=True,
    # Set connection pool size based on requirements
    pool_size=5,
    # Allow additional connections when pool is full
    max_overflow=10,
    # Connection timeout in seconds
    pool_timeout=30,
    # Recycle connections after 30 minutes
    pool_recycle=1800,
    # Enable echo for SQL debugging in non-production
    echo=Config().environment != "production"
)

# Create thread-local session factory
# Implementation addresses Database Session Management requirement
SessionLocal = scoped_session(
    sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )
)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    reraise=True
)
def verify_database_connection(engine: Engine) -> bool:
    """
    Verifies database connectivity with retry logic.
    
    Args:
        engine: SQLAlchemy engine instance
        
    Returns:
        bool: True if connection is successful
        
    Raises:
        SQLAlchemyError: If connection fails after retries
    """
    try:
        # Test connection by running a simple query
        with engine.connect() as connection:
            connection.execute("SELECT 1")
        return True
    except OperationalError as e:
        logger.error(f"Database connection failed: {str(e)}")
        raise

def get_db() -> Generator:
    """
    Provides a transactional database session scope.
    
    This is a dependency injection function that creates a new database session
    for each request and ensures proper cleanup.
    
    Yields:
        Session: SQLAlchemy session for database operations
        
    Example:
        @app.get("/items/")
        def read_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        # Verify database connection before yielding session
        verify_database_connection(engine)
        
        # Yield session for request handling
        yield db
        
        # Commit any pending changes if no exceptions occurred
        db.commit()
    except SQLAlchemyError as e:
        # Roll back changes in case of database errors
        logger.error(f"Database error occurred: {str(e)}")
        db.rollback()
        raise
    except Exception as e:
        # Roll back changes for any other exceptions
        logger.error(f"Unexpected error occurred: {str(e)}")
        db.rollback()
        raise
    finally:
        # Ensure session is closed and returned to pool
        db.close()

@contextmanager
def create_session():
    """
    Context manager for database sessions.
    
    Provides a context-managed database session with automatic
    commit/rollback and cleanup.
    
    Yields:
        Session: SQLAlchemy session for database operations
        
    Example:
        with create_session() as session:
            session.query(User).all()
    """
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

# Initialize models on startup
def init_models():
    """
    Creates all database tables defined in the models.
    
    Should only be used for testing or initial setup, not in production
    where migrations should be used instead.
    """
    if Config().environment != "production":
        Base.metadata.create_all(bind=engine)