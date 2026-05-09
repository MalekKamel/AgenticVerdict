/**
 * Unit tests for Insight Wizard validation schemas
 */

import { describe, it, expect } from "vitest";
import {
  basicInfoSchema,
  connectorSelectionSchema,
  metricConfigurationSchema,
  aiSettingsSchema,
  scheduleDeliverySchema,
  createInsightWizardSchema,
  type CreateInsightFormData,
} from "../ui/wizard/validation";

describe("basicInfoSchema", () => {
  it("should pass with valid data", () => {
    const validData = {
      name: "Test Insight",
      description: "A test insight",
      domain: "marketing",
    };

    const result = basicInfoSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  it("should fail when name is too short", () => {
    const invalidData = {
      name: "AB",
      description: "A test insight",
      domain: "marketing",
    };

    const result = basicInfoSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("NAME_TOO_SHORT");
    }
  });

  it("should fail when name is too long", () => {
    const invalidData = {
      name: "A".repeat(101),
      description: "A test insight",
      domain: "marketing",
    };

    const result = basicInfoSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("NAME_TOO_LONG");
    }
  });

  it("should fail when domain is missing", () => {
    const invalidData = {
      name: "Test Insight",
      description: "A test insight",
      domain: "",
    };

    const result = basicInfoSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("DOMAIN_REQUIRED");
    }
  });

  it("should accept optional description", () => {
    const validData = {
      name: "Test Insight",
      domain: "marketing",
    };

    const result = basicInfoSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });
});

describe("connectorSelectionSchema", () => {
  it("should pass with at least one connector", () => {
    const validData = {
      connectorIds: ["connector-1"],
    };

    const result = connectorSelectionSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  it("should pass with multiple connectors", () => {
    const validData = {
      connectorIds: ["connector-1", "connector-2", "connector-3"],
    };

    const result = connectorSelectionSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  it("should fail when no connectors selected", () => {
    const invalidData = {
      connectorIds: [],
    };

    const result = connectorSelectionSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("CONNECTOR_REQUIRED");
    }
  });
});

describe("metricConfigurationSchema", () => {
  it("should pass with valid metrics", () => {
    const validData = {
      selectedMetrics: {
        "connector-1": ["metric-1", "metric-2"],
        "connector-2": ["metric-3"],
      },
    };

    const result = metricConfigurationSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  it("should pass with empty metrics object", () => {
    const validData = {
      selectedMetrics: {},
    };

    const result = metricConfigurationSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });
});

describe("aiSettingsSchema", () => {
  it("should pass with valid settings", () => {
    const validData = {
      model: "claude-3-5-sonnet",
      quality: 75,
      detailLevel: "standard" as const,
      customPrompt: "Custom analysis prompt",
    };

    const result = aiSettingsSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  it("should fail when model is missing", () => {
    const invalidData = {
      model: "",
      quality: 50,
      detailLevel: "standard" as const,
    };

    const result = aiSettingsSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("MODEL_REQUIRED");
    }
  });

  it("should fail when quality is out of range (negative)", () => {
    const invalidData = {
      model: "claude-3-5-sonnet",
      quality: -1,
      detailLevel: "standard" as const,
    };

    const result = aiSettingsSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });

  it("should fail when quality is out of range (>100)", () => {
    const invalidData = {
      model: "claude-3-5-sonnet",
      quality: 101,
      detailLevel: "standard" as const,
    };

    const result = aiSettingsSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });

  it("should accept valid detailLevel values", () => {
    const executiveData = {
      model: "claude-3-5-sonnet",
      quality: 50,
      detailLevel: "executive" as const,
    };

    const comprehensiveData = {
      model: "claude-3-5-sonnet",
      quality: 50,
      detailLevel: "comprehensive" as const,
    };

    expect(aiSettingsSchema.safeParse(executiveData).success).toBe(true);
    expect(aiSettingsSchema.safeParse(comprehensiveData).success).toBe(true);
  });

  it("should reject invalid detailLevel values", () => {
    const invalidData = {
      model: "claude-3-5-sonnet",
      quality: 50,
      detailLevel: "invalid",
    };

    const result = aiSettingsSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });

  it("should accept optional customPrompt", () => {
    const validData = {
      model: "claude-3-5-sonnet",
      quality: 50,
      detailLevel: "standard" as const,
    };

    const result = aiSettingsSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });
});

describe("scheduleDeliverySchema", () => {
  it("should pass with valid schedule", () => {
    const validData = {
      frequency: "weekly" as const,
      time: 9,
      format: "pdf" as const,
      emailRecipients: ["user@example.com"],
    };

    const result = scheduleDeliverySchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  it("should pass with all frequency options", () => {
    const frequencies = ["daily", "weekly", "monthly", "quarterly"] as const;

    frequencies.forEach((frequency) => {
      const validData = {
        frequency,
        time: 9,
        format: "pdf" as const,
        emailRecipients: [],
      };

      expect(scheduleDeliverySchema.safeParse(validData).success).toBe(true);
    });
  });

  it("should pass with all format options", () => {
    const formats = ["pdf", "excel", "both"] as const;

    formats.forEach((format) => {
      const validData = {
        frequency: "weekly" as const,
        time: 9,
        format,
        emailRecipients: [],
      };

      expect(scheduleDeliverySchema.safeParse(validData).success).toBe(true);
    });
  });

  it("should fail with invalid email", () => {
    const invalidData = {
      frequency: "weekly" as const,
      time: 9,
      format: "pdf" as const,
      emailRecipients: ["invalid-email"],
    };

    const result = scheduleDeliverySchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues || result.error.errors;
      expect(issues[0].message).toBe("EMAIL_INVALID");
    }
  });

  it("should accept multiple valid emails", () => {
    const validData = {
      frequency: "weekly" as const,
      time: 9,
      format: "pdf" as const,
      emailRecipients: ["user1@example.com", "user2@example.com"],
    };

    const result = scheduleDeliverySchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  it("should accept empty email list", () => {
    const validData = {
      frequency: "weekly" as const,
      time: 9,
      format: "pdf" as const,
      emailRecipients: [],
    };

    const result = scheduleDeliverySchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  it("should accept valid webhook URL", () => {
    const validData = {
      frequency: "weekly" as const,
      time: 9,
      format: "pdf" as const,
      emailRecipients: [],
      enableWebhook: true,
      webhookUrl: "https://example.com/webhook",
    };

    const result = scheduleDeliverySchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  it("should fail with invalid webhook URL", () => {
    const invalidData = {
      frequency: "weekly" as const,
      time: 9,
      format: "pdf" as const,
      emailRecipients: [],
      enableWebhook: true,
      webhookUrl: "not-a-url",
    };

    const result = scheduleDeliverySchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("WEBHOOK_URL_INVALID");
    }
  });

  it("should accept empty string for webhookUrl", () => {
    const validData = {
      frequency: "weekly" as const,
      time: 9,
      format: "pdf" as const,
      emailRecipients: [],
      enableWebhook: false,
      webhookUrl: "",
    };

    const result = scheduleDeliverySchema.safeParse(validData);

    expect(result.success).toBe(true);
  });
});

describe("createInsightWizardSchema", () => {
  it("should pass with complete valid data", () => {
    const validData: CreateInsightFormData = {
      name: "Marketing Performance Insight",
      description: "Comprehensive marketing analysis",
      domain: "marketing",
      connectorIds: ["connector-1", "connector-2"],
      selectedMetrics: {
        "connector-1": ["impressions", "clicks"],
        "connector-2": ["conversions", "revenue"],
      },
      model: "claude-3-5-sonnet",
      quality: 75,
      detailLevel: "standard",
      customPrompt: "Focus on ROI analysis",
      frequency: "weekly",
      time: 9,
      format: "pdf",
      emailRecipients: ["manager@example.com"],
      enableWebhook: false,
      webhookUrl: "",
    };

    const result = createInsightWizardSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  it("should fail with invalid data in any field", () => {
    const invalidData = {
      name: "AB", // Too short
      description: "Test",
      domain: "marketing",
      connectorIds: ["connector-1"],
      selectedMetrics: {},
      model: "claude-3-5-sonnet",
      quality: 50,
      detailLevel: "standard" as const,
      frequency: "weekly" as const,
      time: 9,
      format: "pdf" as const,
      emailRecipients: [],
    };

    const result = createInsightWizardSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });
});
