"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "@/i18n/react";

export function AppNotFound() {
  const tErrors = useTranslations("errors");
  const tNav = useTranslations("navigation");

  return (
    <div
      role="status"
      style={{
        padding: "1rem",
        maxWidth: "36rem",
        margin: "2rem auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.125rem", marginBottom: "0.5rem" }}>{tErrors("notFound")}</h1>
      <p style={{ marginBottom: "1rem", color: "#333" }}>
        <Link href="/">{tNav("home")}</Link>
      </p>
    </div>
  );
}
