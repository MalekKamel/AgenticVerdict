"use client";

import { Button, Group } from "@mantine/core";
import { useLocale } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

const LOCALES = ["en", "ar"] as const;

export function LanguageSwitcher() {
  const pathname = usePathname();
  const locale = useLocale();

  return (
    <Group gap={4} wrap="nowrap">
      {LOCALES.map((l) => (
        <Button
          key={l}
          component={Link}
          href={pathname}
          locale={l}
          size="compact-sm"
          variant={l === locale ? "filled" : "outline"}
        >
          {l.toUpperCase()}
        </Button>
      ))}
    </Group>
  );
}
