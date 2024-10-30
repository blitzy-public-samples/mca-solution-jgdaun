/**
 * StatusFilters Component
 * 
 * Implements interactive status filtering options for documents on the dashboard.
 * Supports multi-select filtering capabilities with visual feedback.
 * 
 * Requirements implemented:
 * - Main Dashboard Components (system_design/user_interface_design/main_dashboard_components)
 * - Document Processing Flow States (system_components_architecture/data_flow_diagrams/document_processing_flow)
 */

// React v17.0.2
import { useState, useEffect, useCallback } from 'react';
// classnames v2.3.1
import classNames from 'classnames';

// Internal dependencies
import useFilters from '../../hooks/useFilters';
import {
  STATUS_NEW,
  STATUS_PROCESSING,
  STATUS_COMPLETE,
  STATUS_FAILED,
  type DocumentStatus
} from '../../constants/status';

/**
 * Props interface for StatusFilters component
 */
interface StatusFiltersProps {
  initialStatuses?: string[];
  onStatusChange?: (statuses: DocumentStatus[]) => void;
}

/**
 * StatusFilters component that renders a set of interactive filter buttons
 * for managing document visibility based on their processing status
 */
const StatusFilters: React.FC<StatusFiltersProps> = ({
  initialStatuses = [],
  onStatusChange
}) => {
  // Initialize filter state using the useFilters hook
  const { filters, updateFilters } = useFilters({
    status: initialStatuses,
    startDate: null,
    endDate: null,
    searchQuery: ''
  }, 10);

  // Local state for selected statuses
  const [selectedStatuses, setSelectedStatuses] = useState<DocumentStatus[]>(
    initialStatuses as DocumentStatus[]
  );

  /**
   * Status configuration array defining the available filter options
   * Maps to the document processing pipeline states
   */
  const statusOptions = [
    {
      status: STATUS_NEW,
      label: 'New',
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
    },
    {
      status: STATUS_PROCESSING,
      label: 'Processing',
      className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
    },
    {
      status: STATUS_COMPLETE,
      label: 'Complete',
      className: 'bg-green-100 text-green-800 hover:bg-green-200'
    },
    {
      status: STATUS_FAILED,
      label: 'Failed',
      className: 'bg-red-100 text-red-800 hover:bg-red-200'
    }
  ] as const;

  /**
   * Handles toggling of status filters
   * Supports multiple selection and deselection of statuses
   */
  const handleStatusToggle = useCallback((status: DocumentStatus) => {
    setSelectedStatuses(prevStatuses => {
      const newStatuses = prevStatuses.includes(status)
        ? prevStatuses.filter(s => s !== status)
        : [...prevStatuses, status];
      return newStatuses;
    });
  }, []);

  /**
   * Effect to sync selected statuses with filter state
   * and trigger the onStatusChange callback
   */
  useEffect(() => {
    updateFilters({ status: selectedStatuses });
    onStatusChange?.(selectedStatuses);
  }, [selectedStatuses, updateFilters, onStatusChange]);

  return (
    <div className="flex flex-wrap gap-2 p-4" role="group" aria-label="Document status filters">
      {statusOptions.map(({ status, label, className }) => (
        <button
          key={status}
          onClick={() => handleStatusToggle(status)}
          className={classNames(
            'px-4 py-2 rounded-lg font-medium transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
            className,
            {
              'ring-2 ring-offset-2': selectedStatuses.includes(status),
              'opacity-75': !selectedStatuses.includes(status)
            }
          )}
          aria-pressed={selectedStatuses.includes(status)}
          type="button"
        >
          <span className="flex items-center gap-2">
            {label}
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-white bg-opacity-50">
              {selectedStatuses.includes(status) ? '✓' : ''}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
};

export default StatusFilters;