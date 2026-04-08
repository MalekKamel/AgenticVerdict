import { expect, test } from "@playwright/test";

const apiOrigin = process.env.E2E_API_BASE_URL?.replace(/\/$/, "") ?? "";

test.describe("API health (optional)", () => {
  test.skip(
    !apiOrigin,
    "Set E2E_API_BASE_URL (e.g. http://127.0.0.1:4000) to enable API smoke tests.",
  );

  test("GET /health returns success", async ({ request }) => {
    const res = await request.get(`${apiOrigin}/health`);
    expect(res.ok(), await res.text()).toBeTruthy();
  });
});
