"use client";

import { Stack, Text, Title } from "@mantine/core";
import type { CompanyConfig } from "@agenticverdict/config";
import { useTranslations } from "next-intl";

export function HomeContentClient({ config }: { config: CompanyConfig }) {
  const t = useTranslations("Home");

  return (
    <Stack gap="md">
      <Title order={1}>{t("title")}</Title>
      <Text c="dimmed">{t("subtitle")}</Text>
      <Text>
        {t("companyLabel")}: {config.companyName}
      </Text>
      <Text>
        {t("languageLabel")}: {config.localization.language.toUpperCase()}
      </Text>
      <Text>
        {t("regionLabel")}: {config.localization.region}
      </Text>
    </Stack>
  );
}
