"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Stack,
  Text,
  Button,
  TextInput,
  SegmentedControl,
  Checkbox,
  Group,
  SimpleGrid,
  Card,
  TagsInput,
  Switch,
  Skeleton,
  Alert,
} from "@mantine/core";
import { useParams } from "@/router/hooks/useParams";
import { useRouter } from "@/i18n/navigation";
import { IconCheck, IconAlertCircle } from "@tabler/icons-react";

import { useAppShellHeader } from "@/components/layout/app-shell-context";
import {
  useConnectorDetail,
  useConnectorUpdate,
  useConnectorTest,
} from "@/features/connectors/api/connector-api";
import { useConnectorPermissions } from "@/features/connectors/hooks/useConnectorPermissions";
import {
  inputCheckedFromChangeEvent,
  inputValueFromChangeEvent,
} from "@/lib/dom/safe-input-change";
import { useTranslations } from "@/i18n/react";

const FREQUENCIES = ["hourly", "daily", "weekly"] as const;
const RETENTIONS = [30, 90, 180, 365] as const;

export default function ConnectorConfigurePage() {
  const tNav = useTranslations("navigation");
  const tCommon = useTranslations("common");
  const t = useTranslations("connectors");
  const params = useParams({ from: "/$locale/dashboard/connectors/$id/configure" }) as {
    id: string;
  };
  const { id } = params;
  const router = useRouter();
  useConnectorPermissions();
  const { data, isLoading } = useConnectorDetail(id);
  const updateMutation = useConnectorUpdate();
  const testMutation = useConnectorTest();
  const [_dirty, setDirty] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const [form, setForm] = useState({
    name: "",
    domain: "",
    metrics: [] as string[],
    frequency: "daily",
    retention: 90,
    notifications: {} as Record<string, boolean>,
    tags: [] as string[],
    ipFilter: false,
  });

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name,
        domain: data.domain ?? "",
        metrics: data.metrics ?? [],
        frequency: data.syncFrequency ?? "daily",
        retention: data.retentionDays ?? 90,
        notifications: data.notifications ?? {},
        tags: (data.advancedOptions?.tags as string[]) ?? [],
        ipFilter: (data.advancedOptions?.ipFilter as boolean) ?? false,
      });
      setDirty(false);
    }
  }, [data]);

  useEffect(() => {
    if (!data) return;
    const isDirty =
      form.name !== data.name ||
      form.domain !== (data.domain ?? "") ||
      JSON.stringify(form.metrics) !== JSON.stringify(data.metrics ?? []) ||
      form.frequency !== (data.syncFrequency ?? "daily") ||
      form.retention !== (data.retentionDays ?? 90) ||
      JSON.stringify(form.notifications) !== JSON.stringify(data.notifications ?? {}) ||
      JSON.stringify(form.tags) !==
        JSON.stringify((data.advancedOptions?.tags as string[]) ?? []) ||
      form.ipFilter !== ((data.advancedOptions?.ipFilter as boolean) ?? false);
    setDirty(isDirty);
  }, [form, data]);

  useAppShellHeader({
    breadcrumbs: [
      { label: tNav("dashboard"), href: "/dashboard" },
      { label: tNav("connectors"), href: "/dashboard/connectors" },
      { label: data?.name ?? t("common.connector"), href: `/dashboard/connectors/${id}` },
      { label: t("common.configure"), href: `/dashboard/connectors/${id}/configure` },
    ],
  });

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (_dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [_dirty]);

  async function handleSave() {
    await updateMutation.mutateAsync({
      id,
      name: form.name,
      domain: form.domain || undefined,
      metrics: form.metrics,
      syncFrequency: form.frequency,
      retentionDays: form.retention,
      notifications: form.notifications,
      advancedOptions: { tags: form.tags, ipFilter: form.ipFilter },
    });
    setDirty(false);
    setTestResult(null);
  }

  async function handleTest() {
    setTestResult(null);
    const res = await testMutation.mutateAsync({ id });
    setTestResult(res.success ? "success" : "error");
  }

  if (isLoading) {
    return (
      <Container py="xl" size="md">
        <Stack gap="lg">
          <Skeleton height={40} width="40%" />
          <Skeleton height={60} />
          <Skeleton height={60} />
        </Stack>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container py="xl" size="md">
        <Text>{t("common.notFound")}</Text>
      </Container>
    );
  }

  const allMetrics = data.metrics.length > 0 ? data.metrics : [];

  return (
    <Container py="xl" size="md">
      <Stack gap="lg">
        <Text size="xl" fw={700}>
          {t("configure.title", { name: data.name })}
        </Text>

        <Card withBorder padding="md">
          <Stack gap="md">
            <Text fw={600}>{t("configure.sections.account")}</Text>
            <TextInput
              label={t("common.connectorName")}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: inputValueFromChangeEvent(e) }))}
            />
            <TextInput
              label={t("common.domain")}
              value={form.domain}
              onChange={(e) => setForm((f) => ({ ...f, domain: inputValueFromChangeEvent(e) }))}
            />
          </Stack>
        </Card>

        <Card withBorder padding="md">
          <Stack gap="md">
            <Text fw={600}>{t("common.metrics")}</Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
              {allMetrics.map((m) => (
                <Checkbox
                  key={m}
                  label={m}
                  checked={form.metrics.includes(m)}
                  onChange={(e) => {
                    const checked = inputCheckedFromChangeEvent(e);
                    setForm((f) => ({
                      ...f,
                      metrics: checked ? [...f.metrics, m] : f.metrics.filter((x) => x !== m),
                    }));
                  }}
                />
              ))}
            </SimpleGrid>
            <Group>
              <Button
                variant="subtle"
                size="xs"
                onClick={() => setForm((f) => ({ ...f, metrics: allMetrics }))}
              >
                {t("configure.actions.selectAll")}
              </Button>
              <Button
                variant="subtle"
                size="xs"
                onClick={() => setForm((f) => ({ ...f, metrics: [] }))}
              >
                {tCommon("clear")}
              </Button>
            </Group>
          </Stack>
        </Card>

        <Card withBorder padding="md">
          <Stack gap="md">
            <Text fw={600}>{t("configure.sections.syncPreferences")}</Text>
            <Text size="sm" fw={500}>
              {t("common.syncFrequency")}
            </Text>
            <SegmentedControl
              fullWidth
              value={form.frequency}
              onChange={(value) =>
                setForm((f) => ({ ...f, frequency: value as (typeof FREQUENCIES)[number] }))
              }
              data={FREQUENCIES.map((f) => ({ value: f, label: t(`frequency.${f}`) }))}
            />
            <Text size="sm" fw={500}>
              {t("common.dataRetention")}
            </Text>
            <SegmentedControl
              fullWidth
              value={String(form.retention)}
              onChange={(value) => setForm((f) => ({ ...f, retention: Number(value) }))}
              data={RETENTIONS.map((r) => ({
                value: String(r),
                label: t("common.retentionDays", { days: r }),
              }))}
            />
          </Stack>
        </Card>

        <Card withBorder padding="md">
          <Stack gap="md">
            <Text fw={600}>{t("configure.sections.notifications")}</Text>
            <Checkbox
              label={t("configure.notifications.syncFailure")}
              checked={form.notifications.syncFailure ?? false}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  notifications: {
                    ...f.notifications,
                    syncFailure: inputCheckedFromChangeEvent(e),
                  },
                }))
              }
            />
            <Checkbox
              label={t("configure.notifications.authExpiration")}
              checked={form.notifications.authExpiration ?? false}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  notifications: {
                    ...f.notifications,
                    authExpiration: inputCheckedFromChangeEvent(e),
                  },
                }))
              }
            />
            <Checkbox
              label={t("configure.notifications.weeklySummary")}
              checked={form.notifications.weeklySummary ?? false}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  notifications: {
                    ...f.notifications,
                    weeklySummary: inputCheckedFromChangeEvent(e),
                  },
                }))
              }
            />
          </Stack>
        </Card>

        <Card withBorder padding="md">
          <Stack gap="md">
            <Text fw={600}>{t("configure.sections.advanced")}</Text>
            <TagsInput
              label={t("configure.advanced.customTags")}
              placeholder={t("configure.advanced.customTagsPlaceholder")}
              value={form.tags}
              onChange={(value) => setForm((f) => ({ ...f, tags: value }))}
            />
            <Switch
              label={t("configure.advanced.excludeInternalTraffic")}
              checked={form.ipFilter}
              onChange={(e) => setForm((f) => ({ ...f, ipFilter: inputCheckedFromChangeEvent(e) }))}
            />
          </Stack>
        </Card>

        {testResult === "success" && (
          <Alert color="green" icon={<IconCheck size={16} />}>
            {t("alerts.connectionSuccessfulTitle")}
          </Alert>
        )}
        {testResult === "error" && (
          <Alert color="red" icon={<IconAlertCircle size={16} />}>
            {t("configure.testFailed")}
          </Alert>
        )}

        <Group justify="space-between">
          <Button variant="subtle" onClick={() => router.push(`/dashboard/connectors/${id}`)}>
            {tCommon("cancel")}
          </Button>
          <Group>
            <Button variant="default" onClick={handleTest} loading={testMutation.isPending}>
              {t("common.testConnection")}
            </Button>
            <Button onClick={handleSave} loading={updateMutation.isPending} disabled={!_dirty}>
              {t("configure.actions.saveChanges")}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Container>
  );
}
