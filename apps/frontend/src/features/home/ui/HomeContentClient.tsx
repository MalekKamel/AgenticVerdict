import {
  Badge,
  Breadcrumbs,
  Image,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import type { TenantConfig } from "@agenticverdict/config";
import { createLocalizationFormatters, type AppLocale } from "@agenticverdict/i18n/formatters";

import { DemoLeadForm } from "@/features/home/ui/DemoLeadForm";
import { AppCard } from "@/components/ui/AppCard";
import { useLocale, useTranslations } from "@/i18n/react";
import { Link } from "@/i18n/navigation";

function toAppLocale(code: string): AppLocale {
  return code === "ar" ? "ar" : "en";
}

export function HomeContentClient({ config }: { config: TenantConfig }) {
  const t = useTranslations("Home");
  const code = useLocale();
  const appLocale = toAppLocale(code);
  const localization = config.localization ?? {
    language: "en",
    region: "US",
    timezone: "America/New_York",
    currency: "USD",
  };
  const formatters = createLocalizationFormatters(appLocale, localization);
  const sampleDate = new Date("2026-04-04T12:00:00.000Z");

  return (
    <Stack gap="xl">
      <Breadcrumbs>
        <Link href="/">{t("breadcrumbHome")}</Link>
      </Breadcrumbs>

      <Stack gap="xs">
        <Title order={1}>{t("title")}</Title>
        <Text c="gray.7">{t("subtitle")}</Text>
        <Image
          src="/globe.svg"
          alt=""
          w={120}
          h={120}
          fit="contain"
          loading="lazy"
          style={{ alignSelf: "flex-start" }}
        />
        <Text>
          {t("tenantLabel")}: {config.tenantName}
        </Text>
        <Text>
          {t("languageLabel")}: {localization.language.toUpperCase()}
        </Text>
        <Text>
          {t("regionLabel")}: {localization.region}
        </Text>
      </Stack>

      <Tabs defaultValue="preview">
        <Tabs.List>
          <Tabs.Tab value="preview">{t("previewTitle")}</Tabs.Tab>
          <Tabs.Tab value="form">{t("formTab")}</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="preview" pt="md">
          <Stack gap="md">
            <Title order={3}>{t("previewTitle")}</Title>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <AppCard>
                <Stack gap="xs">
                  <Text fw={500}>{t("sampleCurrencyLabel")}</Text>
                  <Text>{formatters.formatCurrency(12_345.67)}</Text>
                </Stack>
              </AppCard>
              <AppCard>
                <Stack gap="xs">
                  <Text fw={500}>{t("sampleDateLabel")}</Text>
                  <Text>
                    {formatters.formatDate(sampleDate, {
                      dateStyle: "full",
                      timeStyle: "short",
                    })}
                  </Text>
                </Stack>
              </AppCard>
            </SimpleGrid>
            <Text>
              <Text span fw={500}>
                {t("pluralLabel")}:{" "}
              </Text>
              {t("itemCount", { count: 0 })} · {t("itemCount", { count: 1 })} ·{" "}
              {t("itemCount", { count: 3 })}
            </Text>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t("tableName")}</Table.Th>
                  <Table.Th>{t("tableRole")}</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td>Sara</Table.Td>
                  <Table.Td>{t("rowAnalyst")}</Table.Td>
                  <Table.Td>
                    <Badge variant="outline" color="blue">
                      {t("badgeNew")}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>Omar</Table.Td>
                  <Table.Td>{t("rowAdmin")}</Table.Td>
                  <Table.Td>—</Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value="form" pt="md">
          <AppCard maw={480}>
            <DemoLeadForm />
          </AppCard>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
