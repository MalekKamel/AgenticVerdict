import type { ITool } from "../interfaces";
import { ToolRegistry, type ToolHandler } from "../tools";

/**
 * Get a built-in tool by name.
 *
 * This function provides access to all built-in tools available in the system.
 * Tools are organized by category for easy discovery.
 *
 * @param name - The tool name to retrieve
 * @returns The tool instance or null if not found
 */
export function getBuiltinTool(name: string): ITool | null {
  const allTools = getAllBuiltinTools();
  return allTools.find((tool) => tool.name === name) || null;
}

/**
 * Get all built-in tools organized by category.
 */
export function getAllBuiltinTools(): ITool[] {
  const registry = new ToolRegistry();

  // Register all built-in tools
  registerDataTools(registry);
  registerAnalysisTools(registry);
  registerReportingTools(registry);
  registerUtilityTools(registry);

  return registry.list();
}

/**
 * Register data fetcher tools.
 */
function registerDataTools(registry: ToolRegistry): void {
  const createHandler = (fn: ToolHandler): ToolHandler => fn;

  // Tenant data tools
  registry.register({
    name: "get_tenant_profile",
    description: "Retrieve tenant profile information including business details and settings",
    execute: createHandler(async (_args, ctx) => {
      return { tenantId: ctx.tenantId };
    }),
  });

  registry.register({
    name: "get_business_rules",
    description: "Get business rules and constraints for the current tenant",
    execute: createHandler(async (_args, ctx) => {
      return { tenantId: ctx.tenantId, rules: [] };
    }),
  });

  registry.register({
    name: "get_config",
    description: "Retrieve tenant configuration settings",
    execute: createHandler(async (_args, ctx) => {
      return { tenantId: ctx.tenantId, config: {} };
    }),
  });

  // Platform connector tools
  registry.register({
    name: "fetch_meta_metrics",
    description: "Fetch metrics from Meta (Facebook/Instagram) advertising platform",
    execute: createHandler(async (args, ctx) => {
      return { platform: "meta", tenantId: ctx.tenantId, args };
    }),
  });

  registry.register({
    name: "fetch_ga4_metrics",
    description: "Fetch metrics from Google Analytics 4",
    execute: createHandler(async (args, ctx) => {
      return { platform: "ga4", tenantId: ctx.tenantId, args };
    }),
  });

  registry.register({
    name: "fetch_gsc_metrics",
    description: "Fetch metrics from Google Search Console",
    execute: createHandler(async (args, ctx) => {
      return { platform: "gsc", tenantId: ctx.tenantId, args };
    }),
  });

  registry.register({
    name: "fetch_gbp_metrics",
    description: "Fetch metrics from Google Business Profile",
    execute: createHandler(async (args, ctx) => {
      return { platform: "gbp", tenantId: ctx.tenantId, args };
    }),
  });

  registry.register({
    name: "fetch_tiktok_metrics",
    description: "Fetch metrics from TikTok advertising platform",
    execute: createHandler(async (args, ctx) => {
      return { platform: "tiktok", tenantId: ctx.tenantId, args };
    }),
  });

  // Metric calculation tools
  registry.register({
    name: "calculate_metrics",
    description: "Calculate derived metrics from raw platform data",
    execute: createHandler(async (args, ctx) => {
      return { tenantId: ctx.tenantId, calculations: args };
    }),
  });

  registry.register({
    name: "compute_b2b_kpis_from_snapshots",
    description: "Compute B2B funnel KPIs from data snapshots",
    execute: createHandler(async (args, ctx) => {
      return { tenantId: ctx.tenantId, kpis: args };
    }),
  });
}

/**
 * Register analysis tools.
 */
function registerAnalysisTools(registry: ToolRegistry): void {
  const createHandler = (fn: ToolHandler): ToolHandler => fn;

  registry.register({
    name: "analyze_trends",
    description: "Analyze trends in time-series data",
    execute: createHandler(async (args, ctx) => {
      return { tenantId: ctx.tenantId, trends: args };
    }),
  });

  registry.register({
    name: "statistical_analysis",
    description: "Perform statistical analysis on data",
    execute: createHandler(async (args, ctx) => {
      return { tenantId: ctx.tenantId, statistics: args };
    }),
  });

  registry.register({
    name: "compare_periods",
    description: "Compare metrics between different time periods",
    execute: createHandler(async (args, ctx) => {
      return { tenantId: ctx.tenantId, comparison: args };
    }),
  });

  registry.register({
    name: "detect_anomalies",
    description: "Detect anomalies and outliers in data",
    execute: createHandler(async (args, ctx) => {
      return { tenantId: ctx.tenantId, anomalies: args };
    }),
  });
}

/**
 * Register reporting tools.
 */
function registerReportingTools(registry: ToolRegistry): void {
  const createHandler = (fn: ToolHandler): ToolHandler => fn;

  registry.register({
    name: "generate_summary",
    description: "Generate a text summary of data",
    execute: createHandler(async (args, ctx) => {
      return { tenantId: ctx.tenantId, summary: args };
    }),
  });

  registry.register({
    name: "format_report",
    description: "Format data into a structured report",
    execute: createHandler(async (args, ctx) => {
      return { tenantId: ctx.tenantId, report: args };
    }),
  });

  registry.register({
    name: "export_data",
    description: "Export data to CSV, Excel, or other formats",
    execute: createHandler(async (args, ctx) => {
      return { tenantId: ctx.tenantId, export: args };
    }),
  });
}

/**
 * Register utility tools.
 */
function registerUtilityTools(registry: ToolRegistry): void {
  const createHandler = (fn: ToolHandler): ToolHandler => fn;

  registry.register({
    name: "validate_data",
    description: "Validate data quality and completeness",
    execute: createHandler(async (args, ctx) => {
      return { tenantId: ctx.tenantId, validation: args };
    }),
  });

  registry.register({
    name: "transform_data",
    description: "Transform data between different formats",
    execute: createHandler(async (args, ctx) => {
      return { tenantId: ctx.tenantId, transformed: args };
    }),
  });

  registry.register({
    name: "cache_result",
    description: "Cache a result for future retrieval",
    execute: createHandler(async (args, ctx) => {
      return { tenantId: ctx.tenantId, cached: args };
    }),
  });
}
