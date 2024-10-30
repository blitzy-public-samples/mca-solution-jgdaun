/**
 * NotificationSettings Component
 * Implements user interface for managing notification preferences including webhook endpoints,
 * email notifications, and in-app notifications.
 * 
 * Requirements implemented:
 * - User Interface Design (system_design/user_interface_design/application_details_view)
 * - Webhook Management (system_design/api_design/webhook_payload_structure)
 */

import React, { useState, useEffect } from 'react'; // v18.2.0
import { useDispatch } from 'react-redux'; // v8.1.0
import useAuth from '../../hooks/useAuth';
import useWebhooks from '../../hooks/useWebhooks';
import { showNotification, setLoading } from '../../store/slices/uiSlice';

// Types for notification preferences
interface NotificationPreferences {
  email: {
    documentProcessed: boolean;
    reviewRequired: boolean;
    systemAlerts: boolean;
  };
  inApp: {
    documentProcessed: boolean;
    reviewRequired: boolean;
    systemAlerts: boolean;
  };
}

// Types for webhook configuration
interface WebhookConfig {
  id?: string;
  url: string;
  events: string[];
  isActive: boolean;
  headers?: Record<string, string>;
}

const NotificationSettings: React.FC = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useAuth();
  const { 
    webhooks, 
    loading: webhooksLoading, 
    registerWebhook, 
    updateWebhook, 
    deleteWebhook 
  } = useWebhooks();

  // Local state for notification preferences
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      documentProcessed: false,
      reviewRequired: false,
      systemAlerts: false,
    },
    inApp: {
      documentProcessed: true,
      reviewRequired: true,
      systemAlerts: true,
    },
  });

  // Local state for webhook form
  const [newWebhook, setNewWebhook] = useState<WebhookConfig>({
    url: '',
    events: [],
    isActive: true,
    headers: {},
  });

  // Fetch initial notification preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!isAuthenticated || !user) return;

      try {
        dispatch(setLoading(true));
        // Simulated API call - replace with actual endpoint
        const response = await fetch(`/api/v1/users/${user.id}/notification-preferences`);
        const data = await response.json();
        
        if (data.success) {
          setPreferences(data.preferences);
        }
      } catch (error) {
        dispatch(showNotification({
          type: 'error',
          message: 'Failed to load notification preferences',
        }));
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchPreferences();
  }, [isAuthenticated, user, dispatch]);

  // Handle email notification toggle
  const handleEmailToggle = async (key: keyof typeof preferences.email) => {
    try {
      dispatch(setLoading(true));
      
      // Update local state optimistically
      setPreferences(prev => ({
        ...prev,
        email: {
          ...prev.email,
          [key]: !prev.email[key],
        },
      }));

      // Simulated API call - replace with actual endpoint
      await fetch(`/api/v1/users/${user?.id}/notification-preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          preference: key,
          enabled: !preferences.email[key],
        }),
      });

      dispatch(showNotification({
        type: 'success',
        message: 'Email notification preferences updated',
      }));
    } catch (error) {
      // Revert on error
      setPreferences(prev => ({
        ...prev,
        email: {
          ...prev.email,
          [key]: !prev.email[key],
        },
      }));
      
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to update email preferences',
      }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Handle in-app notification toggle
  const handleInAppToggle = async (key: keyof typeof preferences.inApp) => {
    try {
      dispatch(setLoading(true));
      
      // Update local state optimistically
      setPreferences(prev => ({
        ...prev,
        inApp: {
          ...prev.inApp,
          [key]: !prev.inApp[key],
        },
      }));

      // Simulated API call - replace with actual endpoint
      await fetch(`/api/v1/users/${user?.id}/notification-preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'inApp',
          preference: key,
          enabled: !preferences.inApp[key],
        }),
      });

      dispatch(showNotification({
        type: 'success',
        message: 'In-app notification preferences updated',
      }));
    } catch (error) {
      // Revert on error
      setPreferences(prev => ({
        ...prev,
        inApp: {
          ...prev.inApp,
          [key]: !prev.inApp[key],
        },
      }));
      
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to update in-app preferences',
      }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Handle webhook form submission
  const handleWebhookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      dispatch(setLoading(true));
      
      if (!newWebhook.url || newWebhook.events.length === 0) {
        throw new Error('Please provide webhook URL and select at least one event');
      }

      await registerWebhook({
        url: newWebhook.url,
        events: newWebhook.events,
        isActive: newWebhook.isActive,
        headers: newWebhook.headers,
      });

      // Reset form
      setNewWebhook({
        url: '',
        events: [],
        isActive: true,
        headers: {},
      });

      dispatch(showNotification({
        type: 'success',
        message: 'Webhook endpoint registered successfully',
      }));
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to register webhook',
      }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Handle webhook update
  const handleWebhookUpdate = async (id: string, config: WebhookConfig) => {
    try {
      dispatch(setLoading(true));
      await updateWebhook(id, config);
      
      dispatch(showNotification({
        type: 'success',
        message: 'Webhook configuration updated',
      }));
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to update webhook configuration',
      }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Handle webhook deletion
  const handleWebhookDelete = async (id: string) => {
    try {
      dispatch(setLoading(true));
      await deleteWebhook(id);
      
      dispatch(showNotification({
        type: 'success',
        message: 'Webhook endpoint removed',
      }));
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to remove webhook endpoint',
      }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Email Notifications Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Email Notifications</h2>
        <div className="space-y-4">
          {Object.entries(preferences.email).map(([key, enabled]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-gray-700">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={enabled}
                  onChange={() => handleEmailToggle(key as keyof typeof preferences.email)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* In-App Notifications Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">In-App Notifications</h2>
        <div className="space-y-4">
          {Object.entries(preferences.inApp).map(([key, enabled]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-gray-700">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={enabled}
                  onChange={() => handleInAppToggle(key as keyof typeof preferences.inApp)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Webhook Configuration Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Webhook Endpoints</h2>
        
        {/* Webhook Registration Form */}
        <form onSubmit={handleWebhookSubmit} className="space-y-4 mb-6">
          <div>
            <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700">
              Webhook URL
            </label>
            <input
              type="url"
              id="webhookUrl"
              value={newWebhook.url}
              onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="https://your-endpoint.com/webhook"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Events
            </label>
            <div className="space-y-2">
              {['application.processed', 'document.uploaded', 'review.required'].map(event => (
                <label key={event} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newWebhook.events.includes(event)}
                    onChange={(e) => {
                      setNewWebhook(prev => ({
                        ...prev,
                        events: e.target.checked
                          ? [...prev.events, event]
                          : prev.events.filter(e => e !== event),
                      }));
                    }}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-600">{event}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Webhook Endpoint
          </button>
        </form>

        {/* Existing Webhooks List */}
        <div className="space-y-4">
          {webhooksLoading ? (
            <div className="text-center py-4">Loading webhooks...</div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No webhook endpoints configured</div>
          ) : (
            webhooks.map((webhook) => (
              <div key={webhook.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{webhook.url}</span>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleWebhookUpdate(webhook.id!, {
                        ...webhook,
                        isActive: !webhook.isActive,
                      })}
                      className={`px-3 py-1 rounded text-sm ${
                        webhook.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {webhook.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => handleWebhookDelete(webhook.id!)}
                      className="px-3 py-1 rounded text-sm bg-red-100 text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Events: {webhook.events.join(', ')}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default NotificationSettings;