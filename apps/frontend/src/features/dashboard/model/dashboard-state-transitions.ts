import type { UseQueryResult } from "@tanstack/react-query";

export type AsyncSectionStatus = "idle" | "loading" | "empty" | "success" | "error" | "partial";

export type SectionQuerySlice<T> = Pick<
  UseQueryResult<T, Error>,
  "isPending" | "isFetching" | "isError" | "isSuccess" | "data" | "error" | "dataUpdatedAt"
>;

export function resolveAsyncSectionStatus<T>(q: SectionQuerySlice<T>): AsyncSectionStatus {
  if (q.isPending) {
    return "loading";
  }
  if (q.isError) {
    return "error";
  }
  if (q.isSuccess) {
    if (q.data === undefined || q.data === null) {
      return "empty";
    }
    return "success";
  }
  if (q.isFetching) {
    return "loading";
  }
  return "idle";
}

export function combineHomeSurfaceStatus(parts: {
  kpis: AsyncSectionStatus;
  insights: AsyncSectionStatus;
  connectors: AsyncSectionStatus;
}): AsyncSectionStatus {
  const values = [parts.kpis, parts.insights, parts.connectors];
  if (values.every((v) => v === "success" || v === "empty")) {
    if (values.some((v) => v === "empty")) {
      return "partial";
    }
    return "success";
  }
  if (values.some((v) => v === "error")) {
    if (values.some((v) => v === "success")) {
      return "partial";
    }
    return "error";
  }
  if (values.some((v) => v === "loading")) {
    return "loading";
  }
  return "idle";
}
