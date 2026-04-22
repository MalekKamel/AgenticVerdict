/**
 * @agenticverdict/ui - Design System Package
 *
 * A comprehensive component library for AgenticVerdict multi-business-domain intelligence platform.
 * Implements atomic design principles with three-tier design token system.
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
// ATOMS - Basic UI building blocks
// ===================================================================
export * from "./atoms/Button";
export * from "./atoms/Input";
export * from "./atoms/Checkbox";
export * from "./atoms/Radio";
export * from "./atoms/Switch";
export * from "./atoms/Badge";
export * from "./atoms/Typography";
export * from "./atoms/Icon";
export * from "./atoms/Spinner";
export * from "./atoms/Separator";
export * from "./atoms/Link";

// ===================================================================
// MOLECULES - Simple combinations of atoms
// ===================================================================
export * from "./molecules/Card";
export * from "./molecules/FormField";
export * from "./molecules/Alert";
export * from "./molecules/SearchInput";
export * from "./molecules/Select";
export * from "./molecules/DatePicker";
export * from "./molecules/Dropdown";
export * from "./molecules/Tooltip";
export * from "./molecules/Popover";
export * from "./molecules/Toast";
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
