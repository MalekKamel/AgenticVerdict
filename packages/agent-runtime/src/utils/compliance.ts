import { AgentRuntimeError } from "../errors/AgentRuntimeError";
import { AgentRuntimeErrorCode } from "../errors/AgentRuntimeError";

export interface ComplianceConfig {
  enablePIIRedaction: boolean;
  enableAuditLogging: boolean;
  dataResidency?: "us" | "eu" | "apac" | "global";
  gdprMode?: "strict" | "standard" | "minimal";
}

export interface AuditLogEntry {
  timestamp: number;
  tenantId: string;
  requestId: string;
  operation: string;
  providerId: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  success: boolean;
  error?: string;
  piiRedacted: boolean;
  dataResidency?: string;
}

export interface PIIPattern {
  name: string;
  pattern: RegExp;
  replacement: string;
}

const DEFAULT_PII_PATTERNS: PIIPattern[] = [
  {
    name: "email",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: "[REDACTED_EMAIL]",
  },
  {
    name: "phone",
    pattern: /\b(?:\+?\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g,
    replacement: "[REDACTED_PHONE]",
  },
  {
    name: "ssn",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: "[REDACTED_SSN]",
  },
  {
    name: "credit_card",
    pattern: /\b(?:\d{4}[- ]?){3}\d{4}\b/g,
    replacement: "[REDACTED_CC]",
  },
  {
    name: "ip_address",
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    replacement: "[REDACTED_IP]",
  },
];

export class ComplianceManager {
  private config: ComplianceConfig;
  private piiPatterns: PIIPattern[];
  private auditLogs: AuditLogEntry[];

  constructor(config: ComplianceConfig) {
    this.config = config;
    this.piiPatterns = DEFAULT_PII_PATTERNS;
    this.auditLogs = [];
  }

  redactPII(text: string): { redactedText: string; redacted: boolean } {
    if (!this.config.enablePIIRedaction) {
      return { redactedText: text, redacted: false };
    }

    let redacted = false;
    let result = text;

    for (const pattern of this.piiPatterns) {
      const matches = result.match(pattern.pattern);
      if (matches && matches.length > 0) {
        redacted = true;
        result = result.replace(pattern.pattern, pattern.replacement);
      }
    }

    return { redactedText: result, redacted };
  }

  redactMessages(messages: Array<{ role: string; content: string }>): {
    messages: Array<{ role: string; content: string }>;
    redacted: boolean;
  } {
    if (!this.config.enablePIIRedaction) {
      return { messages, redacted: false };
    }

    let overallRedacted = false;
    const redactedMessages = messages.map((msg) => {
      const { redactedText, redacted } = this.redactPII(msg.content);
      if (redacted) {
        overallRedacted = true;
      }
      return {
        role: msg.role,
        content: redactedText,
      };
    });

    return { messages: redactedMessages, redacted: overallRedacted };
  }

  addPIIPattern(pattern: PIIPattern): void {
    this.piiPatterns.push(pattern);
  }

  removePIIPattern(name: string): void {
    this.piiPatterns = this.piiPatterns.filter((p) => p.name !== name);
  }

  logAuditEntry(entry: Omit<AuditLogEntry, "timestamp">): void {
    if (!this.config.enableAuditLogging) {
      return;
    }

    const auditEntry: AuditLogEntry = {
      ...entry,
      timestamp: Date.now(),
    };

    this.auditLogs.push(auditEntry);
  }

  getAuditLogs(filters?: {
    tenantId?: string;
    startTime?: number;
    endTime?: number;
    operation?: string;
  }): AuditLogEntry[] {
    let logs = this.auditLogs;

    if (filters) {
      if (filters.tenantId) {
        logs = logs.filter((log) => log.tenantId === filters.tenantId);
      }

      if (filters.startTime) {
        logs = logs.filter((log) => log.timestamp >= (filters.startTime ?? 0));
      }

      if (filters.endTime) {
        logs = logs.filter((log) => log.timestamp <= (filters.endTime ?? Date.now()));
      }

      if (filters.operation) {
        logs = logs.filter((log) => log.operation === filters.operation);
      }
    }

    return logs;
  }

  clearAuditLogs(): void {
    this.auditLogs = [];
  }

  checkDataResidency(tenantId: string, data: string): void {
    const residency = this.config.dataResidency;

    if (!residency || residency === "global") {
      return;
    }

    if (residency === "eu") {
      if (this.containsNonEUData(data)) {
        throw new AgentRuntimeError({
          code: AgentRuntimeErrorCode.COMPLIANCE_VIOLATION,
          message: "Data residency violation: EU tenant cannot process non-EU data",
          tenantId,
          metadata: {
            dataResidency: residency,
            violation: "non_eu_data_detected",
          },
        });
      }
    }
  }

  private containsNonEUData(data: string): boolean {
    const nonEUPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/g,
      /\b(?:\+1[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g,
    ];

    for (const pattern of nonEUPatterns) {
      if (pattern.test(data)) {
        return true;
      }
    }

    return false;
  }

  checkGDPRCompliance(request: { tenantId: string; operation: string; data?: string }): void {
    const mode = this.config.gdprMode;

    if (!mode || mode === "minimal") {
      return;
    }

    if (request.operation === "data_deletion") {
      this.handleDataDeletionRequest(request.tenantId);
    }

    if (request.operation === "data_export") {
      this.handleDataExportRequest(request.tenantId);
    }

    if (mode === "strict" && request.data) {
      if (this.containsPII(request.data)) {
        throw new AgentRuntimeError({
          code: AgentRuntimeErrorCode.COMPLIANCE_VIOLATION,
          message: "GDPR violation: Unredacted PII detected in strict mode",
          tenantId: request.tenantId,
          metadata: {
            gdprMode: mode,
            violation: "unredacted_pii",
          },
        });
      }
    }
  }

  private containsPII(data: string): boolean {
    for (const pattern of this.piiPatterns) {
      if (pattern.pattern.test(data)) {
        return true;
      }
    }
    return false;
  }

  private handleDataDeletionRequest(tenantId: string): void {
    const auditEntry: Omit<AuditLogEntry, "timestamp"> = {
      tenantId,
      requestId: `gdpr-delete-${Date.now()}`,
      operation: "gdpr_data_deletion",
      providerId: "compliance",
      modelId: "n/a",
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: 0,
      success: true,
      piiRedacted: false,
      dataResidency: this.config.dataResidency,
    };

    this.logAuditEntry(auditEntry);
  }

  private handleDataExportRequest(tenantId: string): void {
    const auditEntry: Omit<AuditLogEntry, "timestamp"> = {
      tenantId,
      requestId: `gdpr-export-${Date.now()}`,
      operation: "gdpr_data_export",
      providerId: "compliance",
      modelId: "n/a",
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: 0,
      success: true,
      piiRedacted: false,
      dataResidency: this.config.dataResidency,
    };

    this.logAuditEntry(auditEntry);
  }

  generateComplianceReport(
    tenantId: string,
    period: { start: number; end: number },
  ): {
    tenantId: string;
    period: { start: number; end: number };
    totalRequests: number;
    piiRedactions: number;
    complianceViolations: number;
    dataResidencyViolations: number;
    gdprRequests: number;
  } {
    const logs = this.getAuditLogs({
      tenantId,
      startTime: period.start,
      endTime: period.end,
    });

    return {
      tenantId,
      period,
      totalRequests: logs.length,
      piiRedactions: logs.filter((log) => log.piiRedacted).length,
      complianceViolations: logs.filter((log) => log.error?.includes("COMPLIANCE_VIOLATION"))
        .length,
      dataResidencyViolations: logs.filter((log) => log.error?.includes("data_residency")).length,
      gdprRequests: logs.filter(
        (log) =>
          log.operation.includes("gdpr_data_deletion") ||
          log.operation.includes("gdpr_data_export"),
      ).length,
    };
  }
}

export function createComplianceManager(config: ComplianceConfig): ComplianceManager {
  return new ComplianceManager(config);
}

export { DEFAULT_PII_PATTERNS };
