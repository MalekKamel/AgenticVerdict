"use client";

import { useState } from "react";
import {
  Stack,
  TextInput,
  PasswordInput,
  Select,
  Button,
  Group,
  Alert,
  Box,
  Text,
  Divider,
  Loader,
} from "@mantine/core";
import { useForm } from "react-hook-form";
import { IconAlertCircle, IconCheck, IconBolt, IconKey, IconLock } from "@tabler/icons-react";

import { useTranslations } from "@/i18n/react";
import { useTestAiProviderConnection } from "@/hooks/useAiProviders";
import type { AiProviderType } from "@agenticverdict/types";

interface CredentialFormData {
  providerType: AiProviderType | "";
  apiKey?: string;
  apiSecret?: string;
  endpoint?: string;
  organizationId?: string;
  projectId?: string;
}

interface CredentialValidationFormProps {
  onSubmit: (data: CredentialFormData) => void;
  isSubmitting?: boolean;
  initialData?: Partial<CredentialFormData>;
  testConnectionEnabled?: boolean;
}

export function CredentialValidationForm({
  onSubmit,
  isSubmitting = false,
  initialData,
  testConnectionEnabled = true,
}: CredentialValidationFormProps) {
  const t = useTranslations("components.credentialForm");
  const testMutation = useTestAiProviderConnection();

  const [selectedProvider, setSelectedProvider] = useState<AiProviderType | "">(
    (initialData?.providerType as AiProviderType) || "",
  );
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const form = useForm<CredentialFormData>({
    defaultValues: {
      providerType: initialData?.providerType || "",
      apiKey: initialData?.apiKey || "",
      apiSecret: initialData?.apiSecret || "",
      endpoint: initialData?.endpoint || "",
      organizationId: initialData?.organizationId || "",
      projectId: initialData?.projectId || "",
    },
  });

  const providerType = form.watch("providerType");

  const handleTestConnection = async () => {
    if (!form.getValues("providerType")) {
      form.setError("providerType", {
        type: "required",
        message: t("errors.selectProvider"),
      });
      return;
    }

    try {
      await testMutation.mutateAsync({
        providerId: "test", // This would be handled differently in actual implementation
      });
      setTestResult("success");
    } catch {
      setTestResult("error");
    }
  };

  const getProviderFields = (type: AiProviderType | "") => {
    switch (type) {
      case "openai":
        return {
          requiresApiKey: true,
          requiresOrganizationId: true,
          requiresEndpoint: false,
          requiresApiSecret: false,
          requiresProjectId: false,
        };
      case "anthropic":
        return {
          requiresApiKey: true,
          requiresOrganizationId: false,
          requiresEndpoint: false,
          requiresApiSecret: false,
          requiresProjectId: false,
        };
      default:
        return {
          requiresApiKey: false,
          requiresOrganizationId: false,
          requiresEndpoint: false,
          requiresApiSecret: false,
          requiresProjectId: false,
        };
    }
  };

  const fields = getProviderFields(providerType as AiProviderType);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Stack gap="md">
        {/* Provider Type Selection */}
        <Select
          label={t("fields.providerType")}
          placeholder={t("fields.selectProvider")}
          data={[
            { value: "openai", label: "OpenAI" },
            { value: "anthropic", label: "Anthropic" },
          ]}
          {...form.register("providerType", {
            required: t("errors.providerTypeRequired"),
          })}
          error={form.formState.errors.providerType?.message}
          onChange={(value) => {
            setSelectedProvider(value as AiProviderType | "");
            form.setValue("providerType", value as AiProviderType | "");
          }}
          leftSection={<IconKey size={16} />}
        />

        <Divider />

        {/* API Key */}
        {fields.requiresApiKey && (
          <PasswordInput
            label={t("fields.apiKey")}
            placeholder={t("fields.apiKeyPlaceholder")}
            {...form.register("apiKey", {
              required: t("errors.apiKeyRequired"),
            })}
            error={form.formState.errors.apiKey?.message}
            leftSection={<IconLock size={16} />}
            description={t("fields.apiKeyDescription")}
          />
        )}

        {/* API Secret */}
        {fields.requiresApiSecret && (
          <PasswordInput
            label={t("fields.apiSecret")}
            placeholder={t("fields.apiSecretPlaceholder")}
            {...form.register("apiSecret", {
              required: t("errors.apiSecretRequired"),
            })}
            error={form.formState.errors.apiSecret?.message}
            leftSection={<IconLock size={16} />}
          />
        )}

        {/* Organization ID */}
        {fields.requiresOrganizationId && (
          <TextInput
            label={t("fields.organizationId")}
            placeholder={t("fields.organizationIdPlaceholder")}
            {...form.register("organizationId")}
            error={form.formState.errors.organizationId?.message}
            description={t("fields.organizationIdDescription")}
          />
        )}

        {/* Project ID */}
        {fields.requiresProjectId && (
          <TextInput
            label={t("fields.projectId")}
            placeholder={t("fields.projectIdPlaceholder")}
            {...form.register("projectId")}
            error={form.formState.errors.projectId?.message}
          />
        )}

        {/* Custom Endpoint */}
        {fields.requiresEndpoint && (
          <TextInput
            label={t("fields.endpoint")}
            placeholder={t("fields.endpointPlaceholder")}
            {...form.register("endpoint")}
            error={form.formState.errors.endpoint?.message}
            description={t("fields.endpointDescription")}
          />
        )}

        {/* Test Connection Button */}
        {testConnectionEnabled && selectedProvider && (
          <Box mt="md">
            <Group gap="xs">
              <Button
                variant="light"
                leftSection={<IconBolt size={16} />}
                onClick={handleTestConnection}
                loading={testMutation.isPending}
                type="button"
              >
                {t("actions.testConnection")}
              </Button>

              {testMutation.isPending && (
                <Group gap="xs">
                  <Loader size="xs" />
                  <Text size="sm" c="dimmed">
                    {t("messages.testing")}
                  </Text>
                </Group>
              )}
            </Group>

            {testResult === "success" && (
              <Alert
                icon={<IconCheck size={16} />}
                color="green"
                mt="sm"
                title={t("alerts.connectionSuccess")}
              >
                {t("messages.connectionValid")}
              </Alert>
            )}

            {testResult === "error" && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                color="red"
                mt="sm"
                title={t("alerts.connectionFailed")}
              >
                {t("messages.connectionInvalid")}
              </Alert>
            )}
          </Box>
        )}

        {/* Submit Button */}
        <Group justify="flex-end" mt="md">
          <Button type="submit" loading={isSubmitting}>
            {t("actions.save")}
          </Button>
        </Group>

        {/* Security Notice */}
        <Alert color="blue" mt="md" icon={<IconLock size={16} />}>
          <Text size="xs">{t("securityNotice")}</Text>
        </Alert>
      </Stack>
    </form>
  );
}
