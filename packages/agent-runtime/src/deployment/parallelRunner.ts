import { TrafficManager } from "./trafficManager";
import { createPinoLogger } from "@agenticverdict/observability";

const logger = createPinoLogger("ParallelRunner");

export interface ParallelRunConfig {
  enabled: boolean;
  mirrorPercentage: number;
  compareResults: boolean;
  logDiscrepancies: boolean;
}

export interface ProviderResponse {
  providerId: string;
  modelId: string;
  output: unknown;
  latency: number;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost?: number;
  error?: {
    message: string;
    code: string;
  };
}

export interface ComparisonResult {
  requestId: string;
  tenantId: string;
  legacyResponse?: ProviderResponse;
  newResponse?: ProviderResponse;
  match: boolean;
  discrepancyType?: "output" | "latency" | "cost" | "error";
  discrepancyDetails?: string;
  latencyDifference?: number;
  costDifference?: number;
  timestamp: Date;
}

export interface ParallelRunMetrics {
  totalRequests: number;
  matchedRequests: number;
  discrepancyCount: number;
  legacyCount: number;
  newCount: number;
  avgLatencyLegacy: number;
  avgLatencyNew: number;
  avgCostLegacy: number;
  avgCostNew: number;
  errorRateLegacy: number;
  errorRateNew: number;
  lastUpdated: Date;
}

export interface DiscrepancyAlert {
  type: "output_mismatch" | "latency_regression" | "cost_increase" | "error_rate_spike";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  metrics: {
    legacyValue: number;
    newValue: number;
    threshold: number;
    difference: number;
  };
  timestamp: Date;
}

export class ParallelRunner {
  private config: ParallelRunConfig;
  private trafficManager: TrafficManager;
  private comparisonResults: ComparisonResult[];
  private metrics: ParallelRunMetrics;
  private readonly maxResultsToKeep: number;
  private readonly latencyRegressionThreshold: number;
  private readonly costIncreaseThreshold: number;
  private readonly errorRateSpikeThreshold: number;

  constructor(trafficManager: TrafficManager, config?: Partial<ParallelRunConfig>) {
    this.trafficManager = trafficManager;
    this.config = {
      enabled: config?.enabled ?? false,
      mirrorPercentage: config?.mirrorPercentage ?? 10,
      compareResults: config?.compareResults ?? true,
      logDiscrepancies: config?.logDiscrepancies ?? true,
    };
    this.comparisonResults = [];
    this.maxResultsToKeep = 10000;
    this.latencyRegressionThreshold = 0.2;
    this.costIncreaseThreshold = 0.15;
    this.errorRateSpikeThreshold = 0.05;
    this.metrics = {
      totalRequests: 0,
      matchedRequests: 0,
      discrepancyCount: 0,
      avgLatencyLegacy: 0,
      avgLatencyNew: 0,
      avgCostLegacy: 0,
      avgCostNew: 0,
      errorRateLegacy: 0,
      errorRateNew: 0,
      lastUpdated: new Date(),
    };
  }

  async shouldMirrorRequest(): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    const shouldMirror = Math.random() * 100 < this.config.mirrorPercentage;
    return shouldMirror;
  }

  async executeParallel(
    requestId: string,
    tenantId: string,
    legacyExecutor: () => Promise<ProviderResponse>,
    newExecutor: () => Promise<ProviderResponse>,
  ): Promise<{
    primary: ProviderResponse;
    mirrored?: ProviderResponse;
    comparison?: ComparisonResult;
  }> {
    this.metrics.totalRequests++;

    const trafficDecision = await this.trafficManager.route(tenantId);
    const isPrimaryNew = trafficDecision.target === "new";

    const shouldMirror = await this.shouldMirrorRequest();

    if (!shouldMirror || !this.config.compareResults) {
      const primaryResponse = isPrimaryNew ? await newExecutor() : await legacyExecutor();

      this.updateMetrics(primaryResponse, isPrimaryNew, undefined);
      return { primary: primaryResponse };
    }

    const [legacyResponse, newResponse] = await Promise.all([
      legacyExecutor().catch((error) => ({
        providerId: "legacy",
        modelId: "unknown",
        output: null,
        latency: 0,
        error: {
          message: error.message || "Unknown error",
          code: error.code || "EXECUTION_ERROR",
        },
      })),
      newExecutor().catch((error) => ({
        providerId: "new",
        modelId: "unknown",
        output: null,
        latency: 0,
        error: {
          message: error.message || "Unknown error",
          code: error.code || "EXECUTION_ERROR",
        },
      })),
    ]);

    const primary = isPrimaryNew ? newResponse : legacyResponse;
    const mirrored = isPrimaryNew ? legacyResponse : newResponse;

    const comparison = this.config.compareResults
      ? await this.compareResults(requestId, tenantId, legacyResponse, newResponse)
      : undefined;

    this.updateMetrics(primary, isPrimaryNew, mirrored);

    if (comparison && !comparison.match && this.config.logDiscrepancies) {
      await this.logDiscrepancy(comparison);
    }

    return {
      primary,
      mirrored,
      comparison,
    };
  }

  private async compareResults(
    requestId: string,
    tenantId: string,
    legacyResponse: ProviderResponse,
    newResponse: ProviderResponse,
  ): Promise<ComparisonResult> {
    const comparison: ComparisonResult = {
      requestId,
      tenantId,
      legacyResponse,
      newResponse,
      match: true,
      timestamp: new Date(),
    };

    if (legacyResponse.error && newResponse.error) {
      comparison.match = legacyResponse.error.code === newResponse.error.code;
      if (!comparison.match) {
        comparison.discrepancyType = "error";
        comparison.discrepancyDetails = `Error code mismatch: legacy=${legacyResponse.error.code}, new=${newResponse.error.code}`;
      }
    } else if (legacyResponse.error && !newResponse.error) {
      comparison.match = false;
      comparison.discrepancyType = "error";
      comparison.discrepancyDetails = "Legacy failed but new succeeded";
    } else if (!legacyResponse.error && newResponse.error) {
      comparison.match = false;
      comparison.discrepancyType = "error";
      comparison.discrepancyDetails = "New failed but legacy succeeded";
    } else if (legacyResponse.output && newResponse.output) {
      const outputsMatch = this.compareOutputs(legacyResponse.output, newResponse.output);
      if (!outputsMatch) {
        comparison.match = false;
        comparison.discrepancyType = "output";
        comparison.discrepancyDetails = "Output mismatch detected";
      }
    }

    if (legacyResponse.latency && newResponse.latency) {
      comparison.latencyDifference = newResponse.latency - legacyResponse.latency;
      const latencyRegression = comparison.latencyDifference / legacyResponse.latency;
      if (latencyRegression > this.latencyRegressionThreshold) {
        comparison.match = false;
        if (!comparison.discrepancyType) {
          comparison.discrepancyType = "latency";
          comparison.discrepancyDetails = `Latency regression: ${(latencyRegression * 100).toFixed(2)}% slower`;
        }
      }
    }

    if (legacyResponse.cost && newResponse.cost) {
      comparison.costDifference = newResponse.cost - legacyResponse.cost;
      const costIncrease = comparison.costDifference / legacyResponse.cost;
      if (costIncrease > this.costIncreaseThreshold) {
        comparison.match = false;
        if (!comparison.discrepancyType) {
          comparison.discrepancyType = "cost";
          comparison.discrepancyDetails = `Cost increase: ${(costIncrease * 100).toFixed(2)}% higher`;
        }
      }
    }

    this.comparisonResults.push(comparison);
    if (this.comparisonResults.length > this.maxResultsToKeep) {
      this.comparisonResults.shift();
    }

    if (!comparison.match) {
      this.metrics.discrepancyCount++;
    } else {
      this.metrics.matchedRequests++;
    }

    return comparison;
  }

  private compareOutputs(output1: unknown, output2: unknown): boolean {
    if (typeof output1 === "string" && typeof output2 === "string") {
      const normalized1 = output1.trim().toLowerCase();
      const normalized2 = output2.trim().toLowerCase();
      return normalized1 === normalized2;
    }

    try {
      const json1 = JSON.stringify(output1, Object.keys(output1 as object).sort());
      const json2 = JSON.stringify(output2, Object.keys(output2 as object).sort());
      return json1 === json2;
    } catch {
      return false;
    }
  }

  private updateMetrics(
    primary: ProviderResponse,
    isNewSystem: boolean,
    mirrored?: ProviderResponse,
  ): void {
    const now = new Date();

    const legacyCount =
      isNewSystem && mirrored
        ? this.metrics.legacyCount + 1
        : !isNewSystem
          ? this.metrics.legacyCount + 1
          : this.metrics.legacyCount;
    const newCount = isNewSystem
      ? this.metrics.newCount + 1
      : mirrored
        ? this.metrics.newCount + 1
        : this.metrics.newCount;

    if (isNewSystem) {
      this.metrics.avgLatencyNew = this.updateAverageWithCount(
        this.metrics.avgLatencyNew,
        primary.latency,
        newCount,
      );
      if (primary.cost !== undefined) {
        this.metrics.avgCostNew = this.updateAverageWithCount(
          this.metrics.avgCostNew,
          primary.cost,
          newCount,
        );
      }
      if (primary.error) {
        this.metrics.errorRateNew = (this.metrics.errorRateNew * (newCount - 1) + 1) / newCount;
      }
    }

    if (mirrored && !isNewSystem) {
      this.metrics.avgLatencyNew = this.updateAverageWithCount(
        this.metrics.avgLatencyNew,
        mirrored.latency,
        newCount,
      );
      if (mirrored.cost !== undefined) {
        this.metrics.avgCostNew = this.updateAverageWithCount(
          this.metrics.avgCostNew,
          mirrored.cost,
          newCount,
        );
      }
      if (mirrored.error) {
        this.metrics.errorRateNew = (this.metrics.errorRateNew * (newCount - 1) + 1) / newCount;
      }
    }

    if (!isNewSystem) {
      this.metrics.avgLatencyLegacy = this.updateAverageWithCount(
        this.metrics.avgLatencyLegacy,
        primary.latency,
        legacyCount,
      );
      if (primary.cost !== undefined) {
        this.metrics.avgCostLegacy = this.updateAverageWithCount(
          this.metrics.avgCostLegacy,
          primary.cost,
          legacyCount,
        );
      }
      if (primary.error) {
        this.metrics.errorRateLegacy =
          (this.metrics.errorRateLegacy * (legacyCount - 1) + 1) / legacyCount;
      }
    }

    if (mirrored && isNewSystem) {
      this.metrics.avgLatencyLegacy = this.updateAverageWithCount(
        this.metrics.avgLatencyLegacy,
        mirrored.latency,
        legacyCount,
      );
      if (mirrored.cost !== undefined) {
        this.metrics.avgCostLegacy = this.updateAverageWithCount(
          this.metrics.avgCostLegacy,
          mirrored.cost,
          legacyCount,
        );
      }
      if (mirrored.error) {
        this.metrics.errorRateLegacy =
          (this.metrics.errorRateLegacy * (legacyCount - 1) + 1) / legacyCount;
      }
    }

    this.metrics.lastUpdated = now;
  }

  private updateAverageWithCount(currentAvg: number, newValue: number, count: number): number {
    if (count <= 0) return newValue;
    if (count === 1) return newValue;
    return (currentAvg * (count - 1) + newValue) / count;
  }

  private async logDiscrepancy(comparison: ComparisonResult): Promise<void> {
    logger.warn(
      {
        requestId: comparison.requestId,
        tenantId: comparison.tenantId,
        type: comparison.discrepancyType,
        details: comparison.discrepancyDetails,
        timestamp: comparison.timestamp,
      },
      "Discrepancy detected",
    );
  }

  async checkForAlerts(): Promise<DiscrepancyAlert | null> {
    if (this.metrics.totalRequests < 100) {
      return null;
    }

    const latencyRegression =
      this.metrics.avgLatencyLegacy > 0
        ? (this.metrics.avgLatencyNew - this.metrics.avgLatencyLegacy) /
          this.metrics.avgLatencyLegacy
        : 0;

    if (latencyRegression > this.latencyRegressionThreshold) {
      return {
        type: "latency_regression",
        severity: latencyRegression > 0.5 ? "critical" : "high",
        description: `New system latency is ${(latencyRegression * 100).toFixed(2)}% higher than legacy`,
        metrics: {
          legacyValue: this.metrics.avgLatencyLegacy,
          newValue: this.metrics.avgLatencyNew,
          threshold: this.latencyRegressionThreshold,
          difference: latencyRegression,
        },
        timestamp: new Date(),
      };
    }

    const costIncrease =
      this.metrics.avgCostLegacy > 0
        ? (this.metrics.avgCostNew - this.metrics.avgCostLegacy) / this.metrics.avgCostLegacy
        : 0;

    if (costIncrease > this.costIncreaseThreshold) {
      return {
        type: "cost_increase",
        severity: costIncrease > 0.3 ? "critical" : "high",
        description: `New system cost is ${(costIncrease * 100).toFixed(2)}% higher than legacy`,
        metrics: {
          legacyValue: this.metrics.avgCostLegacy,
          newValue: this.metrics.avgCostNew,
          threshold: this.costIncreaseThreshold,
          difference: costIncrease,
        },
        timestamp: new Date(),
      };
    }

    const errorRateDiff = this.metrics.errorRateNew - this.metrics.errorRateLegacy;

    if (errorRateDiff > this.errorRateSpikeThreshold) {
      return {
        type: "error_rate_spike",
        severity: errorRateDiff > 0.1 ? "critical" : "high",
        description: `New system error rate is ${(errorRateDiff * 100).toFixed(2)}% higher than legacy`,
        metrics: {
          legacyValue: this.metrics.errorRateLegacy,
          newValue: this.metrics.errorRateNew,
          threshold: this.errorRateSpikeThreshold,
          difference: errorRateDiff,
        },
        timestamp: new Date(),
      };
    }

    const discrepancyRate =
      this.metrics.totalRequests > 0
        ? this.metrics.discrepancyCount / this.metrics.totalRequests
        : 0;

    if (discrepancyRate > 0.05) {
      return {
        type: "output_mismatch",
        severity: discrepancyRate > 0.1 ? "critical" : "medium",
        description: `Output mismatch rate is ${(discrepancyRate * 100).toFixed(2)}%`,
        metrics: {
          legacyValue: 0,
          newValue: discrepancyRate,
          threshold: 0.05,
          difference: discrepancyRate,
        },
        timestamp: new Date(),
      };
    }

    return null;
  }

  getMetrics(): ParallelRunMetrics {
    return { ...this.metrics };
  }

  getComparisonResults(limit: number = 100): ComparisonResult[] {
    return this.comparisonResults.slice(-limit);
  }

  async generateReport(): Promise<{
    summary: {
      totalRequests: number;
      matchRate: number;
      discrepancyRate: number;
      latencyImprovement: number;
      costDifference: number;
    };
    recommendations: string[];
    generatedAt: Date;
  }> {
    const matchRate =
      this.metrics.totalRequests > 0
        ? this.metrics.matchedRequests / this.metrics.totalRequests
        : 0;

    const discrepancyRate =
      this.metrics.totalRequests > 0
        ? this.metrics.discrepancyCount / this.metrics.totalRequests
        : 0;

    const latencyImprovement =
      this.metrics.avgLatencyLegacy > 0
        ? (this.metrics.avgLatencyLegacy - this.metrics.avgLatencyNew) /
          this.metrics.avgLatencyLegacy
        : 0;

    const costDiff =
      this.metrics.avgCostLegacy > 0
        ? (this.metrics.avgCostNew - this.metrics.avgCostLegacy) / this.metrics.avgCostLegacy
        : 0;

    const recommendations: string[] = [];

    if (matchRate < 0.95) {
      recommendations.push(
        "Output mismatch rate is high. Review provider response parsing and normalization.",
      );
    }

    if (latencyImprovement < -0.1) {
      recommendations.push(
        "New system is significantly slower. Optimize provider initialization and caching.",
      );
    } else if (latencyImprovement > 0.1) {
      recommendations.push(
        "New system shows latency improvement. Consider increasing traffic percentage.",
      );
    }

    if (costDiff > 0.1) {
      recommendations.push(
        "New system is more expensive. Review model selection and token usage optimization.",
      );
    } else if (costDiff < -0.1) {
      recommendations.push(
        "New system shows cost savings. Consider increasing traffic percentage.",
      );
    }

    if (this.metrics.errorRateNew > this.metrics.errorRateLegacy + 0.02) {
      recommendations.push(
        "New system has higher error rate. Investigate error handling and retry logic.",
      );
    }

    if (recommendations.length === 0) {
      recommendations.push("Metrics look healthy. Consider gradual traffic increase.");
    }

    return {
      summary: {
        totalRequests: this.metrics.totalRequests,
        matchRate,
        discrepancyRate,
        latencyImprovement,
        costDifference: costDiff,
      },
      recommendations,
      generatedAt: new Date(),
    };
  }

  updateConfig(config: Partial<ParallelRunConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info({ config: this.config }, "Config updated");
  }

  getConfig(): ParallelRunConfig {
    return { ...this.config };
  }

  clearMetrics(): void {
    this.comparisonResults = [];
    this.metrics = {
      totalRequests: 0,
      matchedRequests: 0,
      discrepancyCount: 0,
      legacyCount: 0,
      newCount: 0,
      avgLatencyLegacy: 0,
      avgLatencyNew: 0,
      avgCostLegacy: 0,
      avgCostNew: 0,
      errorRateLegacy: 0,
      errorRateNew: 0,
      lastUpdated: new Date(),
    };
  }
}
