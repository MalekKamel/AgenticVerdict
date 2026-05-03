/**
 * @agenticverdict/ui - Design System Package
 *
 * **Tokens & providers** for AgenticVerdict: three-tier design tokens, tenant branding,
 * RTL/LTR, and Mantine theme wiring. **Primitives** that are not one-to-one with Mantine
 * (`Icon`, `AppShellNavList`) live here; use **`@mantine/core`** directly for buttons,
 * inputs, layout, feedback, and overlays.
 */

// ===================================================================
// DESIGN TOKENS
// ===================================================================
export * from "./tokens";

// ===================================================================
// PROVIDERS
// ===================================================================
export * from "./providers";

// ===================================================================
// HOOKS
// ===================================================================
export * from "./hooks";

// ===================================================================
// COMPOSABLE PRIMITIVES (non–Mantine-duplicative)
// ===================================================================
export * from "./atoms/Icon";
export * from "./atoms/StatusIndicator";
export * from "./atoms/DataFreshnessBadge";
export * from "./molecules/AppShellNavList";

// ===================================================================
// UTILITIES
// ===================================================================

/**
 * Utility function to merge classnames
 * Re-exported for convenience
 */
export { clsx } from "clsx";
export { clsx as cn } from "clsx";
