"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, Title, Text, Container, Modal, Group, Button, Skeleton } from "@mantine/core";
import { useNavigate } from "@/router/hooks";
import { useAppShellHeader } from "@/features/shell/ui/app-shell-context";
import { useTranslations } from "@/i18n/react";
import { ROUTE_PATHS } from "@/router/utils/route-paths";
import { WizardLayout } from "../ui/WizardLayout";
import { BasicInfoStep } from "../ui/wizard/steps/BasicInfoStep";
import { ConnectorSelectionStep } from "../ui/wizard/steps/ConnectorSelectionStep";
import { MetricConfigurationStep } from "../ui/wizard/steps/MetricConfigurationStep";
import { AISettingsStep } from "../ui/wizard/steps/AISettingsStep";
import { ScheduleDeliveryStep } from "../ui/wizard/steps/ScheduleDeliveryStep";
import { ReviewStep } from "../ui/wizard/steps/ReviewStep";
import { createInsightWizardSchema, type CreateInsightFormData } from "../ui/wizard/validation";
import {
  useInsightCreate,
  useAiModels,
  useConnectorDomains,
  useTenantConfig,
} from "../api/insight-api";
import { useConnectorList, useConnectorMetrics } from "@/features/connectors/api/connector-api";
import { PageErrorBoundary } from "@/components/error-boundaries";
import { useInsightOptions } from "../utils/option-mapper";

const STEPS = [
  { id: "basic-info", title: "Basic Info", description: "Name and domain" },
  { id: "connectors", title: "Connectors", description: "Select data sources" },
  { id: "metrics", title: "Metrics", description: "Configure metrics" },
  { id: "ai-settings", title: "AI Settings", description: "Model and quality" },
  { id: "schedule", title: "Schedule", description: "Frequency & delivery" },
  { id: "review", title: "Review", description: "Confirm configuration" },
];

const WIZARD_STEP_FIELDS: Array<Array<keyof CreateInsightFormData>> = [
  ["name", "description", "domain"],
  ["connectorIds"],
  ["selectedMetrics"],
  ["model", "quality", "detailLevel", "customPrompt"],
  ["format", "emailRecipients", "enableWebhook", "webhookUrl"],
  [],
];

function InsightCreateWizardContent() {
  const t = useTranslations("insights");
  const tNav = useTranslations("navigation");
  const navigate = useNavigate();
  const createMutation = useInsightCreate();

  const [activeStep, setActiveStep] = useState(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);

  const { data: aiModels } = useAiModels();
  const { data: connectorDomains } = useConnectorDomains();
  const { data: tenantConfig } = useTenantConfig();
  const options = useInsightOptions();

  const models =
    aiModels?.providers.flatMap((p) =>
      p.models.map((m) => ({
        value: m.value,
        label: m.recommended ? `${m.label} (Recommended)` : m.label,
      })),
    ) || [];

  const domains = connectorDomains?.domains.map((d) => ({ value: d.value, label: d.label })) || [];

  const detailLevelOptions = options.detailLevelOptions(tenantConfig?.detailLevelOptions ?? []);
  const formatOptions = options.formatOptions(tenantConfig?.formatOptions ?? []);

  const {
    data: connectorsData,
    isLoading: connectorsLoading,
    error: connectorsError,
  } = useConnectorList({
    status: "healthy",
    page: 1,
    pageSize: 50,
  });

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
      format: "pdf",
      emailRecipients: [],
      enableWebhook: false,
      webhookUrl: "",
    },
  });

  const connectorIds = methods.watch("connectorIds");
  const { data: metricsData, isLoading: metricsLoading } = useConnectorMetrics(connectorIds);

  const connectors =
    connectorsData?.items.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.platform,
      isHealthy: item.status === "healthy",
      lastSyncedAt: item.lastSyncAt ? new Date(item.lastSyncAt) : null,
    })) || [];

  const connectorMetrics = metricsData || [];

  const { handleSubmit, trigger, setValue } = methods;

  useAppShellHeader({
    breadcrumbs: [
      { label: tNav("dashboard"), href: ROUTE_PATHS.DASHBOARD },
      { label: tNav("insights"), href: ROUTE_PATHS.DASHBOARD_INSIGHTS },
      { label: t("create.new"), href: ROUTE_PATHS.DASHBOARD_INSIGHTS_NEW },
    ],
    headerContext: (
      <Group justify="space-between">
        <div>
          <Title order={1}>{t("create.pageTitle")}</Title>
          <Text c="dimmed">{t("create.pageSubtitle")}</Text>
        </div>
      </Group>
    ),
  });

  const onNext = async () => {
    const stepFields = WIZARD_STEP_FIELDS[activeStep] ?? [];
    const isStepValid = stepFields.length > 0 ? await trigger(stepFields) : true;
    if (!isStepValid) return;

    if (activeStep < STEPS.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      handleSubmit(onSubmit)();
    }
  };

  const onBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const onCancel = () => {
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = () => {
    setShowCancelConfirm(false);
    navigate.push(ROUTE_PATHS.DASHBOARD_INSIGHTS);
  };

  const onSubmit = (data: CreateInsightFormData) => {
    createMutation.mutate(
      {
        name: data.name,
        description: data.description,
        templateId: selectedTemplateId,
        enabled: true,
        delivery: {
          format: data.format,
          emailRecipients: data.emailRecipients,
          enableWebhook: data.enableWebhook,
          webhookUrl: data.webhookUrl,
        },
        aiConfig: {
          model: data.model,
          quality: data.quality,
          detailLevel: data.detailLevel as "standard" | "executive" | "comprehensive",
          customPrompt: data.customPrompt,
        },
        connectors: data.connectorIds.map((id) => ({
          connectorId: id,
          enabled: true,
          selectedMetrics: data.selectedMetrics[id] || [],
          filters: {},
        })),
      },
      {
        onSuccess: (createdInsight) => {
          navigate.push(`${ROUTE_PATHS.DASHBOARD_INSIGHTS}/${createdInsight.id}`);
        },
      },
    );
  };

  const handleManageConnectors = () => {
    navigate.push(ROUTE_PATHS.DASHBOARD_CONNECTORS);
  };

  const handleConnectorsChange = (ids: string[]) => {
    setValue("connectorIds", ids);
  };

  const handleTemplateApplied = (config: {
    templateId: string;
    name: string;
    description: string;
    domain: string;
    connectorIds: string[];
  }) => {
    setSelectedTemplateId(config.templateId);
  };

  const renderStep = () => {
    if (connectorsLoading) {
      return (
        <Stack gap="md">
          <Skeleton height={40} radius="md" />
          <Skeleton height={60} radius="md" />
          <Skeleton height={60} radius="md" />
          <Skeleton height={40} radius="md" />
        </Stack>
      );
    }

    if (connectorsError) {
      return <Text c="red">{t("create.errors.connectorLoadFailed")}</Text>;
    }

    switch (activeStep) {
      case 0:
        return <BasicInfoStep domains={domains} onTemplateApplied={handleTemplateApplied} />;
      case 1:
        return (
          <ConnectorSelectionStep
            connectors={connectors}
            onManageConnectors={handleManageConnectors}
            onConnectorsChange={handleConnectorsChange}
            loading={connectorsLoading}
            error={connectorsError}
          />
        );
      case 2:
        return (
          <MetricConfigurationStep connectorMetrics={connectorMetrics} loading={metricsLoading} />
        );
      case 3:
        return <AISettingsStep models={models} detailLevelOptions={detailLevelOptions} />;
      case 4:
        return <ScheduleDeliveryStep formatOptions={formatOptions} />;
      case 5:
        return <ReviewStep connectors={connectors} />;
      default:
        return null;
    }
  };

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
            isNextDisabled={createMutation.isPending}
            isLastStep={activeStep === STEPS.length - 1}
            isLoading={createMutation.isPending}
          >
            {renderStep()}
          </WizardLayout>
        </form>
      </FormProvider>

      <Modal
        opened={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title={t("wizard.cancel")}
        centered
      >
        <Stack gap="md">
          <Text>{t("wizard.cancelConfirm")}</Text>
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>
              {t("wizard.back")}
            </Button>
            <Button color="red" onClick={handleCancelConfirm}>
              {t("wizard.cancel")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}

export default function InsightCreateWizard() {
  return (
    <PageErrorBoundary pageName="InsightCreateWizard">
      <InsightCreateWizardContent />
    </PageErrorBoundary>
  );
}
