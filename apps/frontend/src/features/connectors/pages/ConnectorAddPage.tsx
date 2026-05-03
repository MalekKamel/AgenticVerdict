"use client";

import { useReducer, useState } from "react";
import {
  Container,
  Stack,
  Stepper,
  Button,
  Group,
  Text,
  TextInput,
  Checkbox,
  SegmentedControl,
  Box,
  SimpleGrid,
  Card,
  LoadingOverlay,
  Alert,
} from "@mantine/core";
import { useSearch } from "@/router/hooks/useSearch";
import { useRouter } from "@/i18n/navigation";
import { IconSearch, IconCheck, IconAlertTriangle, IconX } from "@tabler/icons-react";

import { useAppShellHeader } from "@/features/shell/ui/app-shell-context";
import { useConnectorCreate, useConnectorTest } from "@/features/connectors/api/connector-api";
import {
  inputCheckedFromChangeEvent,
  inputValueFromChangeEvent,
} from "@/lib/dom/safe-input-change";
import { useTranslations } from "@/i18n/react";
import type { ConnectorType } from "@agenticverdict/types";

const PLATFORMS: { id: ConnectorType }[] = [
  { id: "ga4" },
  { id: "meta" },
  { id: "gsc" },
  { id: "tiktok" },
  { id: "gbp" },
];

const METRICS: Record<ConnectorType, string[]> = {
  ga4: ["Sessions", "Users", "Conversions", "Revenue", "Bounce Rate", "Page Views"],
  meta: ["Impressions", "Clicks", "CTR", "CPC", "Conversions", "Spend"],
  gsc: ["Clicks", "Impressions", "CTR", "Position", "Pages", "Queries"],
  tiktok: ["Impressions", "Clicks", "CTR", "Spend", "Conversions", "Video Views"],
  gbp: ["Views", "Clicks", "Calls", "Directions", "Reviews", "Photos"],
};
const METRIC_TRANSLATION_KEYS: Record<string, string> = {
  Sessions: "sessions",
  Users: "users",
  Conversions: "conversions",
  Revenue: "revenue",
  "Bounce Rate": "bounceRate",
  "Page Views": "pageViews",
  Impressions: "impressions",
  Clicks: "clicks",
  CTR: "ctr",
  CPC: "cpc",
  Spend: "spend",
  Position: "position",
  Pages: "pages",
  Queries: "queries",
  "Video Views": "videoViews",
  Views: "views",
  Calls: "calls",
  Directions: "directions",
  Reviews: "reviews",
  Photos: "photos",
};

const FREQUENCIES = ["hourly", "daily", "weekly"] as const;
const RETENTIONS = [30, 90, 180, 365] as const;

type WizardState =
  | { step: "platform" }
  | { step: "auth"; platform: ConnectorType }
  | {
      step: "config";
      platform: ConnectorType;
      authType: "oauth" | "apikey";
      credentials?: Record<string, string>;
    }
  | {
      step: "confirm";
      platform: ConnectorType;
      authType: "oauth" | "apikey";
      credentials?: Record<string, string>;
      config: ConnectorConfig;
    };

interface ConnectorConfig {
  name: string;
  domain: string;
  metrics: string[];
  frequency: string;
  retention: number;
}

type WizardAction =
  | { type: "SELECT_PLATFORM"; platform: ConnectorType }
  | { type: "SET_AUTH"; authType: "oauth" | "apikey"; credentials?: Record<string, string> }
  | { type: "SET_CONFIG"; config: ConnectorConfig }
  | { type: "BACK" }
  | { type: "RESET" };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SELECT_PLATFORM":
      return { step: "auth", platform: action.platform };
    case "SET_AUTH":
      if (state.step !== "auth") return state;
      return {
        step: "config",
        platform: state.platform,
        authType: action.authType,
        credentials: action.credentials,
      };
    case "SET_CONFIG":
      if (state.step !== "config") return state;
      return {
        step: "confirm",
        platform: state.platform,
        authType: state.authType,
        credentials: state.credentials,
        config: action.config,
      };
    case "BACK":
      if (state.step === "confirm")
        return {
          step: "config",
          platform: state.platform,
          authType: state.authType,
          credentials: state.credentials,
        };
      if (state.step === "config") return { step: "auth", platform: state.platform };
      if (state.step === "auth") return { step: "platform" };
      return state;
    case "RESET":
      return { step: "platform" };
    default:
      return state;
  }
}

export default function ConnectorAddPage() {
  const tNav = useTranslations("navigation");
  const tCommon = useTranslations("common");
  const t = useTranslations("connectors");
  const router = useRouter();
  const search = useSearch({ from: "/$locale/dashboard/connectors/add" }) as Record<
    string,
    unknown
  >;
  const [state, dispatch] = useReducer(wizardReducer, { step: "platform" });
  const [platformSearch, setPlatformSearch] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<ConnectorType | null>(
    (search.platform as ConnectorType) ?? null,
  );
  const [config, setConfig] = useState<ConnectorConfig>({
    name: "",
    domain: "",
    metrics: [],
    frequency: "daily",
    retention: 90,
  });
  const [testResult, setTestResult] = useState<"success" | "warning" | "error" | null>(null);

  const createMutation = useConnectorCreate();
  const testMutation = useConnectorTest();

  useAppShellHeader({
    breadcrumbs: [
      { label: tNav("dashboard"), href: "/dashboard" },
      { label: tNav("connectors"), href: "/dashboard/connectors" },
      { label: t("common.add"), href: "/dashboard/connectors/add" },
    ],
  });

  const redirectTo = (search.redirect as string) || "/dashboard/connectors";

  const filteredPlatforms = PLATFORMS.filter((p) =>
    t(`platforms.${p.id}.name`).toLowerCase().includes(platformSearch.toLowerCase()),
  );

  const activeStep =
    state.step === "platform" ? 0 : state.step === "auth" ? 1 : state.step === "config" ? 2 : 3;

  const canContinue =
    (state.step === "platform" && selectedPlatform !== null) ||
    state.step === "auth" ||
    (state.step === "config" && config.name.trim().length > 0 && config.metrics.length > 0);

  const localizeMetric = (metric: string) =>
    t(`metrics.${METRIC_TRANSLATION_KEYS[metric] ?? metric}`);

  function handleContinue() {
    if (state.step === "platform" && selectedPlatform) {
      dispatch({ type: "SELECT_PLATFORM", platform: selectedPlatform });
    } else if (state.step === "auth") {
      dispatch({ type: "SET_AUTH", authType: "oauth" });
    } else if (state.step === "config") {
      dispatch({ type: "SET_CONFIG", config });
      // auto-test on confirm step
      setTestResult(null);
    }
  }

  async function handleConfirm() {
    if (state.step !== "confirm") return;
    const res = await createMutation.mutateAsync({
      platform: state.platform,
      name: state.config.name,
      domain: state.config.domain || undefined,
      metrics: state.config.metrics,
      syncFrequency: state.config.frequency,
      retentionDays: state.config.retention,
    });
    if (res.success) {
      router.push(redirectTo as string);
    }
  }

  function handleCancel() {
    if (window.confirm(t("add.cancelConfirm"))) {
      router.push("/dashboard/connectors");
    }
  }

  return (
    <Container py="xl" size="md">
      <Stack gap="lg">
        <Text size="xl" fw={700}>
          {t("add.title")}
        </Text>
        <Stepper active={activeStep}>
          <Stepper.Step
            label={t("add.steps.platform.label")}
            description={t("add.steps.platform.description")}
          />
          <Stepper.Step
            label={t("add.steps.auth.label")}
            description={t("add.steps.auth.description")}
          />
          <Stepper.Step
            label={t("add.steps.config.label")}
            description={t("add.steps.config.description")}
          />
          <Stepper.Step
            label={t("add.steps.confirm.label")}
            description={t("add.steps.confirm.description")}
          />
        </Stepper>

        {state.step === "platform" && (
          <Stack gap="md">
            <TextInput
              placeholder={t("add.platform.searchPlaceholder")}
              leftSection={<IconSearch size={16} />}
              value={platformSearch}
              onChange={(e) => setPlatformSearch(inputValueFromChangeEvent(e))}
            />
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {filteredPlatforms.map((p) => (
                <Card
                  key={p.id}
                  withBorder
                  padding="md"
                  style={{
                    cursor: "pointer",
                    borderColor:
                      selectedPlatform === p.id ? "var(--mantine-color-blue-6)" : undefined,
                  }}
                  onClick={() => setSelectedPlatform(p.id)}
                >
                  <Group>
                    <IconCheck
                      size={20}
                      style={{ visibility: selectedPlatform === p.id ? "visible" : "hidden" }}
                    />
                    <Box>
                      <Text fw={600}>{t(`platforms.${p.id}.name`)}</Text>
                      <Text size="sm" c="dimmed">
                        {t(`platforms.${p.id}.description`)}
                      </Text>
                    </Box>
                  </Group>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>
        )}

        {state.step === "auth" && (
          <Stack gap="md">
            <Text>
              {t("add.auth.authenticateWith", { platform: t(`platforms.${state.platform}.name`) })}
            </Text>
            <Button onClick={() => dispatch({ type: "SET_AUTH", authType: "oauth" })}>
              {t("add.auth.connectOAuth")}
            </Button>
            <Text size="sm" c="dimmed">
              {t("add.auth.orApiCredentials")}
            </Text>
            <TextInput label={t("add.auth.apiKey")} type="password" />
            <Button
              variant="light"
              onClick={() =>
                dispatch({ type: "SET_AUTH", authType: "apikey", credentials: { apiKey: "" } })
              }
            >
              {t("add.auth.continueApiKey")}
            </Button>
          </Stack>
        )}

        {state.step === "config" && (
          <Stack gap="md">
            <TextInput
              label={t("common.connectorName")}
              placeholder={t("add.config.connectorNamePlaceholder")}
              value={config.name}
              onChange={(e) => setConfig((c) => ({ ...c, name: inputValueFromChangeEvent(e) }))}
              required
            />
            <TextInput
              label={t("common.domain")}
              placeholder={t("common.domainPlaceholder")}
              value={config.domain}
              onChange={(e) => setConfig((c) => ({ ...c, domain: inputValueFromChangeEvent(e) }))}
            />
            <Text fw={500}>{t("common.metrics")}</Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
              {METRICS[state.platform].map((m) => (
                <Checkbox
                  key={m}
                  label={localizeMetric(m)}
                  checked={config.metrics.includes(m)}
                  onChange={(e) => {
                    const checked = inputCheckedFromChangeEvent(e);
                    setConfig((c) => ({
                      ...c,
                      metrics: checked ? [...c.metrics, m] : c.metrics.filter((x) => x !== m),
                    }));
                  }}
                />
              ))}
            </SimpleGrid>
            <Text fw={500}>{t("common.syncFrequency")}</Text>
            <SegmentedControl
              fullWidth
              value={config.frequency}
              onChange={(value) =>
                setConfig((c) => ({ ...c, frequency: value as (typeof FREQUENCIES)[number] }))
              }
              data={FREQUENCIES.map((f) => ({ value: f, label: t(`frequency.${f}`) }))}
            />
            <Text fw={500}>{t("common.dataRetention")}</Text>
            <SegmentedControl
              fullWidth
              value={String(config.retention)}
              onChange={(value) => setConfig((c) => ({ ...c, retention: Number(value) }))}
              data={RETENTIONS.map((r) => ({
                value: String(r),
                label: t("common.retentionDays", { days: r }),
              }))}
            />
          </Stack>
        )}

        {state.step === "confirm" && (
          <Stack gap="md" pos="relative">
            <LoadingOverlay visible={testMutation.isPending} />
            <Text fw={600}>{t("add.confirm.summary")}</Text>
            <Text>
              {t("add.confirm.platform", { platform: t(`platforms.${state.platform}.name`) })}
            </Text>
            <Text>{t("add.confirm.name", { name: state.config.name })}</Text>
            <Text>{t("add.confirm.domain", { domain: state.config.domain || "—" })}</Text>
            <Text>
              {t("add.confirm.metrics", {
                metrics: state.config.metrics.map(localizeMetric).join(", "),
              })}
            </Text>
            <Text>
              {t("add.confirm.frequency", { frequency: t(`frequency.${state.config.frequency}`) })}
            </Text>
            <Text>{t("add.confirm.retention", { days: state.config.retention })}</Text>

            {!testResult && (
              <Button onClick={() => setTestResult("success")} loading={testMutation.isPending}>
                {t("common.testConnection")}
              </Button>
            )}

            {testResult === "success" && (
              <Alert
                color="green"
                icon={<IconCheck size={16} />}
                title={t("alerts.connectionSuccessfulTitle")}
              >
                {t("alerts.connectionSuccessfulBody")}
              </Alert>
            )}
            {testResult === "warning" && (
              <Alert
                color="yellow"
                icon={<IconAlertTriangle size={16} />}
                title={t("alerts.limitedPermissionsTitle")}
              >
                {t("alerts.limitedPermissionsBody")}
              </Alert>
            )}
            {testResult === "error" && (
              <Alert
                color="red"
                icon={<IconX size={16} />}
                title={t("alerts.connectionFailedTitle")}
              >
                {t("alerts.connectionFailedBody")}
              </Alert>
            )}
          </Stack>
        )}

        <Group justify="space-between">
          <Button variant="subtle" color="gray" onClick={handleCancel}>
            {tCommon("cancel")}
          </Button>
          <Group>
            {activeStep > 0 && (
              <Button variant="default" onClick={() => dispatch({ type: "BACK" })}>
                {tCommon("back")}
              </Button>
            )}
            {state.step !== "confirm" ? (
              <Button onClick={handleContinue} disabled={!canContinue}>
                {t("common.continue")}
              </Button>
            ) : (
              <Button
                onClick={handleConfirm}
                loading={createMutation.isPending}
                disabled={testResult !== "success"}
              >
                {t("common.finish")}
              </Button>
            )}
          </Group>
        </Group>
      </Stack>
    </Container>
  );
}
