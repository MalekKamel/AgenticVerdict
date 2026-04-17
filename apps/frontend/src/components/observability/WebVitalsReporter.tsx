"use client";

import { initWebVitalsReporting } from "@/lib/observability/web-vitals";
import { useEffect } from "react";

/**
 * Mounts web-vitals listeners in the browser (no SSR / no test noise when tree is client-only).
 */
export function WebVitalsReporter() {
  useEffect(() => {
    initWebVitalsReporting();
  }, []);

  return null;
}
