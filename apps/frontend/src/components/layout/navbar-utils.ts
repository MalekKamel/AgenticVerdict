/**
 * Get the appropriate icon for the navbar toggle button based on direction and collapsed state.
 * Uses double angle quotation marks that point in the direction the navbar will move when toggled.
 */
export function getNavbarToggleIcon(isRTL: boolean, collapsed: boolean): string {
  return collapsed ? (isRTL ? "«" : "»") : isRTL ? "»" : "«";
}
