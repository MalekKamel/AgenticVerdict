import { Container, Stack } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { HomeContentClient } from "@/components/home/HomeContentClient";

const DEMO_COMPANY_ID = "11111111-1111-4111-8111-111111111111";

/** Server-only: loads JSON from disk; keep out of the client bundle via createServerFn. */
const loadDemoCompanyConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { loadCompanyConfig } = await import("@agenticverdict/config");
  return loadCompanyConfig(DEMO_COMPANY_ID);
});

export const Route = createFileRoute("/$locale/")({
  loader: async () => {
    const config = await loadDemoCompanyConfig();
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
