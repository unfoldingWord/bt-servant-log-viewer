# Contributing

Thank you for contributing to BT Servant Log Viewer! This guide will help you get started.

## Code of Conduct

Be respectful, professional, and collaborative. No harassment, discrimination, or toxic behavior.

## Getting Started

### Prerequisites

- **Node.js**: ≥22.0.0
- **pnpm**: ≥9.0.0
- **Git**: Latest version

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/bt-servant-log-viewer.git
cd bt-servant-log-viewer

# Install dependencies
pnpm install

# Run verification to ensure everything works
pnpm verify
```

### Development Workflow

```bash
# Start development servers (web + API)
pnpm dev

# Run type checking
pnpm typecheck

# Run linting (zero warnings!)
pnpm lint

# Fix linting issues automatically
pnpm lint:fix

# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Format code
pnpm format

# Validate architecture
pnpm arch

# Detect dead code
pnpm knip

# Run ALL quality checks
pnpm verify
```

## Code Quality Standards

### Zero-Warning Policy

**Absolutely forbidden**:

- `// eslint-disable` comments
- `@ts-ignore` (use `@ts-expect-error` with description if truly needed)
- `@ts-nocheck`
- `console.*` statements (except API server logging)

Pre-commit hooks will reject commits with these patterns.

### TypeScript

- Use **strict mode** (already configured)
- **Explicit return types** on all functions
- **No `any` types** (use `unknown` if needed)
- Handle `undefined` with optional chaining: `obj?.prop`

Example:

```typescript
// ✅ Good
function parseTimestamp(raw: string): Date | undefined {
  const parsed = Date.parse(raw);
  return isNaN(parsed) ? undefined : new Date(parsed);
}

// ❌ Bad
function parseTimestamp(raw: string) {
  return new Date(raw);
}
```

### Testing

- **Unit tests** for all business logic (`.test.ts` or `.spec.ts`)
- **E2E tests** for user flows (`apps/web/tests/e2e/`)
- Aim for >80% code coverage
- Test both happy paths and error cases

Example test:

```typescript
import { describe, expect, it } from "vitest";
import { parseLogEntry } from "./parser";

describe("parseLogEntry", () => {
  it("should parse valid log entry", () => {
    const raw = '{"ts":"2025-01-01T00:00:00Z","level":"INFO"}';
    const result = parseLogEntry(raw);
    expect(result).toMatchObject({
      level: "INFO",
      ts: new Date("2025-01-01T00:00:00Z"),
    });
  });

  it("should return undefined for invalid JSON", () => {
    const result = parseLogEntry("not json");
    expect(result).toBeUndefined();
  });
});
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>

[optional body]

[optional footer]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions or fixes
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Maintenance tasks

Examples:

```
feat: add multi-file log loading
fix: correct timestamp parsing in perf reports
docs: update architecture diagram
test: add E2E tests for mobile viewport
```

## Architecture Guidelines

We follow **Clean/Onion/Hexagonal Architecture**:

1. **Domain** (`packages/domain`): Pure types, no dependencies
2. **App** (`packages/app`): Ports and use cases
3. **Adapters** (`packages/adapters`): Implementations
4. **Workers** (`packages/workers`): Web Workers
5. **Apps** (`apps/*`): Entry points

**Key rule**: Dependencies point inward. Domain has ZERO dependencies.

Validate with:

```bash
pnpm arch
```

See `docs/ARCHITECTURE.md` for details.

## Mobile-First Design

**Critical**: This tool must work on mobile phones (320px+).

When adding UI:

- Test at 320px width (iPhone SE)
- Touch targets ≥44x44px
- Use responsive Tailwind classes
- Test with `pnpm test:e2e` (includes mobile viewports)

## Pull Request Process

1. **Create a branch**:

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make changes**:
   - Write code following standards above
   - Add tests
   - Update documentation if needed

3. **Verify locally**:

   ```bash
   pnpm verify
   ```

4. **Commit changes**:

   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

   (Pre-commit hooks will run automatically)

5. **Push to GitHub**:

   ```bash
   git push origin feat/your-feature-name
   ```

6. **Open Pull Request**:
   - Describe what you changed and why
   - Link any related issues
   - Ensure CI checks pass

7. **Address review feedback**:
   - Make requested changes
   - Push updates to the same branch
   - Respond to comments

8. **Merge**:
   - Maintainer will merge once approved
   - Delete your branch after merge

## Project Phases

We're currently in **Phase 0: Scaffold**.

See `docs/prd.md` for the full roadmap:

- **Phase 0**: Scaffold and tooling ✅
- **Phase 1a**: UI shell with mock data (bot competition)
- **Phase 1b**: Backend integration
- **Phase 2**: Parser implementation
- **Phase 3**: Search and filtering
- **Phase 4**: Multi-file support
- **Phase 5**: Visualization

Check the current phase before starting work to ensure alignment.

## Need Help?

- **Documentation**: Check `docs/` directory
- **Architecture**: Read `docs/ARCHITECTURE.md`
- **Agent Guide**: Read `docs/AGENTS.md`
- **PRD**: Read `docs/prd.md`
- **Issues**: Open a GitHub Issue

## License

By contributing, you agree that your contributions will be licensed under the project's license.
