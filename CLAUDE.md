# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

## Repository architecture

CastraVision is a full-stack marketing assistant:

- `CastraServices/` contains the Django REST API, models, authentication, permissions, campaign/business endpoints, background tasks, and migrations.
- `CastraVision/` contains Django project configuration and URL/WSGI/ASGI entry points.
- `CastraView/` is the React/Vite frontend. `src/main.jsx` mounts `App.jsx`.
- `Utils/`, `Datasources/`, `data/`, `docs/`, and `supabase/` hold supporting utilities, external-data integrations, sample data, documentation, and Supabase-related scripts.
- `.github/workflows/ci.yml` runs backend Ruff/pytest checks and frontend dependency installation, lint, and build checks.

The product flow is layered: users configure business and campaign data, the backend exposes authenticated API operations, AI-oriented services produce strategy/content/budget outputs, and the frontend presents those workflows with role-based access.

## Development commands

Frontend commands run from `CastraView/`:

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

Vite proxies `/api` to `http://127.0.0.1:8000` by default. Override this with `VITE_API_PROXY_TARGET`. The Supabase-backed API helper also reads `VITE_API_URL`.

Backend commands run from the repository root:

```bash
python manage.py runserver
python manage.py migrate
pytest
pytest CastraServices/test_authentication.py
ruff check CastraVision CastraServices
```

`CastraView/package.json` currently has no `test` script and does not declare Vitest or Testing Library, although Vitest configuration and frontend test files are present. Do not install dependencies as part of ordinary changes or assume frontend tests run. If the repository’s test dependencies are available in the environment, run one test file from `CastraView/` with:

```bash
npx vitest run src/auth/permissions.test.js
```

## Frontend data and role flow

`App.jsx` owns the active Django-session flow: session bootstrap, `/api/...` calls with same-origin credentials and CSRF headers, profile/campaign/strategy state, page selection, toast state, logout, and active platform/workspace rendering.

There is also a separate legacy/Supabase-oriented actor flow in `actor-ui/ActorPages.jsx`. Do not merge its authentication with `App.jsx`:

- `App.jsx` uses its local Django-session API helper.
- `lib/api.js` obtains a Supabase access token before calling the API.
- `auth/AuthProvider.jsx` resolves Supabase workspace membership and role.

Workspace role identifiers are `admin`, `manager`, and `member`. `manager` is displayed as **Leader** and `member` as **Member**; these are display labels only and must not replace stored/API values. Platform roles are `system_admin` and `company_admin`.

- `auth/permissions.js` defines workspace capabilities, default landing pages, role resolution, and FR04 approval-queue authorization.
- `navigation.js` defines platform/workspace navigation and capability filtering.
- `company-admin/` and `system-admin/` contain platform-role layouts and must remain independent of workspace dashboard changes.
- `member/screens/` and `leader/screens/` contain screen-level composition and interaction state; corresponding `ui/` directories contain presentational views and role-scoped styles.
- `actor-ui/ActorPages.jsx` owns shared actor primitives and compatibility exports. Preserve existing exports used by tests or callers.

Preserve onboarding gates, capability filtering, direct page authorization, role identifiers, session behavior, CSRF handling, API payloads, and unrelated platform-role behavior when changing frontend screens.

## Frontend styling and rules

The frontend uses global project styles and `--cv-*` design tokens in addition to role/platform styles. New role-specific selectors should be scoped with role-prefixed class names and should reuse existing tokens rather than changing broad global selectors.

The checked-in `.claude/rules/` files are authoritative. Their important project-specific requirements are focused functional React components, clear and testable code, CSS variables, accessible UI, input validation at API boundaries, and preservation of authentication/authorization contracts. Comments should explain constraints or reasons rather than restating code. Use the existing Conventional Commits format only when a commit is explicitly requested.

For Figma-based UI work, inspect the relevant design frame and existing project components/tokens first. If the design source is unavailable, implement only from confirmed repository behavior and state that visual fidelity is unverified.
