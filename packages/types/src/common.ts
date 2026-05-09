import { z } from "zod";

/** Inclusive calendar date range (ISO 8601 date, `YYYY-MM-DD`). */
export interface DateRange {
  start: string;
  end: string;
}

/** ISO 8601 date string alias. */
export type DateRangeIso = string;

export const dateRangeSchema = z
  .object({
    start: z.string().min(10),
    end: z.string().min(10),
  })
  .refine((r) => r.start <= r.end, { message: "dateRange.start must be <= end" });

export type MetricReference = {
  key: string;
  label?: string;
  value?: string | number;
  platform?: string;
};

export const metricReferenceSchema = z.object({
  key: z.string().min(1),
  label: z.string().optional(),
  value: z.union([z.string(), z.number()]).optional(),
  platform: z.string().optional(),
});

// ============================================================================
// Sort Direction
// ============================================================================

export const SORT_DIRECTIONS = ["asc", "desc"] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];
export const sortDirectionSchema = z.enum(SORT_DIRECTIONS);

// ============================================================================
// Pagination and Response Schemas
// ============================================================================

/**
 * Generic pagination input
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: sortDirectionSchema.default("asc"),
});

/**
 * Generic response with pagination
 */
export function paginatedResponseSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    pagination: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      totalItems: z.number().int(),
      totalPages: z.number().int(),
      hasMore: z.boolean(),
    }),
  });
}

/**
 * Success response wrapper
 */
export function successResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    timestamp: z.iso.datetime(),
  });
}

/**
 * Error response schema
 */
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
  timestamp: z.iso.datetime(),
});

// Type exports
export type PaginationInput = z.infer<typeof paginationSchema>;

export type TextDirection = "ltr" | "rtl";

export const textDirectionSchema = z.enum(["ltr", "rtl"]);
