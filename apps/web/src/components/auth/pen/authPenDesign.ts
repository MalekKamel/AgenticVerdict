/**
 * Tokens and node IDs from `design/features/auth.pen`
 * (extracted via Pencil MCP `batch_get` / `get_editor_state` — see
 * `design/docs/generation/ui-generation-cheatsheet.md`).
 */
export const AUTH_PEN_NODE_IDS = {
  buttonBase: "ZoQdG",
  authBtnPrimary: "ollIq",
  authBtnSecondary: "t9EZp",
  authBtnGhost: "wkvOZ",
  formField: "oTxhG",
  card: "yMbmO",
  checkbox: "R6srm",
  alertError: "x04Fm",
  alertSuccess: "5KAp1",
  brand: "VW3Se",
  linkRow: "aLZcA",
  actionsRow: "d9wnR",
  footerCenter: "ih55w",
  textMuted: "6DckF",
  loadingIndicator: "yShFU",
  screen: "uimay",
  screens: "k9d2u",
} as const;

/**
 * Layout / typography from reusable frames (Pencil MCP `batch_get`, readDepth ≥ 3):
 * - `ZoQdG` Auth/Button/Base — h 40, radius 8, padding [8,16], gap 8, label 16/600 #fff
 * - `oTxhG` Auth/FormField — gap 4, w 400; label 14/400 #212121; input h 40, pad 12, radius 8, stroke #E0E0E0
 * - `yMbmO` Auth/Card — w 440, radius 8, shadow blur 4 y2 #0000001a; header pad 24 gap 8; body pad [0,24,24,24] gap 16
 * - `R6srm` Auth/Checkbox — box 20, radius 4, gap 8, stroke #E0E0E0, mark #228BE6
 * - `x04Fm` Auth/Alert/Error — pad 12, gap 12, radius 8, fill #FFEBEE, stroke #D32F2F
 * - `5KAp1` Auth/Alert/Success — same layout as error; fill #E8F5E9, stroke #2E7D32, lucide check 20
 * - `VW3Se` Auth/Brand — gap 12, lucide shield-check 40, wordmark 20/600 #212121
 * - `aLZcA` Auth/LinkRow — w 400, space_between, links 14/400 #228BE6
 * - `d9wnR` Auth/ActionsRow — w 400, center, gap 12 (primary + ghost `ZoQdG` refs)
 * - `ih55w` Auth/FooterCenter — w 400, center, gap 8; muted 14 + semibold link #228BE6
 * - `6DckF` Auth/Text/Muted — centered caption 14 #757575
 * - `yShFU` Auth/LoadingIndicator — 48×48 frame, lucide refresh-cw 40 #228BE6
 * - `uimay` Auth/Screen — 800×980, pad 32, #F5F5F5, gap 24, brand + card composition
 */
export const AUTH_PEN = {
  screenBg: "#f5f5f5",
  canvasBg: "#eceff1",
  textPrimary: "#212121",
  textSecondary: "#757575",
  textPlaceholder: "#9e9e9e",
  borderDefault: "#e0e0e0",
  primary: "#228be6",
  primaryHover: "#1c7ed6",
  secondaryFill: "#e7f5ff",
  error: "#d32f2f",
  errorSurface: "#ffebee",
  success: "#2e7d32",
  successSurface: "#e8f5e9",
  /** Outer shadow from `yMbmO` (effect blur 4, offset 0,2, #0000001a). */
  cardShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  cardMaxWidthPx: 440,
  screenMaxWidthPx: 800,
  screenPaddingPx: 32,
  brandIconPx: 40,
  brandWordmarkPx: 20,
  buttonHeightPx: 40,
  buttonRadiusPx: 8,
  buttonPaddingYPx: 8,
  buttonPaddingXPx: 16,
  buttonGapPx: 8,
  formFieldGapPx: 4,
  formFieldMaxWidthPx: 400,
  cardBodyGapPx: 16,
  cardHeaderPaddingPx: 24,
  alertPaddingPx: 12,
  alertGapPx: 12,
  alertIconPx: 20,
  checkboxBoxPx: 20,
  checkboxRadiusPx: 4,
  checkboxGapPx: 8,
} as const;
