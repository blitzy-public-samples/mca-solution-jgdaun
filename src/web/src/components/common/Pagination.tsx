// React 18.2.0
import React from 'react';
// classnames 2.3.2
import classNames from 'classnames';
import Button from './Button';
import { Select, SelectOption } from './Select';
import usePagination from '../../hooks/usePagination';
import { capitalizeFirstLetter } from '../../utils/format';

// Interface for component props as specified in the JSON
interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * A reusable Pagination component that provides a standardized interface for navigating paginated data sets.
 * Implements WAI-ARIA compliant controls with keyboard navigation support and responsive design.
 * 
 * @implements Main Dashboard Components requirement for pagination functionality
 * @implements Frontend Layer requirement for core UI component
 */
const Pagination: React.FC<PaginationProps> = ({
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  className = '',
  disabled = false,
}) => {
  // Calculate total pages
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const [currentPage, setCurrentPage] = React.useState(1);

  // Define page size options
  const pageSizeOptions: SelectOption[] = [
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: '50', label: '50 per page' },
    { value: '100', label: '100 per page' },
  ];

  // Generate array of page numbers to display
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages && !disabled) {
      setCurrentPage(page);
      onPageChange(page);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    if (onItemsPerPageChange && !disabled) {
      const newPageSize = parseInt(value, 10);
      onItemsPerPageChange(newPageSize);
      // Reset to first page when changing page size
      setCurrentPage(1);
      onPageChange(1);
    }
  };

  // Keyboard navigation handlers
  const handleKeyDown = (e: React.KeyboardEvent, page: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePageChange(page);
    }
  };

  const containerClasses = classNames(
    'flex flex-col sm:flex-row items-center justify-between',
    'gap-4 py-3 px-4',
    'bg-white border-t border-gray-200',
    {
      'opacity-50 cursor-not-allowed': disabled,
    },
    className
  );

  const pageButtonClasses = (isActive: boolean) => classNames(
    'relative inline-flex items-center px-4 py-2 text-sm font-medium',
    'focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500',
    {
      'bg-blue-50 border-blue-500 text-blue-600': isActive,
      'bg-white border-gray-300 text-gray-500 hover:bg-gray-50': !isActive,
      'cursor-not-allowed opacity-50': disabled,
    }
  );

  return (
    <nav
      className={containerClasses}
      aria-label="Pagination"
      role="navigation"
    >
      {/* Items per page selector */}
      <div className="flex items-center space-x-2">
        <Select
          options={pageSizeOptions}
          onChange={handleItemsPerPageChange}
          defaultValue={itemsPerPage.toString()}
          disabled={disabled}
          aria-label="Items per page"
          className="w-40"
        />
        <span className="text-sm text-gray-700">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{' '}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
        </span>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center space-x-2">
        {/* Previous page button */}
        <Button
          label="Previous"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || disabled}
          variant="outline"
          size="small"
          className="mr-2"
          aria-label="Go to previous page"
        />

        {/* Page numbers */}
        <div className="hidden sm:flex space-x-1" role="group">
          {getPageNumbers().map((page, index, array) => {
            const showEllipsis = index > 0 && page - array[index - 1] > 1;
            
            return (
              <React.Fragment key={page}>
                {showEllipsis && (
                  <span className="px-4 py-2 text-gray-500">...</span>
                )}
                <button
                  className={pageButtonClasses(page === currentPage)}
                  onClick={() => handlePageChange(page)}
                  onKeyDown={(e) => handleKeyDown(e, page)}
                  disabled={disabled}
                  aria-current={page === currentPage ? 'page' : undefined}
                  aria-label={`${capitalizeFirstLetter(`page ${page}`)}`}
                >
                  {page}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Next page button */}
        <Button
          label="Next"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || disabled}
          variant="outline"
          size="small"
          className="ml-2"
          aria-label="Go to next page"
        />
      </div>
    </nav>
  );
};

export default Pagination;