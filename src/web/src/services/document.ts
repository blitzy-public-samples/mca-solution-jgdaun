/**
 * Document Service Module
 * Provides services for document-related operations including fetching, downloading,
 * processing and validating documents through the backend API.
 * 
 * Requirements implemented:
 * - RESTful Endpoints (system_design/api_design/restful_endpoints)
 * - Primary Data Flow (system_components_architecture/data_flow_diagrams/primary_data_flow)
 */

import { 
  Document, 
  DocumentStatus, 
  DocumentMetadata 
} from '../types/document';
import { makeApiRequest } from '../utils/api';
import { DOCUMENTS } from '../constants/api';
import { ApiResponse } from '../types/api';

/**
 * Interface for document list filtering options
 */
export interface DocumentFilters {
  status: string;
  type: string;
  classification: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Interface for pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Fetches a paginated list of documents from the backend API with optional filters
 * @param filters - Optional filters to apply to the document list
 * @param pagination - Pagination parameters for the request
 * @returns Promise resolving to paginated document list response
 */
export const fetchDocuments = async (
  filters?: DocumentFilters,
  pagination?: PaginationParams
): Promise<ApiResponse<{ documents: Document[]; total: number; }>> => {
  // Construct query parameters
  const queryParams = {
    ...filters,
    page: pagination?.page || 1,
    limit: pagination?.limit || 10,
    // Convert dates to ISO strings if present
    startDate: filters?.startDate?.toISOString(),
    endDate: filters?.endDate?.toISOString()
  };

  // Make GET request to documents endpoint
  return makeApiRequest(
    DOCUMENTS.BASE,
    'GET',
    queryParams
  );
};

/**
 * Fetches a single document by its ID from the backend API
 * @param documentId - ID of the document to fetch
 * @returns Promise resolving to document data response
 * @throws Error if documentId is not provided
 */
export const getDocumentById = async (
  documentId: string
): Promise<ApiResponse<Document>> => {
  // Validate documentId parameter
  if (!documentId) {
    throw new Error('Document ID is required');
  }

  // Construct endpoint URL with document ID
  const endpoint = DOCUMENTS.DETAILS.replace(':id', documentId);

  // Make GET request to document details endpoint
  return makeApiRequest(
    endpoint,
    'GET'
  );
};

/**
 * Retrieves a pre-signed URL for downloading a document
 * @param documentId - ID of the document to download
 * @returns Promise resolving to download URL response
 * @throws Error if documentId is not provided
 */
export const getDocumentDownloadUrl = async (
  documentId: string
): Promise<ApiResponse<{ downloadUrl: string }>> => {
  // Validate documentId parameter
  if (!documentId) {
    throw new Error('Document ID is required');
  }

  // Construct endpoint URL with document ID
  const endpoint = DOCUMENTS.DOWNLOAD.replace(':id', documentId);

  // Make GET request to document download endpoint
  return makeApiRequest(
    endpoint,
    'GET'
  );
};

/**
 * Triggers validation of a document's extracted data
 * @param documentId - ID of the document to validate
 * @returns Promise resolving to validation results response
 * @throws Error if documentId is not provided
 */
export const validateDocument = async (
  documentId: string
): Promise<ApiResponse<{ validationErrors: string[] }>> => {
  // Validate documentId parameter
  if (!documentId) {
    throw new Error('Document ID is required');
  }

  // Construct endpoint URL with document ID
  const endpoint = DOCUMENTS.VALIDATE.replace(':id', documentId);

  // Make POST request to document validation endpoint
  return makeApiRequest(
    endpoint,
    'POST'
  );
};

/**
 * Triggers or retries document processing
 * @param documentId - ID of the document to process
 * @returns Promise resolving to processing status response
 * @throws Error if documentId is not provided
 */
export const processDocument = async (
  documentId: string
): Promise<ApiResponse<{ status: DocumentStatus }>> => {
  // Validate documentId parameter
  if (!documentId) {
    throw new Error('Document ID is required');
  }

  // Construct endpoint URL with document ID
  const endpoint = DOCUMENTS.PROCESS.replace(':id', documentId);

  // Make POST request to document processing endpoint
  return makeApiRequest(
    endpoint,
    'POST'
  );
};