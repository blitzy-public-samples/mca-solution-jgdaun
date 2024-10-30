/**
 * Webhook Service Module
 * Provides services for managing webhook integrations, including registration,
 * updating, and handling webhook events within the frontend application.
 * 
 * Requirements implemented:
 * - RESTful Endpoints (system_design/api_design/restful_endpoints)
 * - Webhook Payload Structure (system_design/api_design/webhook_payload_structure)
 * - API Authentication (system_design/api_design/api_authentication)
 * - Error Responses (system_design/api_design/error_responses)
 */

// axios v0.21.1
import { WebhookPayload, WebhookResponse } from '../types/webhook';
import { makeApiRequest } from '../utils/api';
import { WEBHOOKS } from '../config/api';

/**
 * Validates webhook configuration against required schema
 * @param webhookConfig - Webhook configuration to validate
 * @throws Error if validation fails
 */
const validateWebhookConfig = (webhookConfig: WebhookPayload): void => {
  const requiredFields = [
    'event',
    'application_id',
    'timestamp',
    'data',
    'metadata'
  ];

  const missingFields = requiredFields.filter(field => !(field in webhookConfig));
  if (missingFields.length > 0) {
    throw new Error(`Missing required webhook fields: ${missingFields.join(', ')}`);
  }

  // Validate data object
  if (!webhookConfig.data || typeof webhookConfig.data !== 'object') {
    throw new Error('Invalid webhook data structure');
  }

  // Validate metadata object
  if (!webhookConfig.metadata || typeof webhookConfig.metadata !== 'object') {
    throw new Error('Invalid webhook metadata structure');
  }
};

/**
 * Validates webhook ID format
 * @param webhookId - ID of the webhook to validate
 * @throws Error if validation fails
 */
const validateWebhookId = (webhookId: string): void => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(webhookId)) {
    throw new Error('Invalid webhook ID format');
  }
};

/**
 * Registers a new webhook with the specified configuration
 * @param webhookConfig - Configuration for the new webhook
 * @returns Promise resolving to the registered webhook details
 */
export const registerWebhook = async (
  webhookConfig: WebhookPayload
): Promise<WebhookResponse> => {
  try {
    // Validate webhook configuration
    validateWebhookConfig(webhookConfig);

    // Make API request to register webhook
    const response = await makeApiRequest<WebhookPayload>(
      WEBHOOKS.REGISTER,
      'POST',
      webhookConfig
    );

    return response;
  } catch (error) {
    // Transform error to standard API response format
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to register webhook',
      data: null,
      request_id: 'error'
    };
  }
};

/**
 * Updates an existing webhook configuration
 * @param webhookId - ID of the webhook to update
 * @param webhookConfig - Updated webhook configuration
 * @returns Promise resolving to the updated webhook details
 */
export const updateWebhook = async (
  webhookId: string,
  webhookConfig: WebhookPayload
): Promise<WebhookResponse> => {
  try {
    // Validate webhook ID and configuration
    validateWebhookId(webhookId);
    validateWebhookConfig(webhookConfig);

    // Make API request to update webhook
    const response = await makeApiRequest<WebhookPayload>(
      `${WEBHOOKS.UPDATE}/${webhookId}`,
      'PUT',
      webhookConfig
    );

    return response;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update webhook',
      data: null,
      request_id: 'error'
    };
  }
};

/**
 * Deletes an existing webhook configuration
 * @param webhookId - ID of the webhook to delete
 * @returns Promise resolving to the deletion status
 */
export const deleteWebhook = async (
  webhookId: string
): Promise<WebhookResponse> => {
  try {
    // Validate webhook ID
    validateWebhookId(webhookId);

    // Make API request to delete webhook
    const response = await makeApiRequest<void>(
      `${WEBHOOKS.DELETE}/${webhookId}`,
      'DELETE'
    );

    return {
      ...response,
      data: null
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete webhook',
      data: null,
      request_id: 'error'
    };
  }
};