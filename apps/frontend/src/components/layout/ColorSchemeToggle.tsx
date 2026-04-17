"use client";

import { ActionIcon, useMantineColorScheme } from "@mantine/core";
import { useTranslations } from "@/i18n/react";

export function ColorSchemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const t = useTranslations("Layout");

  return (
    <ActionIcon
      onClick={() => toggleColorScheme()}
      variant="default"
      size="lg"
      radius="md"
      aria-label={colorScheme === "dark" ? t("toggleLight") : t("toggleDark")}
    >
      {colorScheme === "dark" ? "☀" : "☾"}
    </ActionIcon>
  );
}
