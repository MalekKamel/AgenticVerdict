/**
 * Password field — uses Mantine `PasswordInput` (tested, maintained) with
 * app defaults: radius, full width, i18n toggle labels, and a keyboard-focusable
 * visibility control (`tabIndex` override; Mantine defaults the toggle to `tabIndex={-1}`).
 */

"use client";

import { PasswordInput as MantinePasswordInput, type PasswordInputProps } from "@mantine/core";
import { useTranslations } from "@/i18n/react";
import { forwardRef, useCallback, useState } from "react";

export type AppPasswordInputProps = PasswordInputProps;

export const PasswordInput = forwardRef<HTMLInputElement, AppPasswordInputProps>(
  (
    {
      defaultVisible,
      onVisibilityChange,
      visible,
      visibilityToggleButtonProps: userVisToggleProps,
      ...rest
    },
    ref,
  ) => {
    const t = useTranslations("auth");
    const [internalRevealed, setInternalRevealed] = useState(!!defaultVisible);
    const revealed = visible !== undefined ? !!visible : internalRevealed;

    const handleVisibilityChange = useCallback(
      (next: boolean) => {
        if (visible === undefined) {
          setInternalRevealed(next);
        }
        onVisibilityChange?.(next);
      },
      [onVisibilityChange, visible],
    );

    return (
      <MantinePasswordInput
        ref={ref}
        radius="md"
        w="100%"
        defaultVisible={defaultVisible}
        visible={visible}
        onVisibilityChange={handleVisibilityChange}
        visibilityToggleButtonProps={{
          tabIndex: 0,
          "aria-pressed": revealed,
          "aria-label": revealed ? t("password.hidePassword") : t("password.showPassword"),
          ...userVisToggleProps,
        }}
        {...rest}
      />
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
