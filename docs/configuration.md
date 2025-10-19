# Configuration Guide

This guide explains how to configure the BT Servant Log Viewer for local development and production deployment.

## Table of Contents

- [Overview](#overview)
- [Local Development Setup](#local-development-setup)
- [Production Deployment](#production-deployment)
- [Environment Variables Reference](#environment-variables-reference)
- [Security Best Practices](#security-best-practices)

## Overview

The BT Servant Log Viewer uses a **backend proxy architecture** to securely access BT-Servant log files:

```
Browser (Frontend) → Fastify API (Backend) → BT-Servant API
```

This architecture ensures that:

- Bearer tokens are **never exposed** to the browser
- All authentication happens server-side
- Tokens are stored securely in environment variables or secrets management

## Local Development Setup

### Prerequisites

- Node.js 22+
- pnpm 9+
- Access to BT-Servant API tokens (QA, Prod, or Local)

### Step 1: Clone and Install

```bash
git clone <repository-url>
cd bt-servant-log-viewer
pnpm install
```

### Step 2: Configure Backend API

```bash
cd apps/api
cp .env.example .env
```

Edit `apps/api/.env` and add your BT-Servant API tokens:

```bash
# Required for QA server access
BT_SERVANT_QA_URL=https://qa.servant.bible
BT_SERVANT_QA_TOKEN=your-actual-qa-token

# Required for Production server access
BT_SERVANT_PROD_URL=https://app.servant.bible
BT_SERVANT_PROD_TOKEN=your-actual-prod-token

# Optional: Local development instance
BT_SERVANT_LOCAL_URL=http://localhost:8080
BT_SERVANT_LOCAL_TOKEN=your-local-token
```

### Step 3: Configure Frontend (Optional)

```bash
cd apps/web
cp .env.example .env
```

For local development, you typically don't need to change anything in `apps/web/.env`. The frontend will automatically detect localhost and use `http://localhost:3001` for the API.

If you need to override the API URL:

```bash
PUBLIC_API_URL=http://localhost:3001
```

### Step 4: Run Development Servers

```bash
# From repository root
pnpm dev
```

This starts:

- Frontend (SvelteKit): http://localhost:5173
- Backend API (Fastify): http://localhost:3001

### Step 5: Verify Configuration

1. Open http://localhost:5173 in your browser
2. The app should automatically start loading logs from the QA server
3. Use the server dropdown to switch between QA and Production
4. Check the browser console for any errors

## Production Deployment

### Fly.io Deployment (Recommended)

The project is configured for automatic deployment to Fly.io via GitHub Actions. See the complete setup guide: [docs/fly-io-setup.md](./fly-io-setup.md)

#### Quick Start

1. **Set up GitHub secret** (one-time):

   ```bash
   # Get your Fly.io token
   flyctl auth token

   # Add FLY_API_TOKEN secret to GitHub repository settings
   # Settings → Secrets and variables → Actions → New repository secret
   ```

2. **Set BT-Servant API secrets** for your app:

   ```bash
   # For your preview branch (e.g., phase-1b)
   flyctl secrets set \
     BT_SERVANT_QA_URL=https://qa.servant.bible \
     BT_SERVANT_QA_TOKEN=your-actual-qa-token \
     --app bt-log-viewer-phase-1b
   ```

3. **Deploy** by pushing to GitHub:

   ```bash
   git push origin phase-1b
   ```

4. **Visit** your deployed app:

   ```
   https://bt-log-viewer-phase-1b.fly.dev
   ```

5. **Verify** connection status in footer (bottom-right):
   - Green "QA: Connected" = working ✅
   - Red "QA: Disconnected" = check secrets/token ❌

#### Deployment Targets

- **Production**: Push to `main` → `bt-log-viewer-prod.fly.dev`
- **Staging**: Push to `develop` → `bt-log-viewer-staging.fly.dev`
- **Preview**: Push to `phase-*` or `bot-*` → `bt-log-viewer-{branch}.fly.dev`

For detailed setup, troubleshooting, and advanced configuration, see [docs/fly-io-setup.md](./fly-io-setup.md).

### Other Hosting Providers

For other hosting providers (Vercel, Netlify, Railway, etc.):

1. **Backend API**: Deploy `apps/api` as a Node.js service
2. **Frontend**: Deploy `apps/web` as a static site or Node.js app
3. **Environment Variables**: Set all required variables in your hosting provider's dashboard

Required environment variables for backend:

- `BT_SERVANT_QA_TOKEN`
- `BT_SERVANT_PROD_TOKEN`
- `BT_SERVANT_QA_URL`
- `BT_SERVANT_PROD_URL`
- `CORS_ORIGIN`

Optional for frontend:

- `PUBLIC_API_URL` (if backend is on different domain)

## Environment Variables Reference

### Backend API (`apps/api`)

| Variable                 | Required | Default                     | Description                                                      |
| ------------------------ | -------- | --------------------------- | ---------------------------------------------------------------- |
| `NODE_ENV`               | No       | `development`               | Node environment (`development`, `production`)                   |
| `PORT`                   | No       | `3001`                      | Port for API server                                              |
| `HOST`                   | No       | `0.0.0.0`                   | Host to bind to                                                  |
| `LOG_LEVEL`              | No       | `info`                      | Fastify log level (`debug`, `info`, `warn`, `error`)             |
| `CORS_ORIGIN`            | No       | `true`                      | CORS allowed origins (use `true` for dev, specific URL for prod) |
| `BT_SERVANT_QA_URL`      | Yes\*    | `https://qa.servant.bible`  | QA BT-Servant base URL                                           |
| `BT_SERVANT_QA_TOKEN`    | Yes\*    | -                           | QA API Bearer token                                              |
| `BT_SERVANT_PROD_URL`    | Yes\*    | `https://app.servant.bible` | Production BT-Servant base URL                                   |
| `BT_SERVANT_PROD_TOKEN`  | Yes\*    | -                           | Production API Bearer token                                      |
| `BT_SERVANT_LOCAL_URL`   | No       | `http://localhost:8080`     | Local BT-Servant base URL                                        |
| `BT_SERVANT_LOCAL_TOKEN` | No       | -                           | Local API Bearer token                                           |

\* Required in production. In development, missing tokens will log a warning but won't fail startup.

### Frontend Web (`apps/web`)

| Variable         | Required | Default       | Description                                |
| ---------------- | -------- | ------------- | ------------------------------------------ |
| `PUBLIC_API_URL` | No       | Auto-detected | Backend API base URL. Empty = same origin. |

**Auto-detection logic**:

- If hostname includes `localhost`: Use `http://localhost:3001`
- Otherwise: Use empty string (same origin as frontend)

## Security Best Practices

### Never Commit Tokens

- ✅ Use `.env` files (already in `.gitignore`)
- ✅ Use secrets management (Fly.io secrets, GitHub secrets)
- ❌ Never commit tokens to version control
- ❌ Never expose tokens in frontend code

### Token Rotation

Rotate BT-Servant API tokens periodically:

```bash
# Update Fly.io secret
fly secrets set BT_SERVANT_QA_TOKEN=new-token

# Update local .env
# Edit apps/api/.env manually
```

### CORS Configuration

**Development**: Allow all origins

```bash
CORS_ORIGIN=true
```

**Production**: Restrict to your frontend domain

```bash
CORS_ORIGIN=https://bt-log-viewer.fly.dev
```

### Environment Validation

The backend validates all required environment variables on startup:

```typescript
// apps/api/src/server.ts
validateBtServantConfig(); // Throws if tokens missing in production
```

This ensures you catch configuration errors early.

## Troubleshooting

### "Configuration validation failed"

**Error**: Missing `BT_SERVANT_*_TOKEN` environment variables

**Solution**:

1. Check that `.env` file exists in `apps/api/`
2. Verify all tokens are set correctly
3. For Fly.io: Run `fly secrets list` to verify secrets

### "Failed to load logs"

**Causes**:

1. Invalid or expired Bearer token
2. Incorrect BT-Servant URL
3. Network connectivity issues
4. CORS misconfiguration

**Debug steps**:

1. Check browser console for error details
2. Check backend logs: `fly logs` or local terminal
3. Verify token is valid by testing with curl:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://qa.servant.bible/admin/logs/files
   ```

### Frontend can't connect to backend

**Development**:

- Ensure backend is running: `pnpm dev:api`
- Check API is accessible: http://localhost:3001/health
- Verify frontend is using correct URL (check browser Network tab)

**Production**:

- Ensure `PUBLIC_API_URL` is set correctly (or empty for same-origin)
- Check CORS configuration
- Verify backend is deployed and healthy

## Examples

### Example Local Development Setup

```bash
# apps/api/.env
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug
CORS_ORIGIN=true
BT_SERVANT_QA_TOKEN=sk_test_abc123...
BT_SERVANT_PROD_TOKEN=sk_prod_xyz789...

# apps/web/.env
# Empty or:
PUBLIC_API_URL=http://localhost:3001
```

### Example Production Setup (Fly.io)

```bash
# Set via Fly.io CLI
fly secrets set \
  BT_SERVANT_QA_TOKEN=sk_qa_real_token \
  BT_SERVANT_PROD_TOKEN=sk_prod_real_token \
  CORS_ORIGIN=https://bt-log-viewer.fly.dev \
  NODE_ENV=production
```

### Example Docker Setup

```bash
# docker-compose.yml or environment section
services:
  api:
    environment:
      NODE_ENV: production
      BT_SERVANT_QA_TOKEN: ${BT_SERVANT_QA_TOKEN}
      BT_SERVANT_PROD_TOKEN: ${BT_SERVANT_PROD_TOKEN}
      CORS_ORIGIN: https://your-frontend-url.com
```

## Support

For issues or questions:

- Check [troubleshooting](#troubleshooting) section
- Review API logs for detailed error messages
- Verify environment variables match [reference](#environment-variables-reference)
