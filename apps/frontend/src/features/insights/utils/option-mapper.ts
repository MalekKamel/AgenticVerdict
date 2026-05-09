/**
 * Option mapping utilities for Insights wizard
 *
 * Converts tenant config API options to step-compatible format
 */

import { useTranslations } from "@/i18n/react";

export interface TenantOption {
  value: string;
  labelKey: string;
  order?: number;
}

export interface StepOption {
  value: string;
  label: string;
}

const DEFAULT_DETAIL_LEVEL_OPTIONS: TenantOption[] = [
  { value: "executive", labelKey: "wizard.steps.ai.detailExecutive" },
  { value: "standard", labelKey: "wizard.steps.ai.detailStandard" },
  { value: "comprehensive", labelKey: "wizard.steps.ai.detailComprehensive" },
];

const DEFAULT_FREQUENCY_OPTIONS: TenantOption[] = [
  { value: "daily", labelKey: "wizard.steps.schedule.freqDaily" },
  { value: "weekly", labelKey: "wizard.steps.schedule.freqWeekly" },
  { value: "monthly", labelKey: "wizard.steps.schedule.freqMonthly" },
  { value: "quarterly", labelKey: "wizard.steps.schedule.freqQuarterly" },
];

const DEFAULT_FORMAT_OPTIONS: TenantOption[] = [
  { value: "pdf", labelKey: "wizard.steps.schedule.formatPdf" },
  { value: "excel", labelKey: "wizard.steps.schedule.formatExcel" },
  { value: "both", labelKey: "wizard.steps.schedule.formatBoth" },
];

export function useInsightOptions() {
  const t = useTranslations("insights");

  const toStepOptions = (options: TenantOption[], defaults: TenantOption[]): StepOption[] => {
    const source = options && options.length > 0 ? options : defaults;
    const sorted = [...source].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return sorted.map((opt) => ({
      value: opt.value,
      label: t(opt.labelKey),
    }));
  };

  return {
    detailLevelOptions: (apiOptions: TenantOption[]) =>
      toStepOptions(apiOptions, DEFAULT_DETAIL_LEVEL_OPTIONS),
    frequencyOptions: (apiOptions: TenantOption[]) =>
      toStepOptions(apiOptions, DEFAULT_FREQUENCY_OPTIONS),
    formatOptions: (apiOptions: TenantOption[]) =>
      toStepOptions(apiOptions, DEFAULT_FORMAT_OPTIONS),
  };
}
