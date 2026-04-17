import { createRouter } from "@tanstack/react-router";

import { getCspNonce } from "@web-csp-nonce";

import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const nonce = getCspNonce();
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    ...(nonce ? { ssr: { nonce } } : {}),
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

declare module "@tanstack/react-start" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
