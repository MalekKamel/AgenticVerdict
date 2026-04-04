/**
 * Standalone HTTP API (Fastify) — Phase 2 remediation surface (`/api/v1`).
 */
export const API_VERSION = "0.1.0";

export { buildApiServer } from "./server";
export {
  jwtAuth,
  tenantSecurityErrorReply,
  type AuthMiddlewareOptions,
  type AuthPayload,
} from "./middleware/auth";
export { rateLimit, type RateLimitOptions } from "./middleware/rate-limit";
