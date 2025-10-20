# Fly.io Deployment Setup

This guide explains how to set up Fly.io deployments for the BT Servant Log Viewer.

## Overview

The project uses a **QA → Production promotion pipeline** via GitHub Actions:

- **QA** (auto-deploys when CI passes on `main`) → `bt-log-viewer-qa.fly.dev`
- **Production** (manual promotion with approval) → `bt-log-viewer.fly.dev`
- **Preview** (`phase-*`, `bot-*` branches) → `bt-log-viewer-{branch-name}.fly.dev`

## Prerequisites

1. **Fly.io Account**: Sign up at https://fly.io
2. **Fly CLI**: Install locally for testing (optional but recommended)

   ```bash
   # macOS
   brew install flyctl

   # Linux
   curl -L https://fly.io/install.sh | sh

   # Windows
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

## One-Time Setup

### 1. Authenticate with Fly.io

```bash
flyctl auth login
```

This opens your browser to complete authentication.

### 2. Get Your API Token

```bash
flyctl auth token
```

Copy the token output. You'll need this for GitHub Actions.

### 3. Add Secret to GitHub Repository

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `FLY_API_TOKEN`
5. Value: Paste the token from step 2
6. Click **Add secret**

### 4. Fly.io Apps Are Created Automatically

**You don't need to manually create apps!** The workflows automatically create apps on first deployment:

- **QA app** (`bt-log-viewer-qa`) - Created on first push to `main` after CI passes
- **Production app** (`bt-log-viewer-prod`) - Created on first manual promotion
- **Preview apps** (`bt-log-viewer-{branch}`) - Created on first push to `phase-*` or `bot-*` branches

If you prefer to create them manually beforehand:

```bash
# Optional: Create apps manually
flyctl apps create bt-log-viewer-qa
flyctl apps create bt-log-viewer-prod
```

### 5. Set BT-Servant API Secrets

**IMPORTANT:** You must configure BT-Servant API tokens for the app to work. These should be set as Fly.io secrets (never committed to git).

Each environment requires **3 variables**:

- `BT_SERVANT_<ENV>_URL` - Base URL (optional, has defaults)
- `BT_SERVANT_<ENV>_TOKEN` - Bearer token for `/admin/logs/*` endpoints
- `BT_SERVANT_<ENV>_ALIVE_TOKEN` - Bearer token for `/alive` health check endpoint

For each environment you want to deploy, set the following secrets:

```bash
# For QA app (auto-deployed from main)
flyctl secrets set \
  BT_SERVANT_DEV_URL=http://localhost:8080 \
  BT_SERVANT_DEV_TOKEN=your-dev-admin-logs-token \
  BT_SERVANT_DEV_ALIVE_TOKEN=your-dev-alive-token \
  BT_SERVANT_QA_URL=https://qa.servant.bible \
  BT_SERVANT_QA_TOKEN=your-qa-admin-logs-token \
  BT_SERVANT_QA_ALIVE_TOKEN=your-qa-alive-token \
  BT_SERVANT_PROD_URL=https://app.servant.bible \
  BT_SERVANT_PROD_TOKEN=your-prod-admin-logs-token \
  BT_SERVANT_PROD_ALIVE_TOKEN=your-prod-alive-token \
  --app bt-log-viewer-qa

# For production app (manual promotion only)
flyctl secrets set \
  BT_SERVANT_DEV_URL=http://localhost:8080 \
  BT_SERVANT_DEV_TOKEN=your-dev-admin-logs-token \
  BT_SERVANT_DEV_ALIVE_TOKEN=your-dev-alive-token \
  BT_SERVANT_QA_URL=https://qa.servant.bible \
  BT_SERVANT_QA_TOKEN=your-qa-admin-logs-token \
  BT_SERVANT_QA_ALIVE_TOKEN=your-qa-alive-token \
  BT_SERVANT_PROD_URL=https://app.servant.bible \
  BT_SERVANT_PROD_TOKEN=your-prod-admin-logs-token \
  BT_SERVANT_PROD_ALIVE_TOKEN=your-prod-alive-token \
  --app bt-log-viewer-prod
```

**Note:** Only set tokens for environments you actually want to use. If you only have DEV credentials, just set those:

```bash
flyctl secrets set \
  BT_SERVANT_DEV_URL=http://localhost:8080 \
  BT_SERVANT_DEV_TOKEN=your-dev-admin-logs-token \
  BT_SERVANT_DEV_ALIVE_TOKEN=your-dev-alive-token \
  --app bt-log-viewer-qa
```

The app will only show servers in the dropdown that have all required credentials configured (URL + TOKEN + ALIVE_TOKEN).

## How Deployments Work

### QA Deployment (Automatic)

- **Trigger**: Automatic when CI passes on `main` branch
- **Prerequisites**: All checks must pass (typecheck, lint, tests, e2e, build)
- **App Name**: `bt-log-viewer-qa`
- **Config**: `infra/fly.qa.toml`
- **URL**: https://bt-log-viewer-qa.fly.dev

**Workflow:**

1. Push to `main` → CI runs all quality checks
2. If all checks pass → Auto-deploy to QA
3. QA is ready for testing and validation

### Production Promotion (Manual)

- **Trigger**: Manual button in GitHub Actions (requires approval)
- **App Name**: `bt-log-viewer-prod`
- **Config**: `infra/fly.production.toml`
- **URL**: https://bt-log-viewer.fly.dev

**How to promote to production:**

1. Go to **Actions** tab in GitHub
2. Select **"Promote to Production"** workflow
3. Click **"Run workflow"**
4. Choose git ref (default: `main`)
5. Wait for approval (if configured)
6. Deployment runs after approval

### Preview Deployments (Bot Competition)

- **Trigger**: Push to `phase-*` or `bot-*` branches
- **App Name**: `bt-log-viewer-{sanitized-branch-name}`
  - Example: `phase-1a` → `bt-log-viewer-phase-1a`
  - Example: `bot-2-attempt` → `bt-log-viewer-bot-2-attempt`
- **Config**: `infra/fly.staging.toml` (single instance, no HA)
- **URL**: `https://bt-log-viewer-{sanitized-branch-name}.fly.dev`

**Branch Name Sanitization:**

- Converted to lowercase
- Non-alphanumeric characters replaced with hyphens
- Truncated to 30 characters max (Fly.io app name limit)

### Manual Deployment

You can also deploy manually from any branch:

```bash
# Deploy to QA manually
flyctl deploy --config infra/fly.qa.toml --app bt-log-viewer-qa

# Deploy to production manually
flyctl deploy --config infra/fly.production.toml --app bt-log-viewer-prod

# Deploy preview from current branch
BRANCH=$(git branch --show-current)
APP_NAME=$(echo "bt-log-viewer-${BRANCH}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g')
flyctl deploy --config infra/fly.qa.toml --app "$APP_NAME" --ha=false
```

## Bot Competition Workflow

For comparing bot implementations side-by-side:

1. **Bot 1** works on `phase-1a` branch
   - Push to GitHub
   - Workflow automatically deploys to `https://bt-log-viewer-phase-1a.fly.dev`

2. **Bot 2** works on `bot-2-attempt` branch
   - Push to GitHub
   - Workflow automatically deploys to `https://bt-log-viewer-bot-2-attempt.fly.dev`

3. **Compare** both URLs in your browser

## Cleanup

Preview apps remain active until manually deleted. To clean up old preview deployments:

```bash
# List all apps
flyctl apps list

# Delete a preview app
flyctl apps destroy bt-log-viewer-phase-1a
```

Or use the Fly.io dashboard: https://fly.io/dashboard

## Testing Your Deployment

### Quick Test Steps

1. **Set secrets** (if not already done):

   ```bash
   flyctl secrets set \
     BT_SERVANT_DEV_URL=http://localhost:8080 \
     BT_SERVANT_DEV_TOKEN=your-actual-admin-logs-token \
     BT_SERVANT_DEV_ALIVE_TOKEN=your-actual-alive-token \
     --app bt-log-viewer-qa
   ```

2. **Test QA deployment**:

   ```bash
   # Push to main (will trigger CI → QA deployment if all checks pass)
   git push origin main
   ```

3. **Wait for CI and deployment** (check GitHub Actions tab)
   - CI jobs must pass first (verify, e2e, build)
   - Then QA deployment runs automatically

4. **Visit QA app**:

   ```
   https://bt-log-viewer-qa.fly.dev
   ```

5. **Check connection status**:
   - Look at bottom-right footer
   - Should show "Dev: Connected" (green) if working
   - Should show "Dev: Disconnected" (red) if token is invalid

6. **View logs** (if issues):

   ```bash
   flyctl logs --app bt-log-viewer-qa
   ```

7. **Promote to production** (when ready):
   - Go to GitHub Actions → "Promote to Production"
   - Click "Run workflow"
   - Wait for approval (if configured)
   - Visit: https://bt-log-viewer.fly.dev

### Verify Health Check

You can test the health check endpoint directly:

```bash
# QA environment
curl https://bt-log-viewer-qa.fly.dev/api/logs/health
# Should return {"dev":true,"qa":false,"prod":false} if only dev secrets are set

# Production environment
curl https://bt-log-viewer.fly.dev/api/logs/health
```

Note: The health check calls `<BT_SERVANT_URL>/alive` with the `ALIVE_TOKEN` (not the admin logs token).

## Troubleshooting

### "No access token available" error

- Ensure `FLY_API_TOKEN` secret is set in GitHub repository settings
- Verify the token hasn't expired (regenerate if needed with `flyctl auth token`)

### App creation fails

- Check that the app name is unique and follows Fly.io naming rules
- App names must be lowercase alphanumeric with hyphens only
- Maximum 30 characters

### Deployment succeeds but app doesn't start

- Check logs: `flyctl logs --app bt-log-viewer-qa`
- Verify Dockerfile builds correctly locally
- Ensure environment variables are set correctly in fly.toml

### Server shows "Disconnected" in footer

- **Check secrets are set**: `flyctl secrets list --app bt-log-viewer-qa`
- **Verify token is valid**: Test with curl against BT-Servant API directly
- **Check logs**: `flyctl logs --app bt-log-viewer-qa` for auth errors
- **Test health endpoint**: `curl https://bt-log-viewer-qa.fly.dev/api/logs/health`

### No servers appear in dropdown

- **No secrets configured**: Set at least one server's URL and token
- **Check `/api/logs/servers` endpoint**:
  ```bash
  curl https://your-app.fly.dev/api/logs/servers
  # Should return: {"servers":["qa"]} or similar
  ```

## Cost Considerations

- **Free tier**: Fly.io provides free allowances that should cover development/staging
- **Preview apps**: Use `--ha=false` (single instance) to minimize resource usage
- **Cleanup**: Delete preview apps when branches are merged/deleted to avoid unnecessary charges

## Further Reading

- [Fly.io Documentation](https://fly.io/docs/)
- [Fly.io Pricing](https://fly.io/docs/about/pricing/)
- [Continuous Deployment with GitHub Actions](https://fly.io/docs/app-guides/continuous-deployment-with-github-actions/)
