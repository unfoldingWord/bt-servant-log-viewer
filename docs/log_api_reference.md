# BT Servant Admin Log API Reference

This guide is for the log-viewer bot/app that needs to browse and download BT Servant log files through the admin log endpoints.

## Base URL

- Endpoints are served by the primary FastAPI app under the `/admin/logs` namespace.
- Use the deployment's API origin (for example `https://bt-servant.example.com`) and append the paths listed below.

## Authentication

- Admin log routes require credentials when `ENABLE_ADMIN_AUTH` is `true` (default).
- Provide the admin token in one of these headers:
  - `Authorization: Bearer <ADMIN_API_TOKEN>`
  - `X-Admin-Token: <ADMIN_API_TOKEN>`
- Missing or invalid credentials return `401 Unauthorized` and include `WWW-Authenticate: Bearer`.

## Response Envelope

Listing endpoints respond with:

```jsonc
{
  "files": [
    {
      "name": "bt_servant.log",
      "size_bytes": 12345,
      "modified_at": "2024-05-01T18:34:12Z",
      "created_at": "2024-05-01T17:00:00Z",
    },
  ],
  "total_files": 1,
  "total_size_bytes": 12345,
}
```

- `modified_at` / `created_at` are ISO-8601 timestamps in UTC (`Z` suffix).
- `size_bytes` is the raw byte size of the file.

## Endpoints

### `GET /admin/logs/files`

- Lists every `.log` file in the resolved logs directory.
- Sorted newest first (descending `modified_at`).
- Errors:
  - `404` if the directory is missing or not readable.
  - `500` for unexpected I/O issues.

**Example**

```bash
curl -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  "$BASE_URL/admin/logs/files"
```

### `GET /admin/logs/files/{filename}`

- Streams the requested log file as UTF-8 text.
- The filename must end with `.log`; traversal (`/`, `\`, `..`) is rejected.
- Sets `Content-Disposition: attachment; filename="<actual-name>"` and `Content-Length`.
- Errors:
  - `400` for invalid filenames.
  - `404` if the file does not exist or is inaccessible.
  - `500` for unexpected read failures.

**Example**

```bash
curl -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  "$BASE_URL/admin/logs/files/bt_servant.log" -o bt_servant.log
```

### `GET /admin/logs/recent`

- Filtered list of log files updated within the last `days`.
- Query params (validated server-side):
  - `days`: default `7`, allowed range `1–90`.
  - `limit`: default `100`, allowed range `1–500`.
- Response payload matches `/admin/logs/files` but only includes the filtered subset; totals recompute accordingly.
- Errors:
  - `400` when `days` or `limit` fall outside permitted ranges.
  - Other errors mirror the full listing endpoint.

**Example**

```bash
curl -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  "$BASE_URL/admin/logs/recent?days=3&limit=20"
```

## Logs Directory Resolution

The application determines the log directory at startup in this order:

1. `BT_SERVANT_LOG_DIR` (if set).
2. `<repo root>/logs`.
3. `<DATA_DIR>/logs` (defaults to `/data`).
4. `bt_servant_engine/logs` inside the package.

The chosen directory is created if possible, and the default log file is `bt_servant.log` within it.

## Integration Notes for the Log Viewer Bot

- Call `/admin/logs/files` (or `/recent`) to populate file pickers; defer `/files/{filename}` until the user requests content to avoid large transfers.
- Respect the server-side filename validation client-side to prevent unnecessary `400` responses.
- Surface `404` or `500` errors to operators—they indicate missing or permission-denied storage.
- Cache listing results briefly if the viewer polls frequently; the server rescans the filesystem on each call.
- When admin auth is disabled (rare, e.g., staging with `ENABLE_ADMIN_AUTH=false`), the endpoints accept unauthenticated requests—handle `401` responses to detect and prompt for tokens dynamically.
