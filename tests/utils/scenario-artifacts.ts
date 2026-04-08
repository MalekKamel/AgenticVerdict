import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export function getScenarioArtifactsDir(): string | undefined {
  const raw = process.env.SCENARIO_ARTIFACTS_DIR;
  if (!raw || raw.trim().length === 0) {
    return undefined;
  }
  return raw.trim();
}

export function writeScenarioArtifact(relativePath: string, data: Uint8Array): void {
  const root = getScenarioArtifactsDir();
  if (!root) {
    return;
  }
  const outputPath = path.join(root, relativePath);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, Buffer.from(data));
}
