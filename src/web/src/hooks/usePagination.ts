/**
 * Custom React hook for implementing standardized pagination logic across the application
 * Implements requirements from:
 * - Main Dashboard Components (system_design/user_interface_design/main_dashboard_components)
 * - RESTful Endpoints (system_design/api_design/restful_endpoints)
 * 
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react'; // react ^18.0.0
import { PaginatedApiResponse, PaginationMetadata } from '../types/api';
import { makeApiRequest } from '../utils/api';

/**
 * Hook return type containing pagination state and control functions
 */
interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  isLoading: boolean;
  error: string | null;
  items: T[];
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
}

/**
 * Custom hook that manages pagination state and data fetching for lists of items
 * @template T - Type of items being paginated
 * @param initialPageSize - Initial number of items per page
 * @param endpoint - API endpoint to fetch paginated data from
 * @returns Object containing pagination state and control functions
 */
const usePagination = <T>(
  initialPageSize: number,
  endpoint: string
): UsePaginationReturn<T> => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSizeState] = useState<number>(initialPageSize);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  // Data state
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Memoized function to fetch paginated data from the API
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await makeApiRequest<PaginatedApiResponse<T>>(
        endpoint,
        'GET',
        {
          page: currentPage,
          pageSize: pageSize
        }
      );

      if (response.success && response.data) {
        const paginatedResponse = response.data as unknown as PaginatedApiResponse<T>;
        setItems(paginatedResponse.data);
        
        // Update pagination metadata
        const metadata: PaginationMetadata = paginatedResponse.pagination;
        setTotalItems(metadata.total);
        setTotalPages(metadata.totalPages);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, endpoint]);

  /**
   * Fetch data when page, pageSize, or endpoint changes
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Set specific page number with boundary validation
   */
  const setPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  /**
   * Navigate to next page if available
   */
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  /**
   * Navigate to previous page if available
   */
  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  /**
   * Update page size and reset to first page
   */
  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  return {
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    isLoading,
    error,
    items,
    setPage,
    nextPage,
    prevPage,
    setPageSize
  };
};

export default usePagination;