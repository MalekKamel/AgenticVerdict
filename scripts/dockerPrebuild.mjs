#!/usr/bin/env node
/**
 * Lightweight checks before `docker build` / CI image builds.
 * @see docs/docker/container-images.md
 */

const major = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
if (Number.isNaN(major) || major < 20) {
  console.error(`dockerPrebuild: Node.js 20+ required, got ${process.version}`);
  process.exit(1);
}

console.info(`dockerPrebuild: OK (${process.version})`);
