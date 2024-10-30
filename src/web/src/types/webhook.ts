/**
 * @file Webhook Types and Interfaces
 * This file defines TypeScript types and interfaces for webhook-related data structures
 * within the frontend application. These types ensure type safety and consistency when
 * handling webhook events and payloads, following the system's webhook payload structure
 * specification.
 */

import { ApiResponse } from '../types/api';

/**
 * Represents the structure of a webhook payload following the system's webhook payload specification.
 * Implements the standardized webhook payload structure as defined in the API design.
 */
export interface WebhookPayload {
  /** The type of event that triggered the webhook (e.g., "application.processed") */
  event: string;

  /** Unique identifier of the application associated with the webhook event */
  application_id: string;

  /** ISO8601 formatted timestamp indicating when the event occurred */
  timestamp: string;

  /** The main data payload containing event-specific information */
  data: WebhookData;

  /** Additional metadata about the webhook event processing */
  metadata: WebhookMetadata;
}

/**
 * Represents the data payload of a webhook event.
 * Contains specific information about the application processing results.
 */
export interface WebhookData {
  /** Current status of the application processing */
  status: string;

  /** Confidence score of the OCR processing results (0.0 to 1.0) */
  confidence_score: number;

  /** Name of the merchant extracted from the documents */
  merchant_name: string;

  /** Employer Identification Number (EIN) of the merchant */
  ein: string;

  /** The amount requested in the application */
  requested_amount: number;

  /** Total number of documents included in the application */
  document_count: number;
}

/**
 * Represents metadata information for webhook events.
 * Contains technical details about the event processing.
 */
export interface WebhookMetadata {
  /** Time taken to process the event in milliseconds */
  processing_time: number;

  /** Version of the webhook payload structure */
  version: string;
}

/**
 * Type definition for webhook API responses.
 * Extends the standard API response type with webhook-specific data.
 */
export type WebhookResponse = ApiResponse<WebhookPayload>;

/**
 * Type definition for webhook list API responses.
 * Extends the standard API response type with an array of webhook payloads.
 */
export type WebhookListResponse = ApiResponse<WebhookPayload[]>;