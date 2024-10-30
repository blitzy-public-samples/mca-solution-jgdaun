"""
Database Initialization Module

This module handles the initialization of the database with essential data,
including default users, roles, and system configurations.

Version Requirements:
- SQLAlchemy==1.4.22
- logging==3.8+
"""

import logging
from typing import Dict, Optional
from datetime import datetime
import uuid

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text

from app.db.base import Base
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.document import Document
from app.models.email import Email
from app.models.webhook import Webhook
from app.core.config import Config

# Configure logging
logger = logging.getLogger(__name__)

def create_default_roles(db_session: Session) -> Dict[str, Dict]:
    """
    Creates default roles with their respective permissions as defined in RBAC specification.
    
    Args:
        db_session: SQLAlchemy session for database operations
        
    Returns:
        Dict containing created role configurations
    """
    logger.info("Creating default roles...")
    
    # Define role permissions based on RBAC specification
    role_configs = {
        'admin': {
            'permissions': [
                'manage_users',
                'configure_system',
                'view_audit_logs',
                'process_applications',
                'view_documents',
                'view_applications',
                'download_reports'
            ],
            'description': 'Full system access with all permissions'
        },
        'processor': {
            'permissions': [
                'process_applications',
                'view_documents',
                'view_applications',
                'download_reports'
            ],
            'description': 'Can process applications and view documents'
        },
        'viewer': {
            'permissions': [
                'view_applications',
                'download_reports'
            ],
            'description': 'Read-only access to applications and reports'
        }
    }
    
    created_roles = {}
    
    try:
        # Create each role if it doesn't exist
        for role_name, config in role_configs.items():
            # Check if role already exists
            existing_user = db_session.query(User).filter(
                User.role == role_name
            ).first()
            
            if not existing_user:
                logger.info(f"Creating role: {role_name}")
                created_roles[role_name] = config
            else:
                logger.info(f"Role already exists: {role_name}")
                created_roles[role_name] = config
        
        db_session.commit()
        logger.info("Default roles created successfully")
        return created_roles
        
    except SQLAlchemyError as e:
        db_session.rollback()
        logger.error(f"Error creating default roles: {str(e)}")
        raise

def create_default_admin(db_session: Session, config: Config) -> Optional[User]:
    """
    Creates default admin user if it doesn't exist.
    
    Args:
        db_session: SQLAlchemy session
        config: Application configuration instance
        
    Returns:
        Created admin user instance or None if already exists
    """
    logger.info("Creating default admin user...")
    
    try:
        # Check if admin user already exists
        admin_email = config.admin_email
        existing_admin = db_session.query(User).filter(
            User.email == admin_email
        ).first()
        
        if existing_admin:
            logger.info("Default admin user already exists")
            return None
            
        # Create new admin user
        admin_user = User(
            id=uuid.uuid4(),
            email=admin_email,
            full_name="System Administrator",
            is_active=True,
            is_superuser=True,
            role='admin',
            created_at=datetime.utcnow()
        )
        
        # Set admin password from configuration
        admin_user.set_password(config.admin_password.get_secret_value())
        
        db_session.add(admin_user)
        db_session.commit()
        
        logger.info("Default admin user created successfully")
        return admin_user
        
    except SQLAlchemyError as e:
        db_session.rollback()
        logger.error(f"Error creating default admin user: {str(e)}")
        raise

def create_default_webhooks(db_session: Session) -> None:
    """
    Creates default webhook configurations for system events.
    
    Args:
        db_session: SQLAlchemy session
    """
    logger.info("Creating default webhook configurations...")
    
    default_webhooks = [
        {
            'name': 'Document Processing Complete',
            'event_type': 'document.processed',
            'url': None,  # To be configured by admin
            'is_active': False,
            'retry_count': 3
        },
        {
            'name': 'Application Status Change',
            'event_type': 'application.status_change',
            'url': None,  # To be configured by admin
            'is_active': False,
            'retry_count': 3
        }
    ]
    
    try:
        for webhook_config in default_webhooks:
            # Check if webhook already exists
            existing_webhook = db_session.query(Webhook).filter(
                Webhook.event_type == webhook_config['event_type']
            ).first()
            
            if not existing_webhook:
                webhook = Webhook(
                    id=uuid.uuid4(),
                    **webhook_config,
                    created_at=datetime.utcnow()
                )
                db_session.add(webhook)
                
        db_session.commit()
        logger.info("Default webhooks created successfully")
        
    except SQLAlchemyError as e:
        db_session.rollback()
        logger.error(f"Error creating default webhooks: {str(e)}")
        raise

def verify_database_tables(db_session: Session) -> bool:
    """
    Verifies that all required database tables are created and accessible.
    
    Args:
        db_session: SQLAlchemy session
        
    Returns:
        bool: True if all tables are accessible
    """
    logger.info("Verifying database tables...")
    
    required_tables = [
        'users',
        'documents',
        'emails',
        'webhooks'
    ]
    
    try:
        # Check each table's accessibility
        for table in required_tables:
            db_session.execute(text(f"SELECT 1 FROM {table} LIMIT 1"))
            logger.info(f"Table verified: {table}")
            
        return True
        
    except SQLAlchemyError as e:
        logger.error(f"Error verifying database tables: {str(e)}")
        return False

def init_db() -> None:
    """
    Initializes the database with default data including users, roles,
    and required system configurations.
    
    This function implements the core schema requirements and RBAC specification.
    """
    logger.info("Starting database initialization...")
    
    try:
        db = SessionLocal()
        config = Config()
        
        # Create all tables defined in models
        Base.metadata.create_all(bind=db.get_bind())
        logger.info("Database tables created")
        
        # Verify database tables
        if not verify_database_tables(db):
            raise SQLAlchemyError("Database table verification failed")
        
        # Create default roles
        roles = create_default_roles(db)
        logger.info(f"Created roles: {', '.join(roles.keys())}")
        
        # Create default admin user
        admin_user = create_default_admin(db, config)
        if admin_user:
            logger.info(f"Created admin user: {admin_user.email}")
        
        # Create default webhook configurations
        create_default_webhooks(db)
        
        logger.info("Database initialization completed successfully")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        raise
        
    finally:
        db.close()

if __name__ == "__main__":
    # Initialize logging
    logging.basicConfig(level=logging.INFO)
    
    # Run database initialization
    init_db()