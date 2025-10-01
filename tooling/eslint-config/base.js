import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";
import onlyWarn from "eslint-plugin-only-warn";
import drizzlePlugin from "eslint-plugin-drizzle";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
      drizzle: drizzlePlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "drizzle/enforce-delete-with-where": [
        "error",
        { drizzleObjectName: ["adminDB", "clientDB", "db"] },
      ],
      "drizzle/enforce-update-with-where": [
        "error",
        { drizzleObjectName: ["adminDB", "clientDB", "db"] },
      ],
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    files: ["**/scripts/**/*"],
    rules: {
      "no-console": "off",
    },
  },
  {
    ignores: ["dist/**"],
  },
];
