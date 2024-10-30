/**
 * @file Webhooks.tsx
 * Implements the Webhooks page component that provides a comprehensive interface
 * for managing webhook configurations within the application.
 * 
 * Requirements implemented:
 * - User Interface Design - Main Dashboard Components
 * - Webhook Payload Structure
 */

// React 18.2.0
import React, { useState, useCallback } from 'react';

// Internal imports
import WebhookForm from '../components/webhooks/WebhookForm';
import WebhookList from '../components/webhooks/WebhookList';
import useWebhooks from '../hooks/useWebhooks';
import { WebhookPayload } from '../types/webhook';
import { WEBHOOKS_ROUTE } from '../constants/routes';
import {
  STATUS_NEW,
  STATUS_PROCESSING,
  STATUS_COMPLETE,
  STATUS_FAILED
} from '../constants/status';

/**
 * WebhooksPage component that provides a comprehensive interface for managing
 * webhook configurations with proper validation and real-time updates.
 */
const WebhooksPage: React.FC = () => {
  // Initialize webhook management functionality
  const {
    webhooks,
    loading,
    error,
    registerWebhook,
    updateWebhook,
    deleteWebhook,
    refreshWebhooks
  } = useWebhooks();

  // Modal visibility state for webhook form
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Selected webhook for editing
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookPayload | null>(null);

  /**
   * Handles opening the webhook form modal for creating a new webhook
   */
  const handleCreateWebhook = useCallback(() => {
    setSelectedWebhook(null);
    setIsModalOpen(true);
  }, []);

  /**
   * Handles opening the webhook form modal for editing an existing webhook
   * @param webhook - The webhook configuration to edit
   */
  const handleEditWebhook = useCallback((webhook: WebhookPayload) => {
    setSelectedWebhook(webhook);
    setIsModalOpen(true);
  }, []);

  /**
   * Handles webhook form submission for both creation and updates
   * @param webhookData - The webhook configuration data from the form
   */
  const handleSubmitWebhook = useCallback(async (webhookData: WebhookPayload) => {
    try {
      if (selectedWebhook) {
        await updateWebhook(selectedWebhook.application_id, webhookData);
      } else {
        await registerWebhook(webhookData);
      }
      setIsModalOpen(false);
      setSelectedWebhook(null);
      await refreshWebhooks();
    } catch (error) {
      console.error('Failed to save webhook:', error);
    }
  }, [selectedWebhook, updateWebhook, registerWebhook, refreshWebhooks]);

  /**
   * Handles webhook deletion with confirmation
   * @param applicationId - ID of the webhook to delete
   */
  const handleDeleteWebhook = useCallback(async (applicationId: string) => {
    if (window.confirm('Are you sure you want to delete this webhook?')) {
      try {
        await deleteWebhook(applicationId);
        await refreshWebhooks();
      } catch (error) {
        console.error('Failed to delete webhook:', error);
      }
    }
  }, [deleteWebhook, refreshWebhooks]);

  /**
   * Handles modal close and resets selected webhook
   */
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedWebhook(null);
  }, []);

  /**
   * Renders error state if webhook operations fail
   */
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Error</h2>
        <p>{error}</p>
        <button
          onClick={refreshWebhooks}
          className="mt-2 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webhook Management</h1>
          <p className="text-gray-600 mt-1">
            Configure and manage webhook integrations for real-time event notifications
          </p>
        </div>
        <button
          onClick={handleCreateWebhook}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Create Webhook
        </button>
      </div>

      {/* Webhook List Component */}
      <WebhookList
        webhooks={webhooks}
        loading={loading}
        onEdit={handleEditWebhook}
        onDelete={handleDeleteWebhook}
        onRefresh={refreshWebhooks}
      />

      {/* Webhook Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {selectedWebhook ? 'Edit Webhook' : 'Create Webhook'}
            </h2>
            <WebhookForm
              webhook={selectedWebhook}
              onSubmit={handleSubmitWebhook}
              onCancel={handleModalClose}
            />
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white p-4 rounded-md shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhooksPage;