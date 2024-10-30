/**
 * Custom React hook for managing filter and pagination logic within the frontend application.
 * Implements filtering, search, and pagination functionality for dashboard components.
 * 
 * Requirements implemented:
 * - Main Dashboard Components (system_design/user_interface_design/main_dashboard_components)
 * - Real-time search and filtering capabilities
 * - Status filters and date range filtering
 */

// React v17.0.2
import { useState, useEffect, useCallback, useMemo } from 'react';
// lodash v4.17.21
import { debounce } from 'lodash';
import { makeApiRequest } from '../utils/api';
import { validateDate } from '../utils/validation';
import { setDocuments } from '../store/slices/documentSlice';

/**
 * Interface defining the structure of filter state
 */
interface FilterState {
  status: string[];
  startDate: Date | null;
  endDate: Date | null;
  searchQuery: string;
}

/**
 * Interface defining the structure of pagination state
 */
interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

/**
 * Custom hook to manage filtering, search, and pagination logic
 * @param initialFilters - Initial filter state
 * @param itemsPerPage - Number of items to display per page
 * @returns Object containing filter state, search state, pagination state, and management functions
 */
const useFilters = (
  initialFilters: FilterState,
  itemsPerPage: number
) => {
  // Initialize filter state
  const [filters, setFilters] = useState<FilterState>({
    status: initialFilters.status || [],
    startDate: initialFilters.startDate || null,
    endDate: initialFilters.endDate || null,
    searchQuery: initialFilters.searchQuery || '',
  });

  // Initialize pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage,
    totalItems: 0,
  });

  // Initialize loading and error states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Memoized debounced search function to prevent excessive API calls
   */
  const debouncedSearch = useMemo(
    () =>
      debounce(async (searchQuery: string) => {
        setFilters((prev) => ({
          ...prev,
          searchQuery,
        }));
      }, 300),
    []
  );

  /**
   * Validates and applies date range filters
   */
  const validateDateRange = useCallback(
    (startDate: Date | null, endDate: Date | null): boolean => {
      if (!startDate || !endDate) return true;
      
      if (!validateDate(startDate.toISOString()) || !validateDate(endDate.toISOString())) {
        setError('Invalid date format');
        return false;
      }

      if (startDate > endDate) {
        setError('Start date must be before end date');
        return false;
      }

      return true;
    },
    []
  );

  /**
   * Applies filters and fetches filtered data
   */
  const applyFilters = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate date range if present
      if (!validateDateRange(filters.startDate, filters.endDate)) {
        return;
      }

      // Prepare filter parameters
      const params = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        status: filters.status.length > 0 ? filters.status : undefined,
        search: filters.searchQuery || undefined,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
      };

      // Make API request with filters
      const response = await makeApiRequest(
        '/api/documents',
        'GET',
        params
      );

      if (response.success) {
        // Update document state in Redux store
        setDocuments(response.data.documents);
        setPagination((prev) => ({
          ...prev,
          totalItems: response.data.total,
        }));
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while applying filters');
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.itemsPerPage]);

  /**
   * Effect to fetch data when filters or pagination changes
   */
  useEffect(() => {
    applyFilters();
  }, [
    filters.status,
    filters.startDate,
    filters.endDate,
    filters.searchQuery,
    pagination.currentPage,
    applyFilters,
  ]);

  /**
   * Updates filter state with new values
   */
  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
    // Reset to first page when filters change
    setPagination((prev) => ({
      ...prev,
      currentPage: 1,
    }));
  }, []);

  /**
   * Handles search query changes with debouncing
   */
  const handleSearch = useCallback(
    (query: string) => {
      debouncedSearch(query);
    },
    [debouncedSearch]
  );

  /**
   * Pagination control functions
   */
  const nextPage = useCallback(() => {
    const totalPages = Math.ceil(pagination.totalItems / pagination.itemsPerPage);
    if (pagination.currentPage < totalPages) {
      setPagination((prev) => ({
        ...prev,
        currentPage: prev.currentPage + 1,
      }));
    }
  }, [pagination.currentPage, pagination.totalItems, pagination.itemsPerPage]);

  const prevPage = useCallback(() => {
    if (pagination.currentPage > 1) {
      setPagination((prev) => ({
        ...prev,
        currentPage: prev.currentPage - 1,
      }));
    }
  }, [pagination.currentPage]);

  const setPage = useCallback(
    (page: number) => {
      const totalPages = Math.ceil(pagination.totalItems / pagination.itemsPerPage);
      if (page >= 1 && page <= totalPages) {
        setPagination((prev) => ({
          ...prev,
          currentPage: page,
        }));
      }
    },
    [pagination.totalItems, pagination.itemsPerPage]
  );

  /**
   * Reset filters to initial state
   */
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setPagination((prev) => ({
      ...prev,
      currentPage: 1,
    }));
  }, [initialFilters]);

  return {
    // Filter state
    filters,
    updateFilters,
    resetFilters,
    
    // Search functionality
    searchQuery: filters.searchQuery,
    handleSearch,
    
    // Pagination state and controls
    currentPage: pagination.currentPage,
    totalItems: pagination.totalItems,
    itemsPerPage: pagination.itemsPerPage,
    nextPage,
    prevPage,
    setPage,
    
    // Loading and error states
    isLoading,
    error,
    
    // Computed properties
    totalPages: Math.ceil(pagination.totalItems / pagination.itemsPerPage),
    hasNextPage: pagination.currentPage < Math.ceil(pagination.totalItems / pagination.itemsPerPage),
    hasPrevPage: pagination.currentPage > 1,
  };
};

export default useFilters;