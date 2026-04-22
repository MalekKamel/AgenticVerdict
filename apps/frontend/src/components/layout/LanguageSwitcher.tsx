"use client";

import { Button, Group } from "@mantine/core";
import { useLocale } from "@/i18n/react";

import { Link, useLocaleAwareCurrentPath } from "@/i18n/navigation";

const LOCALES = ["en", "ar"] as const;

type LanguageSwitcherProps = {
  onSwitch?: (locale: (typeof LOCALES)[number]) => void;
};

export function LanguageSwitcher({ onSwitch }: LanguageSwitcherProps) {
  const localeAwarePath = useLocaleAwareCurrentPath();
  const locale = useLocale();

  return (
    <Group gap={4} wrap="nowrap">
      {LOCALES.map((l) => (
        <Button
          key={l}
          component={Link}
          href={localeAwarePath}
          locale={l}
          size="compact-sm"
          variant={l === locale ? "filled" : "outline"}
          onClick={() => onSwitch?.(l)}
        >
          {l.toUpperCase()}
        </Button>
      ))}
    </Group>
  );
}
