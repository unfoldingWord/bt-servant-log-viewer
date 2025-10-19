export default {
  extends: ["@commitlint/config-conventional"],
  parserPreset: {
    parserOpts: {
      // Custom parser to handle "(Claude)" or "(CODEX)" prefix
      // Pattern: (Claude|CODEX) type(scope): subject
      headerPattern: /^\((?:Claude|CODEX)\) (\w+)(?:\(([^)]*)\))?: (.+)$/,
      headerCorrespondence: ["type", "scope", "subject"],
    },
  },
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
      ],
    ],
    "subject-case": [2, "never", ["upper-case"]],
    "header-max-length": [2, "always", 100],
  },
};
