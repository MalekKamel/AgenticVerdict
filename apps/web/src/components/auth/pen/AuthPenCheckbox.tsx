"use client";

import { Checkbox, clsx, type CheckboxProps } from "@agenticverdict/ui";

/**
 * `Auth/Checkbox` (`R6srm`) — 20×20, radius 4, gap 8, accent {@link AUTH_PEN.primary} (authentication.pen).
 */
export function AuthPenCheckbox({ className, ...props }: CheckboxProps) {
  return (
    <Checkbox
      {...props}
      className={clsx(
        "gap-2 [&_span]:text-sm [&_span]:font-normal [&_span]:text-[#212121]",
        "[&_input]:!h-5 [&_input]:!w-5 [&_input]:!rounded [&_input]:!border-[#e0e0e0]",
        "[&_input:checked]:!border-[#228be6] [&_input:checked]:!bg-[#228be6]",
        "focus-visible:[&_input]:!ring-[#228be6]",
        className,
      )}
    />
  );
}
