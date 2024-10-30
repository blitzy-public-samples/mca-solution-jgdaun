// React 18.2.0
import React, { useEffect, useState } from 'react';
// React Router DOM 6.4.0
import { useParams } from 'react-router-dom';

// Internal component imports
import DocumentViewer from '../components/documents/DocumentViewer';
import ExtractedData from '../components/documents/ExtractedData';
import FundingDetails from '../components/documents/FundingDetails';
import MerchantDetails from '../components/documents/MerchantDetails';
import OwnerInformation from '../components/documents/OwnerInformation';
import ProcessingStatus from '../components/documents/ProcessingStatus';
import Loader from '../components/common/Loader';

// Hook imports
import useDocuments from '../hooks/useDocuments';
import useFilters from '../hooks/useFilters';
import usePagination from '../hooks/usePagination';
import useSearch from '../hooks/useSearch';

/**
 * DocumentDetails Component
 * Implements the application details view requirements with a split-panel layout
 * for document preview and detailed information display.
 */
const DocumentDetails: React.FC = () => {
  // Get document ID from URL parameters
  const { id } = useParams<{ id: string }>();

  // Initialize hooks
  const {
    loading,
    error,
    getDocument,
    processDocument,
  } = useDocuments();

  // Document state
  const [document, setDocument] = useState<any>(null);

  // Initialize utility hooks for potential navigation
  const { filters } = useFilters();
  const { pagination } = usePagination();
  const { searchTerm } = useSearch();

  /**
   * Fetch document data on component mount or when ID changes
   */
  useEffect(() => {
    const fetchDocumentDetails = async () => {
      if (!id) return;
      
      try {
        const documentData = await getDocument(id);
        setDocument(documentData);
      } catch (error) {
        console.error('Error fetching document details:', error);
      }
    };

    fetchDocumentDetails();
  }, [id, getDocument]);

  /**
   * Handle document reprocessing
   */
  const handleReprocess = async () => {
    if (!id) return;
    
    try {
      await processDocument(id);
      // Refresh document data after reprocessing
      const updatedDocument = await getDocument(id);
      setDocument(updatedDocument);
    } catch (error) {
      console.error('Error reprocessing document:', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader size="large" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Error Loading Document</h3>
        <p>{error}</p>
      </div>
    );
  }

  // No document state
  if (!document) {
    return (
      <div className="p-6 bg-gray-50 text-gray-700 rounded-lg">
        <p>Document not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header Section */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Document Details
          </h1>
          <div className="flex gap-3">
            {document.status === 'FAILED' && (
              <button
                onClick={handleReprocess}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                Reprocess Document
              </button>
            )}
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Split Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Document Preview */}
        <div className="w-1/2 border-r border-gray-200">
          <DocumentViewer
            documentId={id!}
            className="h-full"
          />
        </div>

        {/* Right Panel - Document Information */}
        <div className="w-1/2 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Processing Status Section */}
            <section className="bg-white rounded-lg shadow">
              <ProcessingStatus
                status={document.status}
                metadata={document.metadata}
              />
            </section>

            {/* Extracted Data Section */}
            <section className="bg-white rounded-lg shadow">
              <ExtractedData
                extractedData={document.extractedData}
                confidence={document.metadata.confidence}
              />
            </section>

            {/* Merchant Details Section */}
            <section className="bg-white rounded-lg shadow">
              <MerchantDetails
                merchantData={document.merchantDetails}
              />
            </section>

            {/* Funding Details Section */}
            <section className="bg-white rounded-lg shadow">
              <FundingDetails
                fundingData={document.fundingDetails}
              />
            </section>

            {/* Owner Information Section */}
            <section className="bg-white rounded-lg shadow">
              <OwnerInformation
                ownerData={document.ownerInformation}
              />
            </section>

            {/* Document Metadata Section */}
            <section className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4">Document Metadata</h3>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-600">Upload Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(document.uploadedAt).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Last Modified</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(document.updatedAt).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Document Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {document.type}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">File Size</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {Math.round(document.size / 1024)} KB
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetails;