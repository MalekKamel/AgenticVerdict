import { Registry } from "prom-client";

/**
 * Shared Prometheus registry for API and worker `/metrics` exposition (instrumentation +
 * platform resilience metrics).
 */
export const productionFlowTestRegistry = new Registry();
