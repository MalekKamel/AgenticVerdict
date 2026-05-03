/**
 * Auth Store - TanStack Store
 *
 * This store manages authentication state across the application.
 * TanStack Store provides a lightweight, framework-agnostic state management solution.
 *
 * Features:
 * - User authentication state
 * - Session management
 * - Multi-tenant context
 * - Loading and error states
 */

import { Store } from "@tanstack/react-store";
import { useStore } from "@tanstack/react-store";

import type { Permission, TenantType, TenantStatus } from "@agenticverdict/types";

/**
 * User information type
 */
export type UserInfo = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  emailVerified: boolean;
  roles: string[];
  permissions: Permission[];
  tenantId: string;
  tenantType: TenantType;
  tenantStatus: TenantStatus;
};

/**
 * Authentication error type
 */
export type AuthError = {
  code: string;
  message: string;
  field?: string;
};

/**
 * Authentication store state
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  tenantId: string | null;
  tenantType: TenantType | null;
  tenantStatus: TenantStatus | null;
  isLoading: boolean;
  error: AuthError | null;
}

/**
 * Authentication store using TanStack Store
 *
 * This store manages the authentication state for the entire application.
 * It provides centralized state management for user authentication,
 * tenant context, loading states, and error handling.
 *
 * @example
 * ```tsx
 * const auth = useAuthStore();
 *
 * if (auth.isLoading) {
 *   return <LoadingSpinner />;
 * }
 *
 * if (!auth.isAuthenticated) {
 *   return <LoginForm />;
 * }
 *
 * return <Dashboard user={auth.user} />;
 * ```
 */

// Initial state
const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  tenantId: null,
  tenantType: null,
  tenantStatus: null,
  isLoading: false,
  error: null,
};

// Create the store
export const authStore = new Store(initialAuthState);

// React hook to use the auth store
export function useAuthStore(): AuthState {
  return useStore(authStore, (state) => state);
}

// Store actions
export const authActions = {
  setAuth: (
    isAuthenticated: boolean,
    user?: UserInfo,
    tenantId?: string,
    tenantType?: TenantType,
    tenantStatus?: TenantStatus,
  ) => {
    authStore.setState((prev: AuthState) => ({
      ...prev,
      isAuthenticated,
      user: user ?? null,
      tenantId: tenantId ?? null,
      tenantType: tenantType ?? null,
      tenantStatus: tenantStatus ?? null,
      error: null,
    }));
  },

  setUser: (user: UserInfo | null) => {
    authStore.setState((prev: AuthState) => ({
      ...prev,
      user,
      isAuthenticated: user !== null,
      tenantType: user?.tenantType ?? null,
      tenantStatus: user?.tenantStatus ?? null,
    }));
  },

  setTenantId: (tenantId: string | null) => {
    authStore.setState((prev: AuthState) => ({
      ...prev,
      tenantId,
    }));
  },

  setTenantType: (tenantType: TenantType | null) => {
    authStore.setState((prev: AuthState) => ({
      ...prev,
      tenantType,
    }));
  },

  setTenantStatus: (tenantStatus: TenantStatus | null) => {
    authStore.setState((prev: AuthState) => ({
      ...prev,
      tenantStatus,
    }));
  },

  setLoading: (isLoading: boolean) => {
    authStore.setState((prev: AuthState) => ({
      ...prev,
      isLoading,
    }));
  },

  setError: (error: AuthError | null) => {
    authStore.setState((prev: AuthState) => ({
      ...prev,
      error,
      isLoading: false,
    }));
  },

  clearError: () => {
    authStore.setState((prev: AuthState) => ({
      ...prev,
      error: null,
    }));
  },

  logout: () => {
    authStore.setState((prev: AuthState) => ({
      ...prev,
      isAuthenticated: false,
      user: null,
      tenantId: null,
      tenantType: null,
      tenantStatus: null,
      error: null,
      isLoading: false,
    }));
  },
};
