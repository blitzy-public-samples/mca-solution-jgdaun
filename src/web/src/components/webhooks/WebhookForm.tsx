/**
 * @file WebhookForm.tsx
 * A form component for creating and updating webhook configurations following
 * the standardized webhook payload structure.
 */

// React 18.2.0
import React, { useEffect } from 'react';
// react-hook-form 7.43.0
import { useForm, Controller } from 'react-hook-form';

// Internal imports
import useWebhooks from '../../hooks/useWebhooks';
import { WebhookPayload, WebhookData, WebhookMetadata } from '../../types/webhook';
import { validateEmail } from '../../utils/validation';
import Button from '../common/Button';
import Input from '../common/Input';

interface WebhookFormProps {
  webhook: WebhookPayload | null;
  onSubmit: (webhook: WebhookPayload) => void;
  onCancel: () => void;
}

/**
 * WebhookForm component that provides a user interface for creating and updating
 * webhook configurations with proper validation.
 * 
 * @implements Webhook Management requirement from system_design/api_design/webhook_payload_structure
 * @implements Form Validation requirement from appendices.a.1_additional_technical_information/field_validation_rules
 */
const WebhookForm: React.FC<WebhookFormProps> = ({
  webhook,
  onSubmit,
  onCancel
}) => {
  // Initialize form with react-hook-form
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<WebhookPayload>({
    defaultValues: {
      event: webhook?.event || 'application.processed',
      application_id: webhook?.application_id || '',
      timestamp: webhook?.timestamp || new Date().toISOString(),
      data: webhook?.data || {
        status: 'pending',
        confidence_score: 0,
        merchant_name: '',
        ein: '',
        requested_amount: 0,
        document_count: 0
      },
      metadata: webhook?.metadata || {
        processing_time: 0,
        version: '1.0'
      }
    }
  });

  // Custom hook for webhook operations
  const { loading } = useWebhooks();

  // Reset form when webhook prop changes
  useEffect(() => {
    if (webhook) {
      reset(webhook);
    }
  }, [webhook, reset]);

  /**
   * Validates EIN format according to field validation rules
   * @param ein - Employer Identification Number
   */
  const validateEIN = (ein: string): boolean => {
    const einRegex = /^\d{2}-\d{7}$/;
    return einRegex.test(ein);
  };

  /**
   * Validates numeric fields to ensure they are positive numbers
   * @param value - Numeric value to validate
   */
  const validatePositiveNumber = (value: number): boolean => {
    return !isNaN(value) && value >= 0;
  };

  /**
   * Handle form submission with validation
   * @param formData - Form data matching WebhookPayload interface
   */
  const onFormSubmit = async (formData: WebhookPayload) => {
    try {
      // Ensure timestamp is in ISO8601 format
      const submissionData: WebhookPayload = {
        ...formData,
        timestamp: new Date().toISOString(),
        data: {
          ...formData.data,
          confidence_score: Number(formData.data.confidence_score),
          requested_amount: Number(formData.data.requested_amount),
          document_count: Number(formData.data.document_count)
        }
      };
      
      await onSubmit(submissionData);
    } catch (error) {
      console.error('Error submitting webhook form:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Event Type Selection */}
      <Controller
        name="event"
        control={control}
        rules={{ required: 'Event type is required' }}
        render={({ field }) => (
          <Input
            id="event"
            label="Event Type"
            type="text"
            {...field}
            error={errors.event?.message}
            required
          />
        )}
      />

      {/* Application ID */}
      <Controller
        name="application_id"
        control={control}
        rules={{ required: 'Application ID is required' }}
        render={({ field }) => (
          <Input
            id="application_id"
            label="Application ID"
            type="text"
            {...field}
            error={errors.application_id?.message}
            required
          />
        )}
      />

      {/* Webhook Data Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Webhook Data</h3>

        {/* Status */}
        <Controller
          name="data.status"
          control={control}
          rules={{ required: 'Status is required' }}
          render={({ field }) => (
            <Input
              id="status"
              label="Status"
              type="text"
              {...field}
              error={errors.data?.status?.message}
              required
            />
          )}
        />

        {/* Confidence Score */}
        <Controller
          name="data.confidence_score"
          control={control}
          rules={{
            required: 'Confidence score is required',
            min: { value: 0, message: 'Confidence score must be between 0 and 1' },
            max: { value: 1, message: 'Confidence score must be between 0 and 1' },
            validate: validatePositiveNumber
          }}
          render={({ field }) => (
            <Input
              id="confidence_score"
              label="Confidence Score"
              type="number"
              step="0.01"
              {...field}
              error={errors.data?.confidence_score?.message}
              required
            />
          )}
        />

        {/* Merchant Name */}
        <Controller
          name="data.merchant_name"
          control={control}
          rules={{ required: 'Merchant name is required' }}
          render={({ field }) => (
            <Input
              id="merchant_name"
              label="Merchant Name"
              type="text"
              {...field}
              error={errors.data?.merchant_name?.message}
              required
            />
          )}
        />

        {/* EIN */}
        <Controller
          name="data.ein"
          control={control}
          rules={{
            required: 'EIN is required',
            validate: {
              format: (v) => validateEIN(v) || 'EIN must be in XX-XXXXXXX format'
            }
          }}
          render={({ field }) => (
            <Input
              id="ein"
              label="EIN"
              type="text"
              placeholder="XX-XXXXXXX"
              {...field}
              error={errors.data?.ein?.message}
              required
            />
          )}
        />

        {/* Requested Amount */}
        <Controller
          name="data.requested_amount"
          control={control}
          rules={{
            required: 'Requested amount is required',
            validate: validatePositiveNumber
          }}
          render={({ field }) => (
            <Input
              id="requested_amount"
              label="Requested Amount"
              type="number"
              step="0.01"
              {...field}
              error={errors.data?.requested_amount?.message}
              required
            />
          )}
        />

        {/* Document Count */}
        <Controller
          name="data.document_count"
          control={control}
          rules={{
            required: 'Document count is required',
            validate: validatePositiveNumber
          }}
          render={({ field }) => (
            <Input
              id="document_count"
              label="Document Count"
              type="number"
              {...field}
              error={errors.data?.document_count?.message}
              required
            />
          )}
        />
      </div>

      {/* Webhook Metadata Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Webhook Metadata</h3>

        {/* Processing Time */}
        <Controller
          name="metadata.processing_time"
          control={control}
          rules={{
            required: 'Processing time is required',
            validate: validatePositiveNumber
          }}
          render={({ field }) => (
            <Input
              id="processing_time"
              label="Processing Time (ms)"
              type="number"
              {...field}
              error={errors.metadata?.processing_time?.message}
              required
            />
          )}
        />

        {/* Version */}
        <Controller
          name="metadata.version"
          control={control}
          rules={{ required: 'Version is required' }}
          render={({ field }) => (
            <Input
              id="version"
              label="Version"
              type="text"
              {...field}
              error={errors.metadata?.version?.message}
              required
            />
          )}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button
          label="Cancel"
          onClick={onCancel}
          variant="outline"
          disabled={isSubmitting || loading}
        />
        <Button
          label={webhook ? 'Update Webhook' : 'Create Webhook'}
          onClick={handleSubmit(onFormSubmit)}
          loading={isSubmitting || loading}
          disabled={isSubmitting || loading}
        />
      </div>
    </form>
  );
};

export default WebhookForm;