"use client";

import { useState } from "react";
import { TextInput, Textarea, Select, Stack, Alert, Box } from "@mantine/core";
import { useFormContext, Controller } from "react-hook-form";
import { IconInfoCircle } from "@tabler/icons-react";
import { useTranslations } from "@/i18n/react";
import { TemplateBrowser } from "@/features/insights/ui/TemplateBrowser";
import { templateService } from "@/features/insights/services/template-service";

interface BasicInfoValues {
  name: string;
  description: string;
  domain: string;
  connectorIds: string[];
  templateId?: string | null;
}

interface BasicInfoStepProps {
  domains: { value: string; label: string }[];
  onTemplateApplied?: (config: {
    templateId: string;
    name: string;
    description: string;
    domain: string;
    connectorIds: string[];
  }) => void;
}

export function BasicInfoStep({ domains, onTemplateApplied }: BasicInfoStepProps) {
  const t = useTranslations("insights");
  const tTpl = useTranslations("insights");
  const {
    register,
    control,
    formState: { errors },
    setValue,
  } = useFormContext<BasicInfoValues>();

  const [appliedTemplateName, setAppliedTemplateName] = useState<string | null>(null);

  const handleSelectTemplate = async (templateId: string) => {
    try {
      const config = await templateService.applyTemplate(templateId);
      setValue("name", config.name);
      setValue("description", config.description);
      setValue("domain", config.domain);
      setValue("connectorIds", config.connectorIds);
      setValue("templateId", config.templateId);
      setAppliedTemplateName(config.templateName);
      onTemplateApplied?.({
        templateId: config.templateId,
        name: config.name,
        description: config.description,
        domain: config.domain,
        connectorIds: config.connectorIds,
      });
    } catch {
      // Error is handled by the service notification
    }
  };

  const handleStartFromScratch = () => {
    // No-op — user continues with empty form
  };

  return (
    <Stack gap="md">
      <TemplateBrowser
        onSelectTemplate={handleSelectTemplate}
        onStartFromScratch={handleStartFromScratch}
      />

      {appliedTemplateName && (
        <Alert
          icon={<IconInfoCircle size={16} />}
          title={tTpl("templates.templateApplied")}
          color="blue"
          variant="light"
        >
          {tTpl("templates.appliedTemplate", { name: appliedTemplateName })}
        </Alert>
      )}

      <Box mt="md">
        <TextInput
          label={t("wizard.steps.basicInfo.nameLabel")}
          placeholder={t("wizard.steps.basicInfo.namePlaceholder")}
          required
          {...register("name", {
            required: "NAME_REQUIRED",
            minLength: {
              value: 3,
              message: "NAME_TOO_SHORT",
            },
          })}
          error={errors.name?.message}
        />

        <Controller
          name="domain"
          control={control}
          rules={{
            required: "DOMAIN_REQUIRED",
          }}
          render={({ field, fieldState: { error } }) => (
            <Select
              label={t("wizard.steps.basicInfo.domainLabel")}
              placeholder={t("wizard.steps.basicInfo.domainPlaceholder")}
              data={domains}
              {...field}
              error={error?.message}
            />
          )}
        />

        <Textarea
          label={t("wizard.steps.basicInfo.descriptionLabel")}
          placeholder={t("wizard.steps.basicInfo.descriptionPlaceholder")}
          autosize
          minRows={3}
          {...register("description")}
        />
      </Box>
    </Stack>
  );
}
