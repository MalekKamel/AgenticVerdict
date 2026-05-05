import { describe, it, expect, beforeEach } from "vitest";
import {
  recordRequest,
  recordLatency,
  recordError,
  recordTokenUsage,
  recordCost,
  recordStreamingDuration,
  incrementActiveStreams,
  decrementActiveStreams,
  setModelAvailability,
  recordCredentialRefresh,
  recordCacheHit,
  recordFailover,
  recordRateLimit,
  startLatencyTimer,
} from "./prometheus";

describe("Prometheus Metrics", () => {
  beforeEach(() => {
    // Note: In a real test environment, we would reset the registry
    // For now, we just verify the functions don't throw
  });

  describe("recordRequest", () => {
    it("should record a request without throwing", () => {
      expect(() => {
        recordRequest({
          providerId: "openai",
          tenantId: "tenant-123",
          model: "gpt-4",
          operation: "chat",
        });
      }).not.toThrow();
    });

    it("should record a request with optional fields", () => {
      expect(() => {
        recordRequest({
          providerId: "anthropic",
          tenantId: "tenant-456",
        });
      }).not.toThrow();
    });
  });

  describe("recordLatency", () => {
    it("should record valid latency", () => {
      expect(() => {
        recordLatency(
          {
            providerId: "openai",
            tenantId: "tenant-123",
            model: "gpt-3.5-turbo",
            operation: "chat",
          },
          0.5,
        );
      }).not.toThrow();
    });

    it("should ignore negative latency", () => {
      expect(() => {
        recordLatency(
          {
            providerId: "openai",
            tenantId: "tenant-123",
          },
          -1,
        );
      }).not.toThrow();
    });

    it("should ignore infinite latency", () => {
      expect(() => {
        recordLatency(
          {
            providerId: "openai",
            tenantId: "tenant-123",
          },
          Infinity,
        );
      }).not.toThrow();
    });
  });

  describe("recordError", () => {
    it("should record an error", () => {
      expect(() => {
        recordError({
          providerId: "openai",
          tenantId: "tenant-123",
          errorCode: "RATE_LIMIT_EXCEEDED",
          operation: "chat",
        });
      }).not.toThrow();
    });

    it("should record an error without operation", () => {
      expect(() => {
        recordError({
          providerId: "anthropic",
          tenantId: "tenant-456",
          errorCode: "AUTHENTICATION_FAILED",
        });
      }).not.toThrow();
    });
  });

  describe("recordTokenUsage", () => {
    it("should record prompt tokens", () => {
      expect(() => {
        recordTokenUsage(
          {
            providerId: "openai",
            tenantId: "tenant-123",
            model: "gpt-4",
          },
          "prompt",
          100,
        );
      }).not.toThrow();
    });

    it("should record completion tokens", () => {
      expect(() => {
        recordTokenUsage(
          {
            providerId: "openai",
            tenantId: "tenant-123",
            model: "gpt-4",
          },
          "completion",
          50,
        );
      }).not.toThrow();
    });

    it("should ignore negative token count", () => {
      expect(() => {
        recordTokenUsage(
          {
            providerId: "openai",
            tenantId: "tenant-123",
          },
          "total",
          -10,
        );
      }).not.toThrow();
    });
  });

  describe("recordCost", () => {
    it("should record cost", () => {
      expect(() => {
        recordCost(
          {
            providerId: "openai",
            tenantId: "tenant-123",
            model: "gpt-4",
          },
          0.002,
        );
      }).not.toThrow();
    });

    it("should ignore negative cost", () => {
      expect(() => {
        recordCost(
          {
            providerId: "openai",
            tenantId: "tenant-123",
          },
          -5.0,
        );
      }).not.toThrow();
    });
  });

  describe("recordStreamingDuration", () => {
    it("should record streaming duration", () => {
      expect(() => {
        recordStreamingDuration(
          {
            providerId: "openai",
            tenantId: "tenant-123",
            model: "gpt-4",
          },
          2.5,
        );
      }).not.toThrow();
    });

    it("should ignore negative duration", () => {
      expect(() => {
        recordStreamingDuration(
          {
            providerId: "openai",
            tenantId: "tenant-123",
          },
          -1,
        );
      }).not.toThrow();
    });
  });

  describe("active streams", () => {
    it("should increment and decrement active streams", () => {
      expect(() => {
        incrementActiveStreams("openai", "tenant-123");
        decrementActiveStreams("openai", "tenant-123");
      }).not.toThrow();
    });
  });

  describe("setModelAvailability", () => {
    it("should set model as available", () => {
      expect(() => {
        setModelAvailability("openai", "gpt-4", true);
      }).not.toThrow();
    });

    it("should set model as unavailable", () => {
      expect(() => {
        setModelAvailability("openai", "gpt-4", false);
      }).not.toThrow();
    });
  });

  describe("recordCredentialRefresh", () => {
    it("should record credential refresh", () => {
      expect(() => {
        recordCredentialRefresh("openai", "tenant-123");
      }).not.toThrow();
    });
  });

  describe("recordCacheHit", () => {
    it("should record model cache hit", () => {
      expect(() => {
        recordCacheHit("openai", "tenant-123", "model");
      }).not.toThrow();
    });

    it("should record credential cache hit", () => {
      expect(() => {
        recordCacheHit("openai", "tenant-123", "credential");
      }).not.toThrow();
    });

    it("should record config cache hit", () => {
      expect(() => {
        recordCacheHit("openai", "tenant-123", "config");
      }).not.toThrow();
    });
  });

  describe("recordFailover", () => {
    it("should record failover event", () => {
      expect(() => {
        recordFailover("openai", "tenant-123", "openai", "anthropic");
      }).not.toThrow();
    });
  });

  describe("recordRateLimit", () => {
    it("should record rate limit event", () => {
      expect(() => {
        recordRateLimit("openai", "tenant-123");
      }).not.toThrow();
    });
  });

  describe("startLatencyTimer", () => {
    it("should create a timer and record latency when ended", () => {
      expect(() => {
        const timer = startLatencyTimer();
        // Small delay to simulate real usage
        const start = performance.now();
        while (performance.now() - start < 10) {
          // Busy wait for 10ms
        }
        timer.end({
          providerId: "openai",
          tenantId: "tenant-123",
          model: "gpt-4",
          operation: "chat",
        });
      }).not.toThrow();
    });

    it("should handle timer end with minimal labels", () => {
      expect(() => {
        const timer = startLatencyTimer();
        timer.end({
          providerId: "anthropic",
          tenantId: "tenant-456",
        });
      }).not.toThrow();
    });
  });
});
