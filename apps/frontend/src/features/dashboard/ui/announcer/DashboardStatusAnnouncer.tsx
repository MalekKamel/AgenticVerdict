"use client";

import { useEffect, useRef } from "react";

/**
 * Announces async dashboard transitions once per distinct message to avoid noisy repeats.
 */
export function DashboardStatusAnnouncer({ message }: { message: string | null }) {
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!message || message === last.current) {
      return;
    }
    last.current = message;
  }, [message]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0,
      }}
    >
      {message ?? ""}
    </div>
  );
}
