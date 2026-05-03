export interface SeedInsight {
  name: string;
  description?: string;
  enabled: boolean;
  templateId?: string;
}

export class InsightFactory {
  static create(
    tenantSlug: string,
    insightType: string,
    overrides?: Partial<SeedInsight>,
  ): SeedInsight {
    return {
      name: `${insightType} - ${tenantSlug}`,
      description: `Automated ${insightType.toLowerCase()} insights for ${tenantSlug}`,
      enabled: true,
      ...overrides,
    };
  }

  static createList(tenantSlug: string, insightTypes: string[]): SeedInsight[] {
    return insightTypes.map((type) => this.create(tenantSlug, type));
  }
}
