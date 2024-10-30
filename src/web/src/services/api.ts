/**
 * API Service Module
 * Implements RESTful endpoints for applications, documents, and webhooks with built-in
 * support for JWT authentication, rate limiting, and standardized error handling.
 * 
 * Requirements implemented:
 * - RESTful Endpoints (system_design/api_design/restful_endpoints)
 * - API Authentication (system_design/api_design/api_authentication)
 * - Error Responses (system_design/api_design/error_responses)
 */

// axios v0.21.1
import { configureAxios } from '../config/api';
import { makeApiRequest } from '../utils/api';
import { 
  APPLICATIONS, 
  DOCUMENTS, 
  WEBHOOKS, 
  EMAIL, 
  OCR 
} from '../constants/api';
import type { 
  ApiResponse, 
  PaginatedApiResponse 
} from '../types/api';

// Initialize configured axios instance
configureAxios();

/**
 * Interface for application filter parameters
 */
interface ApplicationFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

/**
 * Interface for pagination parameters
 */
interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Interface for document metadata
 */
interface DocumentMetadata {
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
}

/**
 * Fetches a paginated list of applications with optional filtering
 * @param filters - Optional filters to apply to the applications list
 * @param pagination - Pagination parameters
 * @returns Promise resolving to paginated applications response
 */
export const fetchApplications = async (
  filters: ApplicationFilters = {},
  pagination: PaginationParams
): Promise<PaginatedApiResponse<Application>> => {
  const queryParams = {
    ...filters,
    ...pagination
  };
  
  return makeApiRequest<Application[]>(
    APPLICATIONS.BASE,
    'GET',
    queryParams
  );
};

/**
 * Fetches detailed information about a specific document
 * @param documentId - Unique identifier of the document
 * @returns Promise resolving to document details response
 */
export const fetchDocumentDetails = async (
  documentId: string
): Promise<ApiResponse<DocumentDetails>> => {
  if (!documentId) {
    throw new Error('Document ID is required');
  }

  const endpoint = DOCUMENTS.DETAILS.replace(':id', documentId);
  return makeApiRequest<DocumentDetails>(endpoint, 'GET');
};

/**
 * Uploads a new document for processing with optional metadata
 * @param file - File object to upload
 * @param metadata - Optional metadata for the document
 * @returns Promise resolving to upload response
 */
export const uploadDocument = async (
  file: File,
  metadata?: DocumentMetadata
): Promise<ApiResponse<UploadResponse>> => {
  // Validate file
  if (!file) {
    throw new Error('File is required');
  }

  // Validate file size (max 10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds maximum limit of 10MB');
  }

  // Validate file type
  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Supported types: PDF, JPEG, PNG');
  }

  // Create form data
  const formData = new FormData();
  formData.append('file', file);
  
  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  // Configure request with proper headers for file upload
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent: ProgressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      // Progress can be tracked here if needed
      console.debug(`Upload progress: ${percentCompleted}%`);
    }
  };

  return makeApiRequest<UploadResponse>(
    DOCUMENTS.PROCESS,
    'POST',
    formData,
    config
  );
};

/**
 * Retrieves document processing status
 * @param documentId - Unique identifier of the document
 * @returns Promise resolving to processing status response
 */
export const getDocumentProcessingStatus = async (
  documentId: string
): Promise<ApiResponse<ProcessingStatus>> => {
  if (!documentId) {
    throw new Error('Document ID is required');
  }

  const endpoint = OCR.STATUS.replace(':id', documentId);
  return makeApiRequest<ProcessingStatus>(endpoint, 'GET');
};

/**
 * Retrieves OCR results for a processed document
 * @param documentId - Unique identifier of the document
 * @returns Promise resolving to OCR results response
 */
export const getDocumentOcrResults = async (
  documentId: string
): Promise<ApiResponse<OcrResults>> => {
  if (!documentId) {
    throw new Error('Document ID is required');
  }

  const endpoint = OCR.RESULTS.replace(':id', documentId);
  return makeApiRequest<OcrResults>(endpoint, 'GET');
};

/**
 * Registers a new webhook endpoint
 * @param config - Webhook configuration object
 * @returns Promise resolving to webhook registration response
 */
export const registerWebhook = async (
  config: WebhookConfig
): Promise<ApiResponse<WebhookResponse>> => {
  // Validate webhook configuration
  if (!config.url || !config.events || config.events.length === 0) {
    throw new Error('Invalid webhook configuration');
  }

  return makeApiRequest<WebhookResponse>(
    WEBHOOKS.BASE,
    'POST',
    config
  );
};

/**
 * Updates an existing webhook configuration
 * @param webhookId - Unique identifier of the webhook
 * @param config - Updated webhook configuration
 * @returns Promise resolving to updated webhook response
 */
export const updateWebhook = async (
  webhookId: string,
  config: Partial<WebhookConfig>
): Promise<ApiResponse<WebhookResponse>> => {
  if (!webhookId) {
    throw new Error('Webhook ID is required');
  }

  const endpoint = WEBHOOKS.DETAILS.replace(':id', webhookId);
  return makeApiRequest<WebhookResponse>(
    endpoint,
    'PUT',
    config
  );
};

/**
 * Tests a webhook endpoint with a sample payload
 * @param webhookId - Unique identifier of the webhook
 * @returns Promise resolving to webhook test response
 */
export const testWebhook = async (
  webhookId: string
): Promise<ApiResponse<WebhookTestResponse>> => {
  if (!webhookId) {
    throw new Error('Webhook ID is required');
  }

  const endpoint = WEBHOOKS.TEST.replace(':id', webhookId);
  return makeApiRequest<WebhookTestResponse>(endpoint, 'POST');
};

/**
 * Retrieves webhook delivery logs
 * @param webhookId - Unique identifier of the webhook
 * @param pagination - Pagination parameters
 * @returns Promise resolving to paginated webhook logs response
 */
export const getWebhookLogs = async (
  webhookId: string,
  pagination: PaginationParams
): Promise<PaginatedApiResponse<WebhookLog>> => {
  if (!webhookId) {
    throw new Error('Webhook ID is required');
  }

  const endpoint = WEBHOOKS.LOGS.replace(':id', webhookId);
  return makeApiRequest<WebhookLog[]>(
    endpoint,
    'GET',
    pagination
  );
};

/**
 * Sends a test email using configured email settings
 * @param emailConfig - Email configuration for test
 * @returns Promise resolving to email test response
 */
export const testEmailConfiguration = async (
  emailConfig: EmailTestConfig
): Promise<ApiResponse<EmailTestResponse>> => {
  return makeApiRequest<EmailTestResponse>(
    EMAIL.TEST,
    'POST',
    emailConfig
  );
};