import { z } from "zod";

/** Inclusive calendar date range (ISO 8601 date, `YYYY-MM-DD`). */
export interface DateRange {
  start: string;
  end: string;
}

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
