import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  /** Include workspace packages in `.next/standalone` traces (monorepo). */
  outputFileTracingRoot: path.join(__dirname, "../.."),
  transpilePackages: [
    "@agenticverdict/types",
    "@agenticverdict/config",
    "@agenticverdict/core",
    "@agenticverdict/i18n",
  ],
};

export default withNextIntl(nextConfig);
