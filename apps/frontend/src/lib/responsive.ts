/**
 * Mantine breakpoint variables (aligned with postcss-simple-vars in postcss.config.mjs).
 */
export const MANTINE_BREAKPOINTS_EM = {
  xs: "36em",
  sm: "48em",
  md: "62em",
  lg: "75em",
  xl: "88em",
} as const;

export type MantineBreakpoint = keyof typeof MANTINE_BREAKPOINTS_EM;
