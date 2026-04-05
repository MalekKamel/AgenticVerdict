/**
 * Merges tenant-specific overrides on top of bundled default messages (file-backed).
 */
export function mergeMessageDictionaries(
  base: Readonly<Record<string, string>>,
  overrides: Readonly<Record<string, string>>,
): Record<string, string> {
  return { ...base, ...overrides };
}
