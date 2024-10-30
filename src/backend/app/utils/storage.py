"""
Storage Utility Module

This module provides utility functions for handling document storage operations,
managing secure document persistence in AWS S3 and database interactions with
proper error handling and logging.

Version Requirements:
- boto3==1.18.0
- sqlalchemy==1.4.22
- botocore==1.21.0
"""

import os
import logging
import time
from datetime import datetime
from typing import Optional
from uuid import UUID
import boto3
from botocore.exceptions import ClientError, BotoCoreError
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import Config
from app.models.document import Document

# Configure logging
logger = logging.getLogger(__name__)

# Initialize global S3 client with AWS credentials from Config
S3_CLIENT = boto3.client(
    's3',
    aws_access_key_id=Config.aws_access_key_id,
    aws_secret_access_key=Config.aws_secret_access_key,
    region_name=Config.aws_region
)

# Get S3 bucket name from Config
S3_BUCKET = Config.s3_bucket

# Constants for retry mechanism
MAX_RETRIES = 3
INITIAL_BACKOFF = 1  # seconds
MAX_BACKOFF = 8  # seconds

def upload_document_to_s3(file_path: str, document_id: str) -> str:
    """
    Uploads a document to the specified S3 bucket with proper error handling and retry mechanism.
    
    Args:
        file_path (str): Local path to the file to be uploaded
        document_id (str): Unique identifier for the document
        
    Returns:
        str: The S3 URL of the uploaded document
        
    Raises:
        FileNotFoundError: If the file does not exist at the given path
        Exception: For other upload-related errors after retries are exhausted
    """
    # Validate file existence
    if not os.path.exists(file_path):
        logger.error(f"File not found at path: {file_path}")
        raise FileNotFoundError(f"File not found at path: {file_path}")
    
    # Generate unique S3 key using document_id and timestamp
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    file_extension = os.path.splitext(file_path)[1]
    s3_key = f"documents/{document_id}/{timestamp}{file_extension}"
    
    # Determine content type
    content_type = _get_content_type(file_extension)
    
    # Implement exponential backoff retry
    for attempt in range(MAX_RETRIES):
        try:
            # Upload file to S3 with content-type
            with open(file_path, 'rb') as file:
                S3_CLIENT.upload_fileobj(
                    file,
                    S3_BUCKET,
                    s3_key,
                    ExtraArgs={
                        'ContentType': content_type,
                        'ServerSideEncryption': 'AES256'  # Implement server-side encryption
                    }
                )
            
            # Generate and return the S3 URL
            s3_url = f"https://{S3_BUCKET}.s3.{Config.aws_region}.amazonaws.com/{s3_key}"
            logger.info(f"Successfully uploaded document {document_id} to S3: {s3_url}")
            return s3_url
            
        except (ClientError, BotoCoreError) as e:
            backoff = min(MAX_BACKOFF, INITIAL_BACKOFF * (2 ** attempt))
            logger.warning(
                f"S3 upload attempt {attempt + 1} failed for document {document_id}. "
                f"Error: {str(e)}. Retrying in {backoff} seconds..."
            )
            time.sleep(backoff)
    
    # If all retries are exhausted
    error_msg = f"Failed to upload document {document_id} to S3 after {MAX_RETRIES} attempts"
    logger.error(error_msg)
    raise Exception(error_msg)

def retrieve_document_from_db(document_id: UUID) -> Optional[Document]:
    """
    Retrieves a document record from the database using its ID with proper error handling.
    
    Args:
        document_id (UUID): The unique identifier of the document to retrieve
        
    Returns:
        Optional[Document]: The ORM Document object if found, None otherwise
        
    Raises:
        SQLAlchemyError: For database connection or query errors
    """
    from app.db.session import SessionLocal  # Import here to avoid circular imports
    
    db = SessionLocal()
    try:
        # Query the Document table for the record
        document = db.query(Document).filter(Document.id == document_id).first()
        
        if document is None:
            logger.warning(f"Document not found with ID: {document_id}")
            return None
            
        logger.info(f"Successfully retrieved document with ID: {document_id}")
        return document
        
    except SQLAlchemyError as e:
        logger.error(f"Database error while retrieving document {document_id}: {str(e)}")
        raise
        
    finally:
        db.close()

def delete_document_from_s3(s3_key: str) -> bool:
    """
    Deletes a document from S3 storage with proper error handling.
    
    Args:
        s3_key (str): The S3 key of the document to delete
        
    Returns:
        bool: True if deletion successful, False otherwise
    """
    if not s3_key:
        logger.error("Invalid S3 key provided")
        return False
    
    try:
        # Attempt to delete the object from S3
        S3_CLIENT.delete_object(
            Bucket=S3_BUCKET,
            Key=s3_key
        )
        
        logger.info(f"Successfully deleted document with key: {s3_key}")
        return True
        
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')
        logger.error(f"Failed to delete document from S3. Key: {s3_key}, Error: {error_code}")
        return False
        
    except Exception as e:
        logger.error(f"Unexpected error while deleting document from S3. Key: {s3_key}, Error: {str(e)}")
        return False

def _get_content_type(file_extension: str) -> str:
    """
    Helper function to determine the content type based on file extension.
    
    Args:
        file_extension (str): The file extension including the dot
        
    Returns:
        str: The appropriate MIME type for the file
    """
    content_types = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.tiff': 'image/tiff',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
    
    return content_types.get(file_extension.lower(), 'application/octet-stream')