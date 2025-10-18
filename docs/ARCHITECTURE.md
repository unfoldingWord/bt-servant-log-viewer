# Architecture

BT Servant Log Viewer follows Clean/Onion/Hexagonal architecture principles for maintainability, testability, and independence from external frameworks.

## Layers

### 1. Domain Layer (`packages/domain`)

**Purpose**: Pure business logic and data structures

**Rules**:

- No external dependencies
- No I/O operations
- Only TypeScript types and interfaces
- All derived fields are optional for robust parsing

**Contents**:

- `LogEntry`: Core log entry type with all 13 known intents
- `PerfReport`: Performance metrics structure
- `Span`: Distributed tracing span
- `Intent`: Bot intent enumeration and metadata
- Value objects and domain entities

### 2. Application Layer (`packages/app`)

**Purpose**: Use case orchestration and port definitions

**Rules**:

- Depends only on Domain layer
- Defines interfaces (ports) for external systems
- No implementation details
- Framework-agnostic

**Contents**:

- Port interfaces: `ParsingPort`, `IndexPort`, `StoragePort`
- Use case interfaces
- Application services contracts

### 3. Adapters Layer (`packages/adapters`)

**Purpose**: Implements ports with concrete technology

**Rules**:

- Depends on Domain and Application layers
- Contains all I/O logic
- Framework-specific implementations
- Swappable implementations

**Contents**:

- Log parser implementation
- IndexedDB wrapper
- Browser storage adapter
- Future: BT-Servant API client

### 4. Workers Layer (`packages/workers`)

**Purpose**: Web Workers for non-blocking operations

**Rules**:

- Depends only on Domain layer
- No DOM access
- Pure computation
- Message-based communication

**Contents**:

- Parse worker for large log files
- Future: Index worker, search worker

### 5. Drivers Layer (Apps)

**Purpose**: Entry points and framework integration

#### Web App (`apps/web`)

- SvelteKit 2.x with Svelte 5.x
- Tailwind CSS dark theme
- Mobile-first responsive design
- Consumes all inner layers

#### API App (`apps/api`)

- Fastify server
- Zod validation
- Health checks and metrics
- Future: BT-Servant integration

## Dependency Flow

```
apps/web ──┐
           ├──> packages/adapters ──> packages/app ──> packages/domain
apps/api ──┘                                 ↑
                                             │
                           packages/workers ─┘
```

**Key principle**: Dependencies point inward. Domain has zero dependencies.

## Data Flow

1. **Log Upload/Fetch**:
   - User uploads file OR app fetches from BT-Servant API
   - Web app passes raw content to Parse Worker
   - Parse Worker returns structured LogEntry[]

2. **Indexing**:
   - Adapter layer indexes logs in IndexedDB
   - Creates inverted indices for fast search
   - Aggregates performance metrics

3. **Query/Filter**:
   - User applies filters in UI
   - App layer orchestrates query across indices
   - Results streamed back via adapters

## Quality Gates

All code must pass:

- **Zero warnings**: No eslint-disable, no @ts-ignore
- **Type safety**: TypeScript strict mode
- **Architecture validation**: dependency-cruiser enforces layer boundaries
- **Dead code detection**: knip removes unused exports
- **Tests**: Vitest (unit) + Playwright (E2E)

## Mobile-First Design

**Critical requirement**: Engineers debug from phones during 3am incidents.

- Minimum width: 320px (iPhone SE)
- Touch targets: ≥44x44px
- Performance: <3s initial load on 3G
- Progressive Web App (PWA) capability

## Technology Stack

- **Frontend**: SvelteKit 2.x, Svelte 5.x, Tailwind CSS
- **Backend**: Fastify, Zod
- **Storage**: IndexedDB (browser), Future: PostgreSQL (API)
- **Build**: Turborepo, pnpm workspaces
- **Testing**: Vitest, Playwright, Testing Library
- **Deployment**: Fly.io, Docker

## File Structure

```
bt-servant-log-viewer/
├── apps/
│   ├── web/              # SvelteKit app
│   └── api/              # Fastify API
├── packages/
│   ├── domain/           # Core types (innermost layer)
│   ├── app/              # Ports and use cases
│   ├── adapters/         # Concrete implementations
│   └── workers/          # Web Workers
├── docs/                 # Documentation
├── infra/                # Deployment configs
└── tooling/              # Build and quality tools
```

## Key Design Decisions

1. **Clean Architecture**: Prevents framework lock-in, enables easy testing
2. **Web Workers**: Prevents UI blocking when parsing large logs
3. **IndexedDB**: Enables offline-first, handles large datasets
4. **Zero-warning policy**: Enforces code quality at commit time
5. **Mobile-first**: Matches real-world usage patterns
