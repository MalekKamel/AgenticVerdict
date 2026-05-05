import { describe, expect, it, beforeEach } from "vitest";

import { AgentRuntimeError } from "../errors/AgentRuntimeError";
import { ComplianceManager, createComplianceManager, DEFAULT_PII_PATTERNS } from "./compliance";

describe("ComplianceManager", () => {
  const basicConfig = {
    enablePIIRedaction: true,
    enableAuditLogging: true,
  };

  let complianceManager: ComplianceManager;

  beforeEach(() => {
    complianceManager = createComplianceManager(basicConfig);
  });

  describe("PII Redaction", () => {
    it("should redact email addresses", () => {
      const text = "Contact me at john.doe@example.com";
      const { redactedText, redacted } = complianceManager.redactPII(text);

      expect(redacted).toBe(true);
      expect(redactedText).toContain("[REDACTED_EMAIL]");
      expect(redactedText).not.toContain("john.doe@example.com");
    });

    it("should redact phone numbers", () => {
      const text = "Call me at 555-123-4567";
      const { redactedText, redacted } = complianceManager.redactPII(text);

      expect(redacted).toBe(true);
      expect(redactedText).toContain("[REDACTED_PHONE]");
    });

    it("should redact SSN", () => {
      const text = "My SSN is 123-45-6789";
      const { redactedText, redacted } = complianceManager.redactPII(text);

      expect(redacted).toBe(true);
      expect(redactedText).toContain("[REDACTED_SSN]");
    });

    it("should redact credit card numbers", () => {
      const text = "Card: 1234-5678-9012-3456";
      const { redactedText, redacted } = complianceManager.redactPII(text);

      expect(redacted).toBe(true);
      expect(redactedText).toContain("[REDACTED_CC]");
    });

    it("should redact IP addresses", () => {
      const text = "Server IP: 192.168.1.1";
      const { redactedText, redacted } = complianceManager.redactPII(text);

      expect(redacted).toBe(true);
      expect(redactedText).toContain("[REDACTED_IP]");
    });

    it("should redact multiple PII types in one text", () => {
      const text = "Contact john@example.com or call 555-123-4567";
      const { redactedText, redacted } = complianceManager.redactPII(text);

      expect(redacted).toBe(true);
      expect(redactedText).toContain("[REDACTED_EMAIL]");
      expect(redactedText).toContain("[REDACTED_PHONE]");
    });

    it("should return original text if no PII found", () => {
      const text = "Hello, how are you?";
      const { redactedText, redacted } = complianceManager.redactPII(text);

      expect(redacted).toBe(false);
      expect(redactedText).toBe(text);
    });

    it("should not redact when PII redaction is disabled", () => {
      const manager = createComplianceManager({
        enablePIIRedaction: false,
        enableAuditLogging: false,
      });

      const text = "Email: test@example.com";
      const { redactedText, redacted } = manager.redactPII(text);

      expect(redacted).toBe(false);
      expect(redactedText).toBe(text);
    });
  });

  describe("Message Redaction", () => {
    it("should redact PII from messages", () => {
      const messages = [
        { role: "user", content: "My email is test@example.com" },
        { role: "assistant", content: "I will contact you at test@example.com" },
      ];

      const { messages: redactedMessages, redacted } = complianceManager.redactMessages(messages);

      expect(redacted).toBe(true);
      expect(redactedMessages[0].content).toContain("[REDACTED_EMAIL]");
      expect(redactedMessages[1].content).toContain("[REDACTED_EMAIL]");
    });

    it("should preserve message roles", () => {
      const messages = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ];

      const { messages: redactedMessages } = complianceManager.redactMessages(messages);

      expect(redactedMessages[0].role).toBe("user");
      expect(redactedMessages[1].role).toBe("assistant");
    });
  });

  describe("Audit Logging", () => {
    it("should log audit entries", () => {
      complianceManager.logAuditEntry({
        tenantId: "tenant-123",
        requestId: "req-456",
        operation: "chat_completion",
        providerId: "openai",
        modelId: "gpt-4",
        inputTokens: 100,
        outputTokens: 200,
        latencyMs: 1500,
        success: true,
        piiRedacted: false,
      });

      const logs = complianceManager.getAuditLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].tenantId).toBe("tenant-123");
      expect(logs[0].operation).toBe("chat_completion");
    });

    it("should not log when audit logging is disabled", () => {
      const manager = createComplianceManager({
        enablePIIRedaction: false,
        enableAuditLogging: false,
      });

      manager.logAuditEntry({
        tenantId: "tenant-123",
        requestId: "req-456",
        operation: "chat_completion",
        providerId: "openai",
        modelId: "gpt-4",
        inputTokens: 100,
        outputTokens: 200,
        latencyMs: 1500,
        success: true,
        piiRedacted: false,
      });

      expect(manager.getAuditLogs()).toHaveLength(0);
    });

    it("should filter audit logs by tenantId", () => {
      complianceManager.logAuditEntry({
        tenantId: "tenant-1",
        requestId: "req-1",
        operation: "chat_completion",
        providerId: "openai",
        modelId: "gpt-4",
        inputTokens: 100,
        outputTokens: 200,
        latencyMs: 1500,
        success: true,
        piiRedacted: false,
      });

      complianceManager.logAuditEntry({
        tenantId: "tenant-2",
        requestId: "req-2",
        operation: "chat_completion",
        providerId: "anthropic",
        modelId: "claude-3",
        inputTokens: 150,
        outputTokens: 250,
        latencyMs: 1800,
        success: true,
        piiRedacted: false,
      });

      const logs = complianceManager.getAuditLogs({ tenantId: "tenant-1" });
      expect(logs).toHaveLength(1);
      expect(logs[0].tenantId).toBe("tenant-1");
    });

    it("should filter audit logs by time range", () => {
      const now = Date.now();

      complianceManager.logAuditEntry({
        tenantId: "tenant-1",
        requestId: "req-1",
        operation: "chat_completion",
        providerId: "openai",
        modelId: "gpt-4",
        inputTokens: 100,
        outputTokens: 200,
        latencyMs: 1500,
        success: true,
        piiRedacted: false,
      });

      const logs = complianceManager.getAuditLogs({
        startTime: now - 1000,
        endTime: now + 1000,
      });

      expect(logs.length).toBeGreaterThanOrEqual(1);
    });

    it("should clear audit logs", () => {
      complianceManager.logAuditEntry({
        tenantId: "tenant-1",
        requestId: "req-1",
        operation: "chat_completion",
        providerId: "openai",
        modelId: "gpt-4",
        inputTokens: 100,
        outputTokens: 200,
        latencyMs: 1500,
        success: true,
        piiRedacted: false,
      });

      complianceManager.clearAuditLogs();
      expect(complianceManager.getAuditLogs()).toHaveLength(0);
    });
  });

  describe("Data Residency", () => {
    it("should check data residency for EU tenants", () => {
      const manager = createComplianceManager({
        enablePIIRedaction: false,
        enableAuditLogging: false,
        dataResidency: "eu",
      });

      expect(() => {
        manager.checkDataResidency("tenant-eu", "Normal text without SSN");
      }).not.toThrow();

      expect(() => {
        manager.checkDataResidency("tenant-eu", "SSN: 123-45-6789");
      }).toThrow(AgentRuntimeError);
    });

    it("should not check data residency when set to global", () => {
      const manager = createComplianceManager({
        enablePIIRedaction: false,
        enableAuditLogging: false,
        dataResidency: "global",
      });

      expect(() => {
        manager.checkDataResidency("tenant-any", "SSN: 123-45-6789");
      }).not.toThrow();
    });
  });

  describe("GDPR Compliance", () => {
    it("should handle data deletion requests", () => {
      const manager = createComplianceManager({
        enablePIIRedaction: false,
        enableAuditLogging: true,
        gdprMode: "standard",
      });

      manager.checkGDPRCompliance({
        tenantId: "tenant-123",
        operation: "data_deletion",
      });

      const logs = manager.getAuditLogs({
        tenantId: "tenant-123",
        operation: "gdpr_data_deletion",
      });

      expect(logs).toHaveLength(1);
    });

    it("should handle data export requests", () => {
      const manager = createComplianceManager({
        enablePIIRedaction: false,
        enableAuditLogging: true,
        gdprMode: "standard",
      });

      manager.checkGDPRCompliance({
        tenantId: "tenant-123",
        operation: "data_export",
      });

      const logs = manager.getAuditLogs({
        tenantId: "tenant-123",
        operation: "gdpr_data_export",
      });

      expect(logs).toHaveLength(1);
    });

    it("should detect PII in strict mode", () => {
      const manager = createComplianceManager({
        enablePIIRedaction: false,
        enableAuditLogging: false,
        gdprMode: "strict",
      });

      const hasPII = manager["containsPII"]("Email: test@example.com");
      expect(hasPII).toBe(true);
    });

    it("should throw error for PII detection in strict mode", () => {
      const manager = createComplianceManager({
        enablePIIRedaction: false,
        enableAuditLogging: false,
        gdprMode: "strict",
      });

      expect(() => {
        manager.checkGDPRCompliance({
          tenantId: "tenant-123",
          operation: "chat_completion",
          data: "My SSN is 123-45-6789",
        });
      }).toThrow();
    });
  });

  describe("Compliance Report", () => {
    it("should generate compliance report", () => {
      const now = Date.now();

      complianceManager.logAuditEntry({
        tenantId: "tenant-123",
        requestId: "req-1",
        operation: "chat_completion",
        providerId: "openai",
        modelId: "gpt-4",
        inputTokens: 100,
        outputTokens: 200,
        latencyMs: 1500,
        success: true,
        piiRedacted: true,
      });

      complianceManager.logAuditEntry({
        tenantId: "tenant-123",
        requestId: "req-2",
        operation: "chat_completion",
        providerId: "openai",
        modelId: "gpt-4",
        inputTokens: 150,
        outputTokens: 250,
        latencyMs: 1800,
        success: true,
        piiRedacted: false,
      });

      const report = complianceManager.generateComplianceReport("tenant-123", {
        start: now - 10000,
        end: now + 10000,
      });

      expect(report.tenantId).toBe("tenant-123");
      expect(report.totalRequests).toBe(2);
      expect(report.piiRedactions).toBe(1);
    });
  });

  describe("Custom PII Patterns", () => {
    it("should add custom PII patterns", () => {
      complianceManager.addPIIPattern({
        name: "custom_id",
        pattern: /\bID-\d{6}\b/g,
        replacement: "[REDACTED_ID]",
      });

      const text = "My ID is ID-123456";
      const { redactedText, redacted } = complianceManager.redactPII(text);

      expect(redacted).toBe(true);
      expect(redactedText).toContain("[REDACTED_ID]");
    });

    it("should remove PII patterns", () => {
      complianceManager.removePIIPattern("email");

      const text = "Email: test@example.com";
      const { redactedText, redacted } = complianceManager.redactPII(text);

      expect(redacted).toBe(false);
      expect(redactedText).toBe(text);
    });
  });
});

describe("DEFAULT_PII_PATTERNS", () => {
  it("should export default patterns", () => {
    expect(DEFAULT_PII_PATTERNS).toBeInstanceOf(Array);
    expect(DEFAULT_PII_PATTERNS.length).toBeGreaterThan(0);
  });
});
