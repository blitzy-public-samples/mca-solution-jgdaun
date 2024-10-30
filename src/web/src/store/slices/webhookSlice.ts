/**
 * Redux Slice for Webhook Management
 * Implements state management for webhook operations in the frontend application.
 * 
 * Requirements implemented:
 * - State Management Integration (system_architecture.component_details.frontend_layer)
 * - Webhook Payload Structure (system_design.api_design.webhook_payload_structure)
 */

// @reduxjs/toolkit v1.9.0
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  WebhookPayload,
  WebhookResponse,
} from '../../types/webhook';
import {
  registerWebhook,
  updateWebhook,
  deleteWebhook,
} from '../../services/webhook';

/**
 * Interface defining the shape of the webhook slice state
 */
interface WebhookState {
  webhooks: WebhookPayload[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Initial state for the webhook slice
 */
const initialState: WebhookState = {
  webhooks: [],
  isLoading: false,
  error: null,
};

/**
 * Async thunk for registering a new webhook
 */
export const registerWebhookAsync = createAsyncThunk<
  WebhookPayload,
  WebhookPayload,
  { rejectValue: string }
>(
  'webhook/register',
  async (payload: WebhookPayload, { rejectWithValue }) => {
    try {
      const response = await registerWebhook(payload);
      if (!response.success || !response.data) {
        throw new Error(response.message);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to register webhook');
    }
  }
);

/**
 * Async thunk for updating an existing webhook
 */
export const updateWebhookAsync = createAsyncThunk<
  WebhookPayload,
  { webhookId: string; payload: WebhookPayload },
  { rejectValue: string }
>(
  'webhook/update',
  async ({ webhookId, payload }, { rejectWithValue }) => {
    try {
      const response = await updateWebhook(webhookId, payload);
      if (!response.success || !response.data) {
        throw new Error(response.message);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update webhook');
    }
  }
);

/**
 * Async thunk for deleting a webhook
 */
export const deleteWebhookAsync = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'webhook/delete',
  async (webhookId: string, { rejectWithValue }) => {
    try {
      const response = await deleteWebhook(webhookId);
      if (!response.success) {
        throw new Error(response.message);
      }
      return webhookId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete webhook');
    }
  }
);

/**
 * Webhook slice definition with reducers and extra reducers for async actions
 */
const webhookSlice = createSlice({
  name: 'webhook',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetWebhooks: (state) => {
      state.webhooks = [];
      state.error = null;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    // Register webhook cases
    builder
      .addCase(registerWebhookAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerWebhookAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.webhooks.push(action.payload);
      })
      .addCase(registerWebhookAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to register webhook';
      })

    // Update webhook cases
    builder
      .addCase(updateWebhookAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateWebhookAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.webhooks.findIndex(
          webhook => webhook.application_id === action.payload.application_id
        );
        if (index !== -1) {
          state.webhooks[index] = action.payload;
        }
      })
      .addCase(updateWebhookAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to update webhook';
      })

    // Delete webhook cases
    builder
      .addCase(deleteWebhookAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteWebhookAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.webhooks = state.webhooks.filter(
          webhook => webhook.application_id !== action.payload
        );
      })
      .addCase(deleteWebhookAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to delete webhook';
      });
  },
});

// Export actions and reducer
export const { clearError, resetWebhooks } = webhookSlice.actions;
export const webhookReducer = webhookSlice.reducer;

// Export async actions
export const webhookActions = {
  registerWebhookAsync,
  updateWebhookAsync,
  deleteWebhookAsync,
};