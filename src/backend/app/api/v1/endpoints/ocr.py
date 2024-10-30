"""
OCR API Endpoints Module

This module implements the OCR-related API endpoints for document processing
and text extraction with confidence scoring.

Version Requirements:
- fastapi==0.68.0
"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse

# Internal imports
from app.services.ocr_service import process_document
from app.schemas.ocr import OCRBase, OCRCreate, OCRInDB
from app.api.deps import get_current_user
from app.models.user import User

# Initialize router with prefix and tags
router = APIRouter(prefix='/api/v1/ocr', tags=['ocr'])

@router.post('/', response_model=OCRInDB, status_code=status.HTTP_201_CREATED)
async def create_ocr_request(
    ocr_data: OCRCreate,
    current_user: User = Depends(get_current_user)
) -> OCRInDB:
    """
    Creates a new OCR processing request with document validation and confidence scoring.
    Implements RESTful endpoint requirements from API design specification.

    Args:
        ocr_data: OCR request data validated through OCRCreate schema
        current_user: Authenticated user from token validation

    Returns:
        OCRInDB: Created OCR processing request with confidence scores

    Raises:
        HTTPException: 400 for validation errors
        HTTPException: 401 for authentication errors
        HTTPException: 422 for processing errors
    """
    try:
        # Validate document ownership and permissions
        if not current_user.can_process_documents:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have permission to process documents"
            )

        # Process document through OCR pipeline
        ocr_result = process_document(ocr_data.document_id)

        # Return processed OCR data
        return ocr_result

    except ValueError as e:
        # Handle validation errors
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # Handle processing errors
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"OCR processing failed: {str(e)}"
        )

@router.get('/{document_id}', response_model=OCRInDB)
async def get_ocr_result(
    document_id: UUID,
    current_user: User = Depends(get_current_user)
) -> OCRInDB:
    """
    Retrieves the OCR processing result for a specific document.
    Implements API request flow from system architecture specification.

    Args:
        document_id: UUID of the document to retrieve OCR results for
        current_user: Authenticated user from token validation

    Returns:
        OCRInDB: OCR processing result with confidence scores

    Raises:
        HTTPException: 404 if document not found
        HTTPException: 403 if user lacks permission
    """
    try:
        # Validate document ID
        if not document_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Document ID is required"
            )

        # Query OCR result from database
        ocr_result = db.query(OCRInDB).filter(
            OCRInDB.document_id == document_id
        ).first()

        # Check if OCR result exists
        if not ocr_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"OCR result not found for document: {document_id}"
            )

        # Verify user has permission to access document
        if not current_user.can_access_document(document_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have permission to access this document"
            )

        return ocr_result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving OCR result: {str(e)}"
        )

@router.get('/{document_id}/status')
async def get_ocr_status(
    document_id: UUID,
    current_user: User = Depends(get_current_user)
) -> JSONResponse:
    """
    Retrieves the current status of OCR processing for a document.
    Implements document processing flow from system architecture.

    Args:
        document_id: UUID of the document to check status for
        current_user: Authenticated user from token validation

    Returns:
        JSONResponse: Current OCR processing status and confidence score if available

    Raises:
        HTTPException: 404 if document not found
        HTTPException: 403 if user lacks permission
    """
    try:
        # Query OCR status from database
        ocr_result = db.query(OCRInDB).filter(
            OCRInDB.document_id == document_id
        ).first()

        # Check if OCR record exists
        if not ocr_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"OCR record not found for document: {document_id}"
            )

        # Verify user has permission to access document
        if not current_user.can_access_document(document_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have permission to access this document"
            )

        # Prepare status response
        status_response = {
            "status": ocr_result.status,
            "confidence_score": ocr_result.confidence_score if ocr_result.status == "processed" else None,
            "last_updated": ocr_result.updated_at.isoformat(),
            "error_message": ocr_result.error_message if ocr_result.status == "failed" else None
        }

        return JSONResponse(
            content=status_response,
            status_code=status.HTTP_200_OK
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving OCR status: {str(e)}"
        )