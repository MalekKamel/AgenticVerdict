"use client";

import { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, Title, Text, Container, Modal, Group, Button, Alert, Badge } from "@mantine/core";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { useParams, useNavigate } from "@/router/hooks";
import { ROUTE_PATHS } from "@/router/utils/route-paths";
import { useAppShellHeader } from "@/features/shell/ui/app-shell-context";
import { useTranslations } from "@/i18n/react";
import { WizardLayout } from "../ui/WizardLayout";
import { PageErrorBoundary } from "@/components/error-boundaries";
import { BasicInfoStep } from "../ui/wizard/steps/BasicInfoStep";
import { ConnectorSelectionStep } from "../ui/wizard/steps/ConnectorSelectionStep";
import { MetricConfigurationStep } from "../ui/wizard/steps/MetricConfigurationStep";
import { AISettingsStep } from "../ui/wizard/steps/AISettingsStep";
import { ScheduleDeliveryStep } from "../ui/wizard/steps/ScheduleDeliveryStep";
import { ReviewStep } from "../ui/wizard/steps/ReviewStep";
import { createInsightWizardSchema, type CreateInsightFormData } from "../ui/wizard/validation";
import { useInsightDetail, useInsightUpdate } from "../api/insight-api";
import { useConnectorList, useConnectorMetrics } from "@/features/connectors/api/connector-api";
import { isInsightAIConfig, isInsightSchedule, isInsightDelivery } from "../schemas";

const STEPS = [
  { id: "basic-info", title: "Basic Info", description: "Name and domain" },
  { id: "connectors", title: "Connectors", description: "Select data sources" },
  { id: "metrics", title: "Metrics", description: "Configure metrics" },
  { id: "ai-settings", title: "AI Settings", description: "Model and quality" },
  { id: "schedule", title: "Schedule", description: "Frequency & delivery" },
  { id: "review", title: "Review", description: "Confirm configuration" },
];

const AVAILABLE_MODELS = [
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet (Recommended)" },
  { value: "claude-3-opus", label: "Claude 3 Opus" },
  { value: "gpt-4o", label: "GPT-4o" },
];

const AVAILABLE_DOMAINS = [
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "finance", label: "Finance" },
  { value: "operations", label: "Operations" },
  { value: "analytics", label: "Analytics" },
];

const WIZARD_STEP_FIELDS: Array<Array<keyof CreateInsightFormData>> = [
  ["name", "description", "domain"],
  ["connectorIds"],
  ["selectedMetrics"],
  ["model", "quality", "detailLevel", "customPrompt"],
  ["frequency", "time", "format", "emailRecipients", "enableWebhook", "webhookUrl"],
  [],
];

const DETAIL_LEVEL_OPTIONS = new Set<CreateInsightFormData["detailLevel"]>([
  "executive",
  "standard",
  "comprehensive",
]);

const FREQUENCY_OPTIONS = new Set<CreateInsightFormData["frequency"]>([
  "daily",
  "weekly",
  "monthly",
  "quarterly",
]);

const FORMAT_OPTIONS = new Set<CreateInsightFormData["format"]>(["pdf", "excel", "both"]);

function ResetToDefaultButton({
  onReset,
  sectionName,
}: {
  onReset: () => void;
  sectionName: string;
}) {
  const t = useTranslations("insights");

  return (
    <Group justify="flex-end">
      <Button variant="subtle" size="sm" leftSection={<IconRefresh size={14} />} onClick={onReset}>
        {t("edit.resetToDefault", { section: sectionName })}
      </Button>
    </Group>
  );
}

function InsightEditContent() {
  const t = useTranslations("insights");
  const tNav = useTranslations("navigation");
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { id?: string };
  const insightId = params.id;

  const [activeStep, setActiveStep] = useState(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [originalData, setOriginalData] = useState<CreateInsightFormData | null>(null);
  const [selectedConnectorIds, setSelectedConnectorIds] = useState<string[]>([]);

  const { data: insight, isLoading: isLoadingInsight } = useInsightDetail(insightId || "");
  const updateMutation = useInsightUpdate();

  const {
    data: connectorsData,
    isLoading: connectorsLoading,
    error: connectorsError,
  } = useConnectorList({
    status: "healthy",
    page: 1,
    pageSize: 50,
  });

  const { data: metricsData, isLoading: metricsLoading } =
    useConnectorMetrics(selectedConnectorIds);

  const connectors =
    connectorsData?.items.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.platform,
      isHealthy: item.status === "healthy",
      lastSyncedAt: item.lastSyncAt ? new Date(item.lastSyncAt) : null,
    })) || [];

  const connectorMetrics = metricsData || [];

  const methods = useForm<CreateInsightFormData>({
    resolver: zodResolver(createInsightWizardSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      domain: "",
      connectorIds: [],
      selectedMetrics: {},
      model: "claude-3-5-sonnet",
      quality: 50,
      detailLevel: "standard",
      customPrompt: "",
      frequency: "weekly",
      time: "9",
      format: "pdf",
      emailRecipients: [],
      enableWebhook: false,
      webhookUrl: "",
    },
  });

  const { handleSubmit, reset, watch, trigger } = methods;
  const formData = watch();

  // Load insight data and populate form
  useEffect(() => {
    if (insight) {
      const connectorIds = insight.connectors.map((c) => c.connectorId);
      const selectedMetrics: Record<string, string[]> = {};
      insight.connectors.forEach((c) => {
        selectedMetrics[c.connectorId] = c.selectedMetrics as string[];
      });

      const aiConfigRaw = insight.aiConfig;
      const aiConfig = isInsightAIConfig(aiConfigRaw)
        ? aiConfigRaw
        : { model: "", detailLevel: "standard" as const };

      const scheduleRaw = insight.schedule;
      const schedule = isInsightSchedule(scheduleRaw)
        ? scheduleRaw
        : { frequency: "weekly" as const, time: 9 };

      const deliveryRaw = insight.delivery;
      const delivery = isInsightDelivery(deliveryRaw) ? deliveryRaw : { format: "pdf" as const };

      const detailLevel = DETAIL_LEVEL_OPTIONS.has(aiConfig.detailLevel)
        ? aiConfig.detailLevel
        : "standard";
      const frequency = FREQUENCY_OPTIONS.has(schedule.frequency) ? schedule.frequency : "weekly";
      const format = FORMAT_OPTIONS.has(delivery.format) ? delivery.format : "pdf";

      const defaultData: CreateInsightFormData = {
        name: insight.name,
        description: insight.description || "",
        domain:
          (insight as { domain?: string }).domain ||
          insight.connectors[0]?.connectorId ||
          "analytics",
        connectorIds,
        selectedMetrics,
        model: aiConfig.model || "claude-3-5-sonnet",
        quality: aiConfig.quality || 50,
        detailLevel,
        customPrompt: aiConfig.customPrompt || "",
        frequency,
        time: String(schedule.time || 9),
        format,
        emailRecipients: delivery.emailRecipients || [],
        enableWebhook: !!delivery.webhookUrl,
        webhookUrl: delivery.webhookUrl || "",
      };

      setOriginalData(defaultData);
      reset(defaultData);
      void trigger();
    }
  }, [insight, reset, trigger]);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(originalData);

  useAppShellHeader({
    breadcrumbs: [
      { label: tNav("dashboard"), href: ROUTE_PATHS.DASHBOARD },
      { label: tNav("insights"), href: ROUTE_PATHS.DASHBOARD_INSIGHTS },
      {
        label: insight?.name || t("edit.loading"),
        href: ROUTE_PATHS.DASHBOARD_INSIGHTS_EDIT.replace("$id", insightId || ""),
      },
    ],
    headerContext: (
      <Group justify="space-between">
        <div>
          <Title order={1}>{t("edit.pageTitle")}</Title>
          <Text c="dimmed">{t("edit.pageSubtitle")}</Text>
        </div>
        {isDirty && (
          <Badge color="orange" variant="dot">
            {t("edit.unsavedChanges")}
          </Badge>
        )}
      </Group>
    ),
  });

  const onNext = async () => {
    const fields = WIZARD_STEP_FIELDS[activeStep];
    if (fields.length > 0) {
      const isValid = await trigger(fields);
      if (!isValid) return false;
    }
    if (activeStep < STEPS.length - 1) {
      setActiveStep(activeStep + 1);
    }
    return true;
  };

  const onBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const onCancel = () => {
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      navigate.push(ROUTE_PATHS.DASHBOARD_INSIGHTS_DETAIL.replace("$id", insightId || ""));
    }
  };

  const handleCancelConfirm = () => {
    setShowCancelConfirm(false);
    navigate.push(ROUTE_PATHS.DASHBOARD_INSIGHTS_DETAIL.replace("$id", insightId || ""));
  };

  const onSubmit = (data: CreateInsightFormData) => {
    if (!insightId) return;

    updateMutation.mutate(
      {
        id: insightId,
        data: {
          name: data.name,
          description: data.description,
          connectors: data.connectorIds.map((connectorId) => ({
            connectorId,
            enabled: true,
            selectedMetrics: data.selectedMetrics[connectorId] || [],
            filters: {},
          })),
          aiConfig: {
            model: data.model,
            quality: data.quality,
            detailLevel: data.detailLevel,
            customPrompt: data.customPrompt,
          },
          schedule: {
            frequency: data.frequency,
            time: parseInt(data.time, 10),
          },
          delivery: {
            format: data.format,
            emailRecipients: data.emailRecipients,
            webhookUrl: data.enableWebhook ? data.webhookUrl : undefined,
          },
        },
      },
      {
        onSuccess: () => {
          navigate.push(ROUTE_PATHS.DASHBOARD_INSIGHTS_DETAIL.replace("$id", insightId || ""));
        },
      },
    );
  };

  const handleResetSection = (section: keyof CreateInsightFormData) => {
    if (originalData) {
      methods.setValue(section, originalData[section]);
    }
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <>
            <BasicInfoStep domains={AVAILABLE_DOMAINS} />
            <ResetToDefaultButton
              onReset={() => handleResetSection("name")}
              sectionName={t("edit.sections.basicInfo")}
            />
          </>
        );
      case 1:
        return (
          <>
            <ConnectorSelectionStep
              connectors={connectors}
              onManageConnectors={() => {}}
              onConnectorsChange={setSelectedConnectorIds}
              loading={connectorsLoading}
              error={connectorsError}
            />
            <ResetToDefaultButton
              onReset={() => handleResetSection("connectorIds")}
              sectionName={t("edit.sections.connectors")}
            />
          </>
        );
      case 2:
        return (
          <>
            <MetricConfigurationStep connectorMetrics={connectorMetrics} loading={metricsLoading} />
            <ResetToDefaultButton
              onReset={() => handleResetSection("selectedMetrics")}
              sectionName={t("edit.sections.metrics")}
            />
          </>
        );
      case 3:
        return (
          <>
            <AISettingsStep models={AVAILABLE_MODELS} />
            <ResetToDefaultButton
              onReset={() => handleResetSection("model")}
              sectionName={t("edit.sections.aiSettings")}
            />
          </>
        );
      case 4:
        return (
          <>
            <ScheduleDeliveryStep />
            <ResetToDefaultButton
              onReset={() => handleResetSection("frequency")}
              sectionName={t("edit.sections.schedule")}
            />
          </>
        );
      case 5:
        return <ReviewStep connectors={connectors} />;
      default:
        return null;
    }
  };

  if (isLoadingInsight) {
    return (
      <Container size="lg">
        <Stack gap="lg" align="center" justify="center" style={{ minHeight: "400px" }}>
          <Text>{t("edit.loading")}</Text>
        </Stack>
      </Container>
    );
  }

  if (!insight) {
    return (
      <Container size="lg">
        <Alert variant="light" color="red" icon={<IconAlertCircle size={16} />}>
          {t("edit.errorLoading")}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg">
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <WizardLayout
            steps={STEPS}
            activeStep={activeStep}
            onStepChange={setActiveStep}
            onNext={onNext}
            onBack={onBack}
            onCancel={onCancel}
            isNextDisabled={updateMutation.isPending}
            isLastStep={activeStep === STEPS.length - 1}
            isLoading={updateMutation.isPending}
          >
            {renderStep()}
          </WizardLayout>
        </form>
      </FormProvider>

      <Modal
        opened={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title={t("edit.cancelTitle")}
        centered
      >
        <Stack gap="md">
          <Text>{t("edit.cancelMessage")}</Text>
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>
              {t("edit.continueEditing")}
            </Button>
            <Button color="red" onClick={handleCancelConfirm}>
              {t("edit.discardChanges")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}

export default function InsightEditPage() {
  return (
    <PageErrorBoundary pageName="InsightEditPage">
      <InsightEditContent />
    </PageErrorBoundary>
  );
}
