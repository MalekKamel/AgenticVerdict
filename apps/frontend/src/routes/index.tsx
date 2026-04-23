import { createFileRoute, redirect } from "@tanstack/react-router";

import { detectLocale } from "@/i18n/i18n";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const locale = detectLocale();
    throw redirect({
      to: "/$locale",
      params: { locale },
    });
  },
  component: () => null,
});
