import { describe, expect, it } from "vitest";

import { I18nManager } from "./i18n-manager";

describe("I18nManager", () => {
  it("loads bundled English strings", () => {
    const i18n = new I18nManager("en");
    expect(i18n.t("reports.title")).toBe("Reports");
    expect(i18n.direction()).toBe("ltr");
  });

  it("loads Arabic and reports RTL", () => {
    const i18n = new I18nManager("ar");
    expect(i18n.t("reports.download")).toBe("تنزيل");
    expect(i18n.direction()).toBe("rtl");
  });

  it("falls back to key or explicit fallback", () => {
    const i18n = new I18nManager("en");
    expect(i18n.t("missing.key", "fallback")).toBe("fallback");
  });

  it("setLocaleFromTag switches dictionary", () => {
    const i18n = new I18nManager("en");
    i18n.setLocaleFromTag("ar", "en");
    expect(i18n.getLocale()).toBe("ar");
    expect(i18n.t("common.ok")).toBe("حسناً");
  });

  it("supports manual text direction override", () => {
    const i18n = new I18nManager("ar");
    expect(i18n.direction()).toBe("rtl");
    i18n.setTextDirectionOverride("ltr");
    expect(i18n.direction()).toBe("ltr");
    i18n.setTextDirectionOverride(undefined);
    expect(i18n.direction()).toBe("rtl");
  });
});
