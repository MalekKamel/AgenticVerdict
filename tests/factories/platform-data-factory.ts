/**
 * Platform Data Factory
 *
 * Generates realistic test data for all platform adapters using
 * deterministic random generation with Faker.js.
 */

import { faker } from "@faker-js/faker";

// Set a global seed for deterministic output
let globalSeed = 12345;

export function setSeed(seed: number): void {
  globalSeed = seed;
  faker.seed(seed);
}

/**
 * Meta platform data structures
 */
export interface MetaCampaign {
  id: string;
  name: string;
  status: "active" | "paused" | "archived";
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  startDate: Date;
  endDate: Date;
}

export interface MetaAdSet {
  id: string;
  campaignId: string;
  name: string;
  targeting: {
    locations: string[];
    interests: string[];
    ageRange: [number, number];
  };
}

/**
 * GA4 data structures
 */
export interface GA4Session {
  sessionId: string;
  userId?: string;
  source: string;
  medium: string;
  campaign?: string;
  pageviews: number;
  duration: number;
  converted: boolean;
  conversionValue?: number;
  timestamp: Date;
}

export interface GA4Event {
  name: string;
  sessionId: string;
  parameters: Record<string, string | number>;
  timestamp: Date;
}

/**
 * GSC (Google Search Console) data structures
 */
export interface GSCQuery {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  date: Date;
}

/**
 * GBP (Google Business Profile) data structures
 */
export interface GBPMetric {
  date: Date;
  views: number;
  searches: number;
  interactions: {
    phone: number;
    website: number;
    directions: number;
  };
}

/**
 * TikTok data structures
 */
export interface TikTokAd {
  id: string;
  name: string;
  status: "active" | "paused" | "archived";
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  startDate: Date;
}

/**
 * Factory class for generating platform data
 */
export class PlatformDataFactory {
  /**
   * Generate Meta campaign data
   */
  static generateMetaCampaigns(count: number, seed?: number): MetaCampaign[] {
    if (seed !== undefined) faker.seed(seed);

    return Array.from({ length: count }, () => ({
      id: `meta_campaign_${faker.string.uuid()}`,
      name: faker.tenant.buzzPhrase() + " Campaign",
      status: faker.helpers.weightedArrayElement([
        { weight: 70, value: "active" },
        { weight: 20, value: "paused" },
        { weight: 10, value: "archived" },
      ]),
      budget: parseFloat(faker.finance.amount(5000, 50000, 0)),
      spend: parseFloat(faker.finance.amount(100, 45000, 2)),
      impressions: faker.number.int({ min: 100_000, max: 10_000_000 }),
      clicks: faker.number.int({ min: 1000, max: 500_000 }),
      conversions: faker.number.int({ min: 0, max: 10_000 }),
      revenue: parseFloat(faker.finance.amount(0, 200000, 2)),
      startDate: faker.date.recent({ days: 90 }),
      endDate: faker.date.future({ years: 1 }),
    }));
  }

  /**
   * Generate Meta ad sets
   */
  static generateMetaAdSets(campaignId: string, count: number, seed?: number): MetaAdSet[] {
    if (seed !== undefined) faker.seed(seed);

    const locations = ["US", "CA", "UK", "SA", "AE", "EG"];
    const interests = [
      "Technology",
      "Business",
      "Shopping",
      "Fitness",
      "Travel",
      "Food",
      "Entertainment",
      "Education",
    ];

    return Array.from({ length: count }, () => ({
      id: `meta_adset_${faker.string.uuid()}`,
      campaignId,
      name: faker.tenant.buzzNoun() + " Audience",
      targeting: {
        locations: faker.helpers.arrayElements(locations, { min: 1, max: 3 }),
        interests: faker.helpers.arrayElements(interests, { min: 1, max: 3 }),
        ageRange: [
          faker.number.int({ min: 18, max: 40 }),
          faker.number.int({ min: 45, max: 65 }),
        ] as [number, number],
      },
    }));
  }

  /**
   * Generate GA4 session data
   */
  static generateGA4Sessions(count: number, seed?: number): GA4Session[] {
    if (seed !== undefined) faker.seed(seed);

    const sources = ["organic", "paid", "social", "direct", "referral", "email"];
    const mediums = ["search", "cpc", "social", "none", "referral", "email"];

    return Array.from({ length: count }, () => {
      const source = faker.helpers.arrayElement(sources);
      const converted = faker.datatype.boolean({ probability: 0.04 }); // 4% conversion rate

      return {
        sessionId: `ga4_session_${faker.string.uuid()}`,
        userId: faker.datatype.boolean({ probability: 0.7 })
          ? `ga4_user_${faker.string.uuid()}`
          : undefined,
        source,
        medium: source === "direct" ? "none" : faker.helpers.arrayElement(mediums),
        campaign: source === "paid" ? faker.tenant.buzzPhrase() : undefined,
        pageviews: faker.number.int({ min: 1, max: 20 }),
        duration: faker.number.int({ min: 1000, max: 1_800_000 }), // 1 second to 30 minutes
        converted,
        conversionValue: converted ? parseFloat(faker.finance.amount(50, 500, 2)) : undefined,
        timestamp: faker.date.recent({ days: 30 }),
      };
    });
  }

  /**
   * Generate GA4 events
   */
  static generateGA4Events(
    sessions: GA4Session[],
    eventsPerSession = 3,
    seed?: number,
  ): GA4Event[] {
    if (seed !== undefined) faker.seed(seed);

    const eventNames = [
      "page_view",
      "scroll",
      "click",
      "form_submit",
      "add_to_cart",
      "begin_checkout",
      "purchase",
      "search",
      "video_start",
      "download",
    ];

    const events: GA4Event[] = [];

    for (const session of sessions) {
      const eventCount = faker.number.int({ min: 1, max: eventsPerSession * 2 });

      for (let i = 0; i < eventCount; i++) {
        events.push({
          name: faker.helpers.arrayElement(eventNames),
          sessionId: session.sessionId,
          parameters: {
            page_location: faker.internet.url(),
            page_title: faker.lorem.sentence(),
            engagement_time_msec: faker.number.int({ min: 1000, max: 60_000 }),
          },
          timestamp: new Date(session.timestamp.getTime() + i * 1000 * 60),
        });
      }
    }

    return events;
  }

  /**
   * Generate GSC query data
   */
  static generateGSCQueries(count: number, seed?: number): GSCQuery[] {
    if (seed !== undefined) faker.seed(seed);

    const queryTemplates = [
      "{{verb}} {{noun}} {{location}}",
      "{{noun}} near {{location}}",
      "best {{noun}} in {{location}}",
      "how to {{verb}} {{noun}}",
      "{{noun}} {{adjective}}",
    ];

    const verbs = ["buy", "find", "get", "order", "purchase", "shop"];
    const nouns = [
      "gps tracking",
      "fleet management",
      "vehicle tracking",
      "logistics software",
      "delivery tracking",
      "asset tracking",
    ];
    const adjectives = ["cheap", "best", "affordable", "reliable", "professional"];
    const locations = ["Riyadh", "Jeddah", "Dammam", "Saudi Arabia", "UAE"];

    return Array.from({ length: count }, () => {
      const template = faker.helpers.arrayElement(queryTemplates);
      const query = template
        .replace("{{verb}}", faker.helpers.arrayElement(verbs))
        .replace("{{noun}}", faker.helpers.arrayElement(nouns))
        .replace("{{adjective}}", faker.helpers.arrayElement(adjectives))
        .replace("{{location}}", faker.helpers.arrayElement(locations));

      const impressions = faker.number.int({ min: 10, max: 100_000 });
      const clicks = faker.number.int({ min: 0, max: Math.max(0, Math.floor(impressions * 0.3)) });

      return {
        query,
        impressions,
        clicks,
        ctr: impressions > 0 ? clicks / impressions : 0,
        position: parseFloat(faker.finance.amount(1, 50, 1)),
        date: faker.date.recent({ days: 30 }),
      };
    });
  }

  /**
   * Generate GBP metrics
   */
  static generateGBPMetrics(days: number, seed?: number): GBPMetric[] {
    if (seed !== undefined) faker.seed(seed);

    return Array.from({ length: days }, () => {
      const views = faker.number.int({ min: 50, max: 500 });

      return {
        date: faker.date.recent({ days }),
        views,
        searches: faker.number.int({
          min: Math.floor(views * 0.3),
          max: Math.max(Math.floor(views * 0.3), Math.floor(views * 0.8)),
        }),
        interactions: {
          phone: faker.number.int({ min: 0, max: 20 }),
          website: faker.number.int({ min: 5, max: 50 }),
          directions: faker.number.int({ min: 0, max: 15 }),
        },
      };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Generate TikTok ad data
   */
  static generateTikTokAds(count: number, seed?: number): TikTokAd[] {
    if (seed !== undefined) faker.seed(seed);

    return Array.from({ length: count }, () => ({
      id: `tiktok_ad_${faker.string.uuid()}`,
      name: faker.tenant.buzzPhrase() + " TikTok Ad",
      status: faker.helpers.weightedArrayElement([
        { weight: 70, value: "active" },
        { weight: 25, value: "paused" },
        { weight: 5, value: "archived" },
      ]),
      spend: parseFloat(faker.finance.amount(100, 10000, 2)),
      impressions: faker.number.int({ min: 10_000, max: 2_000_000 }),
      clicks: faker.number.int({ min: 500, max: 100_000 }),
      conversions: faker.number.int({ min: 0, max: 5000 }),
      startDate: faker.date.recent({ days: 60 }),
    }));
  }

  /**
   * Generate multi-platform dataset for a date range
   */
  static generateMultiPlatformDataset(options: {
    startDate: Date;
    endDate: Date;
    campaignsPerPlatform?: number;
    sessionsPerDay?: number;
    seed?: number;
  }) {
    const { startDate, endDate, campaignsPerPlatform = 5, sessionsPerDay = 100, seed } = options;

    if (seed !== undefined) {
      faker.seed(seed);
      setSeed(seed);
    }

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const ga4Sessions = this.generateGA4Sessions(
      days * sessionsPerDay,
      seed !== undefined ? seed + 3 : undefined,
    );

    return {
      meta: {
        campaigns: this.generateMetaCampaigns(
          campaignsPerPlatform,
          seed !== undefined ? seed + 1 : undefined,
        ),
        adSets: this.generateMetaAdSets(
          "meta_campaign_1",
          campaignsPerPlatform * 2,
          seed !== undefined ? seed + 2 : undefined,
        ),
      },
      ga4: {
        sessions: ga4Sessions,
        events: this.generateGA4Events(
          ga4Sessions,
          sessionsPerDay,
          seed !== undefined ? seed + 4 : undefined,
        ),
      },
      gsc: {
        queries: this.generateGSCQueries(days * 10, seed !== undefined ? seed + 5 : undefined),
      },
      gbp: {
        metrics: this.generateGBPMetrics(days, seed !== undefined ? seed + 6 : undefined),
      },
      tiktok: {
        ads: this.generateTikTokAds(
          campaignsPerPlatform,
          seed !== undefined ? seed + 7 : undefined,
        ),
      },
    };
  }
}

/**
 * Scenario-specific data generators
 */
export class ScenarioDataFactory {
  /**
   * Generate data for a successful, high-performing scenario
   */
  static generateHighPerformanceScenario(seed = 1000) {
    faker.seed(seed);

    return {
      meta: PlatformDataFactory.generateMetaCampaigns(5, seed).map((c) => ({
        ...c,
        spend: c.spend * 0.7,
        conversions: c.conversions * 2,
        revenue: c.revenue * 2.5,
      })),
      ga4: PlatformDataFactory.generateGA4Sessions(1000, seed + 1).map((s) => ({
        ...s,
        converted: s.pageviews > 3 ? true : s.converted,
        conversionValue: s.converted ? (s.conversionValue || 0) * 1.5 : undefined,
      })),
    };
  }

  /**
   * Generate data for a low-performing scenario
   */
  static generateLowPerformanceScenario(seed = 2000) {
    faker.seed(seed);

    return {
      meta: PlatformDataFactory.generateMetaCampaigns(5, seed).map((c) => ({
        ...c,
        spend: c.spend * 1.3,
        conversions: Math.floor(c.conversions * 0.3),
        revenue: c.revenue * 0.4,
      })),
      ga4: PlatformDataFactory.generateGA4Sessions(1000, seed + 1).map((s) => ({
        ...s,
        converted: s.pageviews > 8 ? true : s.converted,
        conversionValue: s.converted ? (s.conversionValue || 0) * 0.6 : undefined,
      })),
    };
  }

  /**
   * Generate data for a high-volume scenario
   */
  static generateHighVolumeScenario(seed = 3000) {
    faker.seed(seed);

    return {
      meta: PlatformDataFactory.generateMetaCampaigns(20, seed),
      ga4: PlatformDataFactory.generateGA4Sessions(10000, seed + 1),
      gsc: PlatformDataFactory.generateGSCQueries(5000, seed + 2),
      gbp: PlatformDataFactory.generateGBPMetrics(90, seed + 3),
      tiktok: PlatformDataFactory.generateTikTokAds(25, seed + 4),
    };
  }

  /**
   * Generate data with zero conversions (edge case)
   */
  static generateZeroConversionsScenario(seed = 4000) {
    faker.seed(seed);

    return {
      meta: PlatformDataFactory.generateMetaCampaigns(5, seed).map((c) => ({
        ...c,
        conversions: 0,
        revenue: 0,
      })),
      ga4: PlatformDataFactory.generateGA4Sessions(1000, seed + 1).map((s) => ({
        ...s,
        converted: false,
        conversionValue: undefined,
      })),
      tiktok: PlatformDataFactory.generateTikTokAds(5, seed + 2).map((a) => ({
        ...a,
        conversions: 0,
      })),
    };
  }
}

// Initialize with default seed
faker.seed(globalSeed);
