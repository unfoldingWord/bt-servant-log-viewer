# Fly.io Deployment Setup

This guide explains how to set up Fly.io deployments for the BT Servant Log Viewer.

## Overview

The project is configured for automatic deployments via GitHub Actions:

- **Production** (`main` branch) → `bt-log-viewer.fly.dev`
- **Staging** (`develop` branch) → `bt-log-viewer-staging.fly.dev`
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

### 4. Create Fly.io Apps (First Deploy Only)

The workflows will attempt to create apps automatically, but you can create them manually if preferred:

```bash
# Production app
flyctl apps create bt-log-viewer-prod

# Staging app
flyctl apps create bt-log-viewer-staging
```

For preview apps, the workflow creates them automatically using the branch name.

### 5. Set BT-Servant API Secrets

**IMPORTANT:** You must configure BT-Servant API tokens for the app to work. These should be set as Fly.io secrets (never committed to git).

Each environment requires **3 variables**:

- `BT_SERVANT_<ENV>_URL` - Base URL (optional, has defaults)
- `BT_SERVANT_<ENV>_TOKEN` - Bearer token for `/admin/logs/*` endpoints
- `BT_SERVANT_<ENV>_ALIVE_TOKEN` - Bearer token for `/alive` health check endpoint

For each environment you want to deploy, set the following secrets:

```bash
# For staging/preview apps
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
  --app bt-log-viewer-staging

# For production app (use same command but change --app)
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
  --app bt-log-viewer-staging
```

The app will only show servers in the dropdown that have all required credentials configured (URL + TOKEN + ALIVE_TOKEN).

## How Deployments Work

### Production Deployment

- **Trigger**: Push to `main` branch or manual workflow dispatch
- **App Name**: `bt-log-viewer-prod`
- **Config**: `infra/fly.production.toml`
- **URL**: https://bt-log-viewer.fly.dev

### Staging Deployment

- **Trigger**: Push to `develop` branch or manual workflow dispatch
- **App Name**: `bt-log-viewer-staging`
- **Config**: `infra/fly.staging.toml`
- **URL**: https://bt-log-viewer-staging.fly.dev

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
# Deploy to a specific app
flyctl deploy --config infra/fly.staging.toml --app bt-log-viewer-staging

# Deploy preview from current branch
BRANCH=$(git branch --show-current)
APP_NAME=$(echo "bt-log-viewer-${BRANCH}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g')
flyctl deploy --config infra/fly.staging.toml --app "$APP_NAME" --ha=false
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
     --app bt-log-viewer-staging
   ```

2. **Deploy to staging**:

   ```bash
   # From your current branch (e.g., phase-1b)
   git push origin phase-1b
   ```

3. **Wait for deployment** (check GitHub Actions tab)

4. **Visit your app**:

   ```
   https://bt-log-viewer-phase-1b.fly.dev
   ```

5. **Check connection status**:
   - Look at bottom-right footer
   - Should show "Dev: Connected" (green) if working
   - Should show "Dev: Disconnected" (red) if token is invalid

6. **View logs** (if issues):
   ```bash
   flyctl logs --app bt-log-viewer-phase-1b
   ```

### Verify Health Check

You can test the health check endpoint directly:

```bash
# Should return {"dev":true,"qa":false,"prod":false} if only dev secrets are set
curl https://bt-log-viewer-phase-1b.fly.dev/api/logs/health
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

- Check logs: `flyctl logs --app bt-log-viewer-staging`
- Verify Dockerfile builds correctly locally
- Ensure environment variables are set correctly in fly.toml

### Server shows "Disconnected" in footer

- **Check secrets are set**: `flyctl secrets list --app bt-log-viewer-phase-1b`
- **Verify token is valid**: Test with curl against BT-Servant API directly
- **Check logs**: `flyctl logs --app bt-log-viewer-phase-1b` for auth errors
- **Test health endpoint**: `curl https://your-app.fly.dev/api/logs/health`

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
