"use client";

import { useState } from "react";
import {
  Container,
  Stack,
  Text,
  Button,
  SegmentedControl,
  Group,
  Card,
  TextInput,
  Skeleton,
  List,
} from "@mantine/core";
import { useParams, useSearch } from "@/router/hooks";
import { useRouter } from "@/i18n/navigation";
import { IconAlertTriangle, IconDownload } from "@tabler/icons-react";

import { useAppShellHeader } from "@/features/shell/ui/app-shell-context";
import { useConnectorDetail, useConnectorDelete } from "@/features/connectors/api/connector-api";
import { useConnectorRemovalPreview } from "@/features/connectors/api/connector-api";
import { inputValueFromChangeEvent } from "@/lib/dom/safe-input-change";
import { useTranslations } from "@/i18n/react";

export default function ConnectorRemovePage() {
  const tNav = useTranslations("navigation");
  const tCommon = useTranslations("common");
  const t = useTranslations("connectors");
  const params = useParams({ from: "/$locale/dashboard/connectors/$id/remove" }) as { id: string };
  const { id } = params;
  const router = useRouter();
  const search = useSearch({ from: "/$locale/dashboard/connectors/$id/remove" }) as Record<
    string,
    unknown
  >;
  const { data: connector, isLoading } = useConnectorDetail(id);
  const { data: preview } = useConnectorRemovalPreview(id);
  const deleteMutation = useConnectorDelete();
  const [action, setAction] = useState<"pause" | "remove">(
    search.pause === true ? "pause" : "remove",
  );
  const [confirmText, setConfirmText] = useState("");
  const [exporting, setExporting] = useState(false);

  useAppShellHeader({
    breadcrumbs: [
      { label: tNav("dashboard"), href: "/dashboard" },
      { label: tNav("connectors"), href: "/dashboard/connectors" },
      { label: connector?.name ?? t("common.connector"), href: `/dashboard/connectors/${id}` },
      { label: t("common.remove"), href: `/dashboard/connectors/${id}/remove` },
    ],
  });

  const redirectTo = (search.redirect as string) || "/dashboard/connectors";

  async function handleConfirm() {
    const res = await deleteMutation.mutateAsync({ id, pause: action === "pause" });
    if (res.success) {
      router.push(redirectTo as string);
    }
  }

  function handleExport() {
    setExporting(true);
    setTimeout(() => setExporting(false), 2000);
  }

  if (isLoading) {
    return (
      <Container py="xl" size="md">
        <Stack gap="lg">
          <Skeleton height={40} width="40%" />
          <Skeleton height={120} />
          <Skeleton height={80} />
        </Stack>
      </Container>
    );
  }

  if (!connector) {
    return (
      <Container py="xl" size="md">
        <Text>{t("common.notFound")}</Text>
      </Container>
    );
  }

  const canConfirm = action === "pause" || confirmText === "REMOVE";

  return (
    <Container py="xl" size="md">
      <Stack gap="lg">
        <Text size="xl" fw={700}>
          {t("remove.title", { name: connector.name })}
        </Text>

        <Card withBorder padding="md">
          <Stack gap="xs">
            <Group>
              <IconAlertTriangle size={20} color="var(--mantine-color-orange-6)" />
              <Text fw={600}>{t("remove.warningTitle")}</Text>
            </Group>
            <Text size="sm">{t("remove.warningBody")}</Text>
            <List size="sm">
              {(
                preview?.impacts ?? [
                  t("remove.impacts.dataCollectionStops"),
                  t("remove.impacts.historicalInsightsOnly"),
                  t("remove.impacts.noNewReports"),
                  t("remove.impacts.historicalRetention"),
                  t("remove.impacts.canReconnectAnytime"),
                ]
              ).map((impact, i) => (
                <List.Item key={i}>{impact}</List.Item>
              ))}
            </List>
          </Stack>
        </Card>

        {preview && preview.affectedInsights.length > 0 && (
          <Card withBorder padding="md">
            <Stack gap="xs">
              <Text fw={600}>{t("remove.affectedInsightsTitle")}</Text>
              <List size="sm">
                {preview.affectedInsights.map((insight) => (
                  <List.Item key={insight.id}>{insight.name}</List.Item>
                ))}
              </List>
            </Stack>
          </Card>
        )}

        <Card withBorder padding="md">
          <Stack gap="xs">
            <Text fw={600}>{t("remove.alternativeOptionsTitle")}</Text>
            <SegmentedControl
              fullWidth
              orientation="vertical"
              value={action}
              onChange={(value) => setAction(value as "pause" | "remove")}
              data={[
                { value: "pause", label: t("remove.options.pause") },
                { value: "remove", label: t("remove.options.remove") },
              ]}
            />
          </Stack>
        </Card>

        <Card withBorder padding="md">
          <Stack gap="xs">
            <Text fw={600}>{t("remove.exportTitle")}</Text>
            <Text size="sm" c="dimmed">
              {t("remove.exportDescription")}
            </Text>
            <Button
              leftSection={<IconDownload size={16} />}
              variant="default"
              loading={exporting}
              onClick={handleExport}
            >
              {t("remove.exportAction")}
            </Button>
          </Stack>
        </Card>

        {action === "remove" && (
          <Card withBorder padding="md">
            <Stack gap="xs">
              <Text fw={600}>{t("remove.confirmTitle")}</Text>
              <Text size="sm">{t("remove.confirmInstructions")}</Text>
              <TextInput
                placeholder="REMOVE"
                value={confirmText}
                onChange={(e) => setConfirmText(inputValueFromChangeEvent(e))}
              />
            </Stack>
          </Card>
        )}

        <Group justify="space-between">
          <Button variant="subtle" onClick={() => router.push(`/dashboard/connectors/${id}`)}>
            {tCommon("cancel")}
          </Button>
          <Button
            color={action === "remove" ? "red" : "orange"}
            disabled={!canConfirm}
            loading={deleteMutation.isPending}
            onClick={handleConfirm}
          >
            {action === "pause"
              ? t("remove.actions.pauseConnector")
              : t("remove.actions.confirmRemoval")}
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
