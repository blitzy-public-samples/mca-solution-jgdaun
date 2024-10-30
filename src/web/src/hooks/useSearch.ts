/**
 * Custom React hook that implements real-time search functionality with debounced input handling,
 * integrated filtering, and pagination for the dashboard components.
 * 
 * Requirements implemented:
 * - Main Dashboard Components (system_design/user_interface_design/main_dashboard_components)
 * - RESTful Endpoints (system_design/api_design/restful_endpoints)
 */

// React v18.0.0
import { useState, useEffect, useCallback, useMemo } from 'react';
// lodash v4.17.21
import { debounce } from 'lodash';
import useFilters from './useFilters';
import usePagination from './usePagination';
import { makeApiRequest } from '../utils/api';
import { Document } from '../types/document';

/**
 * Interface defining the structure of search state
 */
interface SearchState {
  query: string;
  isSearching: boolean;
  results: Document[];
  error: string | null;
}

/**
 * Interface for search configuration options
 */
interface SearchConfig {
  initialQuery: string;
  debounceMs: number;
  pageSize: number;
}

/**
 * Custom hook to manage search functionality with debounced input, filtering, and pagination
 * @param searchConfig - Configuration options for search behavior
 * @returns Combined search state, pagination controls, and filter controls
 */
const useSearch = ({
  initialQuery = '',
  debounceMs = 300,
  pageSize = 10
}: SearchConfig) => {
  // Initialize search state
  const [searchState, setSearchState] = useState<SearchState>({
    query: initialQuery,
    isSearching: false,
    results: [],
    error: null
  });

  // Initialize filter and pagination hooks
  const filters = useFilters({
    status: [],
    startDate: null,
    endDate: null,
    searchQuery: initialQuery
  }, pageSize);

  const pagination = usePagination<Document>(pageSize, '/api/documents/search');

  /**
   * Memoized debounced search function to prevent excessive API calls
   */
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        try {
          setSearchState(prev => ({ ...prev, isSearching: true, error: null }));

          const response = await makeApiRequest<{ documents: Document[] }>(
            '/api/documents/search',
            'GET',
            {
              query,
              page: pagination.currentPage,
              pageSize: pagination.pageSize,
              status: filters.filters.status,
              startDate: filters.filters.startDate,
              endDate: filters.filters.endDate
            }
          );

          if (response.success) {
            setSearchState(prev => ({
              ...prev,
              results: response.data.documents,
              isSearching: false
            }));
          } else {
            setSearchState(prev => ({
              ...prev,
              error: response.message,
              isSearching: false
            }));
          }
        } catch (err) {
          setSearchState(prev => ({
            ...prev,
            error: err instanceof Error ? err.message : 'An error occurred during search',
            isSearching: false
          }));
        }
      }, debounceMs),
    [pagination.currentPage, pagination.pageSize, filters.filters, debounceMs]
  );

  /**
   * Handle search query updates
   */
  const setQuery = useCallback(
    (query: string) => {
      setSearchState(prev => ({ ...prev, query }));
      debouncedSearch(query);
    },
    [debouncedSearch]
  );

  /**
   * Effect to perform search when filters or pagination changes
   */
  useEffect(() => {
    if (searchState.query) {
      debouncedSearch(searchState.query);
    }
  }, [
    filters.filters.status,
    filters.filters.startDate,
    filters.filters.endDate,
    pagination.currentPage,
    debouncedSearch,
    searchState.query
  ]);

  /**
   * Effect to cleanup debounced function on unmount
   */
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return {
    // Search state
    query: searchState.query,
    setQuery,
    isSearching: searchState.isSearching,
    results: searchState.results,
    error: searchState.error,

    // Pagination state and controls
    pagination: {
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages,
      pageSize: pagination.pageSize,
      totalItems: pagination.totalItems,
      setPage: pagination.setPage,
      nextPage: pagination.nextPage,
      prevPage: pagination.prevPage,
      setPageSize: pagination.setPageSize
    },

    // Filter state and controls
    filters: {
      status: filters.filters.status,
      startDate: filters.filters.startDate,
      endDate: filters.filters.endDate,
      updateFilters: filters.updateFilters,
      resetFilters: filters.resetFilters
    }
  };
};

export default useSearch;