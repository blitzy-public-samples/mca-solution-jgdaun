// React 18.2.0
import React, { useState, useCallback } from 'react';

// Internal dependencies
import useWebhooks from '../../hooks/useWebhooks';
import Table from '../common/Table';
import Button from '../common/Button';
import { WebhookPayload, WebhookData, WebhookMetadata } from '../../types/webhook';

/**
 * WebhookList Component
 * Displays a list of webhooks in a tabular format with comprehensive management capabilities.
 * Implements the webhook management section requirements from the main dashboard components.
 */
const WebhookList: React.FC = () => {
  // Initialize webhook management functionality
  const {
    webhooks,
    loading,
    error,
    deleteWebhook,
    refreshWebhooks
  } = useWebhooks();

  // Local state for selected webhooks (for batch operations)
  const [selectedWebhooks, setSelectedWebhooks] = useState<string[]>([]);

  /**
   * Formats the timestamp to a readable format
   * @param timestamp - ISO8601 timestamp
   */
  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  /**
   * Formats the status with appropriate styling
   * @param status - Current webhook status
   */
  const formatStatus = useCallback((status: string): JSX.Element => {
    const statusClasses = {
      complete: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      processing: 'bg-yellow-100 text-yellow-800',
      new: 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusClasses[status] || ''}`}>
        {status}
      </span>
    );
  }, []);

  /**
   * Formats the confidence score as a percentage
   * @param score - Confidence score between 0 and 1
   */
  const formatConfidenceScore = (score: number): string => {
    return `${(score * 100).toFixed(1)}%`;
  };

  /**
   * Formats the processing time in milliseconds
   * @param time - Processing time in milliseconds
   */
  const formatProcessingTime = (time: number): string => {
    return `${time.toFixed(2)}ms`;
  };

  /**
   * Handles the deletion of a webhook
   * @param applicationId - ID of the webhook to delete
   */
  const handleDelete = async (applicationId: string) => {
    try {
      await deleteWebhook(applicationId);
      setSelectedWebhooks(prev => prev.filter(id => id !== applicationId));
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  };

  /**
   * Table column configuration following the webhook payload structure
   */
  const columns = [
    {
      key: 'event',
      header: 'Event Type',
      width: '15%',
      sortable: true
    },
    {
      key: 'application_id',
      header: 'Application ID',
      width: '15%'
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      width: '15%',
      sortable: true,
      formatter: (value: string) => formatTimestamp(value)
    },
    {
      key: 'data.status',
      header: 'Status',
      width: '10%',
      formatter: (value: string) => formatStatus(value)
    },
    {
      key: 'data.confidence_score',
      header: 'Confidence',
      width: '10%',
      formatter: (value: number) => formatConfidenceScore(value)
    },
    {
      key: 'data.merchant_name',
      header: 'Merchant',
      width: '15%'
    },
    {
      key: 'metadata.processing_time',
      header: 'Processing Time',
      width: '10%',
      formatter: (value: number) => formatProcessingTime(value)
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '10%',
      formatter: (_, webhook: WebhookPayload) => (
        <div className="flex space-x-2">
          <Button
            label="Delete"
            variant="outline"
            size="small"
            onClick={() => handleDelete(webhook.application_id)}
          />
        </div>
      )
    }
  ];

  /**
   * Renders error state
   */
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        Error loading webhooks: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header section with actions */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Webhooks</h2>
        <div className="space-x-2">
          <Button
            label="Refresh"
            variant="outline"
            onClick={refreshWebhooks}
            loading={loading}
          />
        </div>
      </div>

      {/* Main table */}
      <Table
        columns={columns}
        data={webhooks}
        loading={loading}
        pageSize={10}
        className="shadow-sm rounded-lg"
      />

      {/* Empty state */}
      {!loading && webhooks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No webhooks found. New webhooks will appear here when they are received.
        </div>
      )}
    </div>
  );
};

export default WebhookList;