module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run start -- --hostname 127.0.0.1 --port 3211",
      startServerReadyPattern: "Ready",
      startServerReadyTimeout: 120000,
      url: [
        "http://127.0.0.1:3211/",
        "http://127.0.0.1:3211/contact",
        "http://127.0.0.1:3211/book-consultation",
        "http://127.0.0.1:3211/hearing-aids-india",
      ],
      numberOfRuns: 1,
      settings: {
        preset: "desktop",
        chromeFlags: "--headless=new --no-sandbox --disable-dev-shm-usage",
      },
    },
    assert: {
      assertions: {
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],
        "categories:performance": ["warn", { minScore: 0.65 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 4000 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./test-results/lighthouse",
    },
  },
};
