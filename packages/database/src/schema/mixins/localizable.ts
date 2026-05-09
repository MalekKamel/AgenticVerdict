import { jsonb } from "drizzle-orm/pg-core";

/**
 * Creates a JSONB column for storing translations of a translatable field.
 *
 * Usage:
 *   nameTranslations: translationsJsonb("name_translations"),
 *   descriptionTranslations: translationsJsonb("description_translations"),
 *
 * The column stores a record like: { en: "...", ar: "...", fr: "..." }
 */
export function translationsJsonb(columnName: string) {
  return jsonb(columnName).$type<Record<string, string>>().notNull().default({});
}
