"use client";

import {
  Stack,
  Paper,
  Text,
  Group,
  TextInput,
  Textarea,
  Select,
  Switch,
  Button,
  Alert,
  Divider,
  Badge,
} from "@mantine/core";
import { useForm } from "react-hook-form";
import {
  IconBrain,
  IconAlertCircle,
  IconSettings,
  IconLanguage,
  IconBulb,
} from "@tabler/icons-react";

import { useTranslations } from "@/i18n/react";
import type { AiProviderType } from "@agenticverdict/types";

interface InsightAIConfigFormData {
  enabled: boolean;
  providerType: AiProviderType | "";
  model?: string;
  systemPrompt?: string;
  language: string;
  tone: string;
  maxLength: number;
  includeDataSources: boolean;
  includeConfidenceScore: boolean;
  customInstructions?: string;
}

interface InsightAIConfigProps {
  initialData?: Partial<InsightAIConfigFormData>;
  onSave?: (data: InsightAIConfigFormData) => void;
  isSaving?: boolean;
}

export function InsightAIConfig({ initialData, onSave, isSaving = false }: InsightAIConfigProps) {
  const t = useTranslations("components");

  const form = useForm<InsightAIConfigFormData>({
    defaultValues: {
      enabled: initialData?.enabled ?? true,
      providerType: (initialData?.providerType as AiProviderType) || "openai",
      model: initialData?.model || "gpt-4",
      systemPrompt: initialData?.systemPrompt || t("insightAIConfig.defaults.systemPrompt"),
      language: initialData?.language || "en",
      tone: initialData?.tone || "professional",
      maxLength: initialData?.maxLength || 500,
      includeDataSources: initialData?.includeDataSources ?? true,
      includeConfidenceScore: initialData?.includeConfidenceScore ?? true,
      customInstructions: initialData?.customInstructions || "",
    },
  });

  const enabled = form.watch("enabled");
  const providerType = form.watch("providerType");

  const handleSubmit = (data: InsightAIConfigFormData) => {
    onSave?.(data);
  };

  const getAvailableModels = (type: AiProviderType | "") => {
    switch (type) {
      case "openai":
        return [
          { value: "gpt-4", label: "GPT-4" },
          { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
          { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
        ];
      case "anthropic":
        return [
          { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
          { value: "claude-3-opus", label: "Claude 3 Opus" },
          { value: "claude-3-haiku", label: "Claude 3 Haiku" },
        ];
      default:
        return [];
    }
  };

  return (
    <Paper p="md" withBorder>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Header */}
          <Group justify="space-between">
            <Group gap="xs">
              <IconBrain size={24} color="#228be6" />
              <Text fw={600} size="lg">
                {t("insightAIConfig.title")}
              </Text>
            </Group>
            <Switch label={t("common.enabled")} {...form.register("enabled")} />
          </Group>

          <Alert icon={<IconBulb size={16} />} color="blue">
            <Text size="sm">{t("insightAIConfig.description")}</Text>
          </Alert>

          <Divider />

          {/* AI Provider Configuration */}
          {enabled && (
            <>
              <Stack gap="md">
                <Text fw={600}>{t("insightAIConfig.sections.provider")}</Text>

                <Select
                  label={t("insightAIConfig.fields.providerType")}
                  data={[
                    { value: "openai", label: "OpenAI" },
                    { value: "anthropic", label: "Anthropic" },
                  ]}
                  name="providerType"
                  value={form.watch("providerType")}
                  onChange={(value) =>
                    form.setValue("providerType", (value as AiProviderType | "") || "")
                  }
                  onBlur={form.register("providerType").onBlur}
                  ref={form.register("providerType").ref}
                  leftSection={<IconSettings size={16} />}
                />

                {providerType && (
                  <Select
                    label={t("insightAIConfig.fields.model")}
                    data={getAvailableModels(providerType as AiProviderType)}
                    name="model"
                    value={form.watch("model") || ""}
                    onChange={(value) => form.setValue("model", value || undefined)}
                    onBlur={form.register("model").onBlur}
                    ref={form.register("model").ref}
                  />
                )}
              </Stack>

              <Divider />

              {/* Output Configuration */}
              <Stack gap="md">
                <Text fw={600}>{t("insightAIConfig.sections.output")}</Text>

                <Select
                  label={t("insightAIConfig.fields.language")}
                  data={[
                    { value: "en", label: t("insightAIConfig.languages.en") },
                    { value: "ar", label: t("insightAIConfig.languages.ar") },
                  ]}
                  name="language"
                  value={form.watch("language")}
                  onChange={(value) => form.setValue("language", value || "en")}
                  onBlur={form.register("language").onBlur}
                  ref={form.register("language").ref}
                  leftSection={<IconLanguage size={16} />}
                />

                <Select
                  label={t("insightAIConfig.fields.tone")}
                  data={[
                    { value: "professional", label: t("insightAIConfig.tones.professional") },
                    { value: "casual", label: t("insightAIConfig.tones.casual") },
                    { value: "technical", label: t("insightAIConfig.tones.technical") },
                    { value: "executive", label: t("insightAIConfig.tones.executive") },
                  ]}
                  name="tone"
                  value={form.watch("tone")}
                  onChange={(value) => form.setValue("tone", value || "professional")}
                  onBlur={form.register("tone").onBlur}
                  ref={form.register("tone").ref}
                />

                <TextInput
                  label={t("insightAIConfig.fields.maxLength")}
                  type="number"
                  {...form.register("maxLength", { valueAsNumber: true })}
                  description={t("insightAIConfig.fields.maxLengthDescription")}
                />

                <Group>
                  <Switch
                    label={t("insightAIConfig.fields.includeDataSources")}
                    {...form.register("includeDataSources")}
                  />
                  <Switch
                    label={t("insightAIConfig.fields.includeConfidenceScore")}
                    {...form.register("includeConfidenceScore")}
                  />
                </Group>
              </Stack>

              <Divider />

              {/* Custom Instructions */}
              <Stack gap="md">
                <Text fw={600}>{t("insightAIConfig.sections.customization")}</Text>

                <Textarea
                  label={t("insightAIConfig.fields.systemPrompt")}
                  placeholder={t("insightAIConfig.fields.systemPromptPlaceholder")}
                  rows={4}
                  {...form.register("systemPrompt")}
                  description={t("insightAIConfig.fields.systemPromptDescription")}
                />

                <Textarea
                  label={t("insightAIConfig.fields.customInstructions")}
                  placeholder={t("insightAIConfig.fields.customInstructionsPlaceholder")}
                  rows={3}
                  {...form.register("customInstructions")}
                  description={t("insightAIConfig.fields.customInstructionsDescription")}
                />
              </Stack>

              {/* Best Practices */}
              <Alert icon={<IconAlertCircle size={16} />} color="yellow">
                <Text size="sm" fw={600} mb="xs">
                  {t("insightAIConfig.bestPractices.title")}
                </Text>
                <Stack gap="xs">
                  <Text>{t("insightAIConfig.bestPractices.item1")}</Text>
                  <Text>{t("insightAIConfig.bestPractices.item2")}</Text>
                  <Text>{t("insightAIConfig.bestPractices.item3")}</Text>
                </Stack>
              </Alert>
            </>
          )}

          {/* Disabled State */}
          {!enabled && (
            <Alert icon={<IconAlertCircle size={16} />} color="gray">
              {t("insightAIConfig.disabledMessage")}
            </Alert>
          )}

          {/* Actions */}
          <Group justify="flex-end" mt="md">
            <Button type="submit" loading={isSaving} disabled={!enabled}>
              {t("insightAIConfig.actions.save")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

interface QuickInsightConfigProps {
  enabled: boolean;
  onToggle?: (enabled: boolean) => void;
  compact?: boolean;
}

export function QuickInsightConfig({
  enabled,
  onToggle,
  compact = false,
}: QuickInsightConfigProps) {
  const t = useTranslations("components");

  if (compact) {
    return (
      <Group gap="xs">
        <IconBrain size={16} color="#666" />
        <Text size="sm">{t("insightAIConfig.insightsEnabled")}:</Text>
        <Badge color={enabled ? "green" : "gray"} variant="light">
          {enabled ? t("common.enabled") : t("common.disabled")}
        </Badge>
      </Group>
    );
  }

  return (
    <Paper p="sm" withBorder>
      <Group justify="space-between">
        <Group gap="xs">
          <IconBrain size={20} color="#228be6" />
          <Text fw={600}>{t("title")}</Text>
        </Group>
        <Switch
          checked={enabled}
          onChange={(e) => onToggle?.(e.currentTarget.checked)}
          label={enabled ? t("common.enabled") : t("common.disabled")}
        />
      </Group>
    </Paper>
  );
}
