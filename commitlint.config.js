export default {
  extends: ["@commitlint/config-conventional"],
  parserPreset: {
    parserOpts: {
      // Custom parser to handle "(Claude)" prefix
      // Pattern: (Claude) type(scope): subject
      headerPattern: /^\(Claude\) (\w+)(?:\(([^)]*)\))?: (.+)$/,
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
