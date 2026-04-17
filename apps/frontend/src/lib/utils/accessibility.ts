/**
 * Accessibility utilities
 *
 * Provides WCAG 2.1 AA compliant helper functions for ARIA attributes,
 * focus management, and other accessibility features.
 *
 * Resources:
 * - WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
 * - ARIA Practices: https://www.w3.org/WAI/ARIA/apg/
 */

/**
 * Generate unique ID for ARIA attributes
 *
 * Creates deterministic IDs for ARIA attributes to ensure
 * proper association between elements and their descriptors.
 *
 * @param base - Base identifier for the ID
 * @param suffix - Optional suffix to make ID unique
 * @returns ARIA-compatible ID string
 *
 * @example
 * ```tsx
 * const errorId = generateAriaId("email", "error");
 * const hintId = generateAriaId("email", "hint");
 *
 * <input
 *   id="email"
 *   aria-invalid={hasError}
 *   aria-describedby={`${errorId} ${hintId}`}
 * />
 * <p id={errorId} role="alert">{errorMessage}</p>
 * <p id={hintId}>Enter your email address</p>
 * ```
 */
export function generateAriaId(base: string, suffix?: string): string {
  const cleanBase = base.replace(/[^a-zA-Z0-9-]/g, "-");
  const cleanSuffix = suffix ? `-${suffix.replace(/[^a-zA-Z0-9-]/g, "-")}` : "";
  return `${cleanBase}${cleanSuffix}`;
}

/**
 * ARIA attribute builders
 *
 * Consistent builders for common ARIA attribute patterns.
 */

/**
 * Build aria-describedby attribute value
 *
 * Combines multiple descriptor IDs into a space-separated string.
 *
 * @param descriptors - Array of descriptor IDs
 * @returns Space-separated string or undefined
 */
export function ariaDescribedBy(...descriptors: (string | undefined)[]): string | undefined {
  const validDescriptors = descriptors.filter(Boolean) as string[];
  return validDescriptors.length > 0 ? validDescriptors.join(" ") : undefined;
}

/**
 * Build aria-labelledby attribute value
 *
 * Combines multiple label IDs into a space-separated string.
 *
 * @param labels - Array of label IDs
 * @returns Space-separated string or undefined
 */
export function ariaLabelledBy(...labels: (string | undefined)[]): string | undefined {
  const validLabels = labels.filter(Boolean) as string[];
  return validLabels.length > 0 ? validLabels.join(" ") : undefined;
}

/**
 * Build aria-errormessage attribute value
 *
 * Returns the error message ID if there's an error.
 *
 * @param errorId - Error message element ID
 * @param hasError - Whether there's an error
 * @returns Error ID or undefined
 */
export function ariaErrorMessage(errorId: string, hasError: boolean): string | undefined {
  return hasError ? errorId : undefined;
}

/**
 * Get ARIA attributes for form fields
 *
 * Returns complete ARIA attributes for a form field with error and hint.
 *
 * @param options - Field options
 * @returns ARIA attributes object
 *
 * @example
 * ```tsx
 * const ariaProps = getFieldAriaProps({
 *   id: "email",
 *   hasError: true,
 *   errorId: "email-error",
 *   hintId: "email-hint",
 *   required: true,
 * });
 *
 * <input {...ariaProps} />
 * ```
 */
export function getFieldAriaProps(options: {
  id: string;
  hasError?: boolean;
  errorId?: string;
  hintId?: string;
  required?: boolean;
  invalid?: boolean;
}) {
  const { id, hasError, errorId, hintId, required, invalid = hasError } = options;

  const descriptors = ariaDescribedBy(hasError ? errorId : undefined, hintId);

  return {
    id,
    "aria-invalid": invalid ? true : undefined,
    "aria-required": required ? true : undefined,
    "aria-describedby": descriptors,
    "aria-errormessage": hasError && errorId ? errorId : undefined,
  };
}

/**
 * Focus management utilities
 */

/**
 * Trap focus within a container
 *
 * Implements focus trapping for modals and dialogs per ARIA practices.
 * Use with useEffect to manage focus trapping lifecycle.
 *
 * @param container - Container element to trap focus within
 * @returns Cleanup function to remove focus trap
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   if (isOpen) {
 *     const cleanup = trapFocus(modalRef.current);
 *     return cleanup;
 *   }
 * }, [isOpen]);
 * ```
 */
export function trapFocus(container: HTMLElement | null): () => void {
  if (!container) {
    return () => {};
  }

  // Get all focusable elements
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  // Handle tab key
  const handleTabKey = (event: KeyboardEvent) => {
    if (event.key !== "Tab") return;

    // Shift + Tab
    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
    }
    // Tab
    else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  };

  // Focus first element
  firstElement?.focus();

  // Add event listener
  container.addEventListener("keydown", handleTabKey);

  // Return cleanup function
  return () => {
    container.removeEventListener("keydown", handleTabKey);
  };
}

/**
 * Restore focus to previous element
 *
 * Captures the currently focused element and returns a function
 * to restore focus to that element. Useful for modals and dropdowns.
 *
 * @returns Function to restore focus
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   const restoreFocus = captureFocus();
 *
 *   return () => {
 *     restoreFocus();
 *   };
 * }, []);
 * ```
 */
export function captureFocus(): () => void {
  const activeElement = document.activeElement as HTMLElement;

  return () => {
    activeElement?.focus();
  };
}

/**
 * Focus management for announcements
 *
 * Moves focus to a live region for screen reader announcements.
 *
 * @param element - Element to announce
 *
 * @example
 * ```tsx
 * const announceRef = useRef<HTMLDivElement>(null);
 *
 * const showSuccess = () => {
 *   announceRef.current?.textContent = "Changes saved successfully";
 *   announceToScreenReader(announceRef.current);
 * };
 *
 * <div ref={announceRef} role="status" aria-live="polite" className="sr-only" />
 * ```
 */
export function announceToScreenReader(element: HTMLElement | null): void {
  element?.focus();

  // Clear after announcement to allow re-announcing same message
  setTimeout(() => {
    element?.setAttribute("aria-live", "off");
    setTimeout(() => {
      element?.setAttribute("aria-live", "polite");
    }, 100);
  }, 1000);
}

/**
 * Move focus to error container
 *
 * Moves focus to an error element for accessibility and announces to screen readers.
 * Scrolls the error into view for better visibility.
 *
 * @param element - Error element to focus
 * @param options - Focus options
 *
 * @example
 * ```tsx
 * const errorRef = useRef<HTMLDivElement>(null);
 *
 * const showError = () => {
 *   focusErrorElement(errorRef.current);
 * };
 *
 * <div ref={errorRef} role="alert" aria-live="assertive">
 *   Error message
 * </div>
 * ```
 */
export function focusErrorElement(
  element: HTMLElement | null,
  options: { scroll?: boolean; scrollBehavior?: ScrollBehavior } = {},
): void {
  if (!element) {
    return;
  }

  const { scroll = true, scrollBehavior = "smooth" } = options;

  // Move focus to error element
  element.focus({
    preventScroll: !scroll,
  });

  // Scroll into view if requested
  if (scroll) {
    element.scrollIntoView({
      behavior: scrollBehavior,
      block: "center",
      inline: "nearest",
    });
  }

  // Ensure screen reader announcement
  // Force aria-live to re-announce by temporarily removing and re-adding
  const currentLive = element.getAttribute("aria-live");
  if (currentLive) {
    element.setAttribute("aria-live", "off");
    setTimeout(() => {
      element.setAttribute("aria-live", currentLive);
    }, 100);
  }
}

/**
 * Keyboard interaction helpers
 */

/**
 * Check if key press is an activation key
 *
 * Determines if a keyboard event should trigger an action
 * (Enter or Space for buttons/links).
 *
 * @param event - Keyboard event
 * @returns true if key is an activation key
 */
export function isActivationKey(event: React.KeyboardEvent): boolean {
  return event.key === "Enter" || event.key === " ";
}

/**
 * Handle keyboard activation
 *
 * Wraps onClick handlers to also trigger on keyboard activation.
 *
 * @param handler - Original click handler
 * @returns Enhanced handler with keyboard support
 *
 * @example
 * ```tsx
 * <div
 *   role="button"
 *   tabIndex={0}
 *   onClick={handleClick}
 *   onKeyDown={handleKeyboardActivation(handleClick)}
 * />
 * ```
 */
export function handleKeyboardActivation(
  handler: () => void,
): (event: React.KeyboardEvent) => void {
  return (event) => {
    if (isActivationKey(event)) {
      event.preventDefault();
      handler();
    }
  };
}

/**
 * Screen reader utilities
 */

/**
 * Visually hide but keep accessible for screen readers
 *
 * Utility class for content that should be announced but not visible.
 * Use the "sr-only" CSS class from your global styles.
 *
 * @example
 * ```tsx
 * <span className="sr-only">Loading data, please wait</span>
 * ```
 */

/**
 * Create live region props
 *
 * Returns ARIA attributes for live regions used for announcements.
 *
 * @param polite - Use "polite" vs "assertive" (default: polite)
 * @returns ARIA live region attributes
 *
 * @example
 * ```tsx
 * const liveRegionProps = createLiveRegionProps();
 *
 * <div {...liveRegionProps}>{announcement}</div>
 * ```
 */
export function createLiveRegionProps(polite: boolean = true) {
  return {
    role: "status" as const,
    "aria-live": polite ? "polite" : "assertive",
    "aria-atomic": "true",
  };
}

/**
 * Form validation accessibility helpers
 */

/**
 * Get validation ARIA attributes
 *
 * Returns ARIA attributes for form validation states.
 *
 * @param options - Validation options
 * @returns ARIA validation attributes
 */
export function getValidationAriaProps(options: {
  hasError: boolean;
  errorId?: string;
  hintId?: string;
  description?: string;
}) {
  const { hasError, errorId, hintId, description } = options;

  return {
    "aria-invalid": hasError,
    "aria-describedby": ariaDescribedBy(
      hasError ? errorId : undefined,
      hintId,
      description ? generateAriaId("field", "description") : undefined,
    ),
    "aria-errormessage": hasError ? errorId : undefined,
  };
}

/**
 * Error ARIA utilities
 */

/**
 * Get error container ARIA attributes
 *
 * Returns proper ARIA attributes for error display containers.
 *
 * @param options - Error container options
 * @returns ARIA attributes for error container
 *
 * @example
 * ```tsx
 * const errorAriaProps = getErrorContainerAriaProps({
 *   id: "login-error",
 *   type: "assertive"
 * })
 *
 * <div {...errorAriaProps}>
 *   Error message here
 * </div>
 * ```
 */
export function getErrorContainerAriaProps(options: { id: string; type?: "assertive" | "polite" }) {
  const { id, type = "assertive" } = options;

  return {
    id,
    role: "alert",
    "aria-live": type,
    "aria-atomic": "true",
    tabIndex: -1, // Make focusable but not in tab order
  };
}

/**
 * Get error summary ARIA attributes
 *
 * Returns ARIA attributes for error summary components.
 *
 * @param options - Error summary options
 * @returns ARIA attributes for error summary
 *
 * @example
 * ```tsx
 * const summaryAriaProps = getErrorSummaryAriaProps({
 *   id: "form-errors",
 *   errorCount: 3
 * })
 *
 * <div {...summaryAriaProps}>
 *   <h3>3 errors found</h3>
 *   <ul>...</ul>
 * </div>
 * ```
 */
export function getErrorSummaryAriaProps(options: { id: string; errorCount: number }) {
  const { id, errorCount } = options;

  return {
    id,
    role: "alert",
    "aria-live": "assertive",
    "aria-atomic": "true",
    "aria-label": `${errorCount} error${errorCount !== 1 ? "s" : ""} found`,
    tabIndex: -1,
  };
}

/**
 * Get field error ARIA attributes
 *
 * Returns ARIA attributes for field-level error messages.
 *
 * @param options - Field error options
 * @returns ARIA attributes for field error
 *
 * @example
 * ```tsx
 * const fieldErrorAriaProps = getFieldErrorAriaProps({
 *   id: "email-error",
 *   fieldId: "email"
 * })
 *
 * <p {...fieldErrorAriaProps}>Email is required</p>
 * ```
 */
export function getFieldErrorAriaProps(options: { id: string; fieldId?: string }) {
  const { id, fieldId } = options;

  return {
    id,
    role: "alert",
    "aria-live": "polite",
    ...(fieldId && { "aria-labelledby": fieldId }),
  };
}

/**
 * Create ARIA props for live regions
 *
 * Returns complete ARIA attributes for live region announcements.
 *
 * @param options - Live region options
 * @returns ARIA live region attributes
 *
 * @example
 * ```tsx
 * const liveRegionProps = createLiveRegionProps({
 *   polite: true,
 *   id: "status-announcer"
 * })
 *
 * <div {...liveRegionProps} />
 * ```
 */
export function createLiveRegionPropsWithId(options: { polite?: boolean; id?: string }) {
  const { polite = true, id } = options;

  return {
    ...(id && { id }),
    role: "status" as const,
    "aria-live": polite ? "polite" : "assertive",
    "aria-atomic": "true",
  };
}
