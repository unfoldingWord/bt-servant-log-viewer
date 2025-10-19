# BT Servant Log Viewer — PRD v0.7

**Owner:** Ian Lindsley
**Date:** 2025-10-18
**Status:** Phase 1a Complete (UI with Mock Data) → Phase 1b Starting (Data Integration)
**Guiding Style:** _Zero-warning policy_, clean/onion/hexagonal architecture, same UI stack & dark/techy theme as ChessCoachAI.

---

## 1) TL;DR

Build **BT Servant Log Viewer** — a fast, dark-themed, web-based log viewer for BT-Servant telemetry. It automatically loads the last 21 days of logs on startup, parses **JSON-formatted log entries** (one JSON object per line), extracts all structured fields including embedded **PerfReport** data, and surfaces filters, timelines, search, and cost/latency analytics. **Key extractions** are first-class UI citizens and have dedicated UI elements:

1. **Language code detected** (from `language detection (model): en` messages)
2. **IP → Region/Country** (GeoIP lookup from `client_ip` field)
3. **Original message** (from preprocessing logs)
4. **Preprocessed/normalized message** (from preprocessing logs)
5. **Intents detected** (from `extracted user intents:` messages)
6. **Final message returned to the user** (from `Response from bt_servant:`)
7. **User ID** (from `user` field for filtering all activity)
8. **Biblical references** (e.g., "John 4:1-3" from passage selection)
9. **Resources searched** (for translation assistance flows)
10. **PerfReport data** (token usage, costs, spans, timing from embedded JSON)

From day zero: **strict typing**, **linting**, **import boundaries**, **tests**, **pre-commit**, and **CI/CD** to Fly.io — **no warnings suppressed, ever**. A **companion scaffold** (monorepo layout, strict configs, CI, Fly stubs, parser skeleton, **golden-file tests**) is included as Phase 0 deliverable.

---

## 2) Goals & Non-Goals

### Goals

- **Mobile-first responsive design**: Full functionality on ALL devices (phones, tablets, desktops) with touch-optimized UI.
- **Multi-file support**: Auto-load last 21 days of logs on app open; allow date range adjustment.
- Parse BT-Servant logs into a normalized model (entries, spans, traces, intents, language, geo, messages, references, searched resources).
- Provide instant, responsive UX across all screen sizes: filter by **level/logger/cid/trace_id/intent/language/region/user**, full-text search, drill-down into **PerfReport** spans.
- Visualize **duration histograms**, **waterfall timelines**, **token/cost breakdowns**, **intent mix**, and **traffic by language/region**.
- Server-assisted log loading via API endpoints on BT-Servant.
- Same **SvelteKit + Tailwind + shadcn-svelte** stack and **dark/techy** theme as ChessCoachAI.
- **Node backend** (in-repo) for parsing/index/search API with **Web Workers** for non-blocking parsing.
- **Live tail** for real-time monitoring (Phase 3).
- **Quality gates** from day one: types, lint, imports/boundaries, dead-code, tests, e2e, Docker build, Fly deploy.

### Non-Goals (v1)

- Auth/SSO, multi-tenant access control (but architecture prepared for future).
- Heavy distributed ingestion/streaming pipeline.
- Editing logs; logs remain read-only artifacts.
- Real-time log aggregation from multiple servers.

---

## 3) Sample Log Format (JSON Lines)

### JSON Log Entry Format

Each line in the log file is a complete JSON object with the following structure:

```json
{
  "message": "text message from kwlv1sXnUvYT9dnn with id wamid.HBgLMTQ0Mz... received.",
  "client_ip": "2a03:2880:12ff:70::",
  "taskName": "Task-4",
  "timestamp": "2025-10-18 23:08:31",
  "level": "INFO",
  "logger": "bt_servant_engine.apps.api.routes.webhooks",
  "cid": "5d0101ac8cf34fb5949217328533ccb3",
  "user": "kwlv1sXnUvYT9dnn"
}
```

Key fields in each JSON entry:

- **`timestamp`**: ISO-format timestamp (YYYY-MM-DD HH:MM:SS)
- **`level`**: Log level (TRACE, DEBUG, INFO, WARN, ERROR)
- **`logger`**: Module path (e.g., bt_servant_engine.services.preprocessing)
- **`cid`**: Correlation ID for request tracing
- **`user`**: User identifier (or "-" if not applicable)
- **`client_ip`**: Client IP address (IPv4 or IPv6, or "-" if not available)
- **`taskName`**: Async task identifier (or null)
- **`message`**: Log message content (may contain structured data)

### PerfReport Embedded in Message Field

When a PerfReport is logged, it appears as a JSON entry where the `message` field contains the string "PerfReport " followed by the JSON performance data:

```json
{
  "message": "PerfReport {\n   \"user_id\":\"kwlv1sXnUvYT9dnn\",\n   \"trace_id\":\"wamid.HBgLMTQ0Mzg2NzMzNjgVAgASGBQzRkU5MTZEOEZEMjRGNzlBQzM2NgA=\",\n   \"total_ms\":21337.01,\n   \"total_s\":21.34,\n   \"total_input_tokens\":9411,\n   \"total_output_tokens\":102,\n   \"total_tokens\":9513,\n   \"total_cost_usd\":0.024548,\n   \"grouped_totals_by_intent\":{...},\n   \"spans\":[...]}",
  "client_ip": "2a03:2880:12ff:70::",
  "taskName": "Task-5",
  "timestamp": "2025-10-18 23:08:50",
  "level": "INFO",
  "logger": "bt_servant_engine.apps.api.routes.webhooks",
  "cid": "5d0101ac8cf34fb5949217328533ccb3",
  "user": "kwlv1sXnUvYT9dnn"
}
```

### Key Message Patterns to Extract

From the `message` field, we extract structured data based on patterns:

1. **Language detection**: `"language detection (model): en"`
2. **Intents extracted**: `"extracted user intents: get-translation-helps"`
3. **Original vs preprocessed**: `"original_message: hello bt servant!\nnew_message: Hello, BT Servant!"`
4. **Response to user**: `"Response from bt_servant: [actual response text]"`
5. **Biblical references**: `"[selection-helper] ranges=[(4, 1, 4, 3)]"` → "John 4:1-3"
6. **Resources searched**: `"[translation-helps] selected 2 help entries"`
7. **PerfReport**: When message starts with `"PerfReport {"`, parse the embedded JSON

---

## 4) User Stories

- **Auto-load recent logs**: Open app and immediately see last 21 days of logs parsed and ready.
- **Triage errors quickly** by filtering `level=ERROR|WARN`, sorting by time.
- **Follow a trace** by `trace_id` and see spans, durations, and resulting messages.
- **Filter by user**: See all activity for a specific `user_id` across multiple files.
- **Audit NLP**: For a single entry, see **original message**, **preprocessed message**, **language**, **intents detected**, and **final message** side-by-side.
- **Geo & language insights**: top regions/countries and languages over a time slice.
- **Reference flow**: confirm which **biblical reference** was extracted for a message.
- **Translation assistance flow**: confirm **which resources were searched** for that request.
- **Export** a filtered slice (entries, spans, or a perf report) as JSON/CSV (with optional gzip compression) with reproducible query.
- **Monitor live logs**: tail running log files for real-time debugging and monitoring.
- **Performance analysis**: identify slowest traces, most expensive operations, token consumption patterns.

---

## 5) UX / UI (same theme as ChessCoachAI)

- **Theme**: Dark, techy (VS Code / Zulip / PyCharm dark). Near-black backgrounds (`#0f1115–#1a1d24`), dark greys (`#222–#2b2f36`), high-contrast text (`#e8edf2`), low-saturation cyan/teal/indigo accents, soft shadows, rounded-2xl, grid-first, keyboard-friendly.
- **Stack**: **SvelteKit + Tailwind + shadcn-svelte**; Playwright for E2E; Vitest + Testing Library for unit/UI.
- **Areas**:
  - **Initial Load**: Progress bar showing "Loading logs from last 21 days..." with file-by-file progress.
  - **Date Range Selector**: Adjust loaded date range (presets: Today, Last 7 Days, Last 21 Days, Last Month, Custom).
  - **Entries (virtualized table)** with filters: time, **level**, **logger**, **cid**, **user**, **language**, **region**, **intent**; quick search (powered by MiniSearch); badges: "perf", "intent", "reference", "resources".
  - **Right-pane Detail** (for one entry): **Original**, **Preprocessed**, **Language**, **Region/Country**, **Intents**, **Final Message**; JSON viewer for **PerfReport** and **spans**.
  - **Trace View**: waterfall timeline (spans), PV charts (tokens/cost), duration histograms.
  - **Intent Flow Visualization**: Interactive directed graph showing request processing pipeline:
    - Nodes represent processing steps (start, language detection, preprocessing, intent determination, intent handlers, response)
    - Color-coded by performance (green <100ms, yellow 100-500ms, red >500ms)
    - Node size indicates token usage/cost
    - Edges show flow with timing labels
    - Branching paths for multi-intent requests
    - Interactive: hover for details, click to expand logs, filter by performance
    - Graph libraries: React Flow (preferred) or Cytoscape.js
  - **Insights Dashboard**: top loggers, hottest spans, slowest traces, token/cost over time, **language/region distributions**, **intent mix**, error rate trends.
  - **Live Tail View**: real-time log streaming with auto-scroll, pause/resume, filter application.
- **Perf**: virtualized table for large datasets; indexed search; smooth filters; Web Worker-based parsing.
- **Deep-linking**: shareable URLs with query+filters.
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support.

---

## 5a) Mobile-First Responsive Design 🏁 CRITICAL REQUIREMENT

### Core Principle

**This app MUST work flawlessly on mobile phones.** Engineers need to debug issues on-the-go, often from their phones during incidents. Desktop is an enhancement, not the primary target.

### Responsive Breakpoints

- **320px+**: Minimum supported width (small phones)
- **640px+**: Standard mobile
- **768px+**: Tablets and large phones
- **1024px+**: Desktop
- **1280px+**: Wide desktop

### Mobile Layout (320-767px)

- **Single-column layout** with priority on content
- **Collapsible filters**: Slide-out drawer or bottom sheet
- **Card-based log entries**: Swipeable for actions
- **Entry details**: Full-screen modal or bottom sheet
- **Intent flow**: Vertical layout, pinch-to-zoom, pan gestures
- **Touch targets**: Minimum 44x44px for all interactive elements
- **Sticky headers**: Fixed search bar and filter button
- **Bottom navigation**: Primary actions within thumb reach

### Tablet Layout (768-1023px)

- **Two-column layout**: Filters + content
- **Persistent sidebar**: Collapsible filter panel
- **Split view**: List + detail view side-by-side
- **Modal overlays**: For complex interactions

### Desktop Layout (1024px+)

- **Three-column layout**: Filters + list + details
- **Full feature set**: All panels visible
- **Hover interactions**: Enhanced for mouse users
- **Keyboard shortcuts**: Power user features

### Touch Optimizations

- **Swipe gestures**:
  - Swipe right: Mark as read/dismiss
  - Swipe left: Show actions
  - Pull-to-refresh: Reload logs
- **Long press**: Context menu for entries
- **Pinch-to-zoom**: Intent flow diagrams
- **Touch feedback**: Visual response within 100ms
- **No hover-only features**: Everything accessible via touch

### Performance on Mobile

- **Initial bundle**: < 150KB JavaScript for mobile
- **Critical CSS**: Inline above-the-fold styles
- **Progressive enhancement**: Core features work on 3G
- **Service Worker**: Offline support and caching
- **Virtual scrolling**: REQUIRED for mobile performance

### Mobile-Specific Features

- **Responsive tables**: Transform to cards on mobile
- **Progressive disclosure**: Show summary, expand for details
- **Native-like navigation**: Smooth transitions, back gestures
- **Smart filtering**: Voice input for search on mobile
- **Adaptive UI**: Reduce visual complexity on small screens

### Testing Requirements

- **Real device testing**: iPhone SE, iPhone 14, Pixel 7, iPad
- **Network conditions**: 3G, 4G, offline scenarios
- **Orientation**: Both portrait and landscape
- **Touch simulation**: In all E2E tests

> **Remember**: If it doesn't work on a phone during a 3am incident, it's not production-ready.

---

## 6) Architecture (Clean/Onion/Hexagonal)

### Layers

- **Domain** (pure TS): `LogEntry`, `PerfReport`, `Span`, `Trace`, `Intent`, `LangCode`, `Region`, parsers, aggregations, validation rules.
- **Application** (use-cases): `ParseLog`, `IndexLog`, `QueryEntries`, `GetTrace`, `SummarizePerf`, `ExportSlice`, `TailLog`, `LoadDateRange`.
- **Ports**: `ParsingPort`, `IndexPort`, `QueryPort`, `StoragePort`, `GeoIpPort`, `CompressionPort`, `SearchPort`, `LogSourcePort`.
- **Adapters**: Node parsers (regex + JSON scanner), in-memory index or SQLite, file loader, GeoIP (e.g., **MaxMind GeoLite2** via `mmdb` adapter), SvelteKit adapter, MiniSearch adapter, gzip compression adapter, BT-Servant API client.
- **Drivers/Infra**: SvelteKit server routes (for backend logic), DI wiring, metrics, config, Web Workers orchestration.

### Monorepo (pnpm + Turborepo)

```
apps/
  web/             # SvelteKit UI (includes server routes for backend logic)
  api/             # Fastify reference implementation (development/testing only, not deployed)
packages/
  domain/          # pure types & logic
  app/             # use-cases wired to ports
  adapters/        # parsing, index, storage, http, geoip, search, compression
  workers/         # Web Worker implementations for parsing
tooling/           # dep-cruiser, forbidden-scan, etc.
infra/             # Dockerfiles, fly.toml, GH Actions
tests/fixtures/    # sample logs (golden files)
scripts/           # build, deploy, maintenance scripts
```

### Dependency Rules (fitness-checked)

- `domain` → nothing
- `app` → `domain`
- `adapters/*` → `app|domain` (no UI import)
- `workers` → `domain` only
- `web` → `app|workers` (no direct adapter imports)
- `api` → `app|adapters` allowed (no `web`)

---

## 7) Parser Spec (JSON Lines)

### JSON Line Parser

Each line is a complete JSON object that can be parsed directly:

```typescript
interface LogEntry {
  message: string;
  client_ip: string;
  taskName: string | null;
  timestamp: string; // "YYYY-MM-DD HH:MM:SS"
  level: "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR";
  logger: string;
  cid: string;
  user: string;
}
```

### PerfReport Extraction

When `message` field starts with "PerfReport {":

1. Extract substring from `"PerfReport {"` to the end
2. Parse as JSON (the braces are balanced within the message)
3. Type the extracted data with PerfReport interface
4. Attach to log entry as structured data

### Error Recovery Strategies

- **Invalid JSON lines**: Skip line, log as unparseable with line number
- **Malformed PerfReport JSON**: Store message as-is, flag as `perf_parse_error`
- **Missing required fields**: Use defaults (e.g., "-" for user, null for taskName)
- **Encoding issues**: Attempt UTF-8, fallback to Latin-1, mark as `encoding_warning`
- **Truncated files**: Process what's available, add warning in UI
- **Large message fields**: Truncate at reasonable limit (e.g., 10KB per message)

### Derived Fields (Pattern Matching in Message Field)

Extract structured data by matching patterns in the `message` field:

- **Language code** — Match `"language detection (model): {code}"` or `"language code {code} detected"`
- **Client IP → Region/Country** — Use `client_ip` field with **GeoIP** adapter (offline DB like **GeoLite2**). Store as `{country, region?, city?}`. Country-level resolution sufficient.
- **Original vs Preprocessed message** — Match `"original_message: {text}\nnew_message: {text}"` pattern
- **Intents detected** — Match `"extracted user intents: {intent1,intent2,...}"` pattern. Known intents:
  - `get-bible-translation-assistance` (Get Bible translation assistance)
  - `consult-fia-resources` (Consult FIA resources)
  - `get-passage-summary` (Summarize passage)
  - `get-passage-keywords` (Get keywords)
  - `get-translation-helps` (Get translation helps)
  - `retrieve-scripture` (Show scripture text)
  - `listen-to-scripture` (Read aloud)
  - `translate-scripture` (Translate to language)
  - `perform-unsupported-function` (Unsupported request)
  - `retrieve-system-information` (System info)
  - `set-response-language` (Set language)
  - `set-agentic-strength` (Set AI strength)
  - `converse-with-bt-servant` (General conversation)
- **Final message** — Match `"Response from bt_servant: {text}"` pattern
- **Biblical references** — Extract from `"[selection-helper] ranges="` or `"canonical_book={book}"` patterns
- **Resources searched** — Match `"[translation-helps] selected {n} help entries"` pattern

### Indexing & Storage Strategy

- **In-memory index** for cumulative size < 100MB (maps for `trace_id`, `cid`, `intent`, `lang`, `region`, `logger`, `user_id`)
- **SQLite persistence** for cumulative size > 100MB or > 100k entries
- **Hybrid mode**: Keep hot data in memory, cold in SQLite
- **Text search**: MiniSearch for full-text with fuzzy matching (Levenshtein distance ≤ 2)
- **Search scope**: Messages and logger names (not extracted fields in v1)
- **LRU cache**: 1000 most recent queries cached for 15 minutes

---

## 8) API Specifications

### A. Log Viewer API (SvelteKit Server Routes)

These endpoints are implemented as SvelteKit server routes (`+server.ts` files) within the `apps/web` application. All routes use `zod` for validation and maintain type safety throughout.

**Routes** (typed via `zod`):

- `GET /api/logs/load-range` → Auto-loads last 21 days on startup → `{ files: [], totalEntries, dateRange }`
- `POST /api/logs/ingest` → `{ files[], dateRange }` → `{ sessionId, counts, parseErrors[], estimatedTime }`
- `GET /api/logs/:sessionId/entries` (filters: level, logger, cid, user, **intent**, **lang**, **region**, q, range, limit, offset)
- `GET /api/logs/:sessionId/traces/:traceId` → Full trace with spans and metrics
- `GET /api/logs/:sessionId/traces/:traceId/flow` → Intent flow graph structure for visualization
  ```json
  {
    "nodes": [
      {
        "id": "start",
        "type": "start",
        "name": "brain:start_node",
        "duration_ms": 10,
        "tokens": 0,
        "cost_usd": 0
      },
      {
        "id": "intent_det",
        "type": "intent_detection",
        "name": "brain:determine_intents_node",
        "duration_ms": 245,
        "tokens": 150,
        "cost_usd": 0.003
      }
    ],
    "edges": [
      {
        "from": "start",
        "to": "intent_det",
        "duration_ms": 10,
        "label": "10ms"
      }
    ],
    "intents": ["retrieve-scripture", "get-translation-helps"],
    "total_duration_ms": 2145
  }
  ```
- `GET /api/logs/:sessionId/insights` (top loggers/spans/intents, token/cost over time, **lang/region distributions**)
- `GET /api/logs/:sessionId/export` (csv|json|jsonl; filters applied; gzip option)
- `GET /api/health` → System metrics (memory, parse queue, active workers)
- `GET /api/metrics` → Prometheus-compatible metrics endpoint
- `POST /api/logs/:sessionId/search` → Advanced search with query DSL

### B. BT-Servant Log Source API (Required)

**Status:** Fully specified in [`docs/bt-servant-log-api-spec.md`](./bt-servant-log-api-spec.md)

The BT-Servant application must implement log-serving endpoints. Complete implementation guide with FastAPI code examples available in the API specification document.

**Base Path:** `/api/logs`

**Core Endpoints:**

- `GET /api/logs/files` → List all `.log` files with metadata

  ```json
  {
    "files": [
      {
        "name": "bt_servant_2025-01-15.log",
        "size_mb": 8.2,
        "size_bytes": 8598456,
        "modified": "2025-01-15T23:59:59Z",
        "created": "2025-01-15T00:00:01Z",
        "line_count": 45000,
        "readable": true
      }
    ],
    "total_files": 23,
    "total_size_mb": 189.3
  }
  ```

- `GET /api/logs/files/{filename}` → Stream specific log file
  - Streaming support for large files (>10MB)
  - Optional gzip compression via `?compress=true`
  - Path traversal protection
  - Returns `404` if not found, `403` for invalid extensions

- `GET /api/logs/recent?days=21&max_files=100` → Get recent logs
  - `days`: default `7`, max `90`
  - `max_files`: default `100`, max `500`
  - Response format matches `/api/logs/files`

**Security & Performance:**

- Rate limiting: 60-100 requests/minute per endpoint
- Path traversal prevention with filename validation
- CORS configuration for log viewer domain
- Streaming responses to handle large files efficiently
- Optional compression for bandwidth optimization

**Integration Notes:**

- Auto-load last 21 days on app startup via `/api/logs/recent?days=21`
- Use Web Workers for non-blocking JSON parsing
- Cache file listings for 60 seconds
- Display progress bar during multi-file loading

### Rate Limiting

- **Global**: 1000 req/min per IP
- **Ingest**: 10 sessions/min, max 500MB total per session
- **Export**: 100 exports/hour
- **Search**: 500 searches/min

### Live Tail (Phase 3)

- `WS /api/logs/:sessionId/tail` → WebSocket connection for specific file
- Backpressure handling, automatic reconnection
- Filter application in real-time
- Maximum 10 concurrent tail sessions per client

---

## 9) Quality Gates (Zero-Warning Policy)

- **TS strict**: `strict`, `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`.
- **ESLint**: `--max-warnings=0`; forbid `eslint-disable`, `@ts-ignore`, `console.*` in app code.
- **Import rules**: `eslint-plugin-import`, `import/no-cycle`, `no-restricted-imports`, path-alias checks; **boundary lints** via `eslint-plugin-boundaries` _and_ `dependency-cruiser`.
- **Dead code**: `knip` in CI.
- **Security**: `pnpm audit`, `secretlint` for repo; no secrets in logs; CSP headers; input sanitization.
- **Performance**: Bundle size limits (< 200KB initial), Lighthouse CI (score > 90).
- **Tests**: Vitest (parser/adapters), Testing Library (UI), Playwright (e2e). No `.only`. Coverage gates (80% minimum).
- **Pre-commit**: husky + lint-staged (eslint, typecheck:fast, prettier, forbidden scan).
- **CI**: GH Actions matrix (typecheck, lint, unit, arch, knip, e2e, Docker build, security scan). `main` → Fly deploy (staging/prod).

> **Hard rule:** No warnings anywhere; no disabled rules. PRs failing any gate are rejected.

---

## 10) Performance Targets & Monitoring

### Parser Performance

- **10MB file**: < 2s (using Web Workers)
- **100MB cumulative**: < 15s (with progress updates)
- **1GB cumulative**: < 2min (SQLite mode)
- **21 days typical load**: < 10s for ~200MB of logs

### UI Performance

- **Initial load**: < 2s (FCP < 1s) on desktop, < 3s on 4G mobile
- **Filter application**: < 200ms on all devices
- **Search response**: < 200ms (P95)
- **Trace view render**: < 500ms (P95)
- **Intent flow diagram render**: < 300ms (including graph layout calculation)
- **Virtualized table**: 60fps scrolling with 100k+ entries
- **Touch response**: < 100ms visual feedback
- **Mobile Time to Interactive**: < 3s on 4G
- **Mobile bundle size**: < 150KB initial JavaScript

### Monitoring

- **Structured logs** (JSON format) with correlation IDs
- **OpenTelemetry** traces for request flows (optional)
- **Prometheus metrics**: parse_duration, query_latency, memory_usage
- **Error tracking**: Sentry integration (optional)
- **Performance monitoring**: Real User Monitoring (RUM)

---

## 11) Log Rotation Recommendations

For BT-Servant application:

- **Size-based rotation**: 10MB per file
- **Time-based rotation**: Also rotate daily regardless of size
- **Retention**: Keep last 90 days or last 100 files
- **Naming convention**: `bt_servant_YYYY-MM-DD_N.log` where N increments for multiple files per day
- **Compression**: Gzip files older than 7 days (optional)

---

## 12) Phases & Deliverables (Updated)

### Phase 0 — **Companion Scaffold & Quality Gates** (Day 0–1)

**Deliverables**

- **Monorepo scaffold** (pnpm + turbo); workspace config & scripts.
- **SvelteKit** app (`apps/web`) with Tailwind + **shadcn-svelte** baseline + dark theme tokens.
- **API** reference app (`apps/api`) with **Fastify** + `zod` + typed routes for development/testing (not deployed; actual backend logic uses SvelteKit server routes in `apps/web`).
- **Packages**: `domain`, `app`, `adapters`, `workers` with initial ports and DI container.
- **Tooling**: `eslint` (TS + import + boundaries), `prettier`, `dep-cruiser`, `knip`.
- **Tests**: Vitest + Testing Library; Playwright skeleton; **golden-file tests** for parser.
- **Git hooks**: husky + lint-staged + commitlint; forbidden-pattern scan.
- **CI**: GH Actions (`ci.yml`, `e2e.yml`, `deploy.yml`, `security.yml`).
- **Docker**: multi-stage for `web` (`node:22-alpine`) with healthchecks; `api` Dockerfile available for local testing.
- **Fly.io**: `fly.toml` for web app deployment (staging/prod); secrets via `fly secrets`.
- **Docs**: `ARCHITECTURE.md`, `AGENTS.md`, `SECURITY.md`, `CONTRIBUTING.md`, `PERFORMANCE.md`.

### Phase 1a — Pure UI Shell with Mock Data (Week 1)

**Focus: Visual design and interaction patterns only - Perfect for bot competition**

- SvelteKit dark theme + shadcn-svelte with **mobile-first responsive design**.
- **Mock data only** - No API calls, use static sample log data for development.
  - **Approach:** Simple hardcoded TypeScript data matching domain types
  - Create `apps/web/src/lib/data/mockLogs.ts` with 50-100 realistic `LogEntry` objects
  - UI components import and use mock data directly (no service layer yet)
  - Mock data includes representative samples of all field types: intents, languages, regions, traces, etc.
  - **Rationale:** Fastest path to impressive UI for bot competition; service layer abstraction deferred to Phase 1b
- **Responsive breakpoints**: 320px, 640px, 768px, 1024px, 1280px.
- **Mobile layouts**: Single column, touch-optimized, swipe gestures.
- **UI Components** (all with mock data):
  - Date range selector with presets
  - Log entries table (desktop) / cards (mobile) - virtualized
  - Filter sidebar: level, logger, cid, user, intent, language, region
  - Entry detail view: bottom sheet (mobile) / side panel (desktop)
  - Loading states and skeleton screens
  - Progress indicators
  - Search bar with mock instant results
- **Touch interactions**: swipe left/right, pull-to-refresh, pinch-to-zoom
- **Transitions**: Smooth animations between states
- **Dark theme**: Matching ChessCoachAI aesthetic

**Deliverables:** Complete UI shell that looks and feels production-ready but uses static mock data. All interactions work but with fake data.

### Phase 1b — Backend Integration (Current Phase)

**Focus: Connect the Phase 1a UI to real JSON log data**

- **JSON Line Parser Implementation:**
  - Parse each line as complete JSON object
  - Extract core fields: timestamp, level, logger, cid, user, client_ip, taskName
  - Handle malformed JSON gracefully with error recovery

- **Message Pattern Extraction:**
  - Language: `"language detection (model): {code}"`
  - Intents: `"extracted user intents: {intent1,intent2,...}"`
  - Original/Preprocessed: `"original_message: ...\nnew_message: ..."`
  - Response: `"Response from bt_servant: {text}"`
  - References: `"[selection-helper] canonical_book={book}"` + ranges
  - PerfReport: Parse embedded JSON when message starts with "PerfReport {"

- **Service Layer Architecture:**
  - Implement proper port interfaces (`QueryPort`, `ParsingPort`)
  - Replace mock data imports with service calls
  - Transition from `import { mockLogs }` to `await logService.getEntries()`

- **BT-Servant API Integration:**
  - Implement client for `/api/logs/files`, `/api/logs/recent`
  - Auto-load last 21 days on startup
  - Streaming support for large files
  - Progress reporting during multi-file load

- **Web Worker Pipeline:**
  - Move JSON parsing to worker threads
  - Non-blocking processing with progress updates
  - Chunked parsing for memory efficiency

- **Data Features:**
  - Connect all filters to parsed data
  - Implement MiniSearch for full-text search
  - GeoIP lookup for client_ip → country mapping
  - Real-time filtering and search
- Error handling and retry logic.
- Session management for loaded files.
- Cache management for performance.

**Deliverables:** Fully functional app with the chosen UI connected to real data
sources. All core parsing and extraction working. Basic filters and search
operational. App usable for daily log analysis with essential features.

### Phase 1c — Extracted Fields UI & Intent-Specific Sections (Week 2.5)

**Focus: Complete the UI by adding all extracted fields with intent-aware
contextual display**

- **Universal Extracted Fields (all entries):**
  - Add client_ip → GeoIP country resolution display
  - Add message_original and message_preprocessed comparison view
    (side-by-side or toggle)
  - Add final_message display (response sent to user)
  - CID-based correlation service to gather multi-entry patterns

- **Intent-Specific Contextual Sections:**
  - **Two locations for intent context:**
    1. **LogDetailPanel** (individual entry) - when clicking a log row
    2. **IntentGraph** (conversation-level) - below graph visualization
  - **Biblical Reference Section** (for scripture-related intents):
    - Intents: `retrieve-scripture`, `get-passage-summary`,
      `get-passage-keywords`, `get-translation-helps`, `translate-scripture`
    - Display: Formatted reference (e.g., "John 4:1-3" with book icon)
    - Extracted from: `[selection-helper] canonical_book` + `ranges` patterns
    - Visual: Purple border, book icon, book/chapter/verse breakdown
  - **Translation Resources Section** (for translation assistance intents):
    - Intents: `get-translation-helps`, `get-bible-translation-assistance`,
      `consult-fia-resources`
    - Display: List of resources searched with checkmarks
    - Extracted from: `[translation-helps] selected {n} help entries` pattern
    - Visual: Teal border, search icon, resource count + list
  - **Message Flow Section** (universal):
    - Shows: Original → Preprocessed → Response comparison
    - Visual: Cyan border, three-column layout (accordion on mobile)

- **UI/UX Design:**
  - Intent-specific sections appear **below** basic info, **above** PerfReport
  - Sections use distinct styling (border color, icon) per intent category
  - Smooth animations when sections appear/disappear
  - Empty states: "No biblical reference detected" vs section not shown
  - Sections are collapsible with default expanded state

- **CID Correlation Architecture:**
  - Implement service to find related entries by CID
  - Cache correlation results for performance
  - Show "Correlated from N other entries" hint when fields come from
    different log lines

**Deliverables:** Complete extracted field display. LogDetailPanel shows all
contextual information with intent-aware sections. Users can see
original/preprocessed/final messages, biblical references, and resources
searched when applicable.

### Phase 2 — Performance, Polish & Testing (Week 3)

**Focus: Production readiness, optimization, and comprehensive testing**

- **Performance Optimization:**
  - Profile parser to meet 2s/10MB target
  - Optimize memory usage for large datasets (100k+ entries)
  - Benchmark filtering and search performance
  - Lazy loading and virtualization improvements
  - Optimize CID correlation queries
- **Error Recovery Polish:**
  - Handle all edge cases in message pattern extraction
  - Graceful degradation for malformed PerfReports
  - Robust handling of encoding issues
  - Better user feedback for parse errors
- **Testing Suite:**
  - Golden file tests with actual log samples
  - Property-based testing for parser
  - Performance regression tests
  - Edge case test coverage (missing fields, malformed JSON, etc.)
  - Test intent-specific section rendering
- **PerfReport Visualization:**
  - Replace raw JSON dump with structured display
  - Waterfall timeline for spans
  - Cost breakdown by intent
  - Token usage charts
- **Documentation:**
  - Parser performance benchmarks
  - Extraction pattern documentation
  - Intent-specific UI section guide
  - Troubleshooting guide

### Phase 3 — Live Tail & Advanced Features (Week 4)

- WebSocket-based live tail implementation.
- SQLite adapter for > 100MB cumulative data.
- Advanced search DSL.
- Cross-file filtering and unified timeline.
- User-based filtering across all logs.

### Phase 4 — Trace View, Intent Flow & Insights (Week 5)

- Timeline/waterfall visualization for traces.
- **Intent Flow Visualization**:
  - Interactive directed graph using React Flow or Cytoscape.js
  - Node coloring by performance thresholds
  - Multi-intent branching visualization
  - Click-through to detailed logs
  - Performance: Flow diagram renders < 300ms
- Insights dashboard with charts and metrics.
- Export with compression options.
- Deep-linking support for traces and flow diagrams.
- Intent-specific UI optimizations.

### Phase 5 — Production Hardening (Week 6)

- Rate limiting implementation.
- Security headers and CSP.
- Monitoring integration.
- Performance optimizations.
- Documentation completion.
- Load testing with large datasets.

---

## 13) Data Model (JSON-Based)

```ts
// Raw JSON log entry as received from API
interface RawLogEntry {
  message: string;
  client_ip: string; // IPv4/IPv6 or "-"
  taskName: string | null;
  timestamp: string; // "YYYY-MM-DD HH:MM:SS"
  level: "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR";
  logger: string;
  cid: string; // Correlation ID
  user: string; // User ID or "-"
}

// Known intents enum
enum KnownIntent {
  GET_BIBLE_TRANSLATION_ASSISTANCE = "get-bible-translation-assistance",
  CONSULT_FIA_RESOURCES = "consult-fia-resources",
  GET_PASSAGE_SUMMARY = "get-passage-summary",
  GET_PASSAGE_KEYWORDS = "get-passage-keywords",
  GET_TRANSLATION_HELPS = "get-translation-helps",
  RETRIEVE_SCRIPTURE = "retrieve-scripture",
  LISTEN_TO_SCRIPTURE = "listen-to-scripture",
  TRANSLATE_SCRIPTURE = "translate-scripture",
  PERFORM_UNSUPPORTED_FUNCTION = "perform-unsupported-function",
  RETRIEVE_SYSTEM_INFORMATION = "retrieve-system-information",
  SET_RESPONSE_LANGUAGE = "set-response-language",
  SET_AGENTIC_STRENGTH = "set-agentic-strength",
  CONVERSE_WITH_BT_SERVANT = "converse-with-bt-servant",
}

type GeoLocation = {
  country?: string;
  region?: string;
  city?: string;
  lat?: number;
  lon?: number;
  confidence?: number;
};

// Parsed and enriched log entry
type LogEntry = {
  id: string; // UUID generated on parse
  fileId: string;
  fileName: string; // Which file this entry came from
  ts: Date; // Parsed from timestamp field
  level: "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR";
  logger: string; // From logger field
  cid?: string; // From cid field (may be "-")
  message: string; // From message field

  // Direct from JSON fields
  clientIp?: string; // From client_ip field
  userId?: string; // From user field (for filtering)
  taskName?: string; // From taskName field

  // Extracted from message patterns
  language?: string; // From "language detection (model): {code}"
  location?: GeoLocation; // GeoIP lookup on clientIp
  message_original?: string; // From "original_message:" pattern
  message_preprocessed?: string; // From "new_message:" pattern
  intents?: Intent[]; // From "extracted user intents:"
  final_message?: string; // From "Response from bt_servant:"
  reference_extracted?: BibleReference; // From selection-helper patterns
  resources_searched?: Resource[]; // From translation-helps patterns

  // PerfReport data (when message starts with "PerfReport {")
  hasJson: boolean;
  perfReport?: PerfReport;
  traceId?: string; // From PerfReport trace_id

  // Metadata
  node?: string; // From "Routing to node:" patterns
  raw: { startLine: number; endLine: number };
  parse_errors?: string[]; // Any extraction failures
};

type Intent = {
  name: string; // Known or discovered intent
  confidence?: number;
  parameters?: Record<string, any>;
  isKnown: boolean; // true if in KnownIntent enum
};

type BibleReference = {
  raw: string; // "Gen 1:3-5"
  book: string;
  chapter: number;
  startVerse: number;
  endVerse?: number;
};

type Resource = {
  id: string;
  name: string;
  type: string;
  searched_at?: Date;
};

type PerfReport = {
  trace_id?: string;
  user_id?: string;
  total_ms?: number;
  total_s?: number;
  total_input_tokens?: number;
  total_output_tokens?: number;
  total_tokens?: number;
  total_cached_input_tokens?: number;
  total_audio_input_tokens?: number;
  total_audio_output_tokens?: number;
  total_input_cost_usd?: number;
  total_output_cost_usd?: number;
  total_cached_input_cost_usd?: number;
  total_audio_input_cost_usd?: number;
  total_audio_output_cost_usd?: number;
  total_cost_usd?: number;
  grouped_totals_by_intent?: Record<string, IntentMetrics>;
  spans?: Span[];
};

type IntentMetrics = {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cached_input_tokens?: number;
  audio_input_tokens?: number;
  audio_output_tokens?: number;
  input_cost_usd: number;
  output_cost_usd: number;
  cached_input_cost_usd?: number;
  audio_input_cost_usd?: number;
  audio_output_cost_usd?: number;
  total_cost_usd: number;
};

type Span = {
  name: string;
  duration_ms: number;
  duration_se?: number;
  duration_percentage?: string;
  start_offset_ms?: number;
  input_tokens_expended?: number;
  output_tokens_expended?: number;
  total_tokens_expended?: number;
  input_cost_usd?: number;
  output_cost_usd?: number;
  token_percentage?: string;
};

type Session = {
  id: string;
  files: LoadedFile[];
  dateRange: { start: Date; end: Date };
  totalEntries: number;
  indexMode: "memory" | "sqlite";
  createdAt: Date;
};

type LoadedFile = {
  name: string;
  size: number;
  entryCount: number;
  dateRange: { start: Date; end: Date };
  parseErrors: number;
};

// Intent Flow Visualization Types
type FlowNode = {
  id: string;
  type:
    | "start"
    | "language_detection"
    | "preprocessing"
    | "intent_detection"
    | "intent_handler"
    | "response"
    | "translation"
    | "end";
  name: string; // e.g., "brain:determine_intents_node"
  duration_ms: number;
  tokens?: number;
  cost_usd?: number;
  intent?: string; // For intent_handler nodes
  status: "success" | "error" | "warning";
  metadata?: Record<string, any>;
};

type FlowEdge = {
  from: string; // Node ID
  to: string; // Node ID
  duration_ms: number;
  label?: string; // e.g., "245ms"
  type?: "sequential" | "parallel" | "conditional";
};

type IntentFlow = {
  trace_id: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  intents: string[]; // All intents detected in this flow
  total_duration_ms: number;
  total_tokens: number;
  total_cost_usd: number;
  parallel_branches?: number; // Number of parallel intent paths
  critical_path?: string[]; // Node IDs of the slowest path
};
```

---

## 14) Tooling & Scripts

- `verify` → `turbo run typecheck lint test arch knip --continue --summarize`
- `typecheck` → `tsc -p tsconfig.json --noEmit`
- `lint` → `eslint . --max-warnings=0`
- `arch` → `depcruise --config tooling/depcruise.json "apps|packages"`
- `knip` → `knip`
- `test` → `vitest run --coverage`
- `test:e2e` → `playwright test`
- `scan:forbidden` → `node tooling/scan-forbidden.js` (fails on `eslint-disable|@ts-ignore|console\.`)
- `dev` → `turbo run dev --parallel`
- `build` → `turbo run build`
- `deploy:staging` → `fly deploy --app bt-log-viewer-staging`

---

## 15) Security Considerations

- **Input validation**: Sanitize all file inputs, size limits
- **XSS prevention**: Escape all rendered log content
- **CSP headers**: Strict Content Security Policy
- **Rate limiting**: Prevent DoS attacks
- **File size limits**: Max 500MB per upload, max 2GB cumulative per session
- **Sandboxed parsing**: Web Workers with limited permissions
- **No eval()**: Strict no-eval policy
- **Dependency scanning**: Regular vulnerability checks
- **CORS**: Properly configured for BT-Servant API access
- **Authentication ready**: Middleware hooks for future auth implementation

---

## 16) CI/CD & Infrastructure

- **GitHub Actions**:
  - Matrix testing: Node 20/22
  - Cache: pnpm store, turbo, playwright binaries
  - Workflows: CI, E2E, Security, Deploy
- **Docker**: Multi-stage builds, distroless runtime images
- **Fly.io**:
  - Apps: `bt-log-viewer-staging`, `bt-log-viewer-prod`
  - Secrets: API keys, GeoIP license
  - Auto-scaling based on memory usage
- **Monitoring**: Fly metrics + custom dashboards

---

## 17) Open Questions (Resolved)

- ✅ **Log Volume**: Medium scale (10MB files, ~200MB for 21 days)
- ✅ **Multi-file**: Yes, with auto-load of last 21 days
- ✅ **Storage threshold**: SQLite at 100MB cumulative
- ✅ **Search scope**: Messages and logger names only (v1)
- ✅ **Live tail**: Phase 3 priority
- ✅ **GeoIP**: Country-level sufficient
- ✅ **Log access**: New API endpoints on BT-Servant
- ✅ **Intent taxonomy**: 13 known + dynamic discovery
- ✅ **References**: Extract reference only, not text content

### Remaining Decisions

- Charts library: Recharts vs. Visx vs. Chart.js for visualizations
- Minimum browser support: Modern evergreen only or include older versions?
- GeoIP database update mechanism: Build-time vs runtime updates

---

## 18) Acceptance Criteria Snapshot (v1)

- **Mobile-first**: ALL features work on phones (iPhone SE 375px minimum), tablets, and desktops
- **Responsive**: Passes Google Mobile-Friendly Test, Lighthouse Mobile score > 90
- **Touch-optimized**: All interactions work via touch, 44px minimum touch targets
- **Auto-load**: App opens and loads last 21 days of logs automatically
- **Multi-file**: Unified view across all loaded log files
- **Filtering**: By level, logger, cid, user, intent, language, region works across all files
- **Entries table**: Shows all extracted fields when present, handles missing fields gracefully
- **References**: Correctly extracts biblical references (not text)
- **Known intents**: All 13 intents recognized and categorized
- **Performance**: 21 days of logs (~200MB) loads in < 10s
- **Mobile performance**: < 3s Time to Interactive on 4G, < 150KB initial JS bundle
- **Trace view**: Timeline with spans renders < 500ms
- **Intent flow**: Interactive graph visualization renders < 300ms, pinch-to-zoom on mobile
- **Insights**: Charts responsive on all screen sizes
- **Export**: JSON/CSV with optional compression, honors all active filters
- **Quality**: Zero warnings, all CI checks green
- **Deployment**: Fly staging deploys on `main` merge

---

## 19) Related Documentation

- **Example JSON Logs**: `/docs/example_bt_servant.log` — Actual JSON log format
  from BT-Servant
- **API Specification**: `/docs/bt-servant-log-api-spec.md` — Complete FastAPI
  implementation guide for log endpoints
- **UI Field Mapping**: `/docs/ui-to-log-field-mapping.md` — Comprehensive
  mapping from UI components to log patterns/fields
- **Architecture Decisions**: See sections 6 & 7 for clean architecture details
- **Deployment Guide**: `/docs/fly-io-setup.md` — Fly.io deployment for
  staging/production
- **Phase 1 Split**: `/docs/bot-competition.md` — Phase 1a/1b split for bot
  testing
- **Claude Instructions**: `/CLAUDE.md` — Guidance for AI assistants working
  with codebase

---

### End of BT Servant Log Viewer — PRD v0.7
