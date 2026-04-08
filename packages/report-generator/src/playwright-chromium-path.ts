import { existsSync } from "node:fs";

import { chromium, type LaunchOptions } from "playwright";

/** Debian/Ubuntu `chromium` package (Dockerfile.test and many Linux CI images). */
const LINUX_DISTRO_CHROMIUM = "/usr/bin/chromium";

/**
 * Resolves a Chromium binary for Playwright: env override, distro path, then Playwright-managed install.
 */
export function resolvePlaywrightChromiumExecutablePath(): string | undefined {
  const envPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
  if (envPath && existsSync(envPath)) {
    return envPath;
  }
  if (existsSync(LINUX_DISTRO_CHROMIUM)) {
    return LINUX_DISTRO_CHROMIUM;
  }
  try {
    const bundled = chromium.executablePath();
    return existsSync(bundled) ? bundled : undefined;
  } catch {
    return undefined;
  }
}

/** True when {@link resolvePlaywrightChromiumExecutablePath} finds a binary (skips flaky CDN install in Docker). */
export function isPlaywrightChromiumAvailable(): boolean {
  return resolvePlaywrightChromiumExecutablePath() !== undefined;
}

/** Launch options for headless Chromium in CI/Docker (no-sandbox) and local dev. */
export function getPlaywrightChromiumLaunchOptions(): LaunchOptions {
  const executablePath = resolvePlaywrightChromiumExecutablePath();
  if (!executablePath) {
    throw new Error(
      "Chromium not found. Install Playwright browsers (pnpm exec playwright install chromium), " +
        "or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH (e.g. /usr/bin/chromium in Docker).",
    );
  }
  return {
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };
}
