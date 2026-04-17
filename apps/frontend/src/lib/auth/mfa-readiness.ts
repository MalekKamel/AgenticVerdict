/**
 * MFA readiness (Phase 2): shared types for future tRPC procedures (`auth.mfa.*`).
 * UI is gated by `VITE_PUBLIC_ENABLE_MFA_UI`; default off to avoid scope creep until product enables MFA.
 */

export type MfaFactorType = "totp" | "webauthn" | "sms";

export interface MfaChallengeResponse {
  challengeId: string;
  factors: MfaFactorType[];
  expiresAt: string;
}

export function isMfaUiEnabled(): boolean {
  return import.meta.env.VITE_PUBLIC_ENABLE_MFA_UI === "true";
}
