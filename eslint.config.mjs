import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "azure-functions/dist/**",
    ".lighthouseci/**",
    "playwright-report/**",
    "test-results/**",
    ".azure-deploy-*/**",
    "next-env.d.ts",
  ]),
]);
