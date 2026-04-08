import { describe, expect, it } from "vitest";

import {
  PlatformDataFactory,
  ScenarioDataFactory,
  setSeed,
} from "../factories/platform-data-factory";

describe("PlatformDataFactory", () => {
  it("generates deterministic Meta campaigns for the same seed", () => {
    setSeed(99);
    const first = PlatformDataFactory.generateMetaCampaigns(3, 99);
    setSeed(99);
    const second = PlatformDataFactory.generateMetaCampaigns(3, 99);
    expect(first.map((c) => c.id)).toEqual(second.map((c) => c.id));
    expect(first).toHaveLength(3);
    expect(first[0]?.status).toMatch(/active|paused|archived/);
  });

  it("generates GA4 sessions and events with consistent session references", () => {
    const sessions = PlatformDataFactory.generateGA4Sessions(5, 42);
    const events = PlatformDataFactory.generateGA4Events(sessions, 2, 43);
    expect(sessions).toHaveLength(5);
    expect(events.length).toBeGreaterThan(0);
    const sessionIds = new Set(sessions.map((s) => s.sessionId));
    for (const e of events) {
      expect(sessionIds.has(e.sessionId)).toBe(true);
    }
  });

  it("generateMultiPlatformDataset wires GA4 events to generated sessions", () => {
    const start = new Date("2026-01-01T00:00:00.000Z");
    const end = new Date("2026-01-03T00:00:00.000Z");
    const data = PlatformDataFactory.generateMultiPlatformDataset({
      startDate: start,
      endDate: end,
      campaignsPerPlatform: 2,
      sessionsPerDay: 5,
      seed: 7,
    });
    expect(data.meta.campaigns.length).toBe(2);
    expect(data.ga4.sessions.length).toBeGreaterThan(0);
    expect(data.ga4.events.length).toBeGreaterThan(0);
    const ids = new Set(data.ga4.sessions.map((s) => s.sessionId));
    for (const ev of data.ga4.events) {
      expect(ids.has(ev.sessionId)).toBe(true);
    }
  });
});

describe("ScenarioDataFactory", () => {
  it("produces high- and low-performance scenario shapes", () => {
    const high = ScenarioDataFactory.generateHighPerformanceScenario(500);
    const low = ScenarioDataFactory.generateLowPerformanceScenario(600);
    expect(high.meta.length).toBeGreaterThan(0);
    expect(low.meta.length).toBeGreaterThan(0);
    expect(high.ga4.length).toBeGreaterThan(0);
  });

  it("high-volume scenario includes GBP and TikTok", () => {
    const hv = ScenarioDataFactory.generateHighVolumeScenario(3000);
    expect(hv.meta).toHaveLength(20);
    expect(hv.gbp.length).toBe(90);
    expect(hv.tiktok).toHaveLength(25);
  });

  it("zero-conversions scenario zeroes TikTok conversions", () => {
    const z = ScenarioDataFactory.generateZeroConversionsScenario(4000);
    expect(z.tiktok.every((a) => a.conversions === 0)).toBe(true);
  });
});
