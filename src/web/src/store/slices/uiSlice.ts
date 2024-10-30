/**
 * @file UI Redux Slice
 * Implements UI state management requirements from system_architecture.component_details.frontend_layer
 * and system_design.user_interface_design.dashboard_layout specifications.
 */

// @reduxjs/toolkit version 1.9.5
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UIState } from '../types';

// Initial state structure based on UIState interface
const initialState: UIState = {
  isLoading: false,
  isSidebarOpen: true,
  modal: {
    isOpen: false,
    type: null,
    data: null,
  },
  notification: {
    isVisible: false,
    type: null,
    message: '',
    duration: 3000,
  },
  filters: {
    status: [],
    dateRange: null,
    searchQuery: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
};

/**
 * UI Slice implementation using Redux Toolkit
 * Manages all UI-related state transitions and interactions
 */
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Loading state management
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Sidebar visibility management
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },

    // Modal management
    showModal: (state, action: PayloadAction<{ type: string; data?: any }>) => {
      state.modal = {
        isOpen: true,
        type: action.payload.type,
        data: action.payload.data || null,
      };
    },
    hideModal: (state) => {
      state.modal = {
        isOpen: false,
        type: null,
        data: null,
      };
    },

    // Notification management
    showNotification: (state, action: PayloadAction<{
      type: 'success' | 'error' | 'warning' | 'info';
      message: string;
      duration?: number;
    }>) => {
      state.notification = {
        isVisible: true,
        type: action.payload.type,
        message: action.payload.message,
        duration: action.payload.duration || 3000,
      };
    },
    hideNotification: (state) => {
      state.notification = {
        ...state.notification,
        isVisible: false,
      };
    },
    clearNotification: (state) => {
      state.notification = {
        isVisible: false,
        type: null,
        message: '',
        duration: 3000,
      };
    },

    // Filter state management
    setFilters: (state, action: PayloadAction<{
      status?: string[];
      dateRange?: { start: Date; end: Date } | null;
      searchQuery?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }>) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },
    clearFilters: (state) => {
      state.filters = {
        status: [],
        dateRange: null,
        searchQuery: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
    },
  },
});

// Export actions for component usage
export const uiActions = {
  setLoading: uiSlice.actions.setLoading,
  toggleSidebar: uiSlice.actions.toggleSidebar,
  showModal: uiSlice.actions.showModal,
  hideModal: uiSlice.actions.hideModal,
  showNotification: uiSlice.actions.showNotification,
  hideNotification: uiSlice.actions.hideNotification,
  clearNotification: uiSlice.actions.clearNotification,
  setFilters: uiSlice.actions.setFilters,
  clearFilters: uiSlice.actions.clearFilters,
};

// Export reducer as default for store configuration
export default uiSlice.reducer;