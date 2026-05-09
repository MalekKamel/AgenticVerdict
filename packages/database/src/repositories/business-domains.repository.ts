import { createDatabaseClient } from "../client";
import {
  businessDomains,
  domainConnectorAssignments,
  domainHierarchyCache,
  type BusinessDomainDb,
  type NewBusinessDomain,
  type DomainConnectorAssignment,
  type NewDomainConnectorAssignment,
} from "../schema/business-domains";
import { eq, and, asc, sql, isNull } from "drizzle-orm";

/**
 * Business Domains Repository
 *
 * Handles all database operations for business domain management.
 * Implements graph operations for domain hierarchy.
 * Enforces tenant isolation at the repository level.
 */

export class BusinessDomainsRepository {
  private db: ReturnType<typeof createDatabaseClient>;

  constructor(databaseUrl?: string) {
    this.db = createDatabaseClient(databaseUrl || process.env.DATABASE_URL!, {
      applicationName: "agenticverdict-business-domains",
    });
  }

  /**
   * Allow injecting database client for testing
   */
  static forTest(db: ReturnType<typeof createDatabaseClient>): BusinessDomainsRepository {
    const repo = new BusinessDomainsRepository();
    repo.db = db;
    return repo;
  }

  // ==========================================================================
  // Domain CRUD
  // ==========================================================================

  /**
   * Find all domains for a tenant (flat list)
   */
  async findAllByTenant(tenantId: string): Promise<BusinessDomainDb[]> {
    return this.db
      .select()
      .from(businessDomains)
      .where(eq(businessDomains.tenantId, tenantId))
      .orderBy(asc(businessDomains.order), asc(businessDomains.name));
  }

  /**
   * Find root domains (no parent)
   */
  async findRootDomains(tenantId: string): Promise<BusinessDomainDb[]> {
    return this.db
      .select()
      .from(businessDomains)
      .where(and(eq(businessDomains.tenantId, tenantId), isNull(businessDomains.parentId)))
      .orderBy(asc(businessDomains.order), asc(businessDomains.name));
  }

  /**
   * Find domain by ID with tenant isolation
   */
  async findById(tenantId: string, id: string): Promise<BusinessDomainDb | null> {
    const results = await this.db
      .select()
      .from(businessDomains)
      .where(and(eq(businessDomains.tenantId, tenantId), eq(businessDomains.id, id)))
      .limit(1);

    return results[0] || null;
  }

  /**
   * Find child domains of a parent
   */
  async findChildren(tenantId: string, parentId: string): Promise<BusinessDomainDb[]> {
    return this.db
      .select()
      .from(businessDomains)
      .where(and(eq(businessDomains.tenantId, tenantId), eq(businessDomains.parentId, parentId)))
      .orderBy(asc(businessDomains.order), asc(businessDomains.name));
  }

  /**
   * Create new domain
   */
  async create(data: NewBusinessDomain): Promise<BusinessDomainDb> {
    const results = await this.db.insert(businessDomains).values(data).returning();
    return results[0];
  }

  /**
   * Update domain
   */
  async update(
    tenantId: string,
    id: string,
    data: Partial<NewBusinessDomain>,
  ): Promise<BusinessDomainDb | null> {
    const results = await this.db
      .update(businessDomains)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(businessDomains.tenantId, tenantId), eq(businessDomains.id, id)))
      .returning();

    return results[0] || null;
  }

  /**
   * Delete domain
   */
  async delete(tenantId: string, id: string): Promise<boolean> {
    const results = await this.db
      .delete(businessDomains)
      .where(and(eq(businessDomains.tenantId, tenantId), eq(businessDomains.id, id)))
      .returning({ id: businessDomains.id });

    return results.length > 0;
  }

  /**
   * Check if domain has children
   */
  async hasChildren(tenantId: string, parentId: string): Promise<boolean> {
    const results = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(businessDomains)
      .where(and(eq(businessDomains.tenantId, tenantId), eq(businessDomains.parentId, parentId)));

    return Number(results[0]?.count || 0) > 0;
  }

  /**
   * Check if domain name is unique for tenant
   */
  async isNameUnique(tenantId: string, name: string, excludeId?: string): Promise<boolean> {
    const conditions = [eq(businessDomains.tenantId, tenantId), eq(businessDomains.name, name)];

    if (excludeId) {
      conditions.push(sql`${businessDomains.id} != ${excludeId}`);
    }

    const results = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(businessDomains)
      .where(and(...conditions));

    return Number(results[0]?.count || 0) === 0;
  }

  // ==========================================================================
  // Connector Assignments
  // ==========================================================================

  /**
   * Assign connector to domain
   */
  async assignConnector(data: NewDomainConnectorAssignment): Promise<DomainConnectorAssignment> {
    // First, remove any existing assignment for this connector
    await this.db
      .delete(domainConnectorAssignments)
      .where(eq(domainConnectorAssignments.connectorId, data.connectorId));

    // Then create new assignment
    const results = await this.db.insert(domainConnectorAssignments).values(data).returning();

    return results[0];
  }

  /**
   * Remove connector from domain
   */
  async removeConnector(tenantId: string, connectorId: string): Promise<boolean> {
    const results = await this.db
      .delete(domainConnectorAssignments)
      .where(
        and(
          eq(domainConnectorAssignments.tenantId, tenantId),
          eq(domainConnectorAssignments.connectorId, connectorId),
        ),
      )
      .returning({ id: domainConnectorAssignments.id });

    return results.length > 0;
  }

  /**
   * Get connectors assigned to domain
   */
  async getDomainConnectors(
    tenantId: string,
    domainId: string,
  ): Promise<DomainConnectorAssignment[]> {
    return this.db
      .select()
      .from(domainConnectorAssignments)
      .where(
        and(
          eq(domainConnectorAssignments.tenantId, tenantId),
          eq(domainConnectorAssignments.domainId, domainId),
        ),
      )
      .orderBy(asc(domainConnectorAssignments.order));
  }

  /**
   * Get domain for a connector
   */
  async getConnectorDomain(
    tenantId: string,
    connectorId: string,
  ): Promise<DomainConnectorAssignment | null> {
    const results = await this.db
      .select()
      .from(domainConnectorAssignments)
      .where(
        and(
          eq(domainConnectorAssignments.tenantId, tenantId),
          eq(domainConnectorAssignments.connectorId, connectorId),
        ),
      )
      .limit(1);

    return results[0] || null;
  }

  /**
   * Count connectors in domain
   */
  async countConnectors(tenantId: string, domainId: string): Promise<number> {
    const results = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(domainConnectorAssignments)
      .where(
        and(
          eq(domainConnectorAssignments.tenantId, tenantId),
          eq(domainConnectorAssignments.domainId, domainId),
        ),
      );

    return Number(results[0]?.count || 0);
  }

  // ==========================================================================
  // Hierarchy Operations (Graph)
  // ==========================================================================

  /**
   * Get full domain hierarchy tree for tenant
   */
  async getHierarchyTree(tenantId: string): Promise<BusinessDomainDb[]> {
    // Get all domains ordered for tree construction
    return this.db
      .select()
      .from(businessDomains)
      .where(eq(businessDomains.tenantId, tenantId))
      .orderBy(asc(businessDomains.order), asc(businessDomains.name));
  }

  /**
   * Get ancestor chain for a domain
   */
  async getAncestorChain(tenantId: string, domainId: string): Promise<BusinessDomainDb[]> {
    const ancestors: BusinessDomainDb[] = [];
    let currentDomain = await this.findById(tenantId, domainId);

    while (currentDomain && currentDomain.parentId) {
      const parent = await this.findById(tenantId, currentDomain.parentId);
      if (parent) {
        ancestors.unshift(parent);
        currentDomain = parent;
      } else {
        break;
      }
    }

    return ancestors;
  }

  /**
   * Get all descendant domain IDs
   */
  async getDescendantIds(tenantId: string, domainId: string): Promise<string[]> {
    const descendants: string[] = [];
    const children = await this.findChildren(tenantId, domainId);

    for (const child of children) {
      descendants.push(child.id);
      const childDescendants = await this.getDescendantIds(tenantId, child.id);
      descendants.push(...childDescendants);
    }

    return descendants;
  }

  /**
   * Detect circular reference before save
   */
  async wouldCreateCycle(
    tenantId: string,
    domainId: string,
    newParentId: string | null,
  ): Promise<boolean> {
    // If removing parent, no cycle possible
    if (!newParentId) {
      return false;
    }

    // If new parent is the domain itself, cycle
    if (newParentId === domainId) {
      return true;
    }

    // Check if new parent is a descendant of the domain
    const descendants = await this.getDescendantIds(tenantId, domainId);
    return descendants.includes(newParentId);
  }

  // ==========================================================================
  // Hierarchy Cache
  // ==========================================================================

  /**
   * Update hierarchy cache for a domain
   */
  async updateHierarchyCache(domainId: string): Promise<void> {
    // Get ancestor chain
    const ancestorIds = await this.getAncestorChain(
      (
        await this.db
          .select()
          .from(businessDomains)
          .where(eq(businessDomains.id, domainId))
          .limit(1)
      )[0]?.tenantId || "",
      domainId,
    ).then((domains) => domains.map((d) => d.id));

    // Get descendant IDs
    const tenantId =
      (
        await this.db
          .select()
          .from(businessDomains)
          .where(eq(businessDomains.id, domainId))
          .limit(1)
      )[0]?.tenantId || "";
    const descendantIds = await this.getDescendantIds(tenantId, domainId);

    // Calculate depth
    const depth = ancestorIds.length;

    // Build materialized path
    const materializedPath = "/" + [...ancestorIds, domainId].join("/") + "/";

    // Upsert cache
    await this.db
      .insert(domainHierarchyCache)
      .values({
        domainId,
        materializedPath,
        ancestorIds,
        descendantIds,
        depth,
        lastRefreshedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: domainHierarchyCache.domainId,
        set: {
          materializedPath,
          ancestorIds,
          descendantIds,
          depth,
          lastRefreshedAt: new Date(),
        },
      });
  }

  // ==========================================================================
  // Query Helpers
  // ==========================================================================

  /**
   * Get domains with connector count
   */
  async getDomainsWithConnectorCount(
    tenantId: string,
  ): Promise<Array<BusinessDomainDb & { connectorCount: number }>> {
    const domains = await this.findAllByTenant(tenantId);
    const domainsWithCount = await Promise.all(
      domains.map(async (domain) => {
        const connectorCount = await this.countConnectors(tenantId, domain.id);
        return {
          ...domain,
          connectorCount,
        };
      }),
    );

    return domainsWithCount;
  }

  /**
   * Count domains by tenant
   */
  async countByTenant(tenantId: string): Promise<number> {
    const results = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(businessDomains)
      .where(eq(businessDomains.tenantId, tenantId));

    return Number(results[0]?.count || 0);
  }
}
