"use client";

import { Select } from "@mantine/core";
import { getLocaleName, supportedLocales } from "@/i18n/locales";
import { useLocale } from "@/i18n/react";

import { useLocaleAwareCurrentPath } from "@/i18n/navigation";
import { setPreferredLocale } from "@/lib/storage/locale-storage";

type LanguageSwitcherProps = {
  onSwitch?: (locale: (typeof supportedLocales)[number]) => void;
};

export function LanguageSwitcher({ onSwitch }: LanguageSwitcherProps) {
  const localeAwarePath = useLocaleAwareCurrentPath();
  const locale = useLocale();
  const persistLocalePreference = (nextLocale: (typeof supportedLocales)[number]) => {
    setPreferredLocale(nextLocale);
    onSwitch?.(nextLocale);
  };

  const handleLocaleChange = (nextLocale: string | null) => {
    if (
      !nextLocale ||
      !supportedLocales.includes(nextLocale as (typeof supportedLocales)[number])
    ) {
      return;
    }

    const targetLocale = nextLocale as (typeof supportedLocales)[number];
    persistLocalePreference(targetLocale);

    const nextPath = localeAwarePath === "/" ? "" : localeAwarePath;
    window.location.assign(`/${targetLocale}${nextPath}`);
  };

  return (
    <Select
      aria-label="Select language"
      data={supportedLocales.map((supportedLocale) => ({
        value: supportedLocale,
        label: `${getLocaleName(supportedLocale)} (${supportedLocale.toUpperCase()})`,
      }))}
      value={locale}
      onChange={handleLocaleChange}
      size="xs"
      w={180}
      allowDeselect={false}
      checkIconPosition="right"
    />
  );
}
