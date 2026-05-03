import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useInsightLocalization } from "./use-insight-localization";
import type { InsightDTO } from "@agenticverdict/types";
import { useTranslations } from "@/i18n/react";

vi.mock("@/i18n/react", () => ({
  useTranslations: vi.fn(
    () => (key: string, options?: { returnNull?: boolean; defaultValue?: string }) => {
      if (options?.returnNull) {
        return null;
      }
      return options?.defaultValue ?? key;
    },
  ),
}));

vi.mock("@/providers/TenantProvider", () => ({
  useTenant: vi.fn(() => ({
    tenantId: "test-tenant",
    tenantType: "business",
    tenantStatus: "active",
    capabilities: {},
  })),
}));

describe("useInsightLocalization", () => {
  it("uses i18n key when available", () => {
    vi.mocked(useTranslations).mockImplementationOnce(() => (key: string) => {
      if (key === "insights.types.weekly_performance.title") {
        return "Weekly Performance Report";
      }
      return key;
    });

    const insight: InsightDTO = {
      id: "1",
      insightType: "weekly_performance",
      attributes: { period: "weekly" },
      domains: ["marketing"],
      rawName: "weekly performance",
      createdAt: new Date().toISOString(),
      connectorIds: ["ga4-1"],
    };

    const { result } = renderHook(() => useInsightLocalization());
    expect(result.current.getTitle(insight)).toBe("Weekly Performance Report");
  });

  it("falls back to composed parts when i18n not available", () => {
    const insight: InsightDTO = {
      id: "1",
      insightType: "unknown_type",
      attributes: { period: "weekly", metricClass: "performance" },
      domains: [],
      rawName: "unknown",
      createdAt: new Date().toISOString(),
      connectorIds: [],
    };

    const { result } = renderHook(() => useInsightLocalization());
    expect(result.current.getTitle(insight)).toBe("Weekly Performance");
  });

  it("uses raw name as final fallback", () => {
    const insight: InsightDTO = {
      id: "1",
      insightType: "unknown",
      attributes: {},
      domains: [],
      rawName: "custom insight",
      createdAt: new Date().toISOString(),
      connectorIds: [],
    };

    const { result } = renderHook(() => useInsightLocalization());
    expect(result.current.getTitle(insight)).toBe("Custom Insight");
  });

  it("handles domain labels with i18n fallback", () => {
    vi.mocked(useTranslations).mockImplementationOnce(() => (key: string) => {
      if (key === "domains.marketing") {
        return "Marketing";
      }
      return null;
    });

    const { result } = renderHook(() => useInsightLocalization());
    const labels = result.current.getDomainLabels(["marketing", "seo"]);

    expect(labels).toHaveLength(2);
    expect(labels[0]).toBe("Marketing");
    expect(labels[1]).toBe("Seo");
  });

  it("generates aria label with title and domains", () => {
    const insight: InsightDTO = {
      id: "1",
      insightType: "weekly_performance",
      attributes: { period: "weekly" },
      domains: ["marketing", "social"],
      rawName: "weekly performance",
      createdAt: new Date().toISOString(),
      connectorIds: [],
    };

    const { result } = renderHook(() => useInsightLocalization());
    const ariaLabel = result.current.getAriaLabel(insight);

    expect(ariaLabel).toContain("Weekly Performance");
    expect(ariaLabel).toContain("Marketing");
    expect(ariaLabel).toContain("Social");
  });

  it("handles empty domains in aria label", () => {
    const insight: InsightDTO = {
      id: "1",
      insightType: "test",
      attributes: {},
      domains: [],
      rawName: "test insight",
      createdAt: new Date().toISOString(),
      connectorIds: [],
    };

    const { result } = renderHook(() => useInsightLocalization());
    const ariaLabel = result.current.getAriaLabel(insight);

    expect(ariaLabel).toBe("Test Insight");
  });
});
