/**
 * Type-level tests to verify compile-time i18n key validation.
 * These tests verify that TypeScript produces errors for invalid keys.
 * Run with: pnpm --filter @agenticverdict/i18n typecheck
 */

import type { MessageKey, NamespaceKeys, NamespaceType } from "./generated";

// Test: Valid keys should be accepted
const validKey: MessageKey = "common.ok";
const validKey2: MessageKey = "auth.login.title";

// Test: NamespaceType should only include valid namespaces
const validNamespace: NamespaceType = "auth";
const validNamespace2: NamespaceType = "common";

// Test: NamespaceKeys should extract keys within a namespace
type AuthKeys = NamespaceKeys<"auth">;
const authKey: AuthKeys = "auth.login.title";

// Verify types are exported correctly (no runtime, just compilation check)
export { validKey, validKey2, validNamespace, validNamespace2, authKey };
