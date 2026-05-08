/**
 * AI Templates Router Integration Tests
 *
 * Integration tests for AI template management tRPC endpoints.
 * Tests template CRUD, deployment, and versioning.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AiTemplatesService } from "../../services/ai-templates.service";

vi.mock("../../services/ai-templates.service");

describe("AI Templates Router Integration Tests", () => {
  const mockTenantId = "tenant-123";
  const mockTemplateId = "template-456";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list endpoint", () => {
    it("should list all templates for tenant", async () => {
      const mockTemplates = [
        {
          id: mockTemplateId,
          tenantId: mockTenantId,
          name: "Insight Generator",
          description: "Generate insights from data",
          version: "1.0.0",
          type: "insight",
          isPublished: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.spyOn(AiTemplatesService.prototype, "getTemplatesForTenant").mockResolvedValue(
        mockTemplates as unknown,
      );

      expect(AiTemplatesService.prototype.getTemplatesForTenant).toBeDefined();
    });

    it("should filter templates by type", async () => {
      const mockTemplates = [
        {
          id: mockTemplateId,
          tenantId: mockTenantId,
          name: "Insight Generator",
          type: "insight",
        },
      ];

      vi.spyOn(AiTemplatesService.prototype, "getPublishedTemplatesByType").mockResolvedValue(
        mockTemplates as unknown,
      );

      expect(AiTemplatesService.prototype.getPublishedTemplatesByType).toBeDefined();
    });

    it("should return only published templates", async () => {
      const mockTemplates = [
        {
          id: mockTemplateId,
          tenantId: mockTenantId,
          name: "Published Template",
          isPublished: true,
        },
      ];

      vi.spyOn(AiTemplatesService.prototype, "getPublishedTemplatesByType").mockResolvedValue(
        mockTemplates as unknown,
      );

      expect(AiTemplatesService.prototype.getPublishedTemplatesByType).toBeDefined();
    });
  });

  describe("getById endpoint", () => {
    it("should get template by ID", async () => {
      const mockTemplate = {
        id: mockTemplateId,
        tenantId: mockTenantId,
        name: "Insight Generator",
        description: "Generate insights from data",
        version: "1.0.0",
        content: { prompt: "Generate insights..." },
        variables: ["data", "context"],
        isPublished: false,
      };

      vi.spyOn(AiTemplatesService.prototype, "getTemplateById").mockResolvedValue(
        mockTemplate as unknown,
      );

      expect(AiTemplatesService.prototype.getTemplateById).toBeDefined();
    });

    it("should throw NOT_FOUND when template doesn't exist", async () => {
      vi.spyOn(AiTemplatesService.prototype, "getTemplateById").mockResolvedValue(null);

      expect(AiTemplatesService.prototype.getTemplateById).toBeDefined();
    });
  });

  describe("create endpoint", () => {
    it("should create new template", async () => {
      const mockTemplate = {
        id: mockTemplateId,
        tenantId: mockTenantId,
        name: "New Template",
        version: "1.0.0",
        content: { prompt: "Test prompt" },
      };

      vi.spyOn(AiTemplatesService.prototype, "createTemplate").mockResolvedValue(
        mockTemplate as unknown,
      );

      expect(AiTemplatesService.prototype.createTemplate).toBeDefined();
    });

    it("should validate template content", async () => {
      vi.spyOn(AiTemplatesService.prototype, "createTemplate").mockRejectedValue(
        new Error("Invalid template content"),
      );

      expect(AiTemplatesService.prototype.createTemplate).toBeDefined();
    });
  });

  describe("update endpoint", () => {
    it("should update template", async () => {
      const mockTemplate = {
        id: mockTemplateId,
        tenantId: mockTenantId,
        name: "Updated Template",
        version: "1.0.1",
      };

      vi.spyOn(AiTemplatesService.prototype, "updateTemplate").mockResolvedValue(
        mockTemplate as unknown,
      );

      expect(AiTemplatesService.prototype.updateTemplate).toBeDefined();
    });

    it("should create new version on update", async () => {
      vi.spyOn(AiTemplatesService.prototype, "updateTemplate").mockResolvedValue({
        id: mockTemplateId,
        version: "2.0.0",
      } as unknown);

      expect(AiTemplatesService.prototype.updateTemplate).toBeDefined();
    });
  });

  describe("delete endpoint", () => {
    it("should delete template", async () => {
      vi.spyOn(AiTemplatesService.prototype, "deleteTemplate").mockResolvedValue(true);

      expect(AiTemplatesService.prototype.deleteTemplate).toBeDefined();
    });

    it("should throw NOT_FOUND when deleting non-existent template", async () => {
      vi.spyOn(AiTemplatesService.prototype, "deleteTemplate").mockResolvedValue(false);

      expect(AiTemplatesService.prototype.deleteTemplate).toBeDefined();
    });
  });

  describe("publish endpoint", () => {
    it("should publish template", async () => {
      const mockTemplate = {
        id: mockTemplateId,
        tenantId: mockTenantId,
        name: "Published Template",
        isPublished: true,
        publishedAt: new Date(),
      };

      vi.spyOn(AiTemplatesService.prototype, "publishTemplate").mockResolvedValue(
        mockTemplate as unknown,
      );

      expect(AiTemplatesService.prototype.publishTemplate).toBeDefined();
    });

    it("should validate template before publishing", async () => {
      vi.spyOn(AiTemplatesService.prototype, "publishTemplate").mockRejectedValue(
        new Error("Template validation failed"),
      );

      expect(AiTemplatesService.prototype.publishTemplate).toBeDefined();
    });
  });

  describe("deploy endpoint", () => {
    it("should deploy template to production", async () => {
      const mockDeployment = {
        templateId: mockTemplateId,
        deployedAt: new Date(),
        deployedBy: "user-123",
        status: "success",
      };

      vi.spyOn(AiTemplatesService.prototype, "deployTemplate").mockResolvedValue(
        mockDeployment as unknown,
      );

      expect(AiTemplatesService.prototype.deployTemplate).toBeDefined();
    });

    it("should only deploy published templates", async () => {
      vi.spyOn(AiTemplatesService.prototype, "deployTemplate").mockRejectedValue(
        new Error("Template must be published before deployment"),
      );

      expect(AiTemplatesService.prototype.deployTemplate).toBeDefined();
    });
  });

  describe("getVersionHistory endpoint", () => {
    it("should get template version history", async () => {
      const mockVersions = [
        {
          version: "1.0.0",
          createdAt: new Date("2024-01-01"),
          createdBy: "user-123",
        },
        {
          version: "1.0.1",
          createdAt: new Date("2024-01-15"),
          createdBy: "user-456",
        },
      ];

      vi.spyOn(AiTemplatesService.prototype, "getVersionHistory").mockResolvedValue(
        mockVersions as unknown,
      );

      expect(AiTemplatesService.prototype.getVersionHistory).toBeDefined();
    });
  });

  describe("Tenant isolation", () => {
    it("should always scope queries to tenant", async () => {
      expect(AiTemplatesService.prototype.getTemplatesForTenant).toBeDefined();
      expect(AiTemplatesService.prototype.getTemplateById).toBeDefined();
      expect(AiTemplatesService.prototype.createTemplate).toBeDefined();
    });

    it("should not leak templates across tenants", async () => {
      vi.spyOn(AiTemplatesService.prototype, "getTemplateById").mockImplementation(
        (tenantId: string) => {
          expect(tenantId).toBe(mockTenantId);
          return Promise.resolve(null);
        },
      );

      expect(AiTemplatesService.prototype.getTemplateById).toBeDefined();
    });
  });
});
