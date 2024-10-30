"""
Webhook Management API Endpoints

Implements RESTful API endpoints for webhook management, including registration,
updates, and event delivery. Ensures secure communication and proper validation
of webhook configurations.

Version Requirements:
- fastapi==0.68.0
- pydantic==1.9.0
"""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Internal imports
from app.api.deps import get_current_user
from app.schemas.webhook import WebhookCreate, WebhookInDB
from app.services.webhook_service import (
    register_webhook,
    update_webhook,
    trigger_webhook
)
from app.models.user import User

# Initialize router with prefix and tags for OpenAPI docs
router = APIRouter(prefix='/api/v1', tags=['webhooks'])

@router.post('/webhooks', response_model=WebhookInDB, status_code=status.HTTP_201_CREATED)
async def create_webhook(
    webhook_data: WebhookCreate,
    current_user: User = Depends(get_current_user)
) -> WebhookInDB:
    """
    Creates a new webhook with the provided configuration after validating the request.
    
    Args:
        webhook_data: Validated webhook configuration from request body
        current_user: Authenticated user from token dependency
        
    Returns:
        WebhookInDB: The newly created webhook object with database fields
        
    Raises:
        HTTPException: 401 if user not authenticated
        HTTPException: 403 if user lacks permission
        HTTPException: 422 if webhook validation fails
    """
    try:
        # Validate user has permission to create webhooks
        if not current_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user cannot create webhooks"
            )
            
        # Register webhook using service
        webhook = register_webhook(webhook_data, current_user.id)
        return webhook
        
    except ConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create webhook: {str(e)}"
        )

@router.put('/webhooks/{webhook_id}', response_model=WebhookInDB)
async def update_webhook_endpoint(
    webhook_id: UUID,
    webhook_data: WebhookCreate,
    current_user: User = Depends(get_current_user)
) -> WebhookInDB:
    """
    Updates an existing webhook configuration after validating ownership and request data.
    
    Args:
        webhook_id: UUID of the webhook to update
        webhook_data: New webhook configuration from request body
        current_user: Authenticated user from token dependency
        
    Returns:
        WebhookInDB: The updated webhook object with database fields
        
    Raises:
        HTTPException: 401 if user not authenticated
        HTTPException: 403 if user lacks permission
        HTTPException: 404 if webhook not found
        HTTPException: 422 if webhook validation fails
    """
    try:
        # Verify webhook exists and belongs to user
        webhook = get_webhook_by_id(webhook_id)
        if not webhook:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Webhook {webhook_id} not found"
            )
            
        if webhook.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this webhook"
            )
            
        # Update webhook using service
        updated_webhook = update_webhook(webhook_id, webhook_data)
        return updated_webhook
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update webhook: {str(e)}"
        )

@router.get('/webhooks/{webhook_id}', response_model=WebhookInDB)
async def get_webhook(
    webhook_id: UUID,
    current_user: User = Depends(get_current_user)
) -> WebhookInDB:
    """
    Retrieves a specific webhook configuration by ID.
    
    Args:
        webhook_id: UUID of the webhook to retrieve
        current_user: Authenticated user from token dependency
        
    Returns:
        WebhookInDB: The requested webhook object with database fields
        
    Raises:
        HTTPException: 401 if user not authenticated
        HTTPException: 403 if user lacks permission
        HTTPException: 404 if webhook not found
    """
    try:
        # Verify webhook exists and belongs to user
        webhook = get_webhook_by_id(webhook_id)
        if not webhook:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Webhook {webhook_id} not found"
            )
            
        if webhook.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this webhook"
            )
            
        return webhook
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve webhook: {str(e)}"
        )

@router.get('/webhooks', response_model=List[WebhookInDB])
async def list_webhooks(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
) -> List[WebhookInDB]:
    """
    Lists all webhooks registered by the authenticated user with pagination.
    
    Args:
        skip: Number of records to skip for pagination
        limit: Maximum number of records to return
        current_user: Authenticated user from token dependency
        
    Returns:
        List[WebhookInDB]: List of webhook objects with database fields
        
    Raises:
        HTTPException: 401 if user not authenticated
        HTTPException: 403 if user lacks permission
    """
    try:
        # Apply pagination parameters
        webhooks = get_user_webhooks(
            user_id=current_user.id,
            skip=skip,
            limit=limit
        )
        return webhooks
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list webhooks: {str(e)}"
        )

@router.delete('/webhooks/{webhook_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_webhook(
    webhook_id: UUID,
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Deletes a specific webhook configuration.
    
    Args:
        webhook_id: UUID of the webhook to delete
        current_user: Authenticated user from token dependency
        
    Returns:
        dict: Success message
        
    Raises:
        HTTPException: 401 if user not authenticated
        HTTPException: 403 if user lacks permission
        HTTPException: 404 if webhook not found
    """
    try:
        # Verify webhook exists and belongs to user
        webhook = get_webhook_by_id(webhook_id)
        if not webhook:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Webhook {webhook_id} not found"
            )
            
        if webhook.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this webhook"
            )
            
        # Delete webhook from database
        delete_webhook_by_id(webhook_id)
        return {"message": "Webhook deleted successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete webhook: {str(e)}"
        )

# Helper functions for database operations
def get_webhook_by_id(webhook_id: UUID) -> WebhookInDB:
    """Retrieves webhook by ID from database."""
    # Implementation would query database using SQLAlchemy
    pass

def get_user_webhooks(user_id: UUID, skip: int, limit: int) -> List[WebhookInDB]:
    """Retrieves paginated list of user's webhooks from database."""
    # Implementation would query database using SQLAlchemy
    pass

def delete_webhook_by_id(webhook_id: UUID) -> None:
    """Deletes webhook by ID from database."""
    # Implementation would delete from database using SQLAlchemy
    pass