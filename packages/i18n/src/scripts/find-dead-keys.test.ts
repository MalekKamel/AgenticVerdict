import fs from "node:fs";
import { describe, expect, it } from "vitest";

import {
  extractKeysFromSource,
  findDeadKeys,
  getLocaleKeys,
  scanFilesForKeys,
} from "./find-dead-keys";

describe("extractKeysFromSource", () => {
  it("extracts i18n.t() calls", () => {
    const source = `
      const title = i18n.t("auth.login.title");
      const msg = i18n.t("common.ok");
    `;
    expect(extractKeysFromSource(source)).toEqual(["auth.login.title", "common.ok"]);
  });

  it("extracts t() calls from useTranslations", () => {
    const source = `
      const t = useTranslations("auth");
      const title = t("login.title");
    `;
    const keys = extractKeysFromSource(source);
    expect(keys).toContain("auth.*");
    expect(keys).toContain("login.title");
  });

  it("extracts mixed patterns", () => {
    const source = `
      i18n.t("common.cancel");
      t("submit");
      manager.t("auth.login.emailLabel");
    `;
    const keys = extractKeysFromSource(source);
    expect(keys).toContain("common.cancel");
    expect(keys).toContain("submit");
    expect(keys).toContain("auth.login.emailLabel");
  });

  it("handles single and double quotes", () => {
    const source = `
      i18n.t('auth.login.title');
      i18n.t("common.ok");
    `;
    expect(extractKeysFromSource(source)).toEqual(["auth.login.title", "common.ok"]);
  });

  it("returns empty array for no keys", () => {
    expect(extractKeysFromSource("const x = 42;")).toEqual([]);
  });
});

describe("findDeadKeys", () => {
  it("identifies keys not used in code", () => {
    const localeKeys = ["auth.login.title", "auth.login.email", "common.ok"];
    const usedKeys = ["auth.login.title", "common.ok"];

    expect(findDeadKeys(localeKeys, usedKeys)).toEqual(["auth.login.email"]);
  });

  it("respects namespace wildcard patterns", () => {
    const localeKeys = ["auth.login.title", "auth.login.email", "auth.register.name"];
    const usedKeys = ["auth.*"];

    expect(findDeadKeys(localeKeys, usedKeys)).toEqual([]);
  });

  it("returns empty array when all keys are used", () => {
    const localeKeys = ["common.ok", "common.cancel"];
    const usedKeys = ["common.ok", "common.cancel"];

    expect(findDeadKeys(localeKeys, usedKeys)).toEqual([]);
  });

  it("returns all keys when none are used", () => {
    const localeKeys = ["a.key", "b.key", "c.key"];
    const usedKeys: string[] = [];

    expect(findDeadKeys(localeKeys, usedKeys)).toEqual(["a.key", "b.key", "c.key"]);
  });
});

describe("getLocaleKeys", () => {
  it("extracts keys from locale JSON structure", () => {
    const tmpFile = "/tmp/test-locale.json";
    const locale = {
      auth: {
        login: {
          title: "Sign In",
          email: "Email",
        },
      },
      common: {
        ok: "OK",
      },
    };
    fs.writeFileSync(tmpFile, JSON.stringify(locale));

    const keys = getLocaleKeys(tmpFile);
    expect(keys.sort()).toEqual(["auth.login.email", "auth.login.title", "common.ok"]);

    fs.unlinkSync(tmpFile);
  });
});

describe("scanFilesForKeys", () => {
  it("scans directory and finds key usages", () => {
    const tmpDir = "/tmp/test-i18n-scan";
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(
      `${tmpDir}/test.tsx`,
      `const t = useTranslations("auth");\ni18n.t("common.ok");`,
    );

    const results = scanFilesForKeys(tmpDir);
    expect(results).toHaveLength(1);
    expect(results[0].keys).toContain("auth.*");
    expect(results[0].keys).toContain("common.ok");

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("skips non-matching extensions", () => {
    const tmpDir = "/tmp/test-i18n-scan-ext";
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(`${tmpDir}/test.js`, `i18n.t("common.ok");`);

    const results = scanFilesForKeys(tmpDir);
    expect(results).toHaveLength(0);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
