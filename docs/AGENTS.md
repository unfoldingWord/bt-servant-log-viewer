# Guide for AI Agents

This document provides guidance for AI coding assistants (Claude, Cursor, etc.) working on this codebase.

## Project Overview

BT Servant Log Viewer is a fast, mobile-first web app for viewing and analyzing BT-Servant telemetry logs. See `docs/prd.md` for full requirements.

## Architecture

We follow **Clean/Onion/Hexagonal Architecture**:

```
Domain (core types) ← App (ports) ← Adapters (implementations) ← Apps (drivers)
                           ↑
                        Workers
```

**Critical**: Always respect layer boundaries. Domain has NO dependencies. Use `pnpm arch` to validate.

## Code Quality Standards

### Zero-Warning Policy

**Absolutely forbidden**:

- `// eslint-disable` comments
- `@ts-ignore` (use `@ts-expect-error` with 10+ char description if needed)
- `@ts-nocheck`
- `console.*` statements (except in API logging via Fastify)

Pre-commit hooks enforce this. If you try to commit forbidden patterns, the commit will fail.

### TypeScript

All code uses **strict mode**:

```typescript
// tsconfig.base.json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

**All function signatures must have explicit return types**:

```typescript
// ❌ Bad
function parseLog(content: string) {
  return JSON.parse(content);
}

// ✅ Good
function parseLog(content: string): LogEntry {
  return JSON.parse(content);
}
```

### Testing

- **Unit tests**: Vitest (`.test.ts` or `.spec.ts`)
- **E2E tests**: Playwright (`apps/web/tests/e2e/`)
- All new features require tests
- Run `pnpm test` and `pnpm test:e2e`

## Mobile-First Design

**THIS IS CRITICAL**: If it doesn't work on a phone during a 3am incident, it's not production-ready.

### Responsive Breakpoints

```typescript
// Tailwind config
{
  xs: '320px',   // iPhone SE
  sm: '640px',   // Large phones
  md: '768px',   // Tablets
  lg: '1024px',  // Desktops
  xl: '1280px'   // Large desktops
}
```

### Touch Targets

- Minimum: 44x44px (iOS guideline)
- Spacing between targets: ≥8px
- Use `touch-action` CSS for gestures

### Performance Targets

- Initial load: <3s on 3G
- Time to Interactive: <5s
- Log parsing: <2s for 10MB file

## Development Workflow

### Before Starting Work

1. Pull latest changes: `git pull origin main`
2. Install dependencies: `pnpm install`
3. Check everything works: `pnpm verify`

### While Coding

- Run dev servers: `pnpm dev`
- Type check continuously: `pnpm typecheck --watch`
- Lint: `pnpm lint` (zero warnings!)
- Test: `pnpm test --watch`

### Before Committing

Pre-commit hooks run automatically, but manually verify:

```bash
pnpm format:check
pnpm typecheck
pnpm lint
pnpm test
pnpm arch       # Validates architecture boundaries
pnpm knip       # Detects dead code
```

### Commit Messages

Follow Conventional Commits:

```
feat: add multi-file log loading
fix: correct timestamp parsing for perf reports
docs: update architecture diagrams
test: add E2E tests for mobile viewport
```

## Common Tasks

### Adding a New Log Field

1. Update `packages/domain/src/types/log-entry.ts`
2. Mark field as optional: `newField?: string`
3. Update parser in `packages/adapters/src/parser/`
4. Add tests for parsing
5. Update UI to display the field

### Creating a New Use Case

1. Define port interface in `packages/app/src/ports/`
2. Add use case logic in `packages/app/src/use-cases/`
3. Implement adapter in `packages/adapters/src/`
4. Wire up in app (`apps/web/` or `apps/api/`)
5. Add unit tests for port and adapter

### Adding a New Route

For SvelteKit (`apps/web`):

```
apps/web/src/routes/
  +page.svelte              # Home: /
  logs/
    +page.svelte            # Logs list: /logs
    [fileId]/
      +page.svelte          # Single log file: /logs/abc123
```

## Known Intents

The system recognizes 13 bot intents (see `docs/prd.md` Section 2.3):

1. `ping` - Health check
2. `roll` - Dice roll
3. `joke` - Fetch joke
4. `fact` - Fetch fact
5. `trivia` - Trivia question
6. `weather` - Weather query
7. `time` - Time query
8. `reminder` - Set reminder
9. `translate` - Translation
10. `define` - Word definition
11. `calculate` - Math calculation
12. `wikipedia` - Wikipedia search
13. `UNKNOWN` - Unrecognized intent

All intent fields in `LogEntry` are optional to handle partial log parsing gracefully.

## Debugging Tips

### Parser Issues

- Check `apps/web/src/lib/test-logs/` for example logs
- Use `ParseWorker` to avoid blocking main thread
- All derived fields should be optional

### UI Issues on Mobile

- Test in Chrome DevTools mobile emulation
- Use `pnpm test:e2e` to run Playwright tests on mobile viewports
- Remember: minimum width is 320px (iPhone SE)

### Build Failures

- Check Turborepo cache: `rm -rf .turbo && pnpm build`
- Verify TypeScript: `pnpm typecheck`
- Check architecture: `pnpm arch`

## Resources

- **PRD**: `docs/prd.md` - Full product requirements
- **API Spec**: `docs/bt-servant-log-api-spec.md` - BT-Servant integration
- **Architecture**: `docs/ARCHITECTURE.md` - Detailed architecture
- **Example Logs**: `apps/web/src/lib/test-logs/` - Sample log files

## Getting Help

- Check existing issues: GitHub Issues
- Read the PRD: Most answers are in `docs/prd.md`
- Verify architecture: `pnpm arch`
- Run full validation: `pnpm verify`
