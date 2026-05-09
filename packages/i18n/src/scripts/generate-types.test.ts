import { describe, expect, it } from "vitest";

import { extractIcuPlaceholders, flattenJson, generateTypes, getNamespace } from "./generate-types";

describe("flattenJson", () => {
  it("flattens nested JSON to dot-notation keys", () => {
    const input = {
      auth: {
        login: {
          title: "Sign In",
          emailLabel: "Email",
        },
      },
    };
    const result = flattenJson(input);
    expect(result).toEqual({
      "auth.login.title": "Sign In",
      "auth.login.emailLabel": "Email",
    });
  });

  it("handles single-level objects", () => {
    const input = { title: "Hello", subtitle: "World" };
    const result = flattenJson(input);
    expect(result).toEqual({
      title: "Hello",
      subtitle: "World",
    });
  });

  it("ignores array values", () => {
    const input = {
      items: ["a", "b", "c"],
      title: "Test",
    };
    const result = flattenJson(input);
    expect(result).toEqual({ title: "Test" });
  });

  it("handles deeply nested structures", () => {
    const input = {
      a: {
        b: {
          c: {
            d: "deep value",
          },
        },
      },
    };
    const result = flattenJson(input);
    expect(result).toEqual({ "a.b.c.d": "deep value" });
  });

  it("returns empty object for empty input", () => {
    expect(flattenJson({})).toEqual({});
  });
});

describe("extractIcuPlaceholders", () => {
  it("extracts simple placeholders", () => {
    expect(extractIcuPlaceholders("Hello {name}!")).toEqual(["name"]);
  });

  it("extracts multiple different placeholders", () => {
    expect(extractIcuPlaceholders("{user} has {count} items")).toEqual(["count", "user"]);
  });

  it("extracts plural ICU syntax", () => {
    expect(extractIcuPlaceholders("{count, plural, one {# item} other {# items}}")).toEqual([
      "count",
    ]);
  });

  it("extracts select ICU syntax", () => {
    expect(extractIcuPlaceholders("{gender, select, male {He} female {She} other {They}}")).toEqual(
      ["gender"],
    );
  });

  it("returns empty array for no placeholders", () => {
    expect(extractIcuPlaceholders("Hello world")).toEqual([]);
  });

  it("deduplicates repeated placeholders", () => {
    expect(extractIcuPlaceholders("{name} and {name} again")).toEqual(["name"]);
  });

  it("returns sorted placeholders", () => {
    expect(extractIcuPlaceholders("{zebra} {apple} {mango}")).toEqual(["apple", "mango", "zebra"]);
  });
});

describe("getNamespace", () => {
  it("extracts first segment of dot-notation key", () => {
    expect(getNamespace("auth.login.title")).toBe("auth");
  });

  it("handles single-segment keys", () => {
    expect(getNamespace("title")).toBe("title");
  });

  it("handles two-segment keys", () => {
    expect(getNamespace("common.ok")).toBe("common");
  });
});

describe("generateTypes", () => {
  it("generates MessageKey union type", () => {
    const flattened = {
      "auth.login.title": "Sign In",
      "common.ok": "OK",
    };
    const output = generateTypes(flattened);

    expect(output).toContain("export type MessageKey =");
    expect(output).toContain('| "auth.login.title"');
    expect(output).toContain('| "common.ok"');
  });

  it("generates NamespaceType union type", () => {
    const flattened = {
      "auth.login.title": "Sign In",
      "common.ok": "OK",
    };
    const output = generateTypes(flattened);

    expect(output).toContain("export type NamespaceType =");
    expect(output).toContain('| "auth"');
    expect(output).toContain('| "common"');
  });

  it("generates NamespaceKeys mapped type", () => {
    const output = generateTypes({ "auth.login.title": "Sign In" });
    expect(output).toContain(
      "export type NamespaceKeys<N extends NamespaceType> = Extract<MessageKey, `${N}.${string}`>;",
    );
  });

  it("generates PlaceholderMap with placeholders", () => {
    const flattened = {
      "greeting.hello": "Hello {name}!",
      "greeting.plain": "Hello world",
    };
    const output = generateTypes(flattened);

    expect(output).toContain('"greeting.hello": "name";');
    expect(output).toContain('"greeting.plain": never;');
  });

  it("generates PlaceholderMap with multiple placeholders", () => {
    const flattened = {
      "summary.count": "{user} has {count} items",
    };
    const output = generateTypes(flattened);

    expect(output).toContain('"summary.count": "count" | "user";');
  });

  it("includes auto-generated header", () => {
    const output = generateTypes({ key: "value" });
    expect(output).toContain("// Auto-generated — DO NOT EDIT MANUALLY");
    expect(output).toContain("// Run: pnpm --filter @agenticverdict/i18n generate:types");
  });

  it("produces deterministic output (sorted keys)", () => {
    const flattened = {
      "z.key": "z",
      "a.key": "a",
      "m.key": "m",
    };
    const output1 = generateTypes(flattened);
    const output2 = generateTypes(flattened);
    expect(output1).toBe(output2);
  });

  it("integration: generates valid TypeScript from en.json structure", () => {
    const flattened = {
      "auth.login.title": "Sign In",
      "auth.login.emailLabel": "Email address",
      "auth.login.errors.email.required": "Email is required",
      "common.ok": "OK",
      "common.cancel": "Cancel",
      "dashboard.home.title": "Dashboard",
      "dashboard.home.subtitle": "Welcome back {name}",
    };

    const output = generateTypes(flattened);

    // Verify all expected types are present
    expect(output).toContain("export type MessageKey");
    expect(output).toContain("export type NamespaceType");
    expect(output).toContain("export type NamespaceKeys");
    expect(output).toContain("export type PlaceholderMap");

    // Verify namespaces
    expect(output).toContain('| "auth"');
    expect(output).toContain('| "common"');
    expect(output).toContain('| "dashboard"');

    // Verify placeholder detection
    expect(output).toContain('"dashboard.home.subtitle": "name";');
    expect(output).toContain('"auth.login.title": never;');
  });
});
