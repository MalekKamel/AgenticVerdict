import type { QueryClient } from "@tanstack/react-query";
import type { SessionData } from "@/lib/api/auth-api";

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
  authActions.setAuth(true, session.user, session.user.tenantId);
}
