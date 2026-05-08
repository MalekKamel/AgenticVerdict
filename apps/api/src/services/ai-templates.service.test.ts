/**
 * AI Templates Service Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AiTemplatesService } from "./ai-templates.service";
import { AiTemplatesRepository } from "@agenticverdict/database";

const mockRepository = {
  findAllByTenant: vi.fn(),
  findById: vi.fn(),
  findLatestByName: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  publish: vi.fn(),
  archive: vi.fn(),
  getVersions: vi.fn(),
  getVersionHistory: vi.fn(),
  createNewVersion: vi.fn(),
  deployTemplate: vi.fn(),
  getTemplateDeployments: vi.fn(),
  getDeploymentByTarget: vi.fn(),
  undeploy: vi.fn(),
  recordUsage: vi.fn(),
  getUsageForDateRange: vi.fn(),
  getTotalUsage: vi.fn(),
  findPublishedByType: vi.fn(),
  searchByName: vi.fn(),
  countByTenant: vi.fn(),
} as unknown as AiTemplatesRepository;

describe("AiTemplatesService", () => {
  let service: AiTemplatesService;
  const mockTenantId = "tenant-123";

  beforeEach(() => {
    vi.clearAllMocks();
    service = AiTemplatesService.forTest(mockRepository);
  });

  describe("getTemplatesForTenant", () => {
    it("should return all templates for tenant", async () => {
      const mockTemplates = [
        { id: "template-1", tenantId: mockTenantId, name: "Template 1" },
        { id: "template-2", tenantId: mockTenantId, name: "Template 2" },
      ];

      vi.spyOn(mockRepository, "findAllByTenant").mockResolvedValue(mockTemplates as unknown);

      const result = await service.getTemplatesForTenant(mockTenantId);

      expect(result).toEqual(mockTemplates);
    });

    it("should filter by status when provided", async () => {
      vi.spyOn(mockRepository, "findAllByTenant").mockResolvedValue([]);

      await service.getTemplatesForTenant(mockTenantId, "published");

      expect(mockRepository.findAllByTenant).toHaveBeenCalledWith(mockTenantId, "published");
    });
  });

  describe("getTemplateById", () => {
    it("should return template by ID", async () => {
      const mockTemplate = { id: "template-123", tenantId: mockTenantId, name: "Test" };

      vi.spyOn(mockRepository, "findById").mockResolvedValue(mockTemplate as unknown);

      const result = await service.getTemplateById(mockTenantId, "template-123");

      expect(result).toEqual(mockTemplate);
    });

    it("should throw when not found", async () => {
      vi.spyOn(mockRepository, "findById").mockResolvedValue(null);

      await expect(service.getTemplateById(mockTenantId, "non-existent")).rejects.toThrow(
        "Template not found",
      );
    });
  });

  describe("createTemplate", () => {
    it("should create new template", async () => {
      const templateData = {
        name: "New Template",
        type: "prompt" as const,
        content: "Template content",
        version: "1.0.0",
        variables: [],
        domainId: "123e4567-e89b-12d3-a456-426614174000",
      };

      const created = { id: "template-new", tenantId: mockTenantId, ...templateData };

      vi.spyOn(mockRepository, "create").mockResolvedValue(created as unknown);

      const result = await service.createTemplate(mockTenantId, templateData, "user-123");

      expect(result).toEqual(created);
    });
  });

  describe("createNewVersion", () => {
    it("should create new version from existing template", async () => {
      const newVersion = {
        id: "template-v2",
        name: "Template",
        version: "1.0.1",
      };

      vi.spyOn(mockRepository, "findById").mockResolvedValue({ id: "template-123" } as unknown);
      vi.spyOn(mockRepository, "createNewVersion").mockResolvedValue(newVersion as unknown);

      const result = await service.createNewVersion(
        mockTenantId,
        "template-123",
        "Updated content",
      );

      expect(result).toEqual(newVersion);
    });

    it("should throw error when template not found", async () => {
      vi.spyOn(mockRepository, "findById").mockResolvedValue(null);

      await expect(
        service.createNewVersion(mockTenantId, "non-existent", "content"),
      ).rejects.toThrow("Template not found");
    });
  });

  describe("publishTemplate", () => {
    it("should publish template", async () => {
      const published = { id: "template-123", status: "published" };

      vi.spyOn(mockRepository, "findById").mockResolvedValue({
        id: "template-123",
        status: "draft",
      } as unknown);
      vi.spyOn(mockRepository, "publish").mockResolvedValue(published as unknown);

      const result = await service.publishTemplate(mockTenantId, "template-123");

      expect(result).toEqual(published);
      expect(result.status).toBe("published");
    });
  });

  describe("archiveTemplate", () => {
    it("should archive template", async () => {
      const archived = { id: "template-123", status: "archived" };

      vi.spyOn(mockRepository, "findById").mockResolvedValue({
        id: "template-123",
        status: "draft",
      } as unknown);
      vi.spyOn(mockRepository, "archive").mockResolvedValue(archived as unknown);

      const result = await service.archiveTemplate(mockTenantId, "template-123");

      expect(result).toEqual(archived);
      expect(result.status).toBe("archived");
    });
  });

  describe("deleteTemplate", () => {
    it("should delete template", async () => {
      vi.spyOn(mockRepository, "findById").mockResolvedValue({
        id: "template-123",
        status: "draft",
      } as unknown);
      vi.spyOn(mockRepository, "getTemplateDeployments").mockResolvedValue([]);
      vi.spyOn(mockRepository, "delete").mockResolvedValue(true);

      const result = await service.deleteTemplate(mockTenantId, "template-123");

      expect(result).toBe(true);
    });
  });

  describe("deployTemplate", () => {
    it("should deploy template to target", async () => {
      const deployment = {
        id: "deploy-1",
        templateId: "template-123",
        scope: "domain",
        targetId: "domain-456",
      };

      vi.spyOn(mockRepository, "findById").mockResolvedValue({
        id: "template-123",
        status: "published",
      } as unknown);
      vi.spyOn(mockRepository, "getDeploymentByTarget").mockResolvedValue(null);
      vi.spyOn(mockRepository, "deployTemplate").mockResolvedValue(deployment as unknown);

      const result = await service.deployTemplate(mockTenantId, {
        templateId: "123e4567-e89b-12d3-a456-426614174000",
        targetScope: "domain",
        targetId: "123e4567-e89b-12d3-a456-426614174001",
      });

      expect(result).toEqual(deployment);
    });
  });

  describe("undeployTemplate", () => {
    it("should undeploy template", async () => {
      const undeployed = { id: "deploy-1", deploymentStatus: "inactive" };

      vi.spyOn(mockRepository, "undeploy").mockResolvedValue(undeployed as unknown);

      const result = await service.undeployTemplate(mockTenantId, "deploy-1");

      expect(result).toEqual(undeployed);
      expect(result.deploymentStatus).toBe("inactive");
    });
  });

  describe("getTemplateUsage", () => {
    it("should return template usage analytics", async () => {
      const mockTimeSeries = [{ date: "2024-01-01", executions: 10 }];
      const mockTotal = {
        totalExecutions: 100,
        totalSuccesses: 95,
        totalFailures: 5,
        totalTokens: 50000,
        totalCostCents: 750,
      };

      vi.spyOn(mockRepository, "getUsageForDateRange").mockResolvedValue(mockTimeSeries);
      vi.spyOn(mockRepository, "getTotalUsage").mockResolvedValue(mockTotal);

      const result = await service.getTemplateUsage(mockTenantId, "template-123");

      expect(result).toEqual({ timeSeries: mockTimeSeries, total: mockTotal });
    });
  });

  describe("searchTemplates", () => {
    it("should search templates by name", async () => {
      const mockResults = [
        { id: "template-1", name: "Marketing Insight" },
        { id: "template-2", name: "Marketing Report" },
      ];

      vi.spyOn(mockRepository, "searchByName").mockResolvedValue(mockResults as unknown);

      const result = await service.searchTemplates(mockTenantId, "marketing");

      expect(result).toEqual(mockResults);
    });
  });

  describe("Tenant isolation", () => {
    it("should always include tenantId in queries", async () => {
      const mockTemplate = { id: "template-123", tenantId: mockTenantId, name: "Test" };
      vi.spyOn(mockRepository, "findById").mockResolvedValue(mockTemplate as unknown);

      await service.getTemplateById(mockTenantId, "template-123");

      expect(mockRepository.findById).toHaveBeenCalledWith(mockTenantId, "template-123");
    });
  });
});
