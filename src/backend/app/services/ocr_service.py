"""
OCR Service Module

This module implements the OCR processing service responsible for document text extraction,
confidence scoring, and quality validation according to the technical specifications.

Version Requirements:
- pytesseract==0.3.8
- Pillow==8.2.0
- numpy==1.21.0
"""

import os
from typing import Dict, Optional
from uuid import UUID
import pytesseract
import numpy as np
from PIL import Image, ImageEnhance
from sqlalchemy.orm import Session

# Internal imports
from app.core.config import Config
from app.core.exceptions import CustomException
from app.utils.validation import validate_document_data
from app.utils.storage import upload_document_to_s3
from app.models.document import Document
from app.schemas.ocr import OCRBase, OCRCreate, OCRInDB
from app.db.session import SessionLocal

# Global constants from specification
OCR_ENGINE = 'pytesseract'
AUTO_APPROVE_THRESHOLD = 0.95
MANUAL_REVIEW_THRESHOLD = 0.70
SUPPORTED_FORMATS = ['.pdf', '.png', '.jpg', '.jpeg', '.tiff']

class OCRProcessor:
    """
    Handles OCR processing operations with quality checks and confidence scoring.
    Implements OCR processing requirements from system architecture specification.
    """
    
    def __init__(self, db_session: SessionLocal, config: Config):
        """
        Initializes OCR processor with database session and configuration.
        
        Args:
            db_session: Database session for persistence
            config: Application configuration instance
        """
        self.db = db_session
        self.config = config
        
        # Configure OCR engine based on settings
        pytesseract.pytesseract.tesseract_cmd = self.config.ocr_engine_path
    
    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """
        Preprocesses image for optimal OCR results.
        Implements image preprocessing requirements from OCR processing pipeline.
        
        Args:
            image: PIL Image object to preprocess
            
        Returns:
            PIL.Image: Preprocessed image ready for OCR
        """
        # Convert to grayscale for better OCR accuracy
        image = image.convert('L')
        
        # Enhance contrast to improve text visibility
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(2.0)
        
        # Apply noise reduction
        image = image.filter(ImageFilter.MedianFilter(size=3))
        
        # Resize if image is too large (max 4000 pixels on longest side)
        max_size = 4000
        if max(image.size) > max_size:
            ratio = max_size / max(image.size)
            new_size = tuple(int(dim * ratio) for dim in image.size)
            image = image.resize(new_size, Image.LANCZOS)
        
        return image

def process_document(document_id: UUID) -> OCRInDB:
    """
    Processes a document through OCR, extracts text, and calculates confidence scores.
    Implements core OCR processing pipeline from system architecture specification.
    
    Args:
        document_id: UUID of the document to process
        
    Returns:
        OCRInDB: Processed OCR record with extracted text and confidence scores
        
    Raises:
        CustomException: For various processing errors
    """
    db = SessionLocal()
    try:
        # Retrieve document from database
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise CustomException(
                message=f"Document not found: {document_id}",
                code="NOT_FOUND"
            )
        
        # Validate document data
        validate_document_data(document.to_dict())
        
        # Check file format support
        file_ext = os.path.splitext(document.storage_path)[1].lower()
        if file_ext not in SUPPORTED_FORMATS:
            raise CustomException(
                message=f"Unsupported file format: {file_ext}",
                code="VALIDATION_ERROR"
            )
        
        # Initialize OCR processor
        processor = OCRProcessor(db, Config())
        
        # Load and preprocess image
        try:
            image = Image.open(document.storage_path)
            processed_image = processor.preprocess_image(image)
        except Exception as e:
            raise CustomException(
                message=f"Image processing failed: {str(e)}",
                code="PROCESSING_ERROR"
            )
        
        # Perform OCR with detailed data
        try:
            ocr_data = pytesseract.image_to_data(
                processed_image,
                output_type=pytesseract.Output.DICT,
                config='--psm 3'  # Automatic page segmentation
            )
            extracted_text = ' '.join(ocr_data['text'])
        except Exception as e:
            raise CustomException(
                message=f"OCR extraction failed: {str(e)}",
                code="OCR_ERROR"
            )
        
        # Calculate confidence score
        confidence_score = calculate_confidence_score(extracted_text, ocr_data)
        
        # Create OCR record
        ocr_create = OCRCreate(
            document_id=document_id,
            extracted_text=extracted_text,
            confidence_score=confidence_score,
            metadata={
                'word_confidences': ocr_data['conf'],
                'word_count': len(ocr_data['text']),
                'processing_details': {
                    'engine': OCR_ENGINE,
                    'preprocessing_applied': True,
                    'image_quality': {
                        'width': image.width,
                        'height': image.height,
                        'format': image.format
                    }
                }
            }
        )
        
        # Determine processing status based on confidence thresholds
        if confidence_score >= AUTO_APPROVE_THRESHOLD:
            ocr_create.status = 'processed'
        elif confidence_score >= MANUAL_REVIEW_THRESHOLD:
            ocr_create.status = 'needs_review'
        else:
            ocr_create.status = 'failed'
        
        # Upload processed document to S3
        s3_path = upload_document_to_s3(document.storage_path, str(document_id))
        
        # Update document record
        document.status = ocr_create.status
        document.confidence_score = confidence_score
        document.storage_path = s3_path
        document.metadata = {
            **document.metadata,
            'ocr_processing': {
                'timestamp': datetime.utcnow().isoformat(),
                'confidence_score': confidence_score,
                'status': ocr_create.status
            }
        }
        
        # Save OCR results to database
        db.add(OCRInDB(**ocr_create.dict()))
        db.commit()
        
        return OCRInDB(**ocr_create.dict())
        
    except CustomException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise CustomException(
            message=f"OCR processing failed: {str(e)}",
            code="PROCESSING_ERROR"
        )
    finally:
        db.close()

def calculate_confidence_score(extracted_text: str, ocr_data: Dict) -> float:
    """
    Calculates confidence scores for OCR extracted text.
    Implements confidence scoring matrix from technical specifications.
    
    Args:
        extracted_text: Extracted text content
        ocr_data: Dictionary containing OCR processing data
        
    Returns:
        float: Calculated confidence score between 0 and 1
    """
    if not extracted_text or not ocr_data:
        return 0.0
    
    try:
        # Get word-level confidence scores
        word_confidences = np.array(ocr_data['conf'])
        word_confidences = word_confidences[word_confidences != -1]  # Remove invalid scores
        
        if len(word_confidences) == 0:
            return 0.0
        
        # Calculate base confidence score (weighted average)
        base_score = np.mean(word_confidences) / 100.0
        
        # Apply quality factors
        quality_factors = []
        
        # Text length factor
        min_text_length = 10
        if len(extracted_text.split()) >= min_text_length:
            quality_factors.append(1.0)
        else:
            quality_factors.append(0.8)
        
        # Word confidence consistency
        confidence_std = np.std(word_confidences)
        if confidence_std < 10:  # High consistency
            quality_factors.append(1.1)
        elif confidence_std < 20:  # Medium consistency
            quality_factors.append(1.0)
        else:  # Low consistency
            quality_factors.append(0.9)
        
        # Apply quality factors to base score
        final_score = base_score * np.mean(quality_factors)
        
        # Ensure score is between 0 and 1
        return max(0.0, min(1.0, final_score))
        
    except Exception as e:
        raise CustomException(
            message=f"Confidence score calculation failed: {str(e)}",
            code="PROCESSING_ERROR"
        )