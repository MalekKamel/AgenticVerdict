import { test, _electron as electron } from "@playwright/test";

/**
 * Set `ELECTRON_PACKAGED_EXEC` to the path of the **main** executable inside an unpacked build
 * (`electron-builder --dir`), e.g. `release/linux-unpacked/agenticverdict` or
 * `release/mac-arm64/AgenticVerdict.app/Contents/MacOS/AgenticVerdict`.
 */
const packagedExec = process.env.ELECTRON_PACKAGED_EXEC?.trim();

test.skip(!packagedExec, "Set ELECTRON_PACKAGED_EXEC to run packaged smoke.");

test("unpacked packaged app launches", async () => {
  const env = { ...process.env };
  delete env.NODE_OPTIONS;
  delete env.NODE_INSPECTOR_IPC;

  const app = await electron.launch({
    executablePath: packagedExec!,
    env: {
      ...env,
      DESKTOP_DISABLE_SINGLE_INSTANCE: "1",
      DESKTOP_DISABLE_DEVTOOLS: "1",
      DESKTOP_EMBEDDED_SERVER: "0",
      DESKTOP_RENDERER_URL: "http://127.0.0.1:3000/",
      NODE_ENV: "production",
    },
  });

  const window = await app.firstWindow();
  await window.waitForLoadState("domcontentloaded");
  await app.close();
});
