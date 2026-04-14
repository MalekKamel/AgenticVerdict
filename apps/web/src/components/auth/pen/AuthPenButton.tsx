"use client";

import { Button, clsx, type ButtonProps } from "@agenticverdict/ui";

/** `ZoQdG` — label 16px / 600; `ollIq`/`t9EZp`/`wkvOZ` variant fills from authentication.pen. */
const PRIMARY =
  "!bg-[#228be6] !font-semibold !text-white hover:!bg-[#1c7ed6] active:!bg-[#1971c2] focus-visible:!ring-[#228be6] !border-transparent";
const SECONDARY =
  "!bg-[#e7f5ff] !font-semibold !text-[#228be6] !border !border-[#228be6] hover:!bg-[#d0ebff] focus-visible:!ring-[#228be6]";
const GHOST =
  "!bg-transparent !font-semibold !text-[#228be6] hover:!bg-[#e7f5ff]/60 focus-visible:!ring-[#228be6] !border-transparent";

/**
 * Auth button variants (ollIq / t9EZp / wkvOZ) — primary fill #228be6 from authentication.pen.
 */
export function AuthPenButton({ variant = "primary", className, ...props }: ButtonProps) {
  const pen = variant === "primary" ? PRIMARY : variant === "secondary" ? SECONDARY : GHOST;
  return <Button variant={variant} className={clsx(pen, className)} {...props} />;
}
