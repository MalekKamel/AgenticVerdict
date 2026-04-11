import type { Ga4ResponseMetadata, Ga4RunReportResponse } from "./models";

function isSampledFromMetadata(meta: Ga4ResponseMetadata | undefined): boolean {
  if (!meta) {
    return false;
  }
  if (meta.dataLossFromOtherReason === true) {
    return true;
  }
  const list = meta.samplingMetadatas;
  if (!Array.isArray(list) || list.length === 0) {
    return false;
  }
  for (const m of list) {
    const read = Number(m.samplesReadCount);
    const space = Number(m.samplingSpaceSize);
    if (Number.isFinite(read) && Number.isFinite(space) && read < space) {
      return true;
    }
  }
  return false;
}

export function isRunReportSampled(report: Ga4RunReportResponse | undefined): boolean {
  return isSampledFromMetadata(report?.metadata);
}

export function mergeSamplingFlags(reports: readonly Ga4RunReportResponse[]): boolean {
  return reports.some((r) => isRunReportSampled(r));
}
