import { Container, Stack } from "@mantine/core";

import { loadCompanyConfig } from "@agenticverdict/config";

import { HomeContentClient } from "./HomeContentClient";

export const dynamic = "force-dynamic";

const DEMO_COMPANY_ID = "11111111-1111-4111-8111-111111111111";

export default async function HomePage() {
  const config = await loadCompanyConfig(DEMO_COMPANY_ID);

  return (
    <Container py="xl">
      <Stack gap="md">
        <HomeContentClient config={config} />
      </Stack>
    </Container>
  );
}
