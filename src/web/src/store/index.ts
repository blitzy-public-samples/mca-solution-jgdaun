/**
 * Redux Store Configuration
 * Implements requirements from:
 * - Global State Management (system_architecture.component_details.frontend_layer)
 * - Dashboard State Integration (system_design.user_interface_design.dashboard_layout)
 */

// @reduxjs/toolkit v1.9.0
import { configureStore } from '@reduxjs/toolkit';

// Import reducers from slices
import { authReducer } from './slices/authSlice';
import { documentReducer } from './slices/documentSlice';
import uiReducer from './slices/uiSlice';
import { webhookReducer } from './slices/webhookSlice';

/**
 * Interface defining the shape of the complete Redux store state
 * Combines all slice states for proper typing throughout the application
 */
export interface RootState {
  auth: ReturnType<typeof authReducer>;
  documents: ReturnType<typeof documentReducer>;
  ui: ReturnType<typeof uiReducer>;
  webhooks: ReturnType<typeof webhookReducer>;
}

/**
 * Configures and returns the Redux store with integrated slices and middleware
 * Implements the global state management solution for the frontend application
 */
const configureAppStore = () => {
  // Configure store with combined reducers and default middleware
  const store = configureStore({
    reducer: {
      auth: authReducer,
      documents: documentReducer,
      ui: uiReducer,
      webhooks: webhookReducer,
    },
    // Enable Redux DevTools integration for development
    devTools: process.env.NODE_ENV !== 'production',
    // Configure middleware with defaults from Redux Toolkit
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // Enable serializable check in development
        serializableCheck: process.env.NODE_ENV !== 'production',
        // Enable immutability check in development
        immutableCheck: process.env.NODE_ENV !== 'production',
        // Thunk middleware is included by default
      }),
  });

  // Enable hot module replacement for reducers in development
  if (process.env.NODE_ENV !== 'production' && module.hot) {
    module.hot.accept('./slices/authSlice', () => {
      store.replaceReducer(authReducer);
    });
    module.hot.accept('./slices/documentSlice', () => {
      store.replaceReducer(documentReducer);
    });
    module.hot.accept('./slices/uiSlice', () => {
      store.replaceReducer(uiReducer);
    });
    module.hot.accept('./slices/webhookSlice', () => {
      store.replaceReducer(webhookReducer);
    });
  }

  return store;
};

// Create and export the configured store instance
const store = configureAppStore();

// Export the store configuration function for testing purposes
export { configureAppStore };

// Export default store instance for application usage
export default store;

// Export type of store.dispatch for proper typing in components
export type AppDispatch = typeof store.dispatch;