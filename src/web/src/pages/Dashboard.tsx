/**
 * Dashboard Component
 * Implements the main interface for document management and user interaction.
 * 
 * Requirements implemented:
 * - Dashboard Layout (system_design/user_interface_design/dashboard_layout)
 * - Main Dashboard Components (system_design/user_interface_design/main_dashboard_components)
 * - Primary Data Flow (system_components_architecture/data_flow_diagrams/primary_data_flow)
 */

// React imports - v18.2.0
import React, { useState, useEffect, useCallback } from 'react';

// Component imports
import DocumentList from '../components/dashboard/DocumentList';
import SearchBar from '../components/dashboard/SearchBar';
import Statistics from '../components/dashboard/Statistics';
import StatusFilters from '../components/dashboard/StatusFilters';
import ActionButtons from '../components/dashboard/ActionButtons';

// Custom hooks
import useDocuments from '../hooks/useDocuments';
import useFilters from '../hooks/useFilters';
import usePagination from '../hooks/usePagination';
import useSearch from '../hooks/useSearch';
import useAuth from '../hooks/useAuth';

// Interface for Dashboard state
interface DashboardState {
  selectedDocumentIds: string[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Dashboard component serving as the main interface for document management
 */
const Dashboard: React.FC = () => {
  // Initialize authentication
  const { user, isAuthenticated } = useAuth();

  // Initialize document management hooks
  const {
    documents,
    loading: documentsLoading,
    error: documentsError,
    totalCount,
    fetchDocuments,
    processDocument
  } = useDocuments();

  // Initialize filter management
  const {
    filters,
    updateFilters,
    resetFilters,
    isLoading: filtersLoading,
    error: filtersError
  } = useFilters({
    status: [],
    startDate: null,
    endDate: null,
    searchQuery: ''
  }, 10);

  // Initialize search functionality
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching
  } = useSearch();

  // Initialize pagination
  const {
    currentPage,
    pageSize,
    setPage,
    setPageSize
  } = usePagination(10, '/api/documents');

  // Local state management
  const [state, setState] = useState<DashboardState>({
    selectedDocumentIds: [],
    isLoading: false,
    error: null
  });

  /**
   * Handle document selection for batch operations
   */
  const handleDocumentSelection = useCallback((documentId: string, selected: boolean) => {
    setState(prev => ({
      ...prev,
      selectedDocumentIds: selected
        ? [...prev.selectedDocumentIds, documentId]
        : prev.selectedDocumentIds.filter(id => id !== documentId)
    }));
  }, []);

  /**
   * Handle search query changes
   */
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    updateFilters({ searchQuery: query });
  }, [setSearchQuery, updateFilters]);

  /**
   * Handle status filter changes
   */
  const handleStatusFilter = useCallback((statuses: string[]) => {
    updateFilters({ status: statuses });
  }, [updateFilters]);

  /**
   * Handle batch document processing
   */
  const handleBatchProcess = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await Promise.all(
        state.selectedDocumentIds.map(id => processDocument(id))
      );
      setState(prev => ({
        ...prev,
        selectedDocumentIds: [],
        isLoading: false
      }));
      fetchDocuments(); // Refresh document list
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to process documents'
      }));
    }
  }, [state.selectedDocumentIds, processDocument, fetchDocuments]);

  /**
   * Effect to fetch initial documents and setup real-time updates
   */
  useEffect(() => {
    if (isAuthenticated) {
      fetchDocuments();
    }
  }, [isAuthenticated, fetchDocuments]);

  /**
   * Effect to handle filter changes
   */
  useEffect(() => {
    if (filters.status.length > 0 || filters.searchQuery) {
      fetchDocuments();
    }
  }, [filters, fetchDocuments]);

  /**
   * Render error message if any
   */
  const renderError = () => {
    const error = state.error || documentsError || filtersError;
    if (!error) return null;

    return (
      <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-700">{error}</p>
      </div>
    );
  };

  /**
   * Render loading state
   */
  const renderLoading = () => {
    if (!state.isLoading && !documentsLoading && !filtersLoading) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded-md shadow-lg">
          <p className="text-gray-700">Processing...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Document Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back, {user?.name}
        </p>
      </div>

      {/* Statistics Section */}
      <div className="mb-8">
        <Statistics />
      </div>

      {/* Search and Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="col-span-1 md:col-span-2">
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search documents..."
            isLoading={isSearching}
          />
        </div>
        <div className="col-span-1">
          <StatusFilters
            selectedStatuses={filters.status}
            onChange={handleStatusFilter}
          />
        </div>
      </div>

      {/* Error Messages */}
      {renderError()}

      {/* Action Buttons */}
      {state.selectedDocumentIds.length > 0 && (
        <div className="mb-4">
          <ActionButtons
            selectedDocumentIds={state.selectedDocumentIds}
            onActionComplete={() => {
              setState(prev => ({ ...prev, selectedDocumentIds: [] }));
              fetchDocuments();
            }}
          />
        </div>
      )}

      {/* Document List */}
      <DocumentList
        showFilters={true}
        onRefresh={fetchDocuments}
      />

      {/* Loading Overlay */}
      {renderLoading()}
    </div>
  );
};

export default Dashboard;