/**
 * Custom React hook for managing document-related operations and state
 * 
 * Requirements implemented:
 * - Primary Data Flow (system_components_architecture.data_flow_diagrams.primary_data_flow)
 * - RESTful Endpoints (system_design.api_design.restful_endpoints)
 */

// React imports - v18.2.0
import { useState, useCallback } from 'react';
// React Redux imports - v7.2.4
import { useDispatch, useSelector } from 'react-redux';

// Internal imports
import { Document, DocumentStatus, DocumentMetadata } from '../types/document';
import {
  fetchDocuments,
  getDocumentById,
  validateDocument,
  processDocument,
  DocumentFilters,
  PaginationParams
} from '../services/document';
import {
  fetchDocumentsAsync,
  selectDocuments,
  selectDocumentsLoading,
  selectDocumentsError,
  selectDocumentsTotalCount,
  setSelectedDocument
} from '../store/slices/documentSlice';

/**
 * Interface defining the return type of the useDocuments hook
 */
interface DocumentHookState {
  documents: Document[];
  loading: boolean;
  error: string | null;
  totalCount: number;
}

/**
 * Custom hook to manage document-related operations and state
 * @param filters - Optional filters for document listing
 * @param pagination - Optional pagination parameters
 * @returns DocumentHookState and document operations
 */
const useDocuments = (
  filters?: DocumentFilters,
  pagination?: PaginationParams
) => {
  // Initialize Redux dispatch
  const dispatch = useDispatch();

  // Access document state from Redux store
  const documents = useSelector(selectDocuments);
  const loading = useSelector(selectDocumentsLoading);
  const error = useSelector(selectDocumentsError);
  const totalCount = useSelector(selectDocumentsTotalCount);

  // Local state for operation-specific loading and error states
  const [operationLoading, setOperationLoading] = useState<boolean>(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  /**
   * Fetches documents based on provided filters and pagination
   */
  const fetchDocumentList = useCallback(async () => {
    try {
      await dispatch(fetchDocumentsAsync({
        page: pagination?.page,
        limit: pagination?.limit,
        status: filters?.status ? [filters.status] : undefined,
        startDate: filters?.startDate?.toISOString(),
        endDate: filters?.endDate?.toISOString()
      })).unwrap();
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }, [dispatch, filters, pagination]);

  /**
   * Retrieves a specific document by ID
   */
  const getDocument = useCallback(async (documentId: string) => {
    setOperationLoading(true);
    setOperationError(null);
    try {
      const response = await getDocumentById(documentId);
      dispatch(setSelectedDocument(response.data));
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch document';
      setOperationError(errorMessage);
      throw error;
    } finally {
      setOperationLoading(false);
    }
  }, [dispatch]);

  /**
   * Validates a document's extracted data
   */
  const validateDocumentData = useCallback(async (documentId: string) => {
    setOperationLoading(true);
    setOperationError(null);
    try {
      const response = await validateDocument(documentId);
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to validate document';
      setOperationError(errorMessage);
      throw error;
    } finally {
      setOperationLoading(false);
    }
  }, []);

  /**
   * Triggers or retries document processing
   */
  const processDocumentData = useCallback(async (documentId: string) => {
    setOperationLoading(true);
    setOperationError(null);
    try {
      const response = await processDocument(documentId);
      // Refresh document list after processing
      await fetchDocumentList();
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process document';
      setOperationError(errorMessage);
      throw error;
    } finally {
      setOperationLoading(false);
    }
  }, [fetchDocumentList]);

  return {
    // Document state
    documents,
    loading: loading || operationLoading,
    error: error || operationError,
    totalCount,

    // Document operations
    fetchDocuments: fetchDocumentList,
    getDocument,
    validateDocument: validateDocumentData,
    processDocument: processDocumentData,
  };
};

export default useDocuments;