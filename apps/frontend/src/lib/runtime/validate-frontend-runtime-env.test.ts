import { describe, expect, it } from "vitest";

import { validateFrontendRuntimeEnvContract } from "./validate-frontend-runtime-env";

describe("validateFrontendRuntimeEnvContract", () => {
  it("passes in non production-like runtime", () => {
    expect(() =>
      validateFrontendRuntimeEnvContract({
        runtimeEnv: "development",
      }),
    ).not.toThrow();
  });

  it("passes when all required vars are valid in production-like runtime", () => {
    expect(() =>
      validateFrontendRuntimeEnvContract({
        runtimeEnv: "production",
        apiUrl: "http://api:4000",
        vitePublicApiUrl: "http://localhost:4000",
        vitePublicDefaultTenantId: "11111111-1111-4111-8111-111111111111",
      }),
    ).not.toThrow();
  });

  it("fails when required vars are missing", () => {
    expect(() =>
      validateFrontendRuntimeEnvContract({
        runtimeEnv: "staging",
        requireServerApiUrl: true,
      }),
    ).toThrowError(/Missing required `API_URL`/);
  });

  it("does not require API_URL for browser runtime validation", () => {
    expect(() =>
      validateFrontendRuntimeEnvContract({
        runtimeEnv: "production",
        requireServerApiUrl: false,
        vitePublicApiUrl: "http://localhost:4000",
        vitePublicDefaultTenantId: "11111111-1111-4111-8111-111111111111",
      }),
    ).not.toThrow();
  });

  it("fails when URLs are invalid", () => {
    expect(() =>
      validateFrontendRuntimeEnvContract({
        runtimeEnv: "production",
        apiUrl: "api.local",
        vitePublicApiUrl: "/relative-path",
        vitePublicDefaultTenantId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toThrowError(/must be an absolute http\(s\) URL/);
  });

  it("fails when default tenant id is not uuid", () => {
    expect(() =>
      validateFrontendRuntimeEnvContract({
        runtimeEnv: "production",
        apiUrl: "http://api:4000",
        vitePublicApiUrl: "http://localhost:4000",
        vitePublicDefaultTenantId: "not-a-uuid",
      }),
    ).toThrowError(/must be a UUID/);
  });
});
