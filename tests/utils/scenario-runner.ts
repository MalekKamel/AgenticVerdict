/**
 * Scenario orchestration metadata and optional programmatic runner.
 * Primary execution path is production-flow orchestrator Vitest (`pnpm run test:scenarios:all`).
 */

export type ScenarioCategory = "generation" | "integration" | "delivery" | "scheduling" | "system";

export interface ScenarioMeta {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: ScenarioCategory;
  readonly vitestDir: string;
  readonly dependencies: readonly string[];
}

export const SCENARIO_REGISTRY: readonly ScenarioMeta[] = [
  {
    id: "R01",
    name: "PDF generation (EN, LTR)",
    description:
      "English LTR PDF via PlaywrightPdfFormatGenerator; pdf-lib structure + pdf-parse phrases + HTML visual baseline",
    category: "generation",
    vitestDir: "production-flow",
    dependencies: ["playwright-chromium", "pdf-parse", "pdf-lib", "pngjs", "pixelmatch"],
  },
  {
    id: "R02",
    name: "PDF generation (AR, RTL)",
    description: "Arabic RTL PDF text-layer validation, DOM dir/lang, HTML visual baseline",
    category: "generation",
    vitestDir: "production-flow",
    dependencies: ["playwright-chromium", "pdf-parse", "pdf-lib", "pngjs", "pixelmatch"],
  },
  {
    id: "R03",
    name: "DOCX generation",
    description: "HTML → DOCX pipeline with OOXML package assertions (EN + AR)",
    category: "generation",
    vitestDir: "production-flow",
    dependencies: ["jszip"],
  },
  {
    id: "R04",
    name: "XLSX generation",
    description: "ExcelJS workbook load + cell assertions (EN + AR)",
    category: "generation",
    vitestDir: "production-flow",
    dependencies: ["exceljs"],
  },
  {
    id: "R05",
    name: "Multi-platform report model",
    description: "Phase-2 merge into report view model",
    category: "integration",
    vitestDir: "production-flow",
    dependencies: [],
  },
  {
    id: "R06",
    name: "LLM provider integration",
    description: "Mock chat model, GLM/OpenAI/Anthropic wiring, optional live connectivity",
    category: "integration",
    vitestDir: "production-flow",
    dependencies: [],
  },
  {
    id: "R07",
    name: "Tenant isolation",
    description: "Cache keys and config boundaries per tenant",
    category: "integration",
    vitestDir: "production-flow",
    dependencies: [],
  },
  {
    id: "R08",
    name: "Template rendering",
    description: "Composite template engine HTML output",
    category: "generation",
    vitestDir: "production-flow",
    dependencies: [],
  },
  {
    id: "R09",
    name: "Report delivery",
    description: "Delivery processor + mock email capture",
    category: "delivery",
    vitestDir: "production-flow",
    dependencies: [],
  },
  {
    id: "R10",
    name: "Scheduled reports",
    description: "Schedule tick → generation job enqueue (simulated queue)",
    category: "scheduling",
    vitestDir: "production-flow",
    dependencies: [],
  },
  {
    id: "R11",
    name: "System health validation",
    description: "Docker Compose, Postgres, Redis, optional observability probes",
    category: "system",
    vitestDir: "production-flow",
    dependencies: [],
  },
  {
    id: "R12",
    name: "Prerequisites validation",
    description: "Node.js, pnpm, Docker toolchain checks",
    category: "system",
    vitestDir: "production-flow",
    dependencies: [],
  },
] as const;

export function scenariosInCategory(category: ScenarioCategory): readonly ScenarioMeta[] {
  return SCENARIO_REGISTRY.filter((s) => s.category === category);
}

export function resolveScenarioById(id: string): ScenarioMeta | undefined {
  const raw = id.trim().toUpperCase();
  const m = raw.match(/^R0*(\d{1,2})$/);
  const canonical = m !== null ? `R${m[1]!.padStart(2, "0")}` : raw;
  return SCENARIO_REGISTRY.find((s) => s.id === canonical);
}

export interface ScenarioHooks {
  setup: () => Promise<void>;
  execute: () => Promise<void>;
  validate: () => Promise<void>;
  cleanup: () => Promise<void>;
}

export async function checkDependency(dep: string): Promise<void> {
  if (dep === "playwright-chromium") {
    const skip = process.env.SKIP_PLAYWRIGHT_PDF_TESTS === "1";
    if (skip) {
      throw new Error("SKIP_PLAYWRIGHT_PDF_TESTS=1 but scenario requires Chromium");
    }
  }
}

export async function runScenarioHooks(meta: ScenarioMeta, hooks: ScenarioHooks): Promise<void> {
  console.log(`\nScenario ${meta.id} — ${meta.name}`);
  console.log(meta.description);
  for (const dep of meta.dependencies) {
    await checkDependency(dep);
  }
  await hooks.setup();
  try {
    await hooks.execute();
    await hooks.validate();
  } finally {
    await hooks.cleanup();
  }
  console.log(`Scenario ${meta.id} completed\n`);
}
