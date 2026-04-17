/**
 * Password validation utilities
 *
 * Provides comprehensive password strength checking and validation
 * for authentication forms. Includes WCAG 2.1 AA compliant accessibility
 * features for password requirements feedback.
 */

/**
 * Password requirement type
 */
export interface PasswordRequirement {
  /** Unique identifier for the requirement */
  id: string;
  /** Human-readable description of the requirement */
  label: string;
  /** Whether the requirement is met */
  met: boolean;
  /** ARIA identifier for accessibility */
  ariaId: string;
}

/**
 * Password strength level
 */
export enum PasswordStrength {
  /** Very weak password */
  VERY_WEAK = 0,
  /** Weak password */
  WEAK = 1,
  /** Fair password */
  FAIR = 2,
  /** Good password */
  GOOD = 3,
  /** Strong password */
  STRONG = 4,
}

/**
 * Password strength result
 */
export interface PasswordStrengthResult {
  /** Overall strength level */
  strength: PasswordStrength;
  /** Strength label for display */
  label: string;
  /** Strength percentage (0-100) */
  percentage: number;
  /** Color for visual indicator */
  color: string;
  /** Individual requirement checks */
  requirements: PasswordRequirement[];
}

/**
 * Configuration for password validation
 */
const PASSWORD_CONFIG = {
  minLength: 8,
  maxLength: 128,
  // Character requirements
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSpecial: /[^A-Za-z0-9]/,
  // Common patterns to avoid
  commonPatterns: [/123456/, /qwerty/i, /password/i, /abc123/i, /letmein/i, /admin/i],
} as const;

/**
 * Check if password meets minimum length requirement
 *
 * @param password - Password to check
 * @returns true if password meets minimum length
 */
export function hasMinLength(password: string): boolean {
  return password.length >= PASSWORD_CONFIG.minLength;
}

/**
 * Check if password exceeds maximum length
 *
 * @param password - Password to check
 * @returns true if password exceeds maximum length
 */
export function exceedsMaxLength(password: string): boolean {
  return password.length > PASSWORD_CONFIG.maxLength;
}

/**
 * Check if password contains uppercase letter
 *
 * @param password - Password to check
 * @returns true if password contains uppercase letter
 */
export function hasUppercase(password: string): boolean {
  return PASSWORD_CONFIG.hasUppercase.test(password);
}

/**
 * Check if password contains lowercase letter
 *
 * @param password - Password to check
 * @returns true if password contains lowercase letter
 */
export function hasLowercase(password: string): boolean {
  return PASSWORD_CONFIG.hasLowercase.test(password);
}

/**
 * Check if password contains number
 *
 * @param password - Password to check
 * @returns true if password contains number
 */
export function hasNumber(password: string): boolean {
  return PASSWORD_CONFIG.hasNumber.test(password);
}

/**
 * Check if password contains special character
 *
 * @param password - Password to check
 * @returns true if password contains special character
 */
export function hasSpecial(password: string): boolean {
  return PASSWORD_CONFIG.hasSpecial.test(password);
}

/**
 * Check if password contains common patterns
 *
 * @param password - Password to check
 * @returns true if password contains common pattern
 */
export function hasCommonPattern(password: string): boolean {
  return PASSWORD_CONFIG.commonPatterns.some((pattern) => pattern.test(password));
}

/**
 * Get all password requirements for a password
 *
 * Returns an array of requirement objects with accessibility attributes
 * for rendering requirement checklists.
 *
 * @param password - Password to check
 * @param baseId - Base ID for ARIA attributes (default: "password-requirement")
 * @returns Array of password requirements
 *
 * @example
 * ```tsx
 * const requirements = getPasswordRequirements("MyPass123");
 *
 * {requirements.map((req) => (
 *   <li key={req.id}>
 *     <Checkbox checked={req.met} aria-describedby={req.ariaId} />
 *     <span id={req.ariaId}>{req.label}</span>
 *   </li>
 * ))}
 * ```
 */
export function getPasswordRequirements(
  password: string,
  baseId: string = "password-requirement",
): PasswordRequirement[] {
  const requirements: PasswordRequirement[] = [
    {
      id: "minLength",
      label: "auth.password.requirements.minLength",
      met: hasMinLength(password),
      ariaId: `${baseId}-minlength`,
    },
    {
      id: "uppercase",
      label: "auth.password.requirements.uppercase",
      met: hasUppercase(password),
      ariaId: `${baseId}-uppercase`,
    },
    {
      id: "lowercase",
      label: "auth.password.requirements.lowercase",
      met: hasLowercase(password),
      ariaId: `${baseId}-lowercase`,
    },
    {
      id: "number",
      label: "auth.password.requirements.number",
      met: hasNumber(password),
      ariaId: `${baseId}-number`,
    },
    {
      id: "special",
      label: "auth.password.requirements.special",
      met: hasSpecial(password),
      ariaId: `${baseId}-special`,
    },
  ];

  return requirements;
}

/**
 * Calculate password strength
 *
 * Analyzes password and returns strength information including
 * level, label, percentage, and visual color.
 *
 * @param password - Password to analyze
 * @returns Password strength result
 *
 * @example
 * ```tsx
 * const strength = calculatePasswordStrength("MyStr0ng!Pass");
 *
 * <Progress value={strength.percentage} color={strength.color} />
 * <Text>{strength.label}</Text>
 * ```
 */
export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  let score = 0;

  // Length scoring (0-2 points)
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Character variety (0-4 points)
  if (hasLowercase(password)) score++;
  if (hasUppercase(password)) score++;
  if (hasNumber(password)) score++;
  if (hasSpecial(password)) score++;

  // Deduct points for common patterns
  if (hasCommonPattern(password)) {
    score = Math.max(0, score - 2);
  }

  // Normalize to 0-4 scale
  const normalizedStrength = Math.min(
    PasswordStrength.STRONG,
    Math.max(PasswordStrength.VERY_WEAK, Math.floor(score / 2)),
  );

  // Map to result
  const strengthMap: Record<
    PasswordStrength,
    Pick<PasswordStrengthResult, "label" | "percentage" | "color">
  > = {
    [PasswordStrength.VERY_WEAK]: {
      label: "auth.password.strength.veryWeak",
      percentage: 20,
      color: "var(--mantine-color-red-9)",
    },
    [PasswordStrength.WEAK]: {
      label: "auth.password.strength.weak",
      percentage: 40,
      color: "var(--mantine-color-orange-9)",
    },
    [PasswordStrength.FAIR]: {
      label: "auth.password.strength.fair",
      percentage: 60,
      color: "var(--mantine-color-yellow-9)",
    },
    [PasswordStrength.GOOD]: {
      label: "auth.password.strength.good",
      percentage: 80,
      color: "var(--mantine-color-lime-9)",
    },
    [PasswordStrength.STRONG]: {
      label: "auth.password.strength.strong",
      percentage: 100,
      color: "var(--mantine-color-green-9)",
    },
  };

  const strengthInfo = strengthMap[normalizedStrength as PasswordStrength];
  const requirements = getPasswordRequirements(password);

  return {
    strength: normalizedStrength,
    ...strengthInfo,
    requirements,
  };
}

/**
 * Validate password against all requirements
 *
 * Returns true if password meets all security requirements.
 *
 * @param password - Password to validate
 * @returns true if password is valid
 */
export function isPasswordValid(password: string): boolean {
  return (
    hasMinLength(password) &&
    !exceedsMaxLength(password) &&
    hasUppercase(password) &&
    hasLowercase(password) &&
    hasNumber(password) &&
    hasSpecial(password) &&
    !hasCommonPattern(password)
  );
}

/**
 * Get password validation error message
 *
 * Returns the first validation error message for a password.
 *
 * @param password - Password to validate
 * @returns Error message key or null if valid
 */
export function getPasswordErrorMessage(password: string): string | null {
  if (!hasMinLength(password)) {
    return "auth.password.errors.tooShort";
  }

  if (exceedsMaxLength(password)) {
    return "auth.password.errors.tooLong";
  }

  if (!hasUppercase(password)) {
    return "auth.password.errors.noUppercase";
  }

  if (!hasLowercase(password)) {
    return "auth.password.errors.noLowercase";
  }

  if (!hasNumber(password)) {
    return "auth.password.errors.noNumber";
  }

  if (!hasSpecial(password)) {
    return "auth.password.errors.noSpecial";
  }

  if (hasCommonPattern(password)) {
    return "auth.password.errors.commonPattern";
  }

  return null;
}
