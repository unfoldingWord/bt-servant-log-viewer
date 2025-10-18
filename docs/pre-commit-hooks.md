# Pre-Commit Hooks Configuration

This document explains the pre-commit hook setup that ensures code quality before commits reach CI.

## What Gets Checked Pre-Commit

The pre-commit hook runs three stages:

1. **lint-staged** - processes only the files you're committing (fast and focused)
2. **typecheck** - runs full TypeScript/Svelte type checking across the entire project
3. **knip** - detects unused files, exports, and dependencies across the entire project

### File Type Processing (lint-staged)

#### TypeScript/JavaScript/Svelte Files (`*.{ts,tsx,js,jsx,svelte}`)

1. **ESLint** with `--fix` and `--max-warnings=0` (zero-warning policy)
2. **Prettier** formatting
3. **Forbidden pattern scanning** (checks for eslint-disable comments, console.log, etc.)

#### Configuration Files (`*.{json,md,yml,yaml}`)

1. **Prettier** formatting only

#### Package.json

1. **Prettier** formatting (separate rule to ensure it's always formatted)

## How It Works

1. You stage files with `git add`
2. You run `git commit`
3. **Pre-commit hook** automatically runs:
   - Runs lint-staged on all staged files
   - Fixes issues automatically where possible (ESLint --fix, Prettier --write)
   - Runs full typecheck (`pnpm typecheck`) across entire project
   - Runs knip (`pnpm knip`) to detect unused code
   - Fails the commit if there are unfixable issues, type errors, or unused code
4. **Commit-msg hook** validates commit message format

## What Gets Caught

✅ **Caught and Auto-Fixed:**

- Code formatting issues (Prettier)
- Auto-fixable lint errors (missing semicolons, etc.)
- Import sorting

✅ **Caught and Blocks Commit:**

- ESLint errors that can't be auto-fixed
- TypeScript/Svelte type errors (via `pnpm typecheck`)
- Unused files, exports, or dependencies (via `pnpm knip`)
- Forbidden patterns (eslint-disable comments, console.log, debugger statements)
- Invalid commit message format

## Bypassing (Emergency Only)

If you absolutely must bypass the hooks (NOT recommended):

```bash
git commit --no-verify -m "message"
```

**Warning:** This bypasses ALL hooks including forbidden pattern checks. Only use in emergencies.

## Common Issues

### "No files match" warning

This is normal - it means none of your staged files match that pattern.

### Prettier formatting fails

Usually means there's a syntax error. Check the file for issues.

### ESLint --max-warnings=0 fails

You have warnings in your code. Fix them or they'll fail in CI anyway.

### Forbidden pattern detected

You have a pattern that's not allowed (like `eslint-disable`). Remove it or use proper solutions.

## CI Alignment

The pre-commit checks match exactly what CI runs:

- **Verify**: `turbo run typecheck lint test arch knip`
- **Format Check**: `prettier --check`
- **Build**: Production build test

This ensures if your commit passes pre-commit hooks, it should pass CI.

## Maintenance

The configuration lives in:

- `.husky/pre-commit` - Runs lint-staged, typecheck, and knip
- `.husky/commit-msg` - Validates commit messages
- `package.json` → `lint-staged` section - Defines what runs on which files
- `knip.json` - Configures unused code detection

To modify what runs pre-commit:

- Edit the `lint-staged` section in root `package.json` for file-based checks
- Edit `.husky/pre-commit` to add/remove project-wide checks like typecheck and knip
- Edit `knip.json` to configure which files/exports are considered used
