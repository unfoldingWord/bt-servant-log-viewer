// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: ["node_modules/**", "dist/**", ".turbo/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
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
      // Zero-warning policy: Domain layer is pure and has no escape hatches
      "no-console": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": true,
          "ts-nocheck": true,
          minimumDescriptionLength: 10,
        },
      ],

      // Strict TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",

      // Domain purity
      "no-restricted-imports": [
        "error",
        {
          patterns: [".*"],
        },
      ],
    },
  }
);
