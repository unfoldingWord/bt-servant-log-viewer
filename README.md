# BT Servant Log Viewer

Fast, mobile-first web application for viewing and analyzing BT-Servant telemetry logs.

## Features

- **Mobile-First Design**: Optimized for 320px+ screens (iPhone SE to desktop)
- **Dark Theme**: Easy on the eyes during 3am debugging sessions
- **Fast Parsing**: Web Workers for non-blocking log processing
- **Multi-File Support**: Auto-load last 21 days of logs
- **Rich Filtering**: By level, intent, timestamp, region, and more
- **Performance Metrics**: Parse, analyze, and visualize bot performance
- **Intent Flow Visualization**: See how intents connect and perform
- **Offline-First**: IndexedDB storage for fast local access

## Tech Stack

- **Frontend**: SvelteKit 2.x, Svelte 5.x, Tailwind CSS
- **Backend**: Fastify, Zod
- **Storage**: IndexedDB (browser), future PostgreSQL (API)
- **Build**: Turborepo, pnpm workspaces
- **Testing**: Vitest (unit), Playwright (E2E)
- **Deployment**: Fly.io, Docker

## Quick Start

### Prerequisites

- **Node.js**: ≥22.0.0
- **pnpm**: ≥9.0.0

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/bt-servant-log-viewer.git
cd bt-servant-log-viewer

# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

Open:

- Web app: http://localhost:5173
- API: http://localhost:8080

### Verification

Run all quality checks:

```bash
pnpm verify
```

This runs:

- Type checking (`tsc`)
- Linting (ESLint, zero warnings)
- Unit tests (Vitest)
- Architecture validation (dependency-cruiser)
- Dead code detection (knip)

## Development

```bash
# Development
pnpm dev                  # Start all dev servers
pnpm dev --filter web     # Start only web app
pnpm dev --filter api     # Start only API

# Type Checking
pnpm typecheck            # Check all packages

# Linting
pnpm lint                 # Lint all packages (zero warnings!)
pnpm lint:fix             # Auto-fix lint issues

# Testing
pnpm test                 # Unit tests
pnpm test:watch           # Unit tests in watch mode
pnpm test:e2e             # E2E tests with Playwright

# Architecture
pnpm arch                 # Validate clean architecture boundaries
pnpm knip                 # Detect unused exports

# Formatting
pnpm format               # Format with Prettier
pnpm format:check         # Check formatting

# Build
pnpm build                # Build all apps for production
```

## Project Structure

```
bt-servant-log-viewer/
├── apps/
│   ├── web/              # SvelteKit web application
│   └── api/              # Fastify API server
├── packages/
│   ├── domain/           # Core business logic (pure TypeScript)
│   ├── app/              # Use cases and port interfaces
│   ├── adapters/         # Concrete implementations
│   └── workers/          # Web Workers for parsing
├── docs/                 # Documentation
│   ├── prd.md            # Product Requirements Document
│   ├── bt-servant-log-api-spec.md  # API specification
│   ├── ARCHITECTURE.md   # Architecture details
│   └── AGENTS.md         # Guide for AI agents
├── infra/                # Deployment configurations
└── tooling/              # Build and quality tools
```

## Architecture

We follow **Clean/Onion/Hexagonal Architecture**:

```
Domain (types) ← App (ports) ← Adapters (impl) ← Apps (drivers)
                       ↑
                    Workers
```

Key principles:

- Dependencies point inward
- Domain layer has ZERO dependencies
- All layers are testable in isolation

See `docs/ARCHITECTURE.md` for details.

## Code Quality

### Zero-Warning Policy

**Forbidden patterns** (enforced by pre-commit hooks):

- `// eslint-disable` comments
- `@ts-ignore` (use `@ts-expect-error` with description)
- `@ts-nocheck`
- `console.*` (except API logging)

### TypeScript Strict Mode

All code uses strict TypeScript:

- `strict: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- Explicit return types on all functions

## Testing

### Unit Tests (Vitest)

```bash
pnpm test
pnpm test:watch
```

Tests are colocated with source:

```
src/
  parser.ts
  parser.test.ts
```

### E2E Tests (Playwright)

```bash
pnpm test:e2e
```

Tests include mobile viewports:

- Desktop Chrome, Firefox, Safari
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## Deployment

### Docker

```bash
# Build all services
docker-compose build

# Run locally
docker-compose up

# Production build
docker build -f apps/web/Dockerfile -t bt-log-viewer .
```

### Fly.io

```bash
# Staging
pnpm deploy:staging

# Production
pnpm deploy:prod
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Quick checklist**:

1. Fork and clone the repository
2. Create a branch: `git checkout -b feat/your-feature`
3. Make changes following code quality standards
4. Add tests
5. Run `pnpm verify` to ensure all checks pass
6. Commit with conventional commit message
7. Push and open a Pull Request

## Documentation

- **PRD**: [docs/prd.md](./docs/prd.md) - Full product requirements
- **Architecture**: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Detailed architecture
- **Agent Guide**: [docs/AGENTS.md](./docs/AGENTS.md) - For AI coding assistants
- **API Spec**: [docs/bt-servant-log-api-spec.md](./docs/bt-servant-log-api-spec.md) - BT-Servant integration
- **Contributing**: [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- **Security**: [SECURITY.md](./SECURITY.md) - Security policy

## Roadmap

- **Phase 0**: Scaffold and tooling ✅ (Complete)
- **Phase 1a**: UI shell with mock data (bot competition)
- **Phase 1b**: Backend integration
- **Phase 2**: Parser implementation
- **Phase 3**: Search and filtering
- **Phase 4**: Multi-file support
- **Phase 5**: Visualization

See `docs/prd.md` for detailed breakdown.

## License

[MIT](./LICENSE) (or your preferred license)

## Support

- **Issues**: https://github.com/yourusername/bt-servant-log-viewer/issues
- **Discussions**: https://github.com/yourusername/bt-servant-log-viewer/discussions

---

Built with ❤️ for engineers debugging at 3am.
