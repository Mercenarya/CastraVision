# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Repository rules

- `AGENTS.md` is the authoritative project instruction. For normal work, only modify `CastraView/` and `docs/UI/`.
- Do not modify backend files, Docker files, `.env` files, or generated `package-lock.json` unless the user explicitly changes that scope.
- Do not run `git commit`, `git push`, `git reset`, `git clean`, or other destructive Git operations.
- The frontend is React 19 + Vite 8 in JavaScript. Follow the existing Tailwind/shadcn conventions, use `@/` for `CastraView/src`, and use theme tokens rather than new hard-coded colors.
- New frontend API calls belong in `CastraView/src/services/` or existing API helpers, not directly in page components.
- After frontend changes, run `npm run lint` and `npm run build` from `CastraView/` and report both results.

## Repository architecture

CastraVision is a full-stack marketing assistant:

- `CastraServices/` contains the Django REST API, models, authentication, permissions, campaign/business endpoints, background tasks, and migrations.
- `CastraVision/` contains Django project configuration and URL/WSGI/ASGI entry points.
- `CastraView/` is the React/Vite frontend. `src/main.jsx` mounts `App.jsx`.
- `Utils/`, `Datasources/`, `data/`, `docs/`, and `supabase/` hold supporting utilities, external-data integrations, sample data, documentation, and Supabase-related scripts.
- `.github/workflows/ci.yml` runs backend checks and frontend dependency installation, lint, and build checks.

## Common commands

Frontend commands run from `CastraView/`:

```powershell
cd CastraView
npm ci
npm run dev
npm run lint
npm run build
npm run preview
```

Backend commands run from the repository root:

```powershell
python manage.py check
pytest -q
ruff check CastraVision CastraServices
```

Vite proxies `/api` to `http://127.0.0.1:8000` by default. Override this with
`VITE_API_PROXY_TARGET`. The API helper accepts `VITE_API_BASE_URL` and retains
compatibility with `VITE_API_URL`.

The frontend has no declared `test` script. Check installed tooling before running
Vitest; existing test files may be run directly with `npx vitest run` when available.
Do not install dependencies or alter lockfiles as part of ordinary changes.

## Frontend data and role flow

`App.jsx` owns the active Django-session flow: session bootstrap, `/api/...` calls with
same-origin credentials and CSRF headers, profile/campaign/strategy state, page selection,
notifications, logout, and active platform/workspace rendering.

There is also a separate Supabase-oriented actor flow in `actor-ui/ActorPages.jsx`.
Do not merge its authentication with `App.jsx`:

- `App.jsx` uses the Django-session API helper.
- `lib/api.js` obtains a Supabase access token before calling the API.
- `auth/AuthProvider.jsx` resolves Supabase workspace membership and role.

Workspace role identifiers are `admin`, `manager`, and `member`. `manager` may be
displayed as Leader and `member` as Employee; display labels must not replace stored/API
values. Platform roles are `system_admin` and `company_admin`.

- `auth/permissions.js` defines workspace capabilities, default landing pages, role resolution, and FR04/FR11 authorization.
- `navigation.js` defines platform/workspace navigation and capability filtering.
- `company-admin/` and `system-admin/` contain platform-role layouts and remain independent of workspace dashboard changes.
- `member/screens/` and `leader/screens/` contain role-specific composition and interaction state.

Preserve onboarding gates, capability filtering, direct page authorization, role identifiers,
session behavior, CSRF handling, API payloads, and unrelated platform-role behavior.

## Runtime architecture

`CastraView/src/main.jsx` mounts `App`. On startup the app requests `auth/csrf/` and
`auth/session/`; after login or registration it loads the business profile and campaign
import history. A missing profile routes to onboarding; an existing profile renders the
selected page.

The browser-facing session API is in `CastraView/src/services/api.js`. It sends relative
`/api/...` requests with same-origin cookies and CSRF headers. Supabase helpers and a
separate auth provider exist in `src/lib/` and `src/auth/`, but the current main app flow
uses the Django session helper.

The primary workflow is register/login → complete business profile → import CSV/XLSX
campaign history → generate a strategy → review channel allocation and actions → edit
Content Studio drafts. The strategy response is held in frontend state and is not a
separate persisted strategy-history service in the current Sprint 1 implementation.

## Styling and testing

The frontend uses global project styles and `--cv-*` design tokens in addition to
role/platform styles. New role-specific selectors should be scoped with role-prefixed
class names and reuse existing tokens. Components should be focused functional React
components with accessible controls, input validation at API boundaries, and comments that
explain constraints rather than restating code.

For Figma-based UI work, inspect relevant design frames and existing project components
and tokens first. If the design source is unavailable, implement only confirmed behavior
and state that visual fidelity is unverified.

## Important files

- `CastraView/src/App.jsx` — top-level UI state machine and page composition.
- `CastraView/src/services/api.js` — Django session/CSRF client.
- `CastraView/src/auth/permissions.js` — role capabilities and authorization helpers.
- `CastraView/src/navigation.js` — role-filtered navigation.
- `CastraServices/urls.py` — backend endpoint map.
- `docs/SPRINT1_UI.md` and `docs/SPRINT1_SETUP.md` — implemented flow and setup limitations.
- `.github/workflows/ci.yml` — CI checks.
