/**
 * DocumentList Component
 * Implements a comprehensive document management interface with real-time search,
 * status filtering, batch operations, and responsive table display.
 * 
 * Requirements implemented:
 * - Main Dashboard Components (system_design/user_interface_design/main_dashboard_components)
 * - Primary Data Flow (system_components_architecture/data_flow_diagrams/primary_data_flow)
 */

// React imports - v18.2.0
import { useState, useEffect, useMemo } from 'react';

// Internal component imports
import ActionButtons from './ActionButtons';
import SearchBar from './SearchBar';
import Table from '../common/Table';
import Button from '../common/Button';

// Custom hooks
import useDocuments from '../../hooks/useDocuments';
import useFilters from '../../hooks/useFilters';
import usePagination from '../../hooks/usePagination';

// Types
interface DocumentListProps {
  showFilters: boolean;
  onRefresh?: () => void;
}

// Document status types
const DOCUMENT_STATUSES = ['New', 'Processing', 'Complete', 'Failed'] as const;
type DocumentStatus = typeof DOCUMENT_STATUSES[number];

/**
 * DocumentList component that displays a paginated, filterable list of documents
 */
const DocumentList: React.FC<DocumentListProps> = ({
  showFilters,
  onRefresh
}) => {
  // Initialize hooks
  const {
    documents,
    loading: documentsLoading,
    error: documentsError,
    totalCount,
    fetchDocuments
  } = useDocuments();

  const {
    filters,
    updateFilters,
    resetFilters,
    handleSearch,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    isLoading: filtersLoading
  } = useFilters(
    {
      status: [],
      startDate: null,
      endDate: null,
      searchQuery: ''
    },
    10
  );

  const {
    pageSize,
    setPageSize,
    setPage
  } = usePagination(10, '/api/documents');

  // Local state
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<DocumentStatus[]>([]);

  /**
   * Memoized table columns configuration
   */
  const tableColumns = useMemo(() => [
    {
      key: 'select',
      header: '',
      width: '40px',
      formatter: (_, { id }: { id: string }) => (
        <input
          type="checkbox"
          checked={selectedDocuments.includes(id)}
          onChange={(e) => handleDocumentSelection(id, e.target.checked)}
          className="w-4 h-4 rounded border-gray-300"
        />
      )
    },
    {
      key: 'id',
      header: 'Document ID',
      sortable: true,
      width: '120px'
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      formatter: (status: DocumentStatus) => (
        <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(status)}`}>
          {status}
        </span>
      )
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      width: '160px',
      formatter: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      key: 'updatedAt',
      header: 'Last Updated',
      sortable: true,
      width: '160px',
      formatter: (date: string) => new Date(date).toLocaleDateString()
    }
  ], [selectedDocuments]);

  /**
   * Handle document selection for batch operations
   */
  const handleDocumentSelection = (documentId: string, selected: boolean) => {
    setSelectedDocuments(prev =>
      selected
        ? [...prev, documentId]
        : prev.filter(id => id !== documentId)
    );
  };

  /**
   * Handle status filter toggle
   */
  const handleStatusToggle = (status: DocumentStatus) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );

    updateFilters({
      status: selectedStatuses.includes(status)
        ? selectedStatuses.filter(s => s !== status)
        : [...selectedStatuses, status]
    });
  };

  /**
   * Get status-specific styling
   */
  const getStatusColor = (status: DocumentStatus): string => {
    const colors = {
      New: 'bg-blue-100 text-blue-800',
      Processing: 'bg-yellow-100 text-yellow-800',
      Complete: 'bg-green-100 text-green-800',
      Failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || '';
  };

  /**
   * Render status filter buttons
   */
  const StatusFilterButtons = useMemo(() => (
    <div className="flex flex-wrap gap-2 mb-4">
      {DOCUMENT_STATUSES.map(status => (
        <Button
          key={status}
          label={status}
          variant={selectedStatuses.includes(status) ? 'primary' : 'outline'}
          size="small"
          onClick={() => handleStatusToggle(status)}
          className="min-w-[100px]"
        />
      ))}
    </div>
  ), [selectedStatuses]);

  /**
   * Handle refresh when documents are updated
   */
  useEffect(() => {
    if (onRefresh) {
      fetchDocuments();
    }
  }, [onRefresh, fetchDocuments]);

  /**
   * Update documents when filters or pagination changes
   */
  useEffect(() => {
    fetchDocuments();
  }, [filters, currentPage, pageSize, fetchDocuments]);

  return (
    <div className="space-y-4">
      {/* Search and Filters Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:w-96">
          <SearchBar
            placeholder="Search documents..."
            debounceMs={300}
            onSearch={handleSearch}
          />
        </div>

        {showFilters && (
          <div className="flex items-center gap-2">
            <Button
              label="Reset Filters"
              variant="outline"
              size="small"
              onClick={resetFilters}
            />
          </div>
        )}
      </div>

      {/* Status Filters */}
      {showFilters && StatusFilterButtons}

      {/* Error Message */}
      {documentsError && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          {documentsError}
        </div>
      )}

      {/* Document Table */}
      <Table
        columns={tableColumns}
        data={documents}
        loading={documentsLoading || filtersLoading}
        pageSize={pageSize}
        className="w-full"
      />

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2 py-1 border rounded-md"
          >
            {[10, 25, 50, 100].map(size => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} documents
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            label="Previous"
            variant="outline"
            size="small"
            onClick={prevPage}
            disabled={currentPage === 1}
          />
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            label="Next"
            variant="outline"
            size="small"
            onClick={nextPage}
            disabled={currentPage === totalPages}
          />
        </div>
      </div>

      {/* Batch Actions */}
      {selectedDocuments.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="container mx-auto">
            <ActionButtons
              selectedDocumentIds={selectedDocuments}
              onActionComplete={() => {
                setSelectedDocuments([]);
                fetchDocuments();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentList;