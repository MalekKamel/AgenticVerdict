import type { SessionData } from "@/lib/api/auth-api";

export type AuthUnknownReason = "initial" | "probe_failed" | "recovering";

export type AuthResolutionState =
  | { kind: "unknown"; reason: AuthUnknownReason }
  | { kind: "anonymous" }
  | { kind: "authenticated_unverified"; user: NonNullable<SessionData["user"]> }
  | { kind: "authenticated_verified"; user: NonNullable<SessionData["user"]> };

export function resolveAuthResolutionState(input: {
  session: SessionData | null | undefined;
  isPending?: boolean;
  isFetching?: boolean;
  sessionCheckFailed?: boolean;
}): AuthResolutionState {
  if (input.sessionCheckFailed) {
    return { kind: "unknown", reason: "probe_failed" };
  }

  if (input.isPending) {
    return { kind: "unknown", reason: "initial" };
  }

  if (input.isFetching) {
    return { kind: "unknown", reason: "recovering" };
  }

  const user = input.session?.user ?? null;
  if (!user) {
    return { kind: "anonymous" };
  }

  if (!user.emailVerified) {
    return { kind: "authenticated_unverified", user };
  }

  return { kind: "authenticated_verified", user };
}
