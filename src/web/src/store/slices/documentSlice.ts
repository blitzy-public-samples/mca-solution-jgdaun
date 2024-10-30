/**
 * Document Redux Slice
 * Implements state management for document-related data within the frontend application.
 * 
 * Requirements implemented:
 * - State Management Integration (system_architecture.component_details.frontend_layer)
 * - Document Management UI (system_design.user_interface_design.main_dashboard_components)
 */

// @reduxjs/toolkit v1.9.0
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Document, DocumentStatus } from '../types/document';
import { fetchDocuments, getDocumentById } from '../services/document';

/**
 * Interface defining the shape of the document slice state
 */
export interface DocumentState {
  documents: Document[];
  selectedDocument: Document | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
  activeFilters: DocumentStatus[];
}

/**
 * Initial state for the document slice
 */
const initialState: DocumentState = {
  documents: [],
  selectedDocument: null,
  loading: false,
  error: null,
  totalCount: 0,
  activeFilters: [],
};

/**
 * Interface for document fetch parameters
 */
interface FetchDocumentsParams {
  page?: number;
  limit?: number;
  status?: DocumentStatus[];
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Async thunk for fetching documents with optional filtering and pagination
 */
export const fetchDocumentsAsync = createAsyncThunk(
  'documents/fetchDocuments',
  async (params: FetchDocumentsParams) => {
    try {
      const response = await fetchDocuments(
        {
          status: params.status?.join(','),
          startDate: params.startDate ? new Date(params.startDate) : undefined,
          endDate: params.endDate ? new Date(params.endDate) : undefined,
        },
        {
          page: params.page || 1,
          limit: params.limit || 10,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch documents');
    }
  }
);

/**
 * Async thunk for fetching a single document by ID
 */
export const fetchDocumentByIdAsync = createAsyncThunk(
  'documents/fetchDocumentById',
  async (documentId: string) => {
    try {
      const response = await getDocumentById(documentId);
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch document');
    }
  }
);

/**
 * Document slice containing reducers and actions
 */
const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    // Synchronous reducers
    setSelectedDocument: (state, action: PayloadAction<Document | null>) => {
      state.selectedDocument = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setActiveFilters: (state, action: PayloadAction<DocumentStatus[]>) => {
      state.activeFilters = action.payload;
    },
    clearDocuments: (state) => {
      state.documents = [];
      state.totalCount = 0;
    },
  },
  extraReducers: (builder) => {
    // Async thunk reducers for fetchDocumentsAsync
    builder
      .addCase(fetchDocumentsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocumentsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload.documents;
        state.totalCount = action.payload.total;
      })
      .addCase(fetchDocumentsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch documents';
      })
      // Async thunk reducers for fetchDocumentByIdAsync
      .addCase(fetchDocumentByIdAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocumentByIdAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedDocument = action.payload;
      })
      .addCase(fetchDocumentByIdAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch document';
      });
  },
});

// Export actions
export const {
  setSelectedDocument,
  clearError,
  setActiveFilters,
  clearDocuments,
} = documentSlice.actions;

// Export reducer
export const documentReducer = documentSlice.reducer;

// Export selectors
export const selectDocuments = (state: { documents: DocumentState }) => state.documents.documents;
export const selectSelectedDocument = (state: { documents: DocumentState }) => state.documents.selectedDocument;
export const selectDocumentsLoading = (state: { documents: DocumentState }) => state.documents.loading;
export const selectDocumentsError = (state: { documents: DocumentState }) => state.documents.error;
export const selectDocumentsTotalCount = (state: { documents: DocumentState }) => state.documents.totalCount;
export const selectActiveFilters = (state: { documents: DocumentState }) => state.documents.activeFilters;