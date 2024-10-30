"""
Document Management API Endpoints

This module implements RESTful API endpoints for document management including creation,
retrieval, and status updates. Provides comprehensive validation, error handling, and
proper response formatting according to API design specifications.

Version Requirements:
- fastapi==0.68.0
"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.exc import SQLAlchemyError

# Internal imports
from app.models.document import Document
from app.schemas.document import DocumentCreate, DocumentUpdate
from app.services.document_service import (
    create_document,
    get_document,
    update_document_status
)
from app.api.deps import get_current_user
from app.models.user import User

# Initialize router with prefix and tags
router = APIRouter(prefix='/api/v1', tags=['documents'])

# Constants for file validation
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_FILE_TYPES = {
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/tiff'
}

@router.post('/documents/', response_model=Document, status_code=status.HTTP_201_CREATED)
async def create_document_endpoint(
    document_data: DocumentCreate,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
) -> Document:
    """
    Creates a new document with file upload.
    
    Implements requirements:
    - Document creation from document_processing_flow
    - File validation and storage from storage_resources
    - User authentication from security_architecture
    
    Args:
        document_data: Validated document metadata
        file: Uploaded document file
        current_user: Authenticated user from dependency
        
    Returns:
        Document: Created document object
        
    Raises:
        HTTPException: 400 if file validation fails
        HTTPException: 413 if file too large
        HTTPException: 422 if document data invalid
        HTTPException: 500 if creation fails
    """
    try:
        # Step 1: Validate file size
        if file.size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE} bytes"
            )
            
        # Step 2: Validate file type
        content_type = file.content_type
        if content_type not in ALLOWED_FILE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {content_type} not allowed. Allowed types: {ALLOWED_FILE_TYPES}"
            )
            
        # Step 3: Read file content
        file_content = await file.read()
        
        # Step 4: Create document using service
        try:
            document = await create_document(
                document_data=document_data,
                file_content=file_content
            )
            return document
            
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(e)
            )
        except SQLAlchemyError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error occurred while creating document"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating document: {str(e)}"
        )

@router.get('/documents/{document_id}', response_model=Document)
async def get_document_endpoint(
    document_id: UUID,
    current_user: User = Depends(get_current_user)
) -> Document:
    """
    Retrieves a document by its ID.
    
    Implements requirements:
    - Document retrieval from document_processing_flow
    - Access control from security_architecture
    
    Args:
        document_id: Unique identifier of the document
        current_user: Authenticated user from dependency
        
    Returns:
        Document: Retrieved document object
        
    Raises:
        HTTPException: 404 if document not found
        HTTPException: 403 if user lacks permission
        HTTPException: 500 if retrieval fails
    """
    try:
        # Step 1: Retrieve document using service
        document = await get_document(document_id)
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document not found with ID: {document_id}"
            )
            
        # Step 2: Verify user has permission to access document
        if document.application_id != current_user.application_id and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this document"
            )
            
        return document
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving document: {str(e)}"
        )

@router.patch('/documents/{document_id}/status', response_model=Document)
async def update_document_status_endpoint(
    document_id: UUID,
    update_data: DocumentUpdate,
    current_user: User = Depends(get_current_user)
) -> Document:
    """
    Updates document processing status.
    
    Implements requirements:
    - Status updates from document_processing_flow
    - Access control from security_architecture
    
    Args:
        document_id: Document identifier
        update_data: Status update data
        current_user: Authenticated user from dependency
        
    Returns:
        Document: Updated document object
        
    Raises:
        HTTPException: 404 if document not found
        HTTPException: 403 if user lacks permission
        HTTPException: 422 if update data invalid
        HTTPException: 500 if update fails
    """
    try:
        # Step 1: Verify document exists and user has permission
        document = await get_document(document_id)
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document not found with ID: {document_id}"
            )
            
        if document.application_id != current_user.application_id and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this document"
            )
            
        # Step 2: Update document status using service
        try:
            updated_document = await update_document_status(
                document_id=document_id,
                status=update_data.status,
                confidence_score=update_data.confidence_score
            )
            return updated_document
            
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(e)
            )
        except SQLAlchemyError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error occurred while updating document status"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating document status: {str(e)}"
        )