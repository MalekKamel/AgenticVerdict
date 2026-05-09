import { BusinessDomainsRepository } from "@agenticverdict/database";
import { createDomainSchema, updateDomainSchema } from "@agenticverdict/types";
import type { z } from "zod";

/**
 * AI Domains Service
 *
 * Business logic for business domain management.
 * Handles hierarchy validation, connector assignments, and domain operations.
 */

export class AiDomainsService {
  private repository: BusinessDomainsRepository;

  constructor(repository?: BusinessDomainsRepository) {
    this.repository = repository || new BusinessDomainsRepository();
  }

  /**
   * Allow injecting repository for testing
   */
  static forTest(repository: BusinessDomainsRepository): AiDomainsService {
    return new AiDomainsService(repository);
  }

  // ==========================================================================
  // Domain CRUD
  // ==========================================================================

  /**
   * Get all domains for tenant
   */
  async getDomainsForTenant(tenantId: string) {
    return this.repository.findAllByTenant(tenantId);
  }

  /**
   * Get domain hierarchy tree
   */
  async getDomainTree(tenantId: string) {
    return this.repository.getHierarchyTree(tenantId);
  }

  /**
   * Get domain by ID
   */
  async getDomainById(tenantId: string, domainId: string) {
    const domain = await this.repository.findById(tenantId, domainId);
    if (!domain) {
      throw new Error("Domain not found");
    }
    return domain;
  }

  /**
   * Create new domain
   */
  async createDomain(tenantId: string, data: z.infer<typeof createDomainSchema>) {
    // Validate
    const validatedData = createDomainSchema.parse(data);

    // Check name uniqueness
    const isUnique = await this.repository.isNameUnique(tenantId, validatedData.name);
    if (!isUnique) {
      throw new Error("Domain name already exists");
    }

    // Validate parent if provided
    if (validatedData.parentId) {
      const parent = await this.repository.findById(tenantId, validatedData.parentId);
      if (!parent) {
        throw new Error("Parent domain not found");
      }

      // Check for circular reference
      const wouldCycle = await this.repository.wouldCreateCycle(
        tenantId,
        validatedData.parentId,
        null,
      );
      if (wouldCycle) {
        throw new Error("Cannot create circular domain hierarchy");
      }
    }

    // Create domain
    return this.repository.create({
      tenantId,
      name: validatedData.name,
      description: validatedData.description,
      parentId: validatedData.parentId,
      order: validatedData.order,
      usesTenantDefault: true,
    });
  }

  /**
   * Update domain
   */
  async updateDomain(tenantId: string, domainId: string, data: z.infer<typeof updateDomainSchema>) {
    // Validate
    const validatedData = updateDomainSchema.parse(data);

    // Check domain exists
    const existing = await this.repository.findById(tenantId, domainId);
    if (!existing) {
      throw new Error("Domain not found");
    }

    // Check name uniqueness if name is being updated
    if (validatedData.name && validatedData.name !== existing.name) {
      const isUnique = await this.repository.isNameUnique(tenantId, validatedData.name, domainId);
      if (!isUnique) {
        throw new Error("Domain name already exists");
      }
    }

    // Check for circular reference if parent is being updated
    if (validatedData.parentId && validatedData.parentId !== existing.parentId) {
      const wouldCycle = await this.repository.wouldCreateCycle(
        tenantId,
        domainId,
        validatedData.parentId,
      );
      if (wouldCycle) {
        throw new Error("Cannot create circular domain hierarchy");
      }
    }

    // Update domain
    return this.repository.update(tenantId, domainId, validatedData);
  }

  /**
   * Delete domain
   */
  async deleteDomain(
    tenantId: string,
    domainId: string,
  ): Promise<{
    success: boolean;
    hasConnectors: boolean;
    hasChildren: boolean;
  }> {
    // Check if domain has children
    const hasChildren = await this.repository.hasChildren(tenantId, domainId);
    if (hasChildren) {
      return { success: false, hasConnectors: false, hasChildren: true };
    }

    // Check if domain has connectors
    const connectorCount = await this.repository.countConnectors(tenantId, domainId);
    if (connectorCount > 0) {
      return { success: false, hasConnectors: true, hasChildren: false };
    }

    // Delete domain
    const deleted = await this.repository.delete(tenantId, domainId);
    return { success: deleted, hasConnectors: false, hasChildren: false };
  }

  // ==========================================================================
  // Connector Assignments
  // ==========================================================================

  /**
   * Assign connector to domain
   */
  async assignConnectorToDomain(tenantId: string, domainId: string, connectorId: string) {
    // Validate domain exists
    const domain = await this.repository.findById(tenantId, domainId);
    if (!domain) {
      throw new Error("Domain not found");
    }

    // Assign connector
    return this.repository.assignConnector({
      domainId,
      connectorId,
      tenantId,
      order: 0,
    });
  }

  /**
   * Remove connector from domain
   */
  async removeConnectorFromDomain(tenantId: string, connectorId: string) {
    return this.repository.removeConnector(tenantId, connectorId);
  }

  /**
   * Get connectors for domain
   */
  async getDomainConnectors(tenantId: string, domainId: string) {
    return this.repository.getDomainConnectors(tenantId, domainId);
  }

  /**
   * Get domain for connector
   */
  async getConnectorDomain(tenantId: string, connectorId: string) {
    return this.repository.getConnectorDomain(tenantId, connectorId);
  }

  /**
   * Reassign connector to different domain
   */
  async reassignConnector(tenantId: string, connectorId: string, newDomainId: string) {
    // Validate new domain exists
    const newDomain = await this.repository.findById(tenantId, newDomainId);
    if (!newDomain) {
      throw new Error("Target domain not found");
    }

    // Remove from current domain
    await this.repository.removeConnector(tenantId, connectorId);

    // Assign to new domain
    return this.repository.assignConnector({
      domainId: newDomainId,
      connectorId,
      tenantId,
      order: 0,
    });
  }

  // ==========================================================================
  // Hierarchy Operations
  // ==========================================================================

  /**
   * Get domain with full ancestor chain
   */
  async getDomainWithAncestors(tenantId: string, domainId: string) {
    const domain = await this.repository.findById(tenantId, domainId);
    if (!domain) {
      throw new Error("Domain not found");
    }

    const ancestors = await this.repository.getAncestorChain(tenantId, domainId);

    return {
      domain,
      ancestors,
    };
  }

  /**
   * Get domain with children and connectors
   */
  async getDomainWithChildren(tenantId: string, domainId: string) {
    const domain = await this.repository.findById(tenantId, domainId);
    if (!domain) {
      throw new Error("Domain not found");
    }

    const children = await this.repository.findChildren(tenantId, domainId);
    const connectors = await this.repository.getDomainConnectors(tenantId, domainId);

    return {
      domain,
      children,
      connectors,
    };
  }

  /**
   * Get all descendants of a domain
   */
  async getDomainDescendants(tenantId: string, domainId: string) {
    const descendantIds = await this.repository.getDescendantIds(tenantId, domainId);

    // Fetch all descendant domains
    const allDomains = await this.repository.getHierarchyTree(tenantId);
    const descendants = allDomains.filter((d) => descendantIds.includes(d.id));

    return descendants;
  }

  // ==========================================================================
  // Domain Provider Configuration
  // ==========================================================================

  /**
   * Update domain provider override
   */
  async updateDomainProviderConfig(
    tenantId: string,
    domainId: string,
    providerConfig: {
      providerId: string;
      modelId: string;
      costTier: "premium" | "standard" | "economy";
    },
  ) {
    const domain = await this.repository.findById(tenantId, domainId);
    if (!domain) {
      throw new Error("Domain not found");
    }

    return this.repository.update(tenantId, domainId, {
      providerConfig,
      usesTenantDefault: false,
    });
  }

  /**
   * Reset domain to use tenant default provider
   */
  async resetToTenantDefault(tenantId: string, domainId: string) {
    return this.repository.update(tenantId, domainId, {
      providerConfig: null,
      usesTenantDefault: true,
    });
  }

  /**
   * Get domain hierarchy (path from domain to root)
   */
  async getDomainHierarchy(tenantId: string, domainId: string) {
    const domain = await this.repository.findById(tenantId, domainId);
    if (!domain) {
      throw new Error("Domain not found");
    }

    const ancestors = await this.repository.getAncestorChain(tenantId, domainId);

    // Build hierarchy from root to current domain
    const hierarchy = [...ancestors.reverse(), domain];

    return hierarchy.map((d) => ({
      id: d.id,
      tenantId: d.tenantId,
      name: d.name,
      description: d.description,
      parentId: d.parentId,
      order: d.order,
      providerConfig: d.providerConfig as {
        providerId: string;
        modelId: string;
        costTier: string;
      } | null,
      usesTenantDefault: d.usesTenantDefault,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      connectors: [],
    }));
  }

  /**
   * Get effective provider configuration with inheritance chain
   */
  async getEffectiveConfig(tenantId: string, domainId: string) {
    const hierarchy = await this.getDomainHierarchy(tenantId, domainId);

    // Find first non-null provider config from current domain up to root
    let effectiveConfig: { providerId: string; modelId: string; costTier: string } | null = null;
    const inheritanceChain = [];

    for (const domain of hierarchy) {
      inheritanceChain.push({
        domainId: domain.id,
        domainName: domain.name,
        providerConfig: domain.providerConfig,
      });

      if (domain.providerConfig && !effectiveConfig) {
        effectiveConfig = domain.providerConfig;
      }
    }

    return {
      domainId,
      effectiveConfig,
      inheritanceChain,
    };
  }

  // ==========================================================================
  // Query Helpers
  // ==========================================================================

  /**
   * Get domains with connector counts
   */
  async getDomainsWithConnectorCounts(tenantId: string) {
    return this.repository.getDomainsWithConnectorCount(tenantId);
  }

  /**
   * Get root domains (no parent)
   */
  async getRootDomains(tenantId: string) {
    return this.repository.findRootDomains(tenantId);
  }

  /**
   * Count domains for tenant
   */
  async countDomains(tenantId: string): Promise<number> {
    return this.repository.countByTenant(tenantId);
  }

  /**
   * Get orphaned connectors (not assigned to any domain)
   */
  async getOrphanedConnectors(tenantId: string, allConnectorIds: string[]): Promise<string[]> {
    const allDomains = await this.repository.getHierarchyTree(tenantId);
    const assignedConnectors = new Set<string>();

    for (const domain of allDomains) {
      const connectors = await this.repository.getDomainConnectors(tenantId, domain.id);
      connectors.forEach((c) => assignedConnectors.add(c.connectorId));
    }

    return allConnectorIds.filter((id) => !assignedConnectors.has(id));
  }
}
