import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const utilsDir = path.dirname(fileURLToPath(import.meta.url));

/** Directory containing committed PNG baselines for scenario HTML previews (Phase 4). */
export const VISUAL_BASELINES_DIR = path.join(utilsDir, "../scenarios/visual-baselines");

export interface CompareVisualOptions {
  /** Pixelmatch color difference threshold (0–1). Higher ignores more anti-alias noise. */
  readonly threshold?: number;
  /** Maximum allowed ratio of differing pixels (0–1). */
  readonly maxMismatchRatio?: number;
}

export function shouldRunVisualRegression(): boolean {
  return process.env.SKIP_VISUAL_REGRESSION !== "1";
}

export function computePngMismatchRatio(
  actualPng: Buffer,
  baselinePng: Buffer,
  options: CompareVisualOptions = {},
): number {
  const img1 = PNG.sync.read(actualPng);
  const img2 = PNG.sync.read(baselinePng);
  if (img1.width !== img2.width || img1.height !== img2.height) {
    throw new Error(
      `Baseline dimensions ${img2.width}×${img2.height} vs actual ${img1.width}×${img1.height}`,
    );
  }
  const threshold = options.threshold ?? 0.22;
  const diff = Buffer.alloc(img1.width * img1.height * 4);
  const numDiff = pixelmatch(img1.data, img2.data, diff, img1.width, img1.height, { threshold });
  return numDiff / (img1.width * img1.height);
}

/**
 * Compares a PNG buffer to a committed baseline under {@link VISUAL_BASELINES_DIR}.
 * Set `UPDATE_VISUAL_BASELINES=1` to write or refresh the baseline file.
 */
export function assertMatchesVisualBaseline(
  actualPng: Buffer,
  baselineRelativeName: string,
  options: CompareVisualOptions = {},
): void {
  const baselinePath = path.join(VISUAL_BASELINES_DIR, baselineRelativeName);
  const maxRatio = options.maxMismatchRatio ?? 0.14;

  if (process.env.UPDATE_VISUAL_BASELINES === "1") {
    mkdirSync(path.dirname(baselinePath), { recursive: true });
    writeFileSync(baselinePath, actualPng);
    return;
  }

  if (!existsSync(baselinePath)) {
    throw new Error(
      `Missing visual baseline ${baselinePath}. Generate with UPDATE_VISUAL_BASELINES=1 (prefer Linux/Chromium in Dockerfile.test for stable rasterization).`,
    );
  }

  const expected = readFileSync(baselinePath);
  const ratio = computePngMismatchRatio(actualPng, expected, options);
  if (ratio > maxRatio) {
    throw new Error(
      `Visual mismatch for ${baselineRelativeName}: ${(ratio * 100).toFixed(2)}% pixels differ (max ${(maxRatio * 100).toFixed(2)}%)`,
    );
  }
}
