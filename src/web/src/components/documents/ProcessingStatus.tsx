/**
 * ProcessingStatus Component
 * 
 * Implements real-time document processing status display with visual feedback
 * and status management capabilities.
 * 
 * Requirements implemented:
 * - Application Details View (system_design.user_interface_design.application_details_view)
 * - Document Processing Flow (system_components_architecture.data_flow_diagrams.document_processing_flow)
 */

// React v18.2.0
import React, { useCallback, useEffect, useMemo } from 'react';
// classnames v2.3.1
import classNames from 'classnames';

// Internal dependencies
import { Document, DocumentStatus } from '../../types/document';
import useDocuments from '../../hooks/useDocuments';
import StatusFilters from '../dashboard/StatusFilters';

/**
 * Interface defining the props for the ProcessingStatus component
 */
interface ProcessingStatusProps {
  document: Document;
  onStatusChange?: (status: DocumentStatus) => void;
}

/**
 * ProcessingStatus component that displays and manages document processing status
 */
const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  document,
  onStatusChange
}) => {
  // Initialize document management hook
  const { processDocument, loading, error } = useDocuments();

  /**
   * Status-specific styling configurations
   */
  const statusConfig = useMemo(() => ({
    [DocumentStatus.UPLOADED]: {
      containerClass: 'bg-blue-50 border-blue-200',
      textClass: 'text-blue-700',
      icon: '📤',
      label: 'Uploaded'
    },
    [DocumentStatus.PROCESSING]: {
      containerClass: 'bg-yellow-50 border-yellow-200',
      textClass: 'text-yellow-700',
      icon: '⚙️',
      label: 'Processing'
    },
    [DocumentStatus.PROCESSED]: {
      containerClass: 'bg-green-50 border-green-200',
      textClass: 'text-green-700',
      icon: '✅',
      label: 'Processed'
    },
    [DocumentStatus.FAILED]: {
      containerClass: 'bg-red-50 border-red-200',
      textClass: 'text-red-700',
      icon: '❌',
      label: 'Failed'
    },
    [DocumentStatus.ARCHIVED]: {
      containerClass: 'bg-gray-50 border-gray-200',
      textClass: 'text-gray-700',
      icon: '📁',
      label: 'Archived'
    }
  }), []);

  /**
   * Handles document reprocessing attempts
   */
  const handleReprocess = useCallback(async () => {
    try {
      await processDocument(document.id);
      onStatusChange?.(DocumentStatus.PROCESSING);
    } catch (err) {
      console.error('Failed to reprocess document:', err);
    }
  }, [document.id, processDocument, onStatusChange]);

  /**
   * Effect to notify status changes
   */
  useEffect(() => {
    if (document.status !== DocumentStatus.PROCESSING) {
      onStatusChange?.(document.status);
    }
  }, [document.status, onStatusChange]);

  const currentConfig = statusConfig[document.status];

  return (
    <div className="space-y-4">
      {/* Status Display */}
      <div
        className={classNames(
          'p-4 rounded-lg border',
          currentConfig.containerClass
        )}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl" aria-hidden="true">
              {currentConfig.icon}
            </span>
            <div>
              <h4 className={classNames('font-semibold', currentConfig.textClass)}>
                {currentConfig.label}
              </h4>
              <p className="text-sm text-gray-600">
                Last updated: {new Date(document.processedAt || document.uploadedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Reprocess Action */}
          {document.status === DocumentStatus.FAILED && (
            <button
              onClick={handleReprocess}
              disabled={loading}
              className={classNames(
                'px-4 py-2 rounded-md text-sm font-medium',
                'bg-red-600 text-white hover:bg-red-700',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {loading ? 'Retrying...' : 'Retry Processing'}
            </button>
          )}
        </div>

        {/* OCR Confidence Display */}
        {document.status === DocumentStatus.PROCESSED && document.metadata.ocrConfidence && (
          <div className="mt-3 pt-3 border-t border-green-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                OCR Confidence:
              </span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full">
                <div
                  className={classNames(
                    'h-full rounded-full',
                    document.metadata.ocrConfidence >= 90 ? 'bg-green-500' :
                    document.metadata.ocrConfidence >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{ width: `${document.metadata.ocrConfidence}%` }}
                  role="progressbar"
                  aria-valuenow={document.metadata.ocrConfidence}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {document.metadata.ocrConfidence}%
              </span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Validation Errors Display */}
        {document.metadata.validationErrors?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-red-200">
            <h5 className="text-sm font-medium text-red-700 mb-2">
              Validation Errors:
            </h5>
            <ul className="list-disc list-inside text-sm text-red-600">
              {document.metadata.validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Status Filters */}
      <StatusFilters
        initialStatuses={[document.status]}
        onStatusChange={(statuses) => {
          if (statuses.length === 1) {
            onStatusChange?.(statuses[0]);
          }
        }}
      />
    </div>
  );
};

export default ProcessingStatus;