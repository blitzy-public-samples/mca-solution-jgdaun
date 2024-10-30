/**
 * @file Document Types and Interfaces
 * This file defines TypeScript types and interfaces for document-related data structures
 * within the frontend application. These types ensure type safety and consistency when
 * handling document data throughout the document processing pipeline.
 */

import { success, message, data } from '../types/api';

/**
 * Enum representing possible document processing statuses
 * Implements REQ-DOC-1: Document Status Tracking
 */
export enum DocumentStatus {
  /** Document has been uploaded but not yet processed */
  UPLOADED = 'UPLOADED',
  /** Document is currently being processed by the OCR pipeline */
  PROCESSING = 'PROCESSING',
  /** Document has been successfully processed */
  PROCESSED = 'PROCESSED',
  /** Document processing has failed */
  FAILED = 'FAILED',
  /** Document has been archived */
  ARCHIVED = 'ARCHIVED'
}

/**
 * Interface representing additional metadata associated with a document
 * Implements REQ-DOC-2: Document Metadata Structure
 */
export interface DocumentMetadata {
  /** Confidence score from OCR processing (0-100) */
  ocrConfidence: number;
  /** Array of tags associated with the document */
  tags: string[];
  /** Key-value pairs of extracted data from the document */
  extractedData: Record<string, any>;
  /** Array of validation errors encountered during processing */
  validationErrors: string[];
}

/**
 * Interface representing the structure of a document within the application
 * Implements REQ-DOC-3: Document Data Model
 */
export interface Document {
  /** Unique identifier for the document */
  id: string;
  /** Type of document (e.g., 'invoice', 'receipt', etc.) */
  type: string;
  /** Path where the document is stored in the storage system */
  storagePath: string;
  /** Document classification determined by the processing pipeline */
  classification: string;
  /** Current status of document processing */
  status: DocumentStatus;
  /** Timestamp when the document was uploaded */
  uploadedAt: Date;
  /** Original filename of the uploaded document */
  fileName: string;
  /** Size of the file in bytes */
  fileSize: number;
  /** MIME type of the document */
  mimeType: string;
  /** ID of the user who uploaded the document */
  uploadedBy: string;
  /** Timestamp when document processing was completed (null if not processed) */
  processedAt: Date | null;
  /** Number of pages in the document */
  pageCount: number;
  /** Additional metadata associated with the document */
  metadata: DocumentMetadata;
}

// Export named interfaces and enums for use throughout the application
export type { Document, DocumentMetadata };
export { DocumentStatus };