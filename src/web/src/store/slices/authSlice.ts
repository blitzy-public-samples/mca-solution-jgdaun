/**
 * Authentication Redux Slice
 * Implements state management for user authentication, JWT token handling,
 * and role-based access control in the frontend application.
 * 
 * Requirements implemented:
 * - State Management for Authentication (system_architecture.component_details.frontend_layer)
 * - Authentication Flow (security_considerations.authentication_and_authorization.authentication_flow)
 */

// @reduxjs/toolkit v1.9.0
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { login, logout } from '../../services/auth';
import { User, UserRole } from '../../types/user';

// Interface for login credentials
interface LoginCredentials {
  username: string;
  password: string;
}

// Interface for authentication state
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Initial state for the auth slice
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: !!localStorage.getItem('auth_token'),
  isLoading: false,
  error: null,
};

/**
 * Async thunk for handling user login
 * Implements the authentication flow from security_considerations/authentication_and_authorization/authentication_flow
 */
export const loginThunk = createAsyncThunk<User, LoginCredentials>(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const user = await login(credentials.username, credentials.password);
      return user;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Login failed');
    }
  }
);

/**
 * Async thunk for handling user logout
 * Implements session termination from security_considerations/authentication_and_authorization/authentication_flow
 */
export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await logout();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Logout failed');
    }
  }
);

/**
 * Redux slice for authentication state management
 * Implements state management requirements from system_architecture/component_details/frontend_layer
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Updates the authenticated user data
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    // Updates the JWT token
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
      if (action.payload) {
        localStorage.setItem('auth_token', action.payload);
      } else {
        localStorage.removeItem('auth_token');
      }
    },
    // Updates the loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    // Updates the error state
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    // Clears all authentication state
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token_expiry');
    },
  },
  extraReducers: (builder) => {
    // Handle login thunk states
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Handle logout thunk states
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token_expiry');
      })
      .addCase(logoutThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  setUser,
  setToken,
  setLoading,
  setError,
  clearAuth,
} = authSlice.actions;

// Export reducer
export const authReducer = authSlice.reducer;

// Selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectError = (state: { auth: AuthState }) => state.auth.error;
export const selectToken = (state: { auth: AuthState }) => state.auth.token;
export const selectUserRole = (state: { auth: AuthState }): UserRole | null => state.auth.user?.role || null;