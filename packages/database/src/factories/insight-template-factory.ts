import type { Database } from "../client";
import { seedInsightTemplates } from "../seeds/templates.seed";

export interface TemplateBlueprint {
  nameTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  icon: string;
  domains: string[];
  connectors: {
    connectorId: string;
    metrics: string[];
  }[];
  aiTemplateName?: string;
  schedule?: { frequency: string; time: number };
  delivery?: {
    format: string;
    emailRecipients: string[];
    enableWebhook: boolean;
    webhookUrl: string | null;
  };
}

type Locale = "en" | "ar" | "fr";

const BASE_TEMPLATES: Omit<TemplateBlueprint, "nameTranslations" | "descriptionTranslations">[] = [
  {
    icon: "chart-bar",
    domains: ["paid_media", "analytics"],
    connectors: [
      { connectorId: "ga4", metrics: ["sessions", "conversions", "bounce_rate"] },
      { connectorId: "meta", metrics: ["impressions", "clicks", "spend"] },
      { connectorId: "tiktok", metrics: ["video_views", "clicks", "spend"] },
    ],
    aiTemplateName: "Weekly Performance Summary",
    schedule: { frequency: "weekly", time: 9 },
    delivery: {
      format: "pdf",
      emailRecipients: [],
      enableWebhook: false,
      webhookUrl: null,
    },
  },
  {
    icon: "trending-up",
    domains: ["paid_media", "finance"],
    connectors: [
      { connectorId: "ga4", metrics: ["revenue", "transactions", "conversion_rate"] },
      { connectorId: "meta", metrics: ["roas", "cost_per_result", "purchases"] },
      { connectorId: "gsc", metrics: ["clicks", "impressions", "ctr"] },
    ],
    aiTemplateName: "Monthly ROI Report",
    schedule: { frequency: "monthly", time: 9 },
    delivery: {
      format: "excel",
      emailRecipients: [],
      enableWebhook: false,
      webhookUrl: null,
    },
  },
  {
    icon: "search",
    domains: ["organic", "content"],
    connectors: [
      { connectorId: "gsc", metrics: ["clicks", "impressions", "average_position", "ctr"] },
    ],
    aiTemplateName: "SEO Analysis",
    schedule: { frequency: "weekly", time: 10 },
    delivery: {
      format: "pdf",
      emailRecipients: [],
      enableWebhook: false,
      webhookUrl: null,
    },
  },
  {
    icon: "share-2",
    domains: ["social", "engagement"],
    connectors: [
      { connectorId: "meta", metrics: ["reach", "engagement", "followers"] },
      { connectorId: "tiktok", metrics: ["video_views", "likes", "shares", "followers"] },
    ],
    aiTemplateName: "Social Media Performance",
    schedule: { frequency: "daily", time: 8 },
    delivery: {
      format: "pdf",
      emailRecipients: [],
      enableWebhook: false,
      webhookUrl: null,
    },
  },
];

const TEMPLATE_NAMES: Record<string, Record<Locale, string>> = {
  "Weekly Performance Summary": {
    en: "Weekly Performance Summary",
    ar: "ملخص الأداء الأسبوعي",
    fr: "Résumé des performances hebdomadaires",
  },
  "Monthly ROI Report": {
    en: "Monthly ROI Report",
    ar: "تقرير العائد الشهري",
    fr: "Rapport ROI mensuel",
  },
  "SEO Analysis": {
    en: "SEO Analysis",
    ar: "تحليل تحسين محركات البحث",
    fr: "Analyse SEO",
  },
  "Social Media Performance": {
    en: "Social Media Performance",
    ar: "أداء وسائل التواصل الاجتماعي",
    fr: "Performance des réseaux sociaux",
  },
};

const TEMPLATE_DESCRIPTIONS: Record<string, Record<Locale, string>> = {
  "Weekly Performance Summary": {
    en: "Comprehensive weekly performance overview across all paid channels",
    ar: "نظرة شاملة على الأداء الأسبوعي عبر جميع القنوات المدفوعة",
    fr: "Vue d'ensemble hebdomadaire des performances sur tous les canaux payants",
  },
  "Monthly ROI Report": {
    en: "Monthly return on investment analysis with cross-channel attribution",
    ar: "تحليل العائد على الاستثمار الشهري مع العزو عبر القنوات",
    fr: "Analyse mensuelle du retour sur investissement avec attribution multicanaux",
  },
  "SEO Analysis": {
    en: "Search engine optimization insights and keyword performance tracking",
    ar: "رؤى تحسين محركات البحث وتتبع أداء الكلمات الرئيسية",
    fr: "Insights d'optimisation pour les moteurs de recherche et suivi des performances des mots-clés",
  },
  "Social Media Performance": {
    en: "Daily social media engagement and audience growth metrics",
    ar: "مقاييس المشاركة اليومية على وسائل التواصل الاجتماعي ونمو الجمهور",
    fr: "Métriques quotidiennes d'engagement sur les réseaux sociaux et de croissance de l'audience",
  },
};

function buildTranslations(
  templateKey: string,
): Pick<TemplateBlueprint, "nameTranslations" | "descriptionTranslations"> {
  return {
    nameTranslations: { ...TEMPLATE_NAMES[templateKey] },
    descriptionTranslations: { ...TEMPLATE_DESCRIPTIONS[templateKey] },
  };
}

export function getDevTemplates(): TemplateBlueprint[] {
  return BASE_TEMPLATES.map((base) => {
    const key = base.aiTemplateName!;
    return { ...base, ...buildTranslations(key) };
  });
}

export function getProdTemplates(): TemplateBlueprint[] {
  return getDevTemplates();
}

export class InsightTemplateFactory {
  static createSingle(
    nameTranslations: Record<string, string>,
    descriptionTranslations: Record<string, string>,
    blueprint: Omit<TemplateBlueprint, "nameTranslations" | "descriptionTranslations">,
  ): TemplateBlueprint {
    return { nameTranslations, descriptionTranslations, ...blueprint };
  }

  static async createBatch(
    db: Database,
    blueprints: TemplateBlueprint[],
  ): Promise<Map<string, string>> {
    return seedInsightTemplates(db, blueprints);
  }

  static validateBlueprints(blueprints: TemplateBlueprint[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (let i = 0; i < blueprints.length; i++) {
      const bp = blueprints[i];

      if (!bp.nameTranslations || Object.keys(bp.nameTranslations).length === 0) {
        errors.push(`Blueprint ${i}: nameTranslations is empty`);
      }

      if (!bp.descriptionTranslations || Object.keys(bp.descriptionTranslations).length === 0) {
        errors.push(`Blueprint ${i}: descriptionTranslations is empty`);
      }

      if (!bp.icon) {
        errors.push(`Blueprint ${i}: icon is required`);
      }

      if (!bp.domains || bp.domains.length === 0) {
        errors.push(`Blueprint ${i}: at least one domain is required`);
      }

      if (!bp.connectors || bp.connectors.length === 0) {
        errors.push(`Blueprint ${i}: at least one connector is required`);
      }

      for (const conn of bp.connectors || []) {
        if (!conn.connectorId) {
          errors.push(`Blueprint ${i}: connectorId is required for all connectors`);
        }
        if (!conn.metrics || conn.metrics.length === 0) {
          errors.push(
            `Blueprint ${i}: metrics array cannot be empty for connector '${conn.connectorId}'`,
          );
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
