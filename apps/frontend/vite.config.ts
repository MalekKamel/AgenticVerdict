import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { visualizer } from "rollup-plugin-visualizer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const cspNonceStub = path.resolve(__dirname, "src/lib/csp-nonce.stub.ts");
const cspNonceServer = path.resolve(__dirname, "src/lib/csp-nonce.server.ts");

/**
 * Nitro SSR chunks may not inherit `ssr.resolve.alias`; resolve `@web-csp-nonce` per build (client vs SSR).
 */
function cspNonceResolvePlugin(): Plugin {
  return {
    name: "agenticverdict:csp-nonce-resolve",
    enforce: "pre",
    resolveId(id, _importer, opts) {
      if (id === "@web-csp-nonce") {
        return opts.ssr ? cspNonceServer : cspNonceStub;
      }
      return undefined;
    },
  };
}

const analyze = process.env.ANALYZE === "true";

/**
 * Non-CSP security headers for production HTML. CSP is set per request in `src/start.ts`
 * with a cryptographic nonce (see `buildContentSecurityPolicy` in `src/lib/csp.ts`).
 */
function productionHtmlSecurityHeaders(): Record<string, string> {
  return {
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    "x-frame-options": "DENY",
  };
}

function developmentHtmlSecurityHeaders(): Record<string, string> {
  return {
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
  };
}

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";
  const spaEnabled = mode === "spa" || process.env.VITE_BUILD_SPA === "true";

  return {
    plugins: [
      cspNonceResolvePlugin(),
      nitro({
        routeRules: {
          "/assets/**": {
            headers: {
              "cache-control": "public, max-age=31536000, immutable",
            },
          },
          "/**": {
            headers: isProd ? productionHtmlSecurityHeaders() : developmentHtmlSecurityHeaders(),
          },
        },
      }),
      tanstackStart({
        ...(spaEnabled
          ? {
              spa: {
                enabled: true,
                prerender: {
                  crawlLinks: true,
                },
              },
            }
          : {}),
      }),
      viteReact(),
      ...(analyze
        ? [
            visualizer({
              filename: "dist/bundle-stats.html",
              gzipSize: true,
              brotliSize: true,
              open: false,
              template: "treemap",
            }),
          ]
        : []),
    ],
    resolve: {
      tsconfigPaths: true,
      dedupe: ["react", "react-dom", "@mantine/core", "@mantine/hooks"],
    },
    server: {
      port: 3000,
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
  };
});
