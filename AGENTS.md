# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BT Servant Log Viewer is a fast, dark-themed, web-based log viewer for BT-Servant telemetry. It automatically loads the last 21 days of logs on startup, parses structured fields across multiple files, and provides unified filtering and analysis capabilities. The app focuses on extracting and surfacing critical AI/NLP workflow information including language detection, geo-location, message processing, intent detection, biblical references, and resource searches.

**Key Features:**

- **Multi-file support**: Auto-loads last 21 days of logs on app open
- Parse BT-Servant logs into normalized entries with structured fields
- Extract and surface critical fields: language codes, IP→Region mapping (when present), messages (original/preprocessed/final), intents, biblical references, searched resources
- Filter by level, logger, correlation ID, trace ID, intent, language, region, **user ID** across all loaded files
- Visualize performance reports with spans, token usage, and cost breakdowns
- Timeline views, waterfall charts, duration histograms
- Export filtered data as JSON/CSV with optional gzip compression
- Live tail support for real-time monitoring (Phase 3)

## Technology Stack

### Frontend

- **Framework:** SvelteKit (with TypeScript strict mode)
- **Styling:** Tailwind CSS + shadcn-svelte components
- **Theme:** Dark/techy theme (matching ChessCoachAI style)
- **Testing:** Vitest + Testing Library + Playwright (E2E)

### Backend

- **Runtime:** Node.js 22+
- **Framework:** Fastify (API server)
- **Validation:** Zod for typed route validation
- **Architecture:** Clean/Onion/Hexagonal with ports & adapters

### Infrastructure

- **Monorepo:** pnpm + Turborepo
- **Deployment:** Docker + Fly.io (staging/prod)
- **CI/CD:** GitHub Actions with strict quality gates
- **GeoIP:** MaxMind GeoLite2 or similar for IP→Region mapping

## Architecture (Clean/Onion/Hexagonal)

### Layers

- **Domain:** Pure TypeScript types and logic (LogEntry, PerfReport, Span, Trace, Intent)
- **Application:** Use cases (ParseLog, IndexLog, QueryEntries, GetTrace, ExportSlice)
- **Ports:** Interfaces for external dependencies
- **Adapters:** Concrete implementations (parsers, storage, GeoIP, HTTP)
- **Drivers:** SvelteKit app, Fastify API, DI wiring

### Monorepo Structure

```
apps/
  web/             # SvelteKit UI application
  api/             # Fastify parsing/index API
packages/
  domain/          # Pure types & business logic
  app/             # Use cases wired to ports
  adapters/        # Parsing, index, storage, http, geoip
tooling/           # Linting, dependency checking, forbidden patterns
infra/             # Docker, fly.toml, GitHub Actions
tests/
  fixtures/        # Sample logs (golden files)
  e2e/             # Playwright tests
```

### Dependency Rules (Enforced)

- `domain` → nothing
- `app` → `domain` only
- `adapters/*` → `app|domain` (no UI imports)
- `web` → `app` (no direct adapter imports)
- `api` → `app|adapters` (no web imports)

## Quality Standards (Zero-Warning Policy)

**CRITICAL:** This project enforces a strict zero-warning policy. Never suppress warnings, disable rules, or use @ts-ignore.

### Enforced Rules

- TypeScript: `strict: true`, `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`
- ESLint: `--max-warnings=0`, no `eslint-disable` comments allowed
- Import boundaries: Enforced via eslint-plugin-boundaries + dependency-cruiser
- Dead code detection: knip in CI
- Forbidden patterns: No `console.*`, `@ts-ignore`, `eslint-disable` in app code
- Pre-commit hooks: husky + lint-staged for all checks
- Test requirements: No `.only`, coverage gates enforced

### Verification Commands

```bash
pnpm verify           # Run all checks
pnpm typecheck        # TypeScript type checking
pnpm lint             # ESLint with zero warnings
pnpm arch             # Dependency architecture validation
pnpm test             # Unit tests with coverage
pnpm test:e2e         # Playwright E2E tests
pnpm scan:forbidden   # Check for forbidden patterns
```

## Git Commit Guidelines

**IMPORTANT:** All commits made by Codex must follow these conventions:

### Commit Author

- **Author:** `Codex Assistant <noreply@openai.com>`
- **NO Co-Authored-By:** Do not include co-author lines

### Commit Message Format

All commit messages must:

1. **Prefix title with `(CODEX)`:**

   ```
   (CODEX) feat: add user filtering support
   (CODEX) fix: resolve parser edge case with malformed JSON
   (CODEX) docs: update API specification
   ```

2. **Commit description body is MANDATORY (no exceptions):**
   - A commit without a description body is strictly forbidden—stop and write one before committing.
   - Explain WHAT changed and WHY.
   - Include relevant context, testing notes, or breaking changes.

   ✅ **Good:**

   ```
   (CODEX) feat: add language filter to log viewer

   Added language code filtering to the sidebar, allowing users to
   filter entries by detected language (en, es, fr, etc.). The filter
   uses the extracted language_code field from the parser.

   Testing:
   - Verified with golden files containing multiple languages
   - E2E test added for language filter interaction
   ```

   ❌ **Bad:**

   ```
   (CODEX) feat: add language filter

   [No description body - THIS VIOLATES PROJECT RULES]
   ```

3. **Use conventional commit format:**
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `refactor:` for code refactoring
   - `test:` for test additions/changes
   - `chore:` for tooling/config changes

### Example Commit

```bash
git commit -m "$(cat <<'EOF'
(Claude) fix: handle missing correlation IDs in parser

The parser now gracefully handles log entries without correlation IDs
by setting cid to null instead of failing. This resolves parsing errors
when processing older log files that don't include cid fields.

Testing:
- Added test case for log entries without cid
- Verified with production logs from 2024-Q1
EOF
)"
```

## Log Parsing Specifications

### Log Format

```
[YYYY-MM-DD HH:MM:SS] [LEVEL] [logger.module.path] [cid=correlation_id]: message
```

Example:

```
[2025-10-15 20:28:48] [INFO] [bt_servant_engine.apps.api.routes.webhooks] [cid=466256e...]: text message from ... received.
```

### Critical Extractions

The parser must extract these fields when present (all fields are optional and handled gracefully):

1. **Language code:** Detected language (e.g., `en`, `es`)
2. **IP → Region/Country:** GeoIP lookup for client locations (country-level resolution)
3. **Messages:**
   - Original message (as received from user)
   - Preprocessed/normalized message
   - Final message (sent back to user)
4. **Intents:** List of detected intents - both known (13 predefined) and dynamically discovered
5. **Biblical references:** Extract references like "Gen 1:3-5" (NOT the actual text)
6. **Resources searched:** For translation assistance flows
7. **User ID:** For filtering all activity by specific user across files

### PerfReport JSON Blocks

Multi-line JSON blocks starting with `PerfReport {`:

- Capture using balanced brace parsing
- Contains: trace_id, total_ms, spans[], token counts, costs, grouped_totals_by_intent
- Parse tolerantly; attach raw if malformed
- Handle all fields as optional

### Known Intents

The system recognizes 13 known intents (with potential for dynamic discovery of new ones):

- `get-bible-translation-assistance`
- `consult-fia-resources`
- `get-passage-summary`
- `get-passage-keywords`
- `get-translation-helps`
- `retrieve-scripture`
- `listen-to-scripture`
- `translate-scripture`
- `perform-unsupported-function`
- `retrieve-system-information`
- `set-response-language`
- `set-agentic-strength`
- `converse-with-bt-servant`

## Development Workflow

### Initial Setup

```bash
# Install dependencies
pnpm install

# Run development servers
pnpm dev          # Both web and API
pnpm dev:web      # Frontend only
pnpm dev:api      # Backend only

# Run all quality checks
pnpm verify       # Must pass before any commit
```

### BT-Servant Integration

The log viewer requires API endpoints on the BT-Servant application:

```python
# Required endpoints to add to BT-Servant:
GET /api/logs/files          # List available log files
GET /api/logs/files/{name}   # Download specific log file
GET /api/logs/recent?days=21 # Get files from last N days
```

### Key Implementation Priorities

1. **Multi-File Loading:**
   - Auto-load last 21 days of logs on app open
   - Progress bar showing file-by-file loading status
   - BT-Servant API client for fetching logs
   - Web Workers for non-blocking parsing

2. **Parser Development:**
   - Header line regex parsing with error recovery
   - Balanced-brace JSON capture for PerfReport blocks
   - All derived field extractors (handle missing fields gracefully)
   - Golden-file tests with fixtures from actual logs

3. **UI Components:**
   - Date range selector with presets (Last 7/21/30 days)
   - Virtualized log entry table (handle 100k+ entries)
   - Filter sidebar for level/logger/cid/user/intent/language/region
   - Detail pane showing all extracted fields
   - Timeline/waterfall view for traces

4. **Performance Targets:**
   - 21 days of logs (~200MB) loads < 10s
   - Parse 10MB file < 2s (using Web Workers)
   - Filter/search response < 200ms
   - Render 100k+ entries smoothly with virtualization
   - Trace view render < 500ms (P95)
   - Switch to SQLite at 100MB cumulative

## Testing Requirements

### Unit Tests

- Parser functions with edge cases
- Domain logic with property-based testing
- Use golden files from `tests/fixtures/`

### Integration Tests

- API endpoints with various payloads
- File upload and parsing pipeline
- Export functionality

### E2E Tests

- Critical user journeys
- File upload → parse → filter → export
- Performance benchmarks

## Deployment

The project uses Fly.io for automatic deployments via GitHub Actions. See [docs/fly-io-setup.md](./docs/fly-io-setup.md) for complete setup instructions.

### Deployment Environments

- **Production** (`main` branch) → `bt-log-viewer.fly.dev`
- **Staging** (`develop` branch) → `bt-log-viewer-staging.fly.dev`
- **Preview** (`phase-*`, `bot-*` branches) → `bt-log-viewer-{branch-name}.fly.dev`

### Quick Start

1. Set up `FLY_API_TOKEN` secret in GitHub repository settings (see fly-io-setup.md)
2. Push to any branch:
   - `main` → Production deployment
   - `develop` → Staging deployment
   - `phase-*` or `bot-*` → Preview deployment

### Bot Competition Workflow

For comparing different bot implementations:

```bash
# Bot 1 works on phase-1a branch
git checkout phase-1a
git push origin phase-1a
# Auto-deploys to: https://bt-log-viewer-phase-1a.fly.dev

# Bot 2 works on bot-2-attempt branch
git checkout bot-2-attempt
git push origin bot-2-attempt
# Auto-deploys to: https://bt-log-viewer-bot-2-attempt.fly.dev

# Compare both URLs in browser
```

Preview apps use single-instance deployments to minimize costs and remain active until manually deleted.

## Common Tasks

### Adding a New Parser Field

1. Update domain types in `packages/domain/`
2. Add extraction logic in `packages/adapters/parser/`
3. Add golden-file test cases
4. Update UI to display new field
5. Run `pnpm verify` to ensure no regressions

### Creating a New Filter

1. Add filter type to domain model
2. Implement indexing in adapter
3. Add API query parameter
4. Create UI filter component
5. Add E2E test for filter workflow

## Important Notes

- **No console logging:** Use structured logging with proper logger instances
- **No any types:** Everything must be properly typed
- **No disabled lints:** Fix the issue, don't suppress it
- **Test everything:** Parser changes require golden-file updates
- **Maintain boundaries:** Respect architectural layers
- **Performance first:** This is a performance-critical application

## Phase 0 Deliverables (Scaffold)

When setting up the initial scaffold:

1. Monorepo structure with pnpm workspaces
2. SvelteKit app with Tailwind + shadcn-svelte
3. Fastify API with health check endpoint
4. Domain/app/adapter packages with initial ports
5. Complete tooling setup (ESLint, Prettier, dependency-cruiser)
6. Git hooks and CI/CD pipelines
7. Docker builds for both apps
8. Fly.io deployment configurations

## References

- PRD: `/docs/prd.md` (v0.3 - Enhanced with multi-file support)
- Example logs: `/docs/example_bt_servant.log`
- Architecture decisions: See PRD section 6
- Quality gates: See PRD section 9
- Data model: See PRD section 13
- API specifications: See PRD section 8
- Known intents: See PRD section 7
- Performance targets: See PRD section 10
