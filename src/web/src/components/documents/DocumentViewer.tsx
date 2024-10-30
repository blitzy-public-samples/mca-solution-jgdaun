// React 18.2.0
import React, { useState, useCallback, useEffect } from 'react';
// classnames 2.3.2
import classNames from 'classnames';

// Internal dependencies
import { Document, DocumentStatus, DocumentMetadata } from '../types/document';
import { generatePdf } from '../../utils/pdf';
import Loader from '../common/Loader';
import ErrorBoundary from '../common/ErrorBoundary';
import useDocuments from '../../hooks/useDocuments';

// Import subcomponents for document details
import MerchantDetails from './MerchantDetails';
import FundingDetails from './FundingDetails';
import OwnerInformation from './OwnerInformation';
import ProcessingStatus from './ProcessingStatus';

interface DocumentViewerProps {
  /** The document ID to be displayed */
  documentId: string;
  /** Optional class name for styling */
  className?: string;
}

/**
 * DocumentViewer Component
 * Implements the application details view requirements with a split-panel layout
 * for document preview and detailed information display.
 */
const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentId,
  className
}) => {
  // Document state management using custom hook
  const {
    loading,
    error,
    getDocument,
    processDocument
  } = useDocuments();

  // Local state
  const [document, setDocument] = useState<Document | null>(null);
  const [previewScale, setPreviewScale] = useState<number>(1);
  const [activePanel, setActivePanel] = useState<'preview' | 'details'>('preview');
  const [pdfGenerating, setPdfGenerating] = useState<boolean>(false);

  /**
   * Fetch document data on component mount or documentId change
   */
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const documentData = await getDocument(documentId);
        setDocument(documentData);
      } catch (error) {
        console.error('Error fetching document:', error);
      }
    };

    fetchDocument();
  }, [documentId, getDocument]);

  /**
   * Handle PDF generation
   * Implements document export functionality from the technical specification
   */
  const handleGeneratePdf = useCallback(async () => {
    if (!document) return;

    setPdfGenerating(true);
    try {
      const pdfBytes = await generatePdf(document);
      
      // Create blob and download link
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${document.fileName.replace(/\.[^/.]+$/, '')}_export.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setPdfGenerating(false);
    }
  }, [document]);

  /**
   * Handle document reprocessing
   * Implements document processing flow requirements
   */
  const handleReprocess = useCallback(async () => {
    if (!document) return;
    
    try {
      await processDocument(document.id);
      // Refresh document data after reprocessing
      const updatedDocument = await getDocument(document.id);
      setDocument(updatedDocument);
    } catch (error) {
      console.error('Error reprocessing document:', error);
    }
  }, [document, processDocument, getDocument]);

  /**
   * Handle zoom controls
   */
  const handleZoom = useCallback((direction: 'in' | 'out') => {
    setPreviewScale(prevScale => {
      const newScale = direction === 'in' ? prevScale + 0.25 : prevScale - 0.25;
      return Math.max(0.25, Math.min(3, newScale));
    });
  }, []);

  // Loading state
  if (loading) {
    return <Loader overlay size="large" />;
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <h3 className="font-bold">Error Loading Document</h3>
        <p>{error}</p>
      </div>
    );
  }

  // No document state
  if (!document) {
    return (
      <div className="p-4 bg-gray-50 text-gray-700 rounded-md">
        <p>No document found</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={classNames('flex h-full', className)}>
        {/* Left Panel - Document Preview */}
        <div className="w-1/2 border-r border-gray-200 p-4 bg-gray-50">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Document Preview</h2>
            <div className="flex gap-2">
              <button
                onClick={() => handleZoom('out')}
                className="p-2 rounded hover:bg-gray-200"
                disabled={previewScale <= 0.25}
              >
                <span className="sr-only">Zoom Out</span>
                <i className="fas fa-search-minus" />
              </button>
              <button
                onClick={() => handleZoom('in')}
                className="p-2 rounded hover:bg-gray-200"
                disabled={previewScale >= 3}
              >
                <span className="sr-only">Zoom In</span>
                <i className="fas fa-search-plus" />
              </button>
            </div>
          </div>

          <div 
            className="overflow-auto h-[calc(100vh-200px)]"
            style={{ transform: `scale(${previewScale})` }}
          >
            {document.storagePath && (
              <img
                src={document.storagePath}
                alt="Document Preview"
                className="max-w-full h-auto"
              />
            )}
          </div>
        </div>

        {/* Right Panel - Document Details */}
        <div className="w-1/2 p-4 overflow-auto">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Document Details</h2>
            <div className="flex gap-2">
              <button
                onClick={handleGeneratePdf}
                disabled={pdfGenerating}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {pdfGenerating ? 'Generating PDF...' : 'Generate PDF'}
              </button>
              {document.status === DocumentStatus.FAILED && (
                <button
                  onClick={handleReprocess}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Reprocess Document
                </button>
              )}
            </div>
          </div>

          {/* Document Information Sections */}
          <div className="space-y-6">
            {/* Processing Status Section */}
            <ProcessingStatus
              status={document.status}
              metadata={document.metadata}
            />

            {/* Merchant Details Section */}
            <MerchantDetails
              merchantData={document.metadata.extractedData.merchant}
            />

            {/* Funding Details Section */}
            <FundingDetails
              fundingData={document.metadata.extractedData.funding}
            />

            {/* Owner Information Section */}
            <OwnerInformation
              ownerData={document.metadata.extractedData.owner}
            />

            {/* Document Metadata */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-3">Document Metadata</h3>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-600">File Name</dt>
                  <dd className="text-sm font-medium">{document.fileName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Upload Date</dt>
                  <dd className="text-sm font-medium">
                    {new Date(document.uploadedAt).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">File Size</dt>
                  <dd className="text-sm font-medium">
                    {Math.round(document.fileSize / 1024)} KB
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Document Type</dt>
                  <dd className="text-sm font-medium">{document.type}</dd>
                </div>
                {document.processedAt && (
                  <div>
                    <dt className="text-sm text-gray-600">Processing Date</dt>
                    <dd className="text-sm font-medium">
                      {new Date(document.processedAt).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-gray-600">OCR Confidence</dt>
                  <dd className="text-sm font-medium">
                    {document.metadata.ocrConfidence}%
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DocumentViewer;