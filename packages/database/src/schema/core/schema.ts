import { pgSchema } from "drizzle-orm/pg-core";

/** Connector-centric domain tables (registry, insights, usage) live in `core` for clear separation from legacy `public` tenant tables. */
export const coreSchema = pgSchema("core");
