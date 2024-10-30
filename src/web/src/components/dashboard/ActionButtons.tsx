/**
 * ActionButtons Component
 * Provides interactive options for managing documents on the dashboard with proper
 * loading states and error handling.
 * 
 * Requirements implemented:
 * - Main Dashboard Components (system_design/user_interface_design/main_dashboard_components)
 * - Primary Data Flow (system_components_architecture/data_flow_diagrams/primary_data_flow)
 */

// React imports - v18.2.0
import { useState, useEffect, useCallback } from 'react';

// Internal imports
import { useDocuments } from '../../hooks/useDocuments';
import { 
  getDocumentDownloadUrl,
  validateDocument,
  processDocument
} from '../../services/document';
import { makeApiRequest } from '../../utils/api';

/**
 * Props interface for ActionButtons component
 */
interface ActionButtonsProps {
  selectedDocumentIds: string[];
  onActionComplete?: () => void;
}

/**
 * ActionButtons component that provides document management actions
 */
const ActionButtons: React.FC<ActionButtonsProps> = ({
  selectedDocumentIds,
  onActionComplete
}) => {
  // Local state for loading and error states
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get document operations from useDocuments hook
  const { 
    fetchDocuments,
    loading: documentsLoading,
    error: documentsError
  } = useDocuments();

  /**
   * Handles document download for single or multiple documents
   */
  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    setError(null);

    try {
      // Process each selected document
      for (const documentId of selectedDocumentIds) {
        const response = await getDocumentDownloadUrl(documentId);
        
        if (response.success && response.data.downloadUrl) {
          // Create temporary anchor element for download
          const link = document.createElement('a');
          link.href = response.data.downloadUrl;
          link.setAttribute('download', `document-${documentId}`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          throw new Error(`Failed to get download URL for document ${documentId}`);
        }
      }

      onActionComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download documents');
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  }, [selectedDocumentIds, onActionComplete]);

  /**
   * Handles document review/validation for selected documents
   */
  const handleReview = useCallback(async () => {
    setIsReviewing(true);
    setError(null);

    try {
      // Process each selected document
      const validationResults = await Promise.all(
        selectedDocumentIds.map(async (documentId) => {
          const response = await validateDocument(documentId);
          return {
            documentId,
            errors: response.data.validationErrors
          };
        })
      );

      // Check for validation errors
      const documentsWithErrors = validationResults.filter(
        result => result.errors && result.errors.length > 0
      );

      if (documentsWithErrors.length > 0) {
        throw new Error(
          `Validation failed for ${documentsWithErrors.length} document(s)`
        );
      }

      await fetchDocuments();
      onActionComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to review documents');
      console.error('Review error:', err);
    } finally {
      setIsReviewing(false);
    }
  }, [selectedDocumentIds, fetchDocuments, onActionComplete]);

  /**
   * Handles document export/processing for selected documents
   */
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setError(null);

    try {
      // Process each selected document
      await Promise.all(
        selectedDocumentIds.map(async (documentId) => {
          const response = await processDocument(documentId);
          if (!response.success) {
            throw new Error(`Failed to process document ${documentId}`);
          }
          return response;
        })
      );

      await fetchDocuments();
      onActionComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export documents');
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  }, [selectedDocumentIds, fetchDocuments, onActionComplete]);

  // Clear error when selection changes
  useEffect(() => {
    setError(null);
  }, [selectedDocumentIds]);

  // Determine if actions should be disabled
  const isActionsDisabled = documentsLoading || 
    selectedDocumentIds.length === 0 ||
    isDownloading ||
    isReviewing ||
    isExporting;

  return (
    <div className="flex flex-row gap-4 items-center">
      {/* Download button */}
      <button
        className={`px-4 py-2 rounded-md text-sm font-medium ${
          isActionsDisabled
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        onClick={handleDownload}
        disabled={isActionsDisabled}
      >
        {isDownloading ? 'Downloading...' : 'Download'}
      </button>

      {/* Review button */}
      <button
        className={`px-4 py-2 rounded-md text-sm font-medium ${
          isActionsDisabled
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
        onClick={handleReview}
        disabled={isActionsDisabled}
      >
        {isReviewing ? 'Reviewing...' : 'Review'}
      </button>

      {/* Export button */}
      <button
        className={`px-4 py-2 rounded-md text-sm font-medium ${
          isActionsDisabled
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700 text-white'
        }`}
        onClick={handleExport}
        disabled={isActionsDisabled}
      >
        {isExporting ? 'Exporting...' : 'Export'}
      </button>

      {/* Error display */}
      {(error || documentsError) && (
        <span className="text-sm text-red-600">
          {error || documentsError}
        </span>
      )}

      {/* Selection count */}
      <span className="text-sm text-gray-600">
        {selectedDocumentIds.length} document(s) selected
      </span>
    </div>
  );
};

export default ActionButtons;