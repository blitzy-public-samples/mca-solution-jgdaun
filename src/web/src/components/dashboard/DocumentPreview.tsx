// React 18.2.0
import React, { useCallback, useEffect, useState } from 'react';
// classnames 2.3.2
import classNames from 'classnames';

// Internal dependencies
import DocumentViewer from '../documents/DocumentViewer';
import ExtractedData from '../documents/ExtractedData';
import ProcessingStatus from '../documents/ProcessingStatus';
import useDocuments from '../../hooks/useDocuments';
import useFilters from '../../hooks/useFilters';
import { Document } from '../../types/document';

/**
 * Interface defining the props for the DocumentPreview component
 */
interface DocumentPreviewProps {
  document: Document;
  isLoading?: boolean;
  onDocumentUpdate?: (document: Document) => void;
}

/**
 * DocumentPreview component that provides a detailed preview of a selected document
 * within the dashboard, implementing split-panel layout with document preview and details.
 * 
 * Requirements implemented:
 * - Application Details View: Split-panel layout with document preview and details
 * - Document Processing Flow: Real-time document status and processing results
 */
const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  isLoading = false,
  onDocumentUpdate
}) => {
  // Initialize document management hooks
  const {
    loading: documentLoading,
    error: documentError,
    getDocument,
    processDocument
  } = useDocuments();

  // Initialize filter management for document filtering
  const {
    filters,
    updateFilters,
    isLoading: filterLoading
  } = useFilters({
    status: [],
    startDate: null,
    endDate: null,
    searchQuery: ''
  }, 10);

  // Local state for panel management
  const [activePanel, setActivePanel] = useState<'preview' | 'details'>('preview');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  /**
   * Handles document processing status updates
   */
  const handleStatusUpdate = useCallback(async () => {
    try {
      const updatedDocument = await getDocument(document.id);
      onDocumentUpdate?.(updatedDocument);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error updating document status:', error);
    }
  }, [document.id, getDocument, onDocumentUpdate]);

  /**
   * Handles document reprocessing requests
   */
  const handleReprocess = useCallback(async () => {
    try {
      await processDocument(document.id);
      handleStatusUpdate();
    } catch (error) {
      console.error('Error reprocessing document:', error);
    }
  }, [document.id, processDocument, handleStatusUpdate]);

  /**
   * Effect to refresh document data periodically when processing
   */
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (document.status === 'PROCESSING') {
      intervalId = setInterval(handleStatusUpdate, 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [document.status, handleStatusUpdate]);

  /**
   * Renders the loading state
   */
  if (isLoading || documentLoading || filterLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-500">Loading document preview...</div>
      </div>
    );
  }

  /**
   * Renders the error state
   */
  if (documentError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-700 font-medium mb-2">Error Loading Document</h3>
        <p className="text-red-600">{documentError}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Panel - Document Preview */}
      <div className={classNames(
        'transition-all duration-300 ease-in-out',
        activePanel === 'preview' ? 'w-3/5' : 'w-1/2',
        'border-r border-gray-200'
      )}>
        <div className="h-full flex flex-col">
          {/* Panel Header */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Document Preview
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActivePanel('preview')}
                  className={classNames(
                    'px-3 py-1 rounded-md text-sm font-medium',
                    activePanel === 'preview'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  Preview
                </button>
                <button
                  onClick={() => setActivePanel('details')}
                  className={classNames(
                    'px-3 py-1 rounded-md text-sm font-medium',
                    activePanel === 'details'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  Details
                </button>
              </div>
            </div>
          </div>

          {/* Document Viewer */}
          <div className="flex-1 overflow-auto">
            <DocumentViewer
              documentId={document.id}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Document Details */}
      <div className={classNames(
        'transition-all duration-300 ease-in-out',
        activePanel === 'details' ? 'w-3/5' : 'w-1/2'
      )}>
        <div className="h-full flex flex-col overflow-auto">
          {/* Processing Status */}
          <div className="p-4 bg-white border-b border-gray-200">
            <ProcessingStatus
              document={document}
              onStatusChange={handleStatusUpdate}
            />
          </div>

          {/* Extracted Data */}
          <div className="flex-1 p-4 overflow-auto">
            <ExtractedData
              key={refreshKey}
              document={document}
              isLoading={isLoading}
            />
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              {document.status === 'FAILED' && (
                <button
                  onClick={handleReprocess}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 
                           focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                >
                  Retry Processing
                </button>
              )}
              <button
                onClick={handleStatusUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;