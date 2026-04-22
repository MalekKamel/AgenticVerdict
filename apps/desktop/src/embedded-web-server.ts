import { type ChildProcess, execSync, spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

let serverProcess: ChildProcess | null = null;

/**
 * Resolve the Node binary for the embedded Nitro server.
 *
 * Order: `DESKTOP_NODE_BINARY` (absolute path) → bundled `resources/node/...` when `resourcesPath`
 * is set (packaged app) → `node` / `node.exe` on PATH.
 *
 * Bundled layout (optional `extraResources` in electron-builder):
 * - macOS/Linux: `resources/node/bin/node` or `resources/node/node`
 * - Windows: `resources/node/node.exe` or `resources/node/bin/node.exe`
 */
export function resolveNodeExecutable(resourcesPath?: string): string {
  const fromEnv = process.env.DESKTOP_NODE_BINARY?.trim();
  if (fromEnv && fs.existsSync(fromEnv)) {
    return fromEnv;
  }

  if (resourcesPath) {
    const base = path.join(resourcesPath, "node");
    const candidates =
      process.platform === "win32"
        ? [path.join(base, "node.exe"), path.join(base, "bin", "node.exe")]
        : [path.join(base, "bin", "node"), path.join(base, "node")];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        return c;
      }
    }
  }

  return process.platform === "win32" ? "node.exe" : "node";
}

/** True if `nodeExecutable` exists on disk, or resolves on PATH when not path-like. */
export function nodeExecutableAvailable(nodeExecutable: string): boolean {
  if (path.isAbsolute(nodeExecutable) || nodeExecutable.includes(path.sep)) {
    return fs.existsSync(nodeExecutable);
  }
  try {
    if (process.platform === "win32") {
      execSync(`where ${nodeExecutable}`, { stdio: "ignore", windowsHide: true });
    } else {
      execSync(`command -v -- "${nodeExecutable}"`, { stdio: "ignore" });
    }
    return true;
  } catch {
    return false;
  }
}

export async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        const port = addr.port;
        server.close(() => resolve(port));
      } else {
        server.close();
        reject(new Error("Could not allocate an ephemeral port"));
      }
    });
    server.on("error", reject);
  });
}

export async function waitForHttpReady(port: number, timeoutMs = 45_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/ready`);
      if (res.ok) {
        return;
      }
    } catch {
      // server still starting
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`Embedded web server did not respond on port ${port} within ${timeoutMs}ms`);
}

/**
 * Start the Nitro output from `apps/frontend` (`vite build` → `.output/`).
 * Uses {@link resolveNodeExecutable} + {@link nodeExecutableAvailable} before calling in production paths.
 */
export function startEmbeddedWebServer(
  outputRoot: string,
  port: number,
  nodeExecutable: string,
): ChildProcess {
  const entry = path.join(outputRoot, "server/index.mjs");
  serverProcess = spawn(nodeExecutable, [entry], {
    cwd: outputRoot,
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(port),
      HOST: "127.0.0.1",
    },
    stdio: "ignore",
  });
  serverProcess.on("error", (err) => {
    console.error(
      JSON.stringify({
        event: "desktop.embedded.child_error",
        message: String(err),
      }),
    );
  });
  serverProcess.on("exit", () => {
    serverProcess = null;
  });
  return serverProcess;
}

export function stopEmbeddedWebServer(): void {
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
    serverProcess = null;
  }
}
