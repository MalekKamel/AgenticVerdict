import { describe, expect, it } from "vitest";

import { createUpstashRedisFromEnv } from "../src/redis";

describe("createUpstashRedisFromEnv", () => {
  const urlKey = "UPSTASH_REDIS_REST_URL";
  const tokenKey = "UPSTASH_REDIS_REST_TOKEN";

  it("returns null when URL or token is missing", () => {
    const prevUrl = process.env[urlKey];
    const prevToken = process.env[tokenKey];
    delete process.env[urlKey];
    delete process.env[tokenKey];
    try {
      expect(createUpstashRedisFromEnv()).toBeNull();
      process.env[urlKey] = "https://example.upstash.io";
      expect(createUpstashRedisFromEnv()).toBeNull();
    } finally {
      if (prevUrl === undefined) {
        delete process.env[urlKey];
      } else {
        process.env[urlKey] = prevUrl;
      }
      if (prevToken === undefined) {
        delete process.env[tokenKey];
      } else {
        process.env[tokenKey] = prevToken;
      }
    }
  });

  it("returns a Redis client when both env vars are set", () => {
    const prevUrl = process.env[urlKey];
    const prevToken = process.env[tokenKey];
    process.env[urlKey] = "https://example.upstash.io";
    process.env[tokenKey] = "test-token";
    try {
      const client = createUpstashRedisFromEnv();
      expect(client).not.toBeNull();
    } finally {
      if (prevUrl === undefined) {
        delete process.env[urlKey];
      } else {
        process.env[urlKey] = prevUrl;
      }
      if (prevToken === undefined) {
        delete process.env[tokenKey];
      } else {
        process.env[tokenKey] = prevToken;
      }
    }
  });
});
