// React imports - v18.2.0
import React, { useState, useCallback, useEffect } from 'react';

// Internal component imports
import DocumentList from '../components/dashboard/DocumentList';
import DocumentPreview from '../components/dashboard/DocumentPreview';
import SearchBar from '../components/dashboard/SearchBar';
import StatusFilters from '../components/dashboard/StatusFilters';
import ActionButtons from '../components/dashboard/ActionButtons';
import Loader from '../components/common/Loader';

// Custom hooks
import useDocuments from '../hooks/useDocuments';

// Types
import { Document } from '../types/document';

/**
 * DocumentsPage component that implements the main document management interface
 * following the system's microservices architecture patterns.
 * 
 * Requirements implemented:
 * - Main Dashboard Components (system_design.user_interface_design.main_dashboard_components)
 * - Core System Components Integration (system_components_architecture.component_diagrams.core_system_components)
 */
const DocumentsPage: React.FC = () => {
  // Initialize document management hook
  const {
    documents,
    loading,
    error,
    totalCount,
    fetchDocuments
  } = useDocuments();

  // Local state management
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'split'>('list');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  /**
   * Handles document selection for preview
   */
  const handleDocumentSelect = useCallback((document: Document) => {
    setSelectedDocument(document);
    setViewMode('split');
  }, []);

  /**
   * Handles view mode toggle between list and split view
   */
  const handleViewModeToggle = useCallback(() => {
    setViewMode(prev => prev === 'list' ? 'split' : 'list');
    if (viewMode === 'split') {
      setSelectedDocument(null);
    }
  }, [viewMode]);

  /**
   * Handles search query updates
   */
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  /**
   * Handles status filter updates
   */
  const handleStatusFilter = useCallback((statuses: string[]) => {
    setSelectedStatuses(statuses);
  }, []);

  /**
   * Handles document updates and refreshes the list
   */
  const handleDocumentUpdate = useCallback((updatedDocument: Document) => {
    if (selectedDocument?.id === updatedDocument.id) {
      setSelectedDocument(updatedDocument);
    }
    fetchDocuments();
  }, [selectedDocument, fetchDocuments]);

  /**
   * Effect to refresh documents when filters change
   */
  useEffect(() => {
    fetchDocuments();
  }, [searchQuery, selectedStatuses, fetchDocuments]);

  /**
   * Renders the loading state
   */
  if (loading && !documents.length) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  /**
   * Renders the error state
   */
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg m-4">
        <h3 className="text-red-700 font-medium mb-2">Error Loading Documents</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleViewModeToggle}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md 
                       hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {viewMode === 'list' ? 'Split View' : 'List View'}
            </button>
          </div>
        </div>

        {/* Search and Filters Section */}
        <div className="mt-4 flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search documents..."
            />
          </div>
          <StatusFilters
            selectedStatuses={selectedStatuses}
            onChange={handleStatusFilter}
          />
        </div>
      </div>

      {/* Main Content Section */}
      <div className="flex-1 overflow-hidden">
        <div className={`h-full flex ${viewMode === 'split' ? 'space-x-4' : ''}`}>
          {/* Document List Section */}
          <div className={`
            ${viewMode === 'split' ? 'w-1/2' : 'w-full'}
            overflow-auto p-4
          `}>
            <DocumentList
              showFilters={viewMode === 'list'}
              onDocumentSelect={handleDocumentSelect}
              onRefresh={fetchDocuments}
            />
          </div>

          {/* Document Preview Section */}
          {viewMode === 'split' && selectedDocument && (
            <div className="w-1/2 overflow-auto border-l border-gray-200">
              <DocumentPreview
                document={selectedDocument}
                onDocumentUpdate={handleDocumentUpdate}
              />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <ActionButtons
          selectedDocumentIds={selectedDocument ? [selectedDocument.id] : []}
          onActionComplete={() => {
            fetchDocuments();
            setSelectedDocument(null);
          }}
        />
      </div>
    </div>
  );
};

export default DocumentsPage;