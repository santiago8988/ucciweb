import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Plain Node scripts (CommonJS) run by hand, e.g. node db/verify-readonly.js.
  {
    files: ["db/**/*.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Prisma client output (generated, not authored).
    "src/generated/**",
    // Audit evidence (one-off analysis scripts) and local tool state.
    "auditoria/**",
    ".claude/**",
    "test-results/**",
    "playwright-report/**",
  ]),
]);

export default eslintConfig;
