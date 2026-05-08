"use client";

import React from "react";
import { ActionIcon, useMantineColorScheme, useComputedColorScheme } from "@mantine/core";
import { useTranslations } from "@/i18n/react";

type ColorSchemeToggleProps = {
  onToggle?: (nextColorScheme: "light" | "dark") => void;
};

export function ColorSchemeToggle({ onToggle }: ColorSchemeToggleProps) {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme();
  const t = useTranslations("Layout");
  const nextColorScheme = computedColorScheme === "dark" ? "light" : "dark";

  return (
    <ActionIcon
      id="color-scheme-toggle"
      data-testid="color-scheme-toggle"
      onClick={() => {
        setColorScheme(nextColorScheme);
        onToggle?.(nextColorScheme);
      }}
      variant="default"
      size="lg"
      radius="md"
      aria-label={computedColorScheme === "dark" ? t("toggleLight") : t("toggleDark")}
    >
      {computedColorScheme === "dark" ? "☀" : "☾"}
    </ActionIcon>
  );
}
