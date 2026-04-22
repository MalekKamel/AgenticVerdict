#!/usr/bin/env node
/**
 * Downloads official Node.js binaries into `apps/desktop/resources/node` for electron-builder `extraResources`.
 * Run before `pnpm package` when you need installers to work without system Node on PATH.
 *
 * Env:
 * - NODE_BUNDLE_VERSION — e.g. 20.18.1 (default: current process major.minor from NODE_VERSION or 20.18.1)
 */
import { createReadStream, createWriteStream, existsSync, mkdirSync, rmSync } from "node:fs";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

import { x as extractTar } from "tar";
import unzipper from "unzipper";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(__dirname, "..");
const destRoot = path.join(desktopRoot, "resources", "node");

const version =
  process.env.NODE_BUNDLE_VERSION?.trim() ||
  process.version.replace(/^v/, "").split(".").slice(0, 3).join(".") ||
  "20.18.1";

function platformId() {
  const p = process.platform;
  const a = process.arch;
  if (p === "darwin" && a === "arm64") return { id: "darwin-arm64", ext: "tar.gz" };
  if (p === "darwin" && a === "x64") return { id: "darwin-x64", ext: "tar.gz" };
  if (p === "linux" && a === "x64") return { id: "linux-x64", ext: "tar.gz" };
  if (p === "win32" && a === "x64") return { id: "win-x64", ext: "zip" };
  throw new Error(`Unsupported platform ${p} ${a} for bundled Node fetch`);
}

async function downloadTo(url, filePath) {
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Download failed ${res.status} ${url}`);
  }
  await pipeline(res.body, createWriteStream(filePath));
}

async function main() {
  const { id, ext } = platformId();
  const base = `https://nodejs.org/dist/v${version}`;
  const filename = `node-v${version}-${id}.${ext}`;
  const url = `${base}/${filename}`;
  const tmp = await fs.mkdtemp(path.join(tmpdir(), "node-fetch-"));
  const archive = path.join(tmp, filename);

  console.log(`[fetch-bundled-node] Downloading ${url}`);
  await downloadTo(url, archive);

  rmSync(destRoot, { recursive: true, force: true });
  mkdirSync(destRoot, { recursive: true });

  if (ext === "zip") {
    await pipeline(createReadStream(archive), unzipper.Extract({ path: tmp }));
    const extracted = path.join(tmp, `node-v${version}-${id}`);
    const nodeExe = path.join(extracted, "node.exe");
    if (!existsSync(nodeExe)) {
      throw new Error(`Expected ${nodeExe} after unzip`);
    }
    await fs.copyFile(nodeExe, path.join(destRoot, "node.exe"));
  } else {
    await extractTar({
      file: archive,
      cwd: tmp,
    });
    const extracted = path.join(tmp, `node-v${version}-${id}`);
    const nodeBin = path.join(extracted, "bin", "node");
    if (!existsSync(nodeBin)) {
      throw new Error(`Expected ${nodeBin} after extract`);
    }
    await fs.mkdir(path.join(destRoot, "bin"), { recursive: true });
    await fs.copyFile(nodeBin, path.join(destRoot, "bin", "node"));
    await fs.chmod(path.join(destRoot, "bin", "node"), 0o755);
  }

  rmSync(tmp, { recursive: true, force: true });
  console.log(`[fetch-bundled-node] Installed Node ${version} → ${destRoot}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
