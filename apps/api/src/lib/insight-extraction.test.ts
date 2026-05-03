import { describe, it, expect } from "vitest";
import {
  normalizeIdentifier,
  extractPeriod,
  extractMetricClass,
  extractDomains,
} from "./insight-extraction";

describe("normalizeIdentifier", () => {
  it("converts spaces to underscores", () => {
    expect(normalizeIdentifier("Weekly Performance")).toBe("weekly_performance");
  });

  it("lowercases the string", () => {
    expect(normalizeIdentifier("MONTHLY ROI")).toBe("monthly_roi");
  });

  it("removes special characters", () => {
    expect(normalizeIdentifier("Performance & Analytics!")).toBe("performance_analytics");
  });

  it("handles mixed content", () => {
    expect(normalizeIdentifier("Q1 2024: Review (Final)")).toBe("q1_2024_review_final");
  });
});

describe("extractPeriod", () => {
  it("extracts period from start of string", () => {
    expect(extractPeriod("Weekly Performance Review")).toBe("weekly");
    expect(extractPeriod("monthly_roi_analysis")).toBe("monthly");
  });

  it("extracts period from end of string", () => {
    expect(extractPeriod("Performance Review Weekly")).toBe("weekly");
  });

  it("extracts period from middle of string", () => {
    expect(extractPeriod("Analysis monthly report")).toBe("monthly");
  });

  it("returns undefined when no period found", () => {
    expect(extractPeriod("Performance Review")).toBeUndefined();
    expect(extractPeriod("")).toBeUndefined();
  });

  it("handles all period types", () => {
    expect(extractPeriod("daily_standup")).toBe("daily");
    expect(extractPeriod("weekly_review")).toBe("weekly");
    expect(extractPeriod("monthly_report")).toBe("monthly");
    expect(extractPeriod("quarterly_goals")).toBe("quarterly");
    expect(extractPeriod("yearly_summary")).toBe("yearly");
  });
});

describe("extractMetricClass", () => {
  it("extracts metric class from first connector metadata", () => {
    const insight = {
      id: "1",
      name: "Test",
      enabled: true,
      createdAt: new Date(),
      connectors: [
        {
          id: "c1",
          metadata: {
            primaryMetricClass: "performance",
          },
        },
      ],
    };

    expect(extractMetricClass(insight)).toBe("performance");
  });

  it("returns undefined when no metadata", () => {
    const insight = {
      id: "1",
      name: "Test",
      enabled: true,
      createdAt: new Date(),
      connectors: [
        {
          id: "c1",
        },
      ],
    };

    expect(extractMetricClass(insight)).toBeUndefined();
  });

  it("returns undefined when no connectors", () => {
    const insight = {
      id: "1",
      name: "Test",
      enabled: true,
      createdAt: new Date(),
      connectors: [],
    };

    expect(extractMetricClass(insight)).toBeUndefined();
  });
});

describe("extractDomains", () => {
  it("extracts unique domains from all connectors", () => {
    const insight = {
      id: "1",
      name: "Test",
      enabled: true,
      createdAt: new Date(),
      connectors: [
        {
          id: "c1",
          domainTags: ["marketing", "social"],
        },
        {
          id: "c2",
          domainTags: ["social", "seo"],
        },
      ],
    };

    const domains = extractDomains(insight);
    expect(domains).toHaveLength(3);
    expect(domains).toContain("marketing");
    expect(domains).toContain("social");
    expect(domains).toContain("seo");
  });

  it("returns empty array when no domain tags", () => {
    const insight = {
      id: "1",
      name: "Test",
      enabled: true,
      createdAt: new Date(),
      connectors: [
        {
          id: "c1",
        },
      ],
    };

    expect(extractDomains(insight)).toEqual([]);
  });

  it("handles connectors without domainTags", () => {
    const insight = {
      id: "1",
      name: "Test",
      enabled: true,
      createdAt: new Date(),
      connectors: [
        {
          id: "c1",
          domainTags: undefined,
        },
      ],
    };

    expect(extractDomains(insight)).toEqual([]);
  });
});
