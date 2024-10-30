/**
 * SearchBar Component
 * A React component that implements an advanced search bar for the dashboard with
 * real-time search functionality, debounced input handling, and advanced filtering options.
 * 
 * Requirements implemented:
 * - Main Dashboard Components (system_design/user_interface_design/main_dashboard_components)
 * - Dashboard Layout (system_design/user_interface_design/dashboard_layout)
 */

// React v18.0.0
import React, { useState, useCallback, useRef } from 'react';
// lodash v4.17.21
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';

// Internal imports
import useSearch from '../../hooks/useSearch';
import { makeApiRequest } from '../../utils/api';
import { DASHBOARD_ROUTE } from '../../constants/routes';
import '../../styles/index.css';

// Interface for component props
interface SearchBarProps {
  placeholder: string;
  debounceMs: number;
  onSearch: (query: string) => void;
}

// Interface for date range filter
interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

/**
 * SearchBar component that provides real-time search functionality with advanced filtering
 */
const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search documents...',
  debounceMs = 300,
  onSearch
}) => {
  // Initialize hooks
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Initialize search hook with configuration
  const {
    query,
    setQuery,
    isSearching,
    results,
    error,
    filters,
    pagination
  } = useSearch({
    initialQuery: '',
    debounceMs,
    pageSize: 10
  });

  // Local state for advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null
  });

  /**
   * Handle input change with debounced search
   */
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setQuery(newQuery);
    onSearch(newQuery);
  }, [setQuery, onSearch]);

  /**
   * Handle date range filter changes
   */
  const handleDateRangeChange = useCallback((type: 'startDate' | 'endDate', date: Date | null) => {
    setDateRange(prev => ({
      ...prev,
      [type]: date
    }));
    
    filters.updateFilters({
      ...filters,
      [type]: date
    });
  }, [filters]);

  /**
   * Handle search result item click
   */
  const handleResultClick = useCallback((documentId: string) => {
    navigate(`${DASHBOARD_ROUTE}/documents/${documentId}`);
  }, [navigate]);

  /**
   * Handle keyboard navigation in search results
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      // Implement keyboard navigation logic
    } else if (event.key === 'Enter' && results.length > 0) {
      handleResultClick(results[0].id);
    }
  }, [results, handleResultClick]);

  /**
   * Reset all filters to default values
   */
  const handleResetFilters = useCallback(() => {
    setDateRange({
      startDate: null,
      endDate: null
    });
    filters.resetFilters();
  }, [filters]);

  return (
    <div className="search-bar" onKeyDown={handleKeyDown}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          aria-label="Search documents"
        />
        
        {/* Search Icon */}
        <svg
          className="search-icon"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 17A8 8 0 109 1a8 8 0 000 16zM19 19l-4.35-4.35"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Loading Indicator */}
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      <div className="mt-2">
        <button
          type="button"
          className="text-sm text-gray-600 hover:text-primary focus:outline-none focus:text-primary"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        {showFilters && (
          <div className="mt-2 p-4 bg-white rounded-md shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Range Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  value={dateRange.startDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleDateRangeChange('startDate', e.target.value ? new Date(e.target.value) : null)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  value={dateRange.endDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleDateRangeChange('endDate', e.target.value ? new Date(e.target.value) : null)}
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                onClick={handleResetFilters}
              >
                Reset Filters
              </button>
              <button
                type="button"
                className="px-3 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90"
                onClick={() => setShowFilters(false)}
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {query && (
        <div className="absolute w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {error ? (
            <div className="p-4 text-error text-sm">{error}</div>
          ) : results.length > 0 ? (
            <ul>
              {results.map((document, index) => (
                <li
                  key={document.id}
                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleResultClick(document.id)}
                >
                  <div className="text-sm font-medium text-gray-900">
                    {document.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {document.type} • {new Date(document.createdAt).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-sm text-gray-500">
              No results found
            </div>
          )}

          {/* Pagination Controls */}
          {results.length > 0 && (
            <div className="p-2 border-t border-gray-200 flex justify-between items-center">
              <button
                type="button"
                className="px-2 py-1 text-sm text-gray-600 hover:text-primary disabled:opacity-50"
                disabled={pagination.currentPage === 1}
                onClick={pagination.prevPage}
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                type="button"
                className="px-2 py-1 text-sm text-gray-600 hover:text-primary disabled:opacity-50"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={pagination.nextPage}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;