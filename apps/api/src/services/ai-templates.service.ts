import { AiTemplatesRepository } from "@agenticverdict/database";
import {
  createTemplateSchema,
  updateTemplateSchema,
  deployTemplateSchema,
} from "@agenticverdict/core/schemas/ai-provider";
import type { z } from "zod";

/**
 * AI Templates Service
 *
 * Business logic for AI template management.
 * Handles template validation, versioning, and deployment workflows.
 */

export class AiTemplatesService {
  private repository: AiTemplatesRepository;

  constructor(repository?: AiTemplatesRepository) {
    this.repository = repository || new AiTemplatesRepository();
  }

  /**
   * Allow injecting repository for testing
   */
  static forTest(repository: AiTemplatesRepository): AiTemplatesService {
    return new AiTemplatesService(repository);
  }

  // ==========================================================================
  // Template CRUD
  // ==========================================================================

  /**
   * Get all templates for tenant
   */
  async getTemplatesForTenant(tenantId: string, status?: "draft" | "published" | "archived") {
    return this.repository.findAllByTenant(tenantId, status);
  }

  /**
   * Get template by ID
   */
  async getTemplateById(tenantId: string, templateId: string) {
    const template = await this.repository.findById(tenantId, templateId);
    if (!template) {
      throw new Error("Template not found");
    }
    return template;
  }

  /**
   * Get latest version of template by name
   */
  async getLatestTemplateByName(tenantId: string, name: string, domainId?: string) {
    const template = await this.repository.findLatestByName(tenantId, name, domainId);
    if (!template) {
      throw new Error("Template not found");
    }
    return template;
  }

  /**
   * Create new template
   */
  async createTemplate(
    tenantId: string,
    data: z.infer<typeof createTemplateSchema>,
    createdById: string,
  ) {
    // Validate
    const validatedData = createTemplateSchema.parse(data);

    // Check name uniqueness
    const existing = await this.repository.findLatestByName(
      tenantId,
      validatedData.name,
      validatedData.domainId,
    );

    if (existing) {
      throw new Error("Template with this name already exists");
    }

    // Validate variables
    this.validateVariables(validatedData.variables || []);

    // Create template
    return this.repository.create({
      tenantId,
      name: validatedData.name,
      description: validatedData.description,
      type: validatedData.type,
      version: "1.0.0",
      content: validatedData.content,
      variables: validatedData.variables || [],
      providerId: validatedData.providerId,
      modelId: validatedData.modelId,
      domainId: validatedData.domainId,
      status: "draft",
      isLatestVersion: true,
      versionNumber: 1,
      createdById,
    });
  }

  /**
   * Update template
   */
  async updateTemplate(
    tenantId: string,
    templateId: string,
    data: z.infer<typeof updateTemplateSchema>,
  ) {
    // Validate
    const validatedData = updateTemplateSchema.parse(data);

    // Check template exists
    const existing = await this.repository.findById(tenantId, templateId);
    if (!existing) {
      throw new Error("Template not found");
    }

    // Validate variables if being updated
    if (validatedData.variables) {
      this.validateVariables(validatedData.variables);
    }

    // Update template
    const updated = await this.repository.update(tenantId, templateId, validatedData);
    if (!updated) {
      throw new Error("Template not found");
    }
    return updated;
  }

  /**
   * Delete template
   */
  async deleteTemplate(tenantId: string, templateId: string): Promise<boolean> {
    const template = await this.repository.findById(tenantId, templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Check if template has deployments
    const deployments = await this.repository.getTemplateDeployments(tenantId, templateId);
    if (deployments.length > 0) {
      throw new Error("Cannot delete template with active deployments");
    }

    return this.repository.delete(tenantId, templateId);
  }

  // ==========================================================================
  // Template Versioning
  // ==========================================================================

  /**
   * Create new version from existing template
   */
  async createNewVersion(
    tenantId: string,
    templateId: string,
    content: string,
    variables?: Array<{
      name: string;
      type: string;
      required: boolean;
      defaultValue?: unknown;
      description?: string;
      pattern?: string;
    }>,
  ) {
    const template = await this.repository.findById(tenantId, templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    return this.repository.createNewVersion(tenantId, templateId, content, variables);
  }

  /**
   * Get version history
   */
  async getVersionHistory(tenantId: string, templateId: string) {
    return this.repository.getVersionHistory(tenantId, templateId);
  }

  /**
   * Get all versions of a template
   */
  async getTemplateVersions(tenantId: string, name: string, domainId?: string) {
    return this.repository.getVersions(tenantId, name, domainId);
  }

  /**
   * Publish template
   */
  async publishTemplate(tenantId: string, templateId: string) {
    const template = await this.repository.findById(tenantId, templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    if (template.status === "published") {
      throw new Error("Template is already published");
    }

    const updated = await this.repository.publish(tenantId, templateId);
    if (!updated) {
      throw new Error("Template not found");
    }
    return updated;
  }

  /**
   * Archive template
   */
  async archiveTemplate(tenantId: string, templateId: string) {
    const template = await this.repository.findById(tenantId, templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    if (template.status === "archived") {
      throw new Error("Template is already archived");
    }

    const updated = await this.repository.archive(tenantId, templateId);
    if (!updated) {
      throw new Error("Template not found");
    }
    return updated;
  }

  // ==========================================================================
  // Template Deployment
  // ==========================================================================

  /**
   * Deploy template to target
   */
  async deployTemplate(
    tenantId: string,
    data: z.infer<typeof deployTemplateSchema>,
    deployedBy?: string,
  ) {
    // Validate
    const validatedData = deployTemplateSchema.parse(data);

    // Check template exists
    const template = await this.repository.findById(tenantId, validatedData.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Check if template is published
    if (template.status !== "published") {
      throw new Error("Only published templates can be deployed");
    }

    // Check for existing deployment
    if (validatedData.targetId) {
      const existing = await this.repository.getDeploymentByTarget(
        tenantId,
        validatedData.targetScope,
        validatedData.targetId,
      );

      if (existing) {
        throw new Error("Target already has an active template deployment");
      }
    }

    // Deploy
    return this.repository.deployTemplate({
      templateId: validatedData.templateId,
      tenantId,
      scope: validatedData.targetScope,
      targetId: validatedData.targetId,
      deployedVariables: validatedData.variables || {},
      deployedBy,
      deploymentStatus: "active",
    });
  }

  /**
   * Undeploy template
   */
  async undeployTemplate(tenantId: string, deploymentId: string) {
    return this.repository.undeploy(tenantId, deploymentId);
  }

  /**
   * Get deployments for template
   */
  async getTemplateDeployments(tenantId: string, templateId: string) {
    return this.repository.getTemplateDeployments(tenantId, templateId);
  }

  /**
   * Get deployment by target
   */
  async getDeploymentByTarget(tenantId: string, scope: string, targetId: string) {
    return this.repository.getDeploymentByTarget(tenantId, scope, targetId);
  }

  // ==========================================================================
  // Template Search & Discovery
  // ==========================================================================

  /**
   * Search templates by name
   */
  async searchTemplates(tenantId: string, query: string) {
    return this.repository.searchByName(tenantId, query);
  }

  /**
   * Get published templates by type
   */
  async getPublishedTemplatesByType(
    tenantId: string,
    type: "prompt" | "configuration" | "workflow",
    domainId?: string,
  ) {
    return this.repository.findPublishedByType(tenantId, type, domainId);
  }

  /**
   * Get template usage analytics
   */
  async getTemplateUsage(tenantId: string, templateId: string, startDate?: Date, endDate?: Date) {
    const now = new Date();
    const start = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate || now;

    const usageData = await this.repository.getUsageForDateRange(tenantId, templateId, start, end);

    const totalUsage = await this.repository.getTotalUsage(tenantId, templateId);

    return {
      timeSeries: usageData,
      total: totalUsage,
    };
  }

  // ==========================================================================
  // Validation Helpers
  // ==========================================================================

  /**
   * Validate template variables
   */
  private validateVariables(variables: Array<Record<string, unknown>>): void {
    const variableNames = new Set<string>();

    for (const variable of variables) {
      const name = variable.name as string;

      // Check for duplicate names
      if (variableNames.has(name)) {
        throw new Error(`Duplicate variable name: ${name}`);
      }
      variableNames.add(name);

      // Validate name format
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        throw new Error(`Invalid variable name format: ${name}`);
      }

      // Validate type
      const validTypes = ["string", "number", "boolean", "object", "array"];
      if (!validTypes.includes(variable.type as string)) {
        throw new Error(`Invalid variable type: ${variable.type}`);
      }
    }
  }

  // ==========================================================================
  // Query Helpers
  // ==========================================================================

  /**
   * Count templates for tenant
   */
  async countTemplates(tenantId: string): Promise<number> {
    return this.repository.countByTenant(tenantId);
  }

  /**
   * Get most deployed templates
   */
  async getMostDeployedTemplates(tenantId: string, limit = 10) {
    const allTemplates = await this.repository.findAllByTenant(tenantId);
    return allTemplates.sort((a, b) => b.deploymentCount - a.deploymentCount).slice(0, limit);
  }
}
