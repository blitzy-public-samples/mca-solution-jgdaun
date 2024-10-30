/**
 * @file Validation Utilities
 * This file provides utility functions for validating various data types and structures
 * within the frontend application, ensuring data integrity and consistency according to
 * the system's validation rules and requirements.
 * @version 1.0.0
 */

import { ApiResponse } from '../types/api';
import { Document, DocumentStatus, DocumentMetadata } from '../types/document';
import { User, UserRole, isValidUserRole } from '../types/user';

// RFC 5322 compliant email regex pattern
// Implements validation rule from field_validation_rules specification
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Document type whitelist
const ALLOWED_DOCUMENT_TYPES = ['invoice', 'receipt', 'contract', 'form', 'report'];

// Maximum file size in bytes (100MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Allowed file extensions
const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff'];

/**
 * Validates if the given string is a valid email address using RFC 5322 compliant regex pattern.
 * Implements the email validation rule from field_validation_rules specification.
 * 
 * @param email - The email string to validate
 * @returns boolean indicating if the email is valid
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Validates the structure and content of a document object according to system requirements.
 * Implements document validation requirements from the technical specification.
 * 
 * @param document - The document object to validate
 * @returns ApiResponse indicating validation success/failure with detailed error messages
 */
export const validateDocument = (document: Document): ApiResponse => {
  const errors: string[] = [];

  // Required field validation
  if (!document.id || typeof document.id !== 'string') {
    errors.push('Document ID is required and must be a string');
  }

  if (!document.type || !ALLOWED_DOCUMENT_TYPES.includes(document.type)) {
    errors.push(`Document type must be one of: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`);
  }

  if (!document.storagePath || typeof document.storagePath !== 'string') {
    errors.push('Storage path is required and must be a string');
  }

  if (!document.classification || typeof document.classification !== 'string') {
    errors.push('Classification is required and must be a string');
  }

  if (!Object.values(DocumentStatus).includes(document.status)) {
    errors.push(`Status must be one of: ${Object.values(DocumentStatus).join(', ')}`);
  }

  if (!(document.uploadedAt instanceof Date)) {
    errors.push('uploadedAt must be a valid Date object');
  }

  // File validation
  if (!document.fileName || typeof document.fileName !== 'string') {
    errors.push('File name is required and must be a string');
  } else {
    const extension = document.fileName.toLowerCase().substring(document.fileName.lastIndexOf('.'));
    if (!ALLOWED_FILE_EXTENSIONS.includes(extension)) {
      errors.push(`File extension must be one of: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`);
    }
  }

  if (!document.fileSize || typeof document.fileSize !== 'number' || document.fileSize <= 0) {
    errors.push('File size must be a positive number');
  } else if (document.fileSize > MAX_FILE_SIZE) {
    errors.push(`File size must not exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  // Metadata validation
  if (!document.metadata || typeof document.metadata !== 'object') {
    errors.push('Metadata is required and must be an object');
  } else {
    const metadata = document.metadata as DocumentMetadata;
    if (typeof metadata.ocrConfidence !== 'number' || metadata.ocrConfidence < 0 || metadata.ocrConfidence > 100) {
      errors.push('OCR confidence must be a number between 0 and 100');
    }
    if (!Array.isArray(metadata.tags)) {
      errors.push('Metadata tags must be an array');
    }
    if (typeof metadata.extractedData !== 'object') {
      errors.push('Extracted data must be an object');
    }
    if (!Array.isArray(metadata.validationErrors)) {
      errors.push('Validation errors must be an array');
    }
  }

  return {
    success: errors.length === 0,
    message: errors.length === 0 ? 'Document validation successful' : 'Document validation failed',
    data: errors.length === 0 ? document : { errors }
  };
};

/**
 * Validates the structure and content of a user object according to system requirements.
 * Implements user validation requirements from the technical specification.
 * 
 * @param user - The user object to validate
 * @returns ApiResponse indicating validation success/failure with detailed error messages
 */
export const validateUser = (user: User): ApiResponse => {
  const errors: string[] = [];

  // Required field validation
  if (!user.id || typeof user.id !== 'string') {
    errors.push('User ID is required and must be a string');
  }

  // Username validation
  if (!user.username || typeof user.username !== 'string') {
    errors.push('Username is required and must be a string');
  } else if (user.username.length < 3 || user.username.length > 50) {
    errors.push('Username must be between 3 and 50 characters');
  }

  // Email validation
  if (!user.email || !validateEmail(user.email)) {
    errors.push('A valid email address is required');
  }

  // Role validation
  if (!user.role || !isValidUserRole(user.role)) {
    errors.push(`Role must be one of: ${Object.values(UserRole).join(', ')}`);
  }

  // Active status validation
  if (typeof user.isActive !== 'boolean') {
    errors.push('isActive must be a boolean value');
  }

  return {
    success: errors.length === 0,
    message: errors.length === 0 ? 'User validation successful' : 'User validation failed',
    data: errors.length === 0 ? user : { errors }
  };
};