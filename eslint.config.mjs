import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // The app currently uses client-side effects for data synchronization.
      // These React Compiler diagnostics are intentionally not enforced until
      // those flows are migrated to server/cache-driven data primitives.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/static-components": "off",

      // Existing legacy/UI code still relies on dynamic records and native
      // image elements in a few places. TypeScript remains the authoritative
      // type-safety gate via `pnpm typecheck`.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "supabase/.temp/**",
  ]),
]);

export default eslintConfig;
