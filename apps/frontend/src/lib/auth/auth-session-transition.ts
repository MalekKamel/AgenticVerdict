import type { QueryClient } from "@tanstack/react-query";
import type { SessionData } from "@/lib/api/auth-api";
import type { Permission, TenantType, TenantStatus } from "@agenticverdict/types";

import { authActions } from "@/stores/auth-store";

/**
 * Applies a successful login session atomically across query cache and auth store.
 * This avoids transient authenticated->anonymous flips during post-login navigation.
 */
export function applySuccessfulLoginSession(queryClient: QueryClient, session: SessionData): void {
  if (!session.user) {
    return;
  }

  queryClient.setQueryData<SessionData>(["auth", "session"], session);
  authActions.setAuth(
    true,
    {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      emailVerified: session.user.emailVerified,
      roles: session.user.roles,
      permissions: session.user.permissions as Permission[],
      tenantId: session.user.tenantId,
      tenantType: session.user.tenantType as TenantType,
      tenantStatus: session.user.tenantStatus as TenantStatus,
    },
    session.user.tenantId,
    session.user.tenantType as TenantType,
    session.user.tenantStatus as TenantStatus,
  );
}
