import { Container, Stack } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { AppRouteError } from "@/components/errors/AppRouteError";
import { HomeContentClient } from "@/components/home/HomeContentClient";

function resolveHomeTenantIdFromEnv(): string {
  const fromVite =
    typeof import.meta !== "undefined" && import.meta.env?.VITE_PUBLIC_DEFAULT_TENANT_ID
      ? String(import.meta.env.VITE_PUBLIC_DEFAULT_TENANT_ID).trim()
      : "";
  const fromNode = process.env.VITE_PUBLIC_DEFAULT_TENANT_ID?.trim() ?? "";
  const tenantId = fromVite || fromNode;
  if (!tenantId) {
    throw new Error("VITE_PUBLIC_DEFAULT_TENANT_ID is required for /$locale home loader");
  }
  return tenantId;
}

/** Server-only: loads JSON from disk; keep out of the client bundle via createServerFn. */
const loadDemoTenantConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { loadTenantConfig } = await import("@agenticverdict/config");
  return loadTenantConfig(resolveHomeTenantIdFromEnv());
});

export const Route = createFileRoute("/$locale/")({
  errorComponent: ({ error, reset }) => (
    <AppRouteError error={error} reset={reset} routeLabel="/$locale/" />
  ),
  loader: async () => {
    const config = await loadDemoTenantConfig();
    return { config };
  },
  component: HomePage,
});

function HomePage() {
  const { config } = Route.useLoaderData();

  return (
    <Container py="xl">
      <Stack gap="md">
        <HomeContentClient config={config} />
      </Stack>
    </Container>
  );
}
