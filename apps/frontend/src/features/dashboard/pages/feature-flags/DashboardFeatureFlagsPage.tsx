"use client";

import { Alert, Anchor, Container, Stack, Table, Text, Title } from "@mantine/core";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";

import { useRequireAuth } from "@/features/auth/hooks/useRequireAuth";
import { useAppShellHeader } from "@/components/layout/app-shell-context";
import { trpc } from "@/lib/api/trpc-client";
import { normalizeFrontendError } from "@/lib/errors/normalized-error-adapter";
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

export default function DashboardFeatureFlagsPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tNav = useTranslations("navigation");
  const { user, isLoading } = useRequireAuth();
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { locale?: string };
  const locale = params.locale ?? "en";
  const enabled = isFeatureFlagsAdminUiEnabled();
  useAppShellHeader({
    breadcrumbs: [
      { label: tNav("dashboard"), href: "/dashboard" },
      { label: tNav("featureFlags"), href: "/dashboard/feature-flags" },
    ],
  });

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
  const normalizedQueryError = rowsQuery.error ? normalizeFrontendError(rowsQuery.error) : null;
  const queryErrorMessage =
    normalizedQueryError && normalizedQueryError.messageKey.startsWith("errors.")
      ? tErrors(
          normalizedQueryError.messageKey.slice("errors.".length),
          normalizedQueryError.messageParams,
        )
      : tErrors("common.unknownError");

  return (
    <Container py="xl">
      <Stack gap="md">
        <Title order={1}>{t("featureFlags.title")}</Title>
        <Text>{user?.email}</Text>
        <Alert color="blue" title={t("featureFlags.liveTitle")}>
          {t("featureFlags.liveDescription")}
        </Alert>
        {rowsQuery.error ? (
          <Alert color="red" title={tCommon("error")}>
            {queryErrorMessage}
          </Alert>
        ) : null}
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("featureFlags.columnKey")}</Table.Th>
              <Table.Th>{t("featureFlags.columnType")}</Table.Th>
              <Table.Th>{t("featureFlags.columnDefault")}</Table.Th>
              <Table.Th>{t("featureFlags.columnResolved")}</Table.Th>
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
        <Anchor component={Link} href="/dashboard">
          {tNav("dashboard")}
        </Anchor>
      </Stack>
    </Container>
  );
}
