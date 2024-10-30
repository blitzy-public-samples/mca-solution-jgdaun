/**
 * Reports Page Component
 * Implements comprehensive document-related statistics, insights, and analytics dashboard
 * Requirements implemented from system_design.user_interface_design.main_dashboard_components
 */

// React imports - v18.2.0
import React, { useState, useEffect, useMemo } from 'react';

// Internal component imports
import Statistics from '../components/dashboard/Statistics';
import DocumentList from '../components/dashboard/DocumentList';
import SearchBar from '../components/dashboard/SearchBar';
import ActionButtons from '../components/dashboard/ActionButtons';

// Custom hooks
import useDocuments from '../hooks/useDocuments';
import useFilters from '../hooks/useFilters';
import usePagination from '../hooks/usePagination';
import useSearch from '../hooks/useSearch';

// Interface definitions
interface ReportsProps {
  className?: string;
}

/**
 * Reports component that provides comprehensive document analytics and reporting interface
 */
const Reports: React.FC<ReportsProps> = ({ className = '' }) => {
  // Initialize hooks for data management
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
    dateRange,
    setDateRange
  } = useFilters({
    status: [],
    startDate: null,
    endDate: null
  });

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    performSearch
  } = useSearch();

  const {
    currentPage,
    pageSize,
    totalPages,
    setPage,
    setPageSize
  } = usePagination(20, totalCount);

  // Local state for time range selection
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('7d');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  /**
   * Time range options for statistics filtering
   */
  const timeRangeOptions = useMemo(() => [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: 'all', label: 'All Time' }
  ], []);

  /**
   * Handle time range change and update filters
   */
  const handleTimeRangeChange = (range: string) => {
    setSelectedTimeRange(range);
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
    }

    setDateRange({
      startDate,
      endDate: now
    });
  };

  /**
   * Handle search query changes
   */
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page on new search
    performSearch(query);
  };

  /**
   * Refresh data periodically and on filter changes
   */
  useEffect(() => {
    const fetchData = async () => {
      await fetchDocuments();
    };

    fetchData();

    // Set up periodic refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [fetchDocuments, filters, currentPage, pageSize, refreshTrigger]);

  return (
    <div className={`flex flex-col space-y-6 p-6 ${className}`}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          Document Analytics & Reports
        </h1>
        
        {/* Time Range Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Time Range:</span>
          <select
            value={selectedTimeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="form-select rounded-md border-gray-300 text-sm"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-96">
          <SearchBar
            placeholder="Search documents..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <ActionButtons
          onRefresh={() => setRefreshTrigger(prev => prev + 1)}
          className="flex-shrink-0"
        />
      </div>

      {/* Error Message */}
      {documentsError && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          {documentsError}
        </div>
      )}

      {/* Statistics Dashboard */}
      <Statistics
        className="w-full"
        timeRange={selectedTimeRange}
      />

      {/* Document List with Filters */}
      <div className="bg-white rounded-lg shadow-sm">
        <DocumentList
          showFilters={true}
          onRefresh={() => setRefreshTrigger(prev => prev + 1)}
        />
      </div>

      {/* Loading Overlay */}
      {documentsLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
        </div>
      )}
    </div>
  );
};

export default Reports;