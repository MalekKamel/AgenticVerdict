/** @type {import('lhci').LHCI.LighthouseConfig} */
// Thresholds: raise category/minScore and numeric budgets after several stable `main` runs (see web-core-web-vitals-evidence.md).
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      startServerCommand: "node .output/server/index.mjs",
      startServerReadyPattern: "Listening",
      startServerReadyTimeout: 120000,
      url: ["http://127.0.0.1:3000/en", "http://127.0.0.1:3000/en/auth/login"],
      settings: {
        chromeFlags: "--no-sandbox --disable-dev-shm-usage --disable-gpu",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.5 }],
        "categories:accessibility": ["error", { minScore: 0.85 }],
        "categories:best-practices": ["warn", { minScore: 0.8 }],
        "categories:seo": ["warn", { minScore: 0.8 }],
        "categories:pwa": "off",
        "first-contentful-paint": ["warn", { maxNumericValue: 4000 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 4000 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.25 }],
        "total-blocking-time": ["warn", { maxNumericValue: 800 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
