# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository rules

- `AGENTS.md` is the authoritative project instruction. For normal work, only modify `CastraView/` and `docs/UI/`.
- Do not modify backend files, Docker files, `.env` files, or generated `package-lock.json` unless the user explicitly changes that scope.
- Do not run `git commit`, `git push`, `git reset`, or other destructive Git operations.
- The frontend is React 19 + Vite 8 in JavaScript. Follow the existing Tailwind v4/shadcn conventions, use `@/` for `CastraView/src`, and use theme tokens rather than new hard-coded colors.
- New frontend API calls belong in `CastraView/src/services/` or the existing API helpers, not directly in page components. Keep displayed copy consistent with the Vietnamese UI and the supplied designs in `docs/UI/`.
- After frontend changes, run `npm run lint` and `npm run build` from `CastraView/` and report both results.

## Common commands

Run commands from the repository root unless noted otherwise.

### Backend local development

```powershell
# Optional: activate the project virtual environment
.\.venv\Scripts\Activate.ps1

# Use SQLite when PostgreSQL/Docker is not running
$env:DATABASE_URL = ""
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

The backend loads the root `.env` through `CastraVision/settings.py`. The legacy
`Utils/supabase_client.py` is imported while URL modules load and requires a non-empty
`SUPABASE_URL` and `SUPABASE_KEY`. The current frontend configuration uses a publishable
key name instead, so a direct local backend run may need a temporary PowerShell alias in
the same terminal:

```powershell
$env:SUPABASE_URL = "https://<project-ref>.supabase.co"
$env:SUPABASE_KEY = "<publishable-key>"
```

Do not commit these values. If the backend is not listening on port 8000, the Vite
frontend reports API calls as `502`; that is a backend startup/proxy symptom, not an
invalid login response.

### Backend tests and checks

```powershell
python manage.py check
pytest -q
pytest CastraServices/tests.py -k test_health_endpoint
pytest CastraServices/test_authentication.py -k test_rejects
ruff check CastraVision CastraServices
```

The backend test configuration is in `pytest.ini`; Django tests use
`DJANGO_SETTINGS_MODULE=CastraVision.settings`. CI runs migrations against PostgreSQL
with pgvector before running coverage tests.

### Frontend local development

```powershell
cd CastraView
npm ci
npm run dev
npm run lint
npm run build
npm run preview
```

Vite serves the app on port 5173 and proxies `/api` to `http://127.0.0.1:8000` by
default. Set `VITE_API_PROXY_TARGET` for a different proxy target. The API helper
accepts the canonical `VITE_API_BASE_URL` and retains compatibility with the older
`VITE_API_URL` name. There is currently no `test` script in `CastraView/package.json`;
frontend files containing Vitest/Testing Library tests are not wired into the declared
package scripts, so do not assume `npm test` is available without first checking the
installed test tooling.

### Full Docker stack

Docker Desktop with WSL2 is required:

```powershell
Copy-Item .env.example .env
 docker compose up --build
```

Compose starts `postgres` (pgvector), `redis`, `backend`, `celery_worker`, and `frontend`.
The backend container runs migrations before Django; the frontend is exposed on port
5173 and the backend on port 8000.

## Architecture

### Runtime flow

`CastraView/src/main.jsx` mounts the single `App` component. `App.jsx` owns the current
session bootstrap, profile/import/strategy state, page selection, notifications, and
logout flow. On startup it requests `auth/csrf/` and `auth/session/`; after login or
registration it loads the business profile and campaign-import history. A missing
profile routes the user to onboarding; an existing profile renders the shared
`layouts/AppShell` and the selected page from `pages/`.

The browser-facing session API is in `CastraView/src/services/api.js`. It sends relative
`/api/...` requests with same-origin cookies and CSRF headers. `CastraView/vite.config.js`
proxies those requests to Django in local development. Supabase-related helpers and a
separate auth provider exist in `src/lib/` and `src/auth/`, but the current main app
flow uses the Django session helper.

### Backend layers

- `CastraVision/settings.py` loads environment variables, selects PostgreSQL from
  `DATABASE_URL` or falls back to SQLite, and configures CORS, Celery, and strategy/RAG
  settings.
- `CastraVision/urls.py` mounts `CastraServices.urls` below `/api/`.
- `CastraServices/account_api.py` owns Django session/CSRF endpoints, registration,
  login/logout, business-profile CRUD, campaign import preview/commit, and import history.
  `models.py` stores `BusinessAccount` and `CampaignImport` records per user.
- `CastraServices/views.py` exposes health and strategy endpoints. `strategy.py` validates
  and generates structured recommendations; it uses OpenAI when configured and falls
  back to a deterministic offline recommendation when no key is present or fallback is
  allowed.
- `CastraServices/rag.py` provides chunking, ingestion, embeddings, and retrieval.
  It uses OpenAI embeddings when configured and a deterministic local hash embedding for
  development/tests. PostgreSQL uses pgvector cosine distance; SQLite ranks vectors in
  Python.
- `CastraServices/tasks.py` contains Celery work for asynchronous knowledge processing.
  Redis is the broker/result backend in Compose.
- `Utils/` contains an older eager Supabase client imported by the health view. Its
  import-time environment requirement can prevent Django from starting before any API
  request is handled.

### Product workflow represented by the UI

The primary Sprint 1 path is: register/login → complete business profile → import CSV/XLSX
campaign history → generate a strategy → review channel allocation and actions → edit
Content Studio drafts. The wider shell also includes budget optimization/recommendation
review, reports/export, competitor insights, and role-oriented dashboard pages. The
strategy response is held in frontend state and passed to Content Studio; it is not a
separate persisted strategy-history service in the current Sprint 1 implementation.

## Important files and references

- `AGENTS.md`: project-specific scope, frontend conventions, and prohibited operations.
- `docs/SPRINT1_UI.md`: implemented UI/API flow and local frontend/backend commands.
- `docs/SPRINT1_SETUP.md`: RAG/strategy setup, Docker workflow, environment variables,
  endpoint examples, and Sprint 1 limitations.
- `CastraView/src/App.jsx`: top-level UI state machine and page composition.
- `CastraView/src/services/api.js`: Django session/CSRF client.
- `CastraView/src/utils/constants.js`: shared channels, business sizes, and shell navigation.
- `CastraServices/urls.py`: backend endpoint map.
- `CastraServices/tests.py`: backend strategy, RAG, account, and import flow coverage.
- `.github/workflows/ci.yml`: CI's authoritative lint, migration, test, and frontend build steps.
