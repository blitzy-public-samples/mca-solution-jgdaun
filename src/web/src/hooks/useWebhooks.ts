/**
 * @file useWebhooks.ts
 * Custom React hook for comprehensive webhook management functionality.
 * Implements frontend integration with webhook management RESTful endpoints
 * and ensures proper handling of webhook payloads according to the standardized structure.
 */

// React 18.2.0
import { useState, useEffect } from 'react';

// Internal imports
import { 
  WebhookPayload,
  WebhookListResponse,
  WebhookResponse 
} from '../types/webhook';
import { 
  registerWebhook as registerWebhookService,
  updateWebhook as updateWebhookService,
  deleteWebhook as deleteWebhookService 
} from '../services/webhook';

/**
 * Custom hook that provides webhook management functionality with proper error handling
 * and loading states.
 * 
 * @returns {Object} Object containing webhook state and management functions
 */
const useWebhooks = () => {
  // State for storing webhook configurations
  const [webhooks, setWebhooks] = useState<WebhookPayload[]>([]);
  
  // Loading state for API operations
  const [loading, setLoading] = useState<boolean>(true);
  
  // Error state for handling API errors
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches current webhook configurations from the API
   * Implements the GET /api/v1/webhooks endpoint integration
   */
  const refreshWebhooks = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/v1/webhooks', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch webhooks');
      }

      const data: WebhookListResponse = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setWebhooks(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch webhooks');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching webhooks');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Registers a new webhook configuration
   * @param config - Webhook configuration following the standardized payload structure
   */
  const registerWebhook = async (config: WebhookPayload): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response: WebhookResponse = await registerWebhookService(config);

      if (!response.success) {
        throw new Error(response.message || 'Failed to register webhook');
      }

      // Refresh webhooks list after successful registration
      await refreshWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while registering webhook');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates an existing webhook configuration
   * @param id - ID of the webhook to update
   * @param config - Updated webhook configuration
   */
  const updateWebhook = async (id: string, config: WebhookPayload): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response: WebhookResponse = await updateWebhookService(id, config);

      if (!response.success) {
        throw new Error(response.message || 'Failed to update webhook');
      }

      // Refresh webhooks list after successful update
      await refreshWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating webhook');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deletes an existing webhook configuration
   * @param id - ID of the webhook to delete
   */
  const deleteWebhook = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response: WebhookResponse = await deleteWebhookService(id);

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete webhook');
      }

      // Refresh webhooks list after successful deletion
      await refreshWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while deleting webhook');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch webhooks on component mount
  useEffect(() => {
    refreshWebhooks();
  }, []);

  // Return webhook state and management functions
  return {
    webhooks,
    loading,
    error,
    registerWebhook,
    updateWebhook,
    deleteWebhook,
    refreshWebhooks,
  };
};

export default useWebhooks;