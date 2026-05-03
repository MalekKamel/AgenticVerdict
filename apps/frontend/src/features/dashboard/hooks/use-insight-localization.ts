import { useTranslations } from "@/i18n/react";
import type { InsightDTO } from "@agenticverdict/types";

interface UseInsightLocalizationReturn {
  getTitle: (insight: InsightDTO) => string;
  getBody: (insight: InsightDTO) => string;
  getDomainLabels: (domains: string[]) => string[];
  getAriaLabel: (insight: InsightDTO) => string;
}

export function useInsightLocalization(): UseInsightLocalizationReturn {
  const t = useTranslations("dashboard");

  const getTitle = (insight: InsightDTO) => {
    const i18nKey = `insights.types.${insight.insightType}.title`;
    const i18nTitle = t(i18nKey, { returnNull: true });
    if (i18nTitle) {
      return i18nTitle;
    }

    const periodName = insight.attributes.period ? capitalizeWords(insight.attributes.period) : "";
    const metricName = insight.attributes.metricClass
      ? capitalizeWords(insight.attributes.metricClass)
      : "";

    if (periodName && metricName) {
      return `${periodName} ${metricName}`;
    }

    return capitalizeWords(insight.rawName);
  };

  const getBody = (insight: InsightDTO) => {
    const i18nKey = `insights.types.${insight.insightType}.body`;
    const i18nBody = t(i18nKey, { returnNull: true });
    if (i18nBody) {
      return i18nBody;
    }

    const periodName = insight.attributes.period
      ? capitalizeWords(insight.attributes.period)
      : "Periodic";

    const defaultBody = t("insights.body.default", {
      period: periodName,
      defaultValue: `${periodName} metrics and analysis`,
    });

    return defaultBody ?? `${periodName} metrics and analysis`;
  };

  const getDomainLabels = (domains: string[]) => {
    return domains.map((domain) => {
      const i18nDomain = t(`domains.${domain}`, { returnNull: true });
      if (i18nDomain) {
        return i18nDomain;
      }

      return capitalizeWords(domain);
    });
  };

  const getAriaLabel = (insight: InsightDTO) => {
    const title = getTitle(insight);
    const domainLabels = getDomainLabels(insight.domains);
    const domains = domainLabels.length > 0 ? `, ${domainLabels.join(", ")}` : "";

    return `${title}${domains}`;
  };

  return { getTitle, getBody, getDomainLabels, getAriaLabel };
}

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}
