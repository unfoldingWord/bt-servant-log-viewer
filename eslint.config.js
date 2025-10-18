// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import sveltePlugin from "eslint-plugin-svelte";
import svelteParser from "svelte-eslint-parser";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.svelte-kit/**",
      "**/build/**",
      "**/.turbo/**",
      "**/.pnpm-store/**",
      "**/tooling/**/*.js",
      "**/*.config.ts",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  ...sveltePlugin.configs["flat/recommended"],
  ...sveltePlugin.configs["flat/prettier"],
  prettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".svelte"],
      },
    },
  },
  {
    // Disable type-aware linting for JS files (including this config file)
    files: ["**/*.js"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    // Apply strict rules only to TypeScript files
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Zero-warning policy: No escape hatches
      "no-console": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": true,
          "ts-nocheck": true,
          "ts-check": false,
          minimumDescriptionLength: 10,
        },
      ],

      // Strict TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",

      // Code quality
      "no-debugger": "error",
      "no-alert": "error",
      eqeqeq: ["error", "always"],
      "prefer-const": "error",
      "no-var": "error",
    },
  },
  {
    // Svelte files configuration
    files: ["**/*.svelte"],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      // Svelte-specific
      "svelte/no-at-html-tags": "error",
      "svelte/no-target-blank": "error",
      "svelte/button-has-type": "error",
    },
  }
);
