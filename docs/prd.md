# BT Servant Log Viewer — PRD v0.5
**Owner:** Ian Lindsley
**Date:** 2025-10-16
**Status:** Draft → Scaffold-ready → Enhanced → Flow Visualization → Mobile-First Design
**Guiding Style:** *Zero-warning policy*, clean/onion/hexagonal architecture, same UI stack & dark/techy theme as ChessCoachAI.

---

## 1) TL;DR
Build **BT Servant Log Viewer** — a fast, dark-themed, web-based log viewer for BT-Servant telemetry. It automatically loads the last 21 days of logs on startup, parses structured fields (timestamp, level, logger, correlation id), recognizes multi-line JSON payloads (e.g., **PerfReport**), and surfaces filters, timelines, search, and cost/latency analytics. **Key extractions** are first-class UI citizens and have dedicated UI elements:
1) **Language code detected**
2) **IP → Region/Country** (GeoIP) - when IP field is present
3) **Original message**
4) **Preprocessed/normalized message**
5) **Intents detected** (critical)
6) **Final message returned to the user**
Additionally, for **reference-oriented flows** we capture the **reference extracted** (e.g., "Gen 1:3-5"), and for **get-bible-translation-assistance** we list **which resources were searched**.

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

## 3) Sample Log Dialect (What we parse)
### Header Line Format
```
[2025-10-15 20:28:48] [INFO] [bt_servant_engine.apps.api.routes.webhooks] [cid=466256e...]: text message from ... received.
```

### PerfReport JSON Block Example
```json
[2025-10-15 20:29:09] [INFO] [...] [cid=466256eb842f434c9b11738498710c8a]: PerfReport {
   "user_id":"kwlv1sXnUvYT9dnn",
   "trace_id":"wamid.HBgLMTQ0Mzg2NzMzNjgVAgASGBQzRkU5MTZEOEZEMjRGNzlBQzM2NgA=",
   "total_ms":21337.01,
   "total_s":21.34,
   "total_input_tokens":9411,
   "total_output_tokens":102,
   "total_tokens":9513,
   "total_cached_input_tokens":0,
   "total_audio_input_tokens":0,
   "total_audio_output_tokens":0,
   "total_input_cost_usd":0.023527,
   "total_output_cost_usd":0.00102,
   "total_cached_input_cost_usd":0.0,
   "total_audio_input_cost_usd":0.0,
   "total_audio_output_cost_usd":0.0,
   "total_cost_usd":0.024548,
   "grouped_totals_by_intent":{
      "get-translation-helps":{
         "input_tokens":2281,
         "output_tokens":418,
         "total_tokens":2699,
         "cached_input_tokens":0,
         "audio_input_tokens":0,
         "audio_output_tokens":0,
         "input_cost_usd":0.005703,
         "output_cost_usd":0.00418,
         "cached_input_cost_usd":0.0,
         "audio_input_cost_usd":0.0,
         "audio_output_cost_usd":0.0,
         "total_cost_usd":0.009883
      }
   },
   "spans":[
      {
         "name":"bt_servant:verify_facebook_signature",
         "duration_ms":0.52,
         "duration_se":0.0,
         "duration_percentage":"0.0%",
         "start_offset_ms":0.0,
         "token_percentage":"0.0%"
      },
      {
         "name":"messaging:send_typing_indicator_message",
         "duration_ms":845.49,
         "duration_se":0.85,
         "duration_percentage":"4.0%",
         "start_offset_ms":0.52,
         "input_tokens_expended":0,
         "output_tokens_expended":0,
         "total_tokens_expended":0,
         "token_percentage":"0.0%"
      }
   ]
}
```

We will additionally derive or extract: **language**, **client IP** (when added), **region/country**, **original vs. preprocessed message**, **intents detected**, **final message**, **reference extracted** (e.g., "Gen 1:3-5"), **resources searched** (when present). All extracted fields are optional and the parser handles missing fields gracefully.

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
- **Drivers/Infra**: HTTP API (Fastify or SvelteKit endpoints), DI wiring, metrics, config, Web Workers orchestration.

### Monorepo (pnpm + Turborepo)
```
apps/
  web/             # SvelteKit UI
  api/             # Fastify (Node 22) parsing/index API
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

## 7) Parser Spec (Enhanced)
### Header line regex
```regex
/^\[(?<ts>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]\s
 \[(?<level>TRACE|DEBUG|INFO|WARN|ERROR)\]\s
 \[(?<logger>[^\]]+)\]\s
 \[(?<cid>cid=[^\]]+|-)\]:\s
 (?<message>.*)$/x
```

### JSON block (e.g., "PerfReport { … }")
- Start token: `PerfReport {`
- Capture until **balanced braces** (nested arrays/objects OK).
- Parse with tolerant JSON parser (handle trailing commas, comments); if invalid, attach raw block with line range.
- Maximum nesting depth: 10 levels for safety.

### Error Recovery Strategies
- **Corrupted headers**: Skip line, log as unparseable with line number
- **Incomplete JSON blocks**: Store as raw text with `parse_error` flag
- **Malformed timestamps**: Use file position as fallback ordering
- **Encoding issues**: Attempt UTF-8, fallback to Latin-1, mark as `encoding_warning`
- **Truncated files**: Process what's available, add warning in UI
- **Missing fields**: All extracted fields are optional; handle gracefully

### Derived fields (matchers & transforms)
- **Language code** (e.g., `lang=en|es|…`) — from message or JSON block.
- **Client IP** (`ip=…`) → **Region/Country** via **GeoIP** adapter (offline DB like **GeoLite2** with quarterly updates). Store as `{country, region?, city?, lat?, lon?}`. Country-level resolution sufficient.
- **Original message** vs **Preprocessed/normalized message** (from preprocessor logs).
- **Intents detected** — List of known intents plus dynamic discovery:
  - GET_BIBLE_TRANSLATION_ASSISTANCE = "get-bible-translation-assistance"
  - CONSULT_FIA_RESOURCES = "consult-fia-resources"
  - GET_PASSAGE_SUMMARY = "get-passage-summary"
  - GET_PASSAGE_KEYWORDS = "get-passage-keywords"
  - GET_TRANSLATION_HELPS = "get-translation-helps"
  - RETRIEVE_SCRIPTURE = "retrieve-scripture"
  - LISTEN_TO_SCRIPTURE = "listen-to-scripture"
  - TRANSLATE_SCRIPTURE = "translate-scripture"
  - PERFORM_UNSUPPORTED_FUNCTION = "perform-unsupported-function"
  - RETRIEVE_SYSTEM_INFORMATION = "retrieve-system-information"
  - SET_RESPONSE_LANGUAGE = "set-response-language"
  - SET_AGENTIC_STRENGTH = "set-agentic-strength"
  - CONVERSE_WITH_BT_SERVANT = "converse-with-bt-servant"
- **Final message** returned to user (post-processing/templating result).
- **Reference extracted** (e.g., "Gen 1:3-5", "John 3:16-18") - the biblical reference, NOT the text content.
- **Resources searched** for **get-bible-translation-assistance** (array of resource names/IDs).

### Indexing & Storage Strategy
- **In-memory index** for cumulative size < 100MB (maps for `trace_id`, `cid`, `intent`, `lang`, `region`, `logger`, `user_id`)
- **SQLite persistence** for cumulative size > 100MB or > 100k entries
- **Hybrid mode**: Keep hot data in memory, cold in SQLite
- **Text search**: MiniSearch for full-text with fuzzy matching (Levenshtein distance ≤ 2)
- **Search scope**: Messages and logger names (not extracted fields in v1)
- **LRU cache**: 1000 most recent queries cached for 15 minutes

---

## 8) API Specifications

### A. Log Viewer API (Fastify backend)
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

### B. BT-Servant Log Source API (new endpoints)
Add these endpoints to BT-Servant application (see `/docs/bt-servant-log-api-spec.md` for complete implementation guide):

- `GET /api/logs/files` → List available log files with metadata
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
    "total_files": 1,
    "total_size_mb": 8.2
  }
  ```
- `GET /api/logs/files/{filename}` → Download specific log file (streaming)
- `GET /api/logs/recent?days=N` → Get list of files from last N days

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
- **Import rules**: `eslint-plugin-import`, `import/no-cycle`, `no-restricted-imports`, path-alias checks; **boundary lints** via `eslint-plugin-boundaries` *and* `dependency-cruiser`.
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
- **API** app (`apps/api`) with **Fastify** + `zod` + typed routes; `/healthz` and `/metrics`.
- **Packages**: `domain`, `app`, `adapters`, `workers` with initial ports and DI container.
- **Tooling**: `eslint` (TS + import + boundaries), `prettier`, `dep-cruiser`, `knip`.
- **Tests**: Vitest + Testing Library; Playwright skeleton; **golden-file tests** for parser.
- **Git hooks**: husky + lint-staged + commitlint; forbidden-pattern scan.
- **CI**: GH Actions (`ci.yml`, `e2e.yml`, `deploy.yml`, `security.yml`).
- **Docker**: multi-stage for `api` and `web` (`node:22-alpine`) with healthchecks.
- **Fly.io**: `fly.toml` stubs (staging/prod); secrets via `fly secrets`.
- **Docs**: `ARCHITECTURE.md`, `AGENTS.md`, `SECURITY.md`, `CONTRIBUTING.md`, `PERFORMANCE.md`.

### Phase 1 — Multi-File UI & Auto-Load (Week 1)
- SvelteKit dark theme + shadcn-svelte with **mobile-first responsive design**.
- **Auto-load last 21 days** of logs on app open.
- Date range selector with presets.
- BT-Servant API client for fetching log files.
- Web Worker integration for non-blocking parsing.
- Progress bar showing file-by-file loading status.
- Basic entries table with filters.
- **Mobile layouts**: Single column, touch-optimized, swipe gestures.
- **Responsive breakpoints**: 320px, 640px, 768px, 1024px, 1280px.

### Phase 2 — Complete Parser & Extractors (Week 2)
- Full parser implementation with error recovery.
- All derived field extractors (intents, language, references, etc.).
- Handle missing fields gracefully.
- MiniSearch integration for text search.
- Golden file test suite with real log samples.

### Phase 3 — Live Tail & Advanced Features (Week 3)
- WebSocket-based live tail implementation.
- SQLite adapter for > 100MB cumulative data.
- Advanced search DSL.
- Cross-file filtering and unified timeline.
- User-based filtering across all logs.

### Phase 4 — Trace View, Intent Flow & Insights (Week 4)
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

### Phase 5 — Production Hardening (Week 5)
- Rate limiting implementation.
- Security headers and CSP.
- Monitoring integration.
- Performance optimizations.
- Documentation completion.
- Load testing with large datasets.

---

## 13) Data Model (Enhanced)
```ts
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
  CONVERSE_WITH_BT_SERVANT = "converse-with-bt-servant"
}

type GeoLocation = {
  country?: string;
  region?: string;
  city?: string;
  lat?: number;
  lon?: number;
  confidence?: number;
};

type LogEntry = {
  id: string;
  fileId: string;
  fileName: string;              // Which file this entry came from
  ts: Date;
  level: 'TRACE'|'DEBUG'|'INFO'|'WARN'|'ERROR';
  logger: string;
  cid?: string;                 // correlation id
  message: string;              // header message
  hasJson: boolean;
  perfReport?: PerfReport;
  // All derived fields are optional - handle missing gracefully:
  language?: string;            // e.g., 'en', 'es'
  ip?: string;                  // raw ip if present
  location?: GeoLocation;       // GeoIP data when available
  message_original?: string;    // as received
  message_preprocessed?: string;// normalized form
  intents?: Intent[];           // detected intents with confidence
  final_message?: string;       // returned to the user
  reference_extracted?: BibleReference;  // e.g., "Gen 1:3-5"
  resources_searched?: Resource[];// for translation assistance
  traceId?: string;
  userId?: string;              // User ID for filtering
  node?: string;                // "Routing to node: …"
  raw: { startLine: number; endLine: number };
  parse_errors?: string[];      // Any parsing issues
};

type Intent = {
  name: string;                 // Known or discovered intent
  confidence?: number;
  parameters?: Record<string, any>;
  isKnown: boolean;            // true if in KnownIntent enum
};

type BibleReference = {
  raw: string;           // "Gen 1:3-5"
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
  indexMode: 'memory' | 'sqlite';
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
  type: 'start' | 'language_detection' | 'preprocessing' | 'intent_detection' |
        'intent_handler' | 'response' | 'translation' | 'end';
  name: string;                // e.g., "brain:determine_intents_node"
  duration_ms: number;
  tokens?: number;
  cost_usd?: number;
  intent?: string;             // For intent_handler nodes
  status: 'success' | 'error' | 'warning';
  metadata?: Record<string, any>;
};

type FlowEdge = {
  from: string;                // Node ID
  to: string;                  // Node ID
  duration_ms: number;
  label?: string;              // e.g., "245ms"
  type?: 'sequential' | 'parallel' | 'conditional';
};

type IntentFlow = {
  trace_id: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  intents: string[];          // All intents detected in this flow
  total_duration_ms: number;
  total_tokens: number;
  total_cost_usd: number;
  parallel_branches?: number;  // Number of parallel intent paths
  critical_path?: string[];    // Node IDs of the slowest path
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

- **BT-Servant Log API Implementation**: `/docs/bt-servant-log-api-spec.md` - Complete guide for implementing the required endpoints in BT-Servant
- **Architecture Decisions**: See sections 6 & 7
- **Example Logs**: `/docs/example_bt_servant.log`

---

### End of BT Servant Log Viewer — PRD v0.5