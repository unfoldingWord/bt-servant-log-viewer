# BT Servant Log Viewer — PRD v0.2
**Owner:** Ian Lindsley  
**Date:** 2025-10-16  
**Status:** Draft → Scaffold-ready  
**Guiding Style:** *Zero-warning policy*, clean/onion/hexagonal architecture, same UI stack & dark/techy theme as ChessCoachAI.

---

## 1) TL;DR
Build **BT Servant Log Viewer** — a fast, dark-themed, web-based log viewer for BT-Servant telemetry. It ingests plain-text log files, parses structured fields (timestamp, level, logger, correlation id), recognizes multi-line JSON payloads (e.g., **PerfReport**), and surfaces filters, timelines, search, and cost/latency analytics. **Key extractions** are first-class UI citizens and have dedicated UI elements:  
1) **Language code detected**  
2) **IP → Region/Country** (GeoIP)  
3) **Original message**  
4) **Preprocessed/normalized message**  
5) **Intents detected** (critical)  
6) **Final message returned to the user**  
Additionally, for **passage-oriented flows** we capture the **passage extracted**, and for **get-bible-translation-assistance** we list **which resources were searched**.

From day zero: **strict typing**, **linting**, **import boundaries**, **tests**, **pre-commit**, and **CI/CD** to Fly.io — **no warnings suppressed, ever**. A **companion scaffold** (monorepo layout, strict configs, CI, Fly stubs, parser skeleton, **golden-file tests**) is included as Phase 0 deliverable.

---

## 2) Goals & Non-Goals
### Goals
- Parse BT-Servant logs into a normalized model (entries, spans, traces, intents, language, geo, messages, passage refs, searched resources).
- Provide instant, responsive UX: filter by **level/logger/cid/trace_id/intent/language/region**, full-text search, drill-down into **PerfReport** spans.
- Visualize **duration histograms**, **waterfall timelines**, **token/cost breakdowns**, **intent mix**, and **traffic by language/region**.
- Drag-and-drop **file upload**; later: open from path/URL and live tail.
- Same **SvelteKit + Tailwind + shadcn-svelte** stack and **dark/techy** theme as ChessCoachAI.
- **Node backend** (in-repo) for parsing/index/search API.
- **Quality gates** from day one: types, lint, imports/boundaries, dead-code, tests, e2e, Docker build, Fly deploy.

### Non-Goals (v1)
- Auth/SSO, multi-tenant access control.
- Heavy ingestion/streaming pipeline; tailing is optional later.
- Editing logs; logs remain read-only artifacts.

---

## 3) Sample Log Dialect (What we parse)
Typical header line:
```
[2025-10-15 20:28:48] [INFO] [bt_servant_engine.apps.api.routes.webhooks] [cid=466256e...]: text message from ... received.
```
We also expect multi-line JSON blocks such as `PerfReport { ... }` with fields like `trace_id`, `total_ms`, `grouped_totals_by_intent`, and `spans[]` (name, duration, tokens, cost). We will additionally derive or extract: **language**, **client IP**, **region/country**, **original vs. preprocessed message**, **intents detected**, **final message**, **passage extracted**, **resources searched** (when present).

---

## 4) User Stories
- **Triage errors quickly** by filtering `level=ERROR|WARN`, sorting by time.
- **Follow a trace** by `trace_id` and see spans, durations, and resulting messages.
- **Audit NLP**: For a single entry, see **original message**, **preprocessed message**, **language**, **intents detected**, and **final message** side-by-side.
- **Geo & language insights**: top regions/countries and languages over a time slice.
- **Passage flow**: confirm which **passage reference** was extracted for a message.
- **Translation assistance flow**: confirm **which resources were searched** for that request.
- **Export** a filtered slice (entries, spans, or a perf report) as JSON/CSV with reproducible query.

---

## 5) UX / UI (same theme as ChessCoachAI)
- **Theme**: Dark, techy (VS Code / Zulip / PyCharm dark). Near-black backgrounds (`#0f1115–#1a1d24`), dark greys (`#222–#2b2f36`), high-contrast text (`#e8edf2`), low-saturation cyan/teal/indigo accents, soft shadows, rounded-2xl, grid-first, keyboard-friendly.
- **Stack**: **SvelteKit + Tailwind + shadcn-svelte**; Playwright for E2E; Vitest + Testing Library for unit/UI.
- **Areas**:
  - **Ingest**: drag-drop file; parse stats (lines, errors, entries, perf blocks).
  - **Entries (virtualized table)** with filters: time, **level**, **logger**, **cid**, **language**, **region**, **intent**; quick search; badges: “perf”, “intent”, “passage”, “resources”.
  - **Right-pane Detail** (for one entry): **Original**, **Preprocessed**, **Language**, **Region/Country**, **Intents**, **Final Message**; JSON viewer for **PerfReport** and **spans**.
  - **Trace View**: waterfall timeline (spans), PV charts (tokens/cost), duration histograms.
  - **Insights**: top loggers, hottest spans, slowest traces, token/cost over time, **language/region distributions**, **intent mix**.
- **Perf**: virtualized table for large files; indexed search; smooth filters.
- **Deep-linking**: shareable URLs with query+filters.

---

## 6) Architecture (Clean/Onion/Hexagonal)
### Layers
- **Domain** (pure TS): `LogEntry`, `PerfReport`, `Span`, `Trace`, `Intent`, `LangCode`, `Region`, parsers, aggregations.
- **Application** (use-cases): `ParseLog`, `IndexLog`, `QueryEntries`, `GetTrace`, `SummarizePerf`, `ExportSlice`.
- **Ports**: `ParsingPort`, `IndexPort`, `QueryPort`, `StoragePort`, `GeoIpPort`.
- **Adapters**: Node parsers (regex + JSON scanner), in-memory index or SQLite, file loader, GeoIP (e.g., **MaxMind GeoLite2** via `mmdb` adapter), SvelteKit adapter.
- **Drivers/Infra**: HTTP API (Fastify or SvelteKit endpoints), DI wiring, metrics, config.

### Monorepo (pnpm + Turborepo)
```
apps/
  web/             # SvelteKit UI
  api/             # Fastify (Node 22) parsing/index API
packages/
  domain/          # pure types & logic
  app/             # use-cases wired to ports
  adapters/        # parsing, index, storage, http, geoip
tooling/           # dep-cruiser, forbidden-scan, etc.
infra/             # Dockerfiles, fly.toml, GH Actions
tests/fixtures/    # sample logs (golden files)
```

### Dependency Rules (fitness-checked)
- `domain` → nothing
- `app` → `domain`
- `adapters/*` → `app|domain` (no UI import)
- `web` → `app` (no direct adapter imports)
- `api` → `app|adapters` allowed (no `web`)

---

## 7) Parser Spec (Draft)
### Header line regex
```
/^\[(?<ts>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]\s
 \[(?<level>[A-Z]+)\]\s
 \[(?<logger>[^\]]+)\]\s
 \[(?<cid>cid=[^\]]+|-)\]:\s
 (?<message>.*)$/x
```

### JSON block (e.g., “PerfReport { … }”)
- Start token: `PerfReport {`
- Capture until **balanced braces** (nested arrays/objects OK).
- Parse with tolerant JSON parser; if invalid, attach raw block with line range.

### Derived fields (matchers & transforms)
- **Language code** (e.g., `lang=en|es|…`) — from message or JSON block.
- **Client IP** (`ip=…`) → **Region/Country** via **GeoIP** adapter (offline DB like **GeoLite2** or pluggable API). Store as `{country, region?, city?}`.
- **Original message** vs **Preprocessed/normalized message** (from preprocessor logs).
- **Intents detected** (list, with confidence if present) — **critical** for UI surfacing.
- **Final message** returned to user (post-processing/templating result).
- **Passage extracted** (e.g., “John 3:16–18”).
- **Resources searched** for **get-bible-translation-assistance** (array of resource names/IDs).

### Indexing
- In-memory per-file index (maps for `trace_id`, `cid`, `intent`, `lang`, `region`, `logger`); optional SQLite for big files.
- Text search: tiny inverted index; fuzzy fallback.

---

## 8) API (in-repo Node backend)
**Fastify** routes (typed via `zod`):
- `POST /api/logs/ingest` → `{ file|text }` → `{ fileId, counts, parseErrors[] }`
- `GET /api/logs/:fileId/entries` (filters: level, logger, cid, **intent**, **lang**, **region**, q, range)
- `GET /api/logs/:fileId/traces/:traceId`
- `GET /api/logs/:fileId/insights` (top loggers/spans/intents, token/cost over time, **lang/region distributions**)
- `GET /api/logs/:fileId/export` (csv|json; filters applied)

**SSE/WebSocket (optional later)** for live tail.

---

## 9) Quality Gates (Zero-Warning Policy)
- **TS strict**: `strict`, `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`.
- **ESLint**: `--max-warnings=0`; forbid `eslint-disable`, `@ts-ignore`, `console.*` in app code.
- **Import rules**: `eslint-plugin-import`, `import/no-cycle`, `no-restricted-imports`, path-alias checks; **boundary lints** via `eslint-plugin-boundaries` *and* `dependency-cruiser`.
- **Dead code**: `knip` in CI.
- **Tests**: Vitest (parser/adapters), Testing Library (UI), Playwright (e2e). No `.only`. Coverage gates.
- **Security**: `pnpm audit`, `secretlint` for repo; no secrets in logs.
- **Pre-commit**: husky + lint-staged (eslint, typecheck:fast, prettier, forbidden scan).
- **CI**: GH Actions matrix (typecheck, lint, unit, arch, knip, e2e, Docker build). `main` → Fly deploy (staging/prod).

> **Hard rule:** No warnings anywhere; no disabled rules. PRs failing any gate are rejected.

---

## 10) Phases & Deliverables (incl. Scaffold)
### Phase 0 — **Companion Scaffold & Quality Gates** (Day 0–1)
**Deliverables**
- **Monorepo scaffold** (pnpm + turbo); workspace config & scripts.
- **SvelteKit** app (`apps/web`) with Tailwind + **shadcn-svelte** baseline + dark theme tokens.
- **API** app (`apps/api`) with **Fastify** + `zod` + typed routes; basic `/healthz`.
- **Packages**: `domain`, `app`, `adapters` with initial ports and DI container.
- **Tooling**: `eslint` (TS + import + boundaries), `prettier`, `dep-cruiser`, `knip`.
- **Tests**: Vitest + Testing Library; Playwright skeleton; **golden-file tests** for parser with `tests/fixtures/bt_servant-abridged.log` (sanitized).
- **Git hooks**: husky + lint-staged + commitlint; forbidden-pattern scan (fails on `eslint-disable|@ts-ignore|console.`).
- **CI**: GH Actions (`ci.yml`, `e2e.yml`, `deploy.yml`); caches; build artifacts.
- **Docker**: multi-stage for `api` and `web` (`node:22-alpine`) with healthchecks.
- **Fly.io**: `fly.toml` stubs (staging/prod); secrets via `fly secrets`.
- **Docs**: `ARCHITECTURE.md`, `AGENTS.md`, `SECURITY.md`, `CONTRIBUTING.md`.

**Acceptance Criteria**
- `pnpm verify` (typecheck, lint, unit, arch, knip) **green** locally & in CI; **zero warnings**.
- PR preview deploy to Fly (staging) succeeds on `main` merge.
- Parser skeleton runs against fixture and produces baseline JSON for tests.

### Phase 1 — UI Shell & File Upload (Week 1)
- SvelteKit dark theme + shadcn-svelte; drag-drop upload.
- Parse summary: lines, entries, perf blocks, **lang/region counts**, parse errors.
- Entries table with filters (level/logger/cid/intent/lang/region), search, and right-pane detail (Original/Preprocessed/Intents/FinalMessage).
- **AC:** Ingest demo file; filters work; detail pane shows derived fields.

### Phase 2 — Parser & JSON Blocks (Week 2)
- Implement header regex + balanced-brace capture; tolerant JSON parsing; attach `perfReport`.
- Extract **language**, **ip→geo**, **original/preprocessed**, **intents**, **final message**, **passage**, **resources searched** when present.
- Unit tests with golden files; fuzz tests for malformed JSON.
- **AC:** PerfReport spans table renders; derived fields verified via tests.

### Phase 3 — Indexing, Search & Trace View (Week 3)
- In-memory index; quick search; trace reconstruction by `trace_id`.
- Timeline/waterfall; histograms; token/cost charts.
- **AC:** Trace view <200ms typical; P95 render <500ms (desktop).

### Phase 4 — Insights & Export (Week 4)
- Aggregations: top loggers/spans/intents; token/cost; **lang/region distributions**.
- Export CSV/JSON with filters.
- **AC:** Exports match UI filters; charts snappy and interactive.

### Phase 5 — Live Tail (Optional) & Hardening (Week 5)
- SSE/WebSocket tail of a file (append-only); retry/backoff.
- Structured logging; error boundaries; telemetry hooks; canary deploys.
- **AC:** Tail UI non-blocking; reconnection stable; SLOs met.

---

## 11) Data Model (sketch)
```ts
type RegionInfo = { country: string; region?: string; city?: string };

type LogEntry = {
  id: string;
  fileId: string;
  ts: Date;
  level: 'TRACE'|'DEBUG'|'INFO'|'WARN'|'ERROR';
  logger: string;
  cid?: string;                 // correlation id
  message: string;              // header message
  hasJson: boolean;
  perfReport?: PerfReport;
  // Derived fields:
  language?: string;            // e.g., 'en', 'es'
  ip?: string;                  // raw ip if present
  region?: RegionInfo;          // GeoIP transform
  message_original?: string;    // as received
  message_preprocessed?: string;// normalized form
  intents?: string[];           // detected intents
  final_message?: string;       // returned to the user
  passage_ref?: string;         // e.g., 'John 3:16-18'
  resources_searched?: string[];// for translation assistance
  traceId?: string;
  userId?: string;
  node?: string;                // “Routing to node: …”
  raw: { startLine: number; endLine: number };
};

type PerfReport = {
  trace_id?: string;
  user_id?: string;
  total_ms?: number;
  total_tokens?: number;
  total_cost_usd?: number;
  grouped_totals_by_intent?: Record<string, { total_tokens: number; total_cost_usd: number }>;
  spans?: Span[];
};

type Span = {
  name: string;
  duration_ms: number;
  start_offset_ms?: number;
  input_tokens_expended?: number;
  output_tokens_expended?: number;
  total_tokens_expended?: number;
  input_cost_usd?: number;
  output_cost_usd?: number;
};
```

---

## 12) Tooling & Scripts
- `verify` → `turbo run typecheck lint test arch knip --continue --summarize`
- `typecheck` → `tsc -p tsconfig.json --noEmit`
- `lint` → `eslint . --max-warnings=0`
- `arch` → `depcruise --config tooling/depcruise.json "apps|packages"`
- `knip` → `knip`
- `test` → `vitest run --coverage`
- `test:e2e` → `playwright test`
- `scan:forbidden` → `node tooling/scan-forbidden.js` (fails on `eslint-disable|@ts-ignore|console\.`)

---

## 13) CI/CD & Infra
- **GitHub Actions**: cache pnpm/turbo; matrix Node 20/22; Playwright artifacts.
- **Docker**: multi-stage for `api` and `web` (`node:22-alpine`) + healthchecks.
- **Fly.io**: staging & prod apps; secrets via `fly secrets`; autoscale (later).

---

## 14) AGENTS.md (Bot Coders) — Summary
- Obey **Zero-Warning** & **Boundaries**; never add `eslint-disable` or `@ts-ignore`.
- Tests first; small PRs; screenshots for UI; keep dep-graph green.
- Use **ports/adapters**; the UI never imports adapters directly.
- Extend tests + fixtures for every parser change (**golden files**).

---

## 15) Open Questions
- Optional **SQLite** index for huge files (>100MB) now or later?
- Charts lib: Recharts vs. lightweight SVG primitives in Svelte?
- Redaction rules (phone numbers, emails) at parse-time?
- Minimum browser support (Chromium-only vs. include Safari/Firefox)?
- Live tail source contract (local FS vs. remote agent).

---

## 16) Acceptance Criteria Snapshot (v1)
- Ingest demo file; entries table shows **language**, **region**, **intents**, **original/preprocessed/final messages**, **passage**, **resources searched** when present.
- Trace reconstruction view with timeline and spans.
- Insights page renders token/cost, duration summaries, **intent mix**, **lang/region** charts.
- Export JSON/CSV honors filters; CI green; Fly staging deploys on `main`.
- **Zero warnings** across type/lint/build/test; arch rules enforced.

---

### End of BT Servant Log Viewer — PRD v0.2
