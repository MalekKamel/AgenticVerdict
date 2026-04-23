import { randomBytes } from "node:crypto";

import { createMiddleware, createStart } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

import { buildContentSecurityPolicy } from "@/lib/csp";
import { runWithCspNonce } from "@/lib/csp-nonce.server";
import { validateFrontendRuntimeEnvContract } from "@/lib/runtime/validate-frontend-runtime-env";

validateFrontendRuntimeEnvContract();

const cspNonceMiddleware = createMiddleware().server(async ({ next, request }) => {
  if (process.env.NODE_ENV !== "production") {
    return next();
  }

  const url = new URL(request.url);
  if (url.pathname.startsWith("/_serverFn")) {
    return next();
  }

  const nonce = randomBytes(16).toString("base64url");
  const policy = buildContentSecurityPolicy(nonce, {
    requestOrigin: request.url,
  });

  return runWithCspNonce(nonce, () => {
    setResponseHeader("Content-Security-Policy", policy);
    return next();
  });
});

export const startInstance = createStart(() => ({
  requestMiddleware: [cspNonceMiddleware],
}));
