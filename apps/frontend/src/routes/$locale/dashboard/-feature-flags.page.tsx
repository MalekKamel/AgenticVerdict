"use client";

import { Alert, Container, Stack, Table, Text, Title } from "@mantine/core";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { trpc } from "@/lib/api/trpc-client";
import { isFeatureFlagsAdminUiEnabled } from "@/lib/feature-flags/feature-flags-readiness";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "@/i18n/react";

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default function FeatureFlagsAdminPage() {
  const t = useTranslations("admin.featureFlags");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("navigation");
  const { user, isLoading } = useRequireAuth();
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { locale?: string };
  const locale = params.locale ?? "en";
  const enabled = isFeatureFlagsAdminUiEnabled();

  useEffect(() => {
    if (!enabled) {
      navigate({ to: `/${locale}/dashboard`, replace: true });
    }
  }, [enabled, locale, navigate]);

  if (!enabled) {
    return (
      <Container py="xl">
        <Text role="status">{tCommon("loading")}</Text>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container py="xl">
        <Text role="status">{tCommon("loading")}</Text>
      </Container>
    );
  }

  const rowsQuery = trpc.admin.featureFlags.list.useQuery(undefined, {
    enabled: Boolean(user),
  });

  return (
    <Container py="xl">
      <Stack gap="md">
        <Title order={1}>{t("title")}</Title>
        <Text>{user?.email}</Text>
        <Alert color="blue" title={t("liveTitle")}>
          {t("liveDescription")}
        </Alert>
        {rowsQuery.error ? (
          <Alert color="red" title={tCommon("error")}>
            {rowsQuery.error.message}
          </Alert>
        ) : null}
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("columnKey")}</Table.Th>
              <Table.Th>{t("columnType")}</Table.Th>
              <Table.Th>{t("columnDefault")}</Table.Th>
              <Table.Th>{t("columnResolved")}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rowsQuery.isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text role="status">{tCommon("loading")}</Text>
                </Table.Td>
              </Table.Tr>
            ) : null}
            {(rowsQuery.data ?? []).map((r) => (
              <Table.Tr key={r.flagKey}>
                <Table.Td>
                  <Text fw={500}>{r.flagKey}</Text>
                  {r.description ? (
                    <Text size="sm" c="dimmed">
                      {r.description}
                    </Text>
                  ) : null}
                </Table.Td>
                <Table.Td>{r.type}</Table.Td>
                <Table.Td>
                  <Text style={{ fontFamily: "monospace" }}>{formatJson(r.defaultValue)}</Text>
                </Table.Td>
                <Table.Td>
                  <Text style={{ fontFamily: "monospace" }}>{formatJson(r.resolvedValue)}</Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        <Link href="/dashboard">{tNav("dashboard")}</Link>
      </Stack>
    </Container>
  );
}
