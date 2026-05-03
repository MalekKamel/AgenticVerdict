import { createRouter } from "@tanstack/react-router";

import { getCspNonce } from "@web-csp-nonce";

import { routeTree } from "@/routeTree.gen";

export function createAppRouter() {
  const nonce = getCspNonce();
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    ...(nonce ? { ssr: { nonce } } : {}),
  });
}

export const router = createAppRouter();
export type AppRouter = typeof router;
