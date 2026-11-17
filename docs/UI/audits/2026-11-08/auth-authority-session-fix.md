# Authority and session fixes — 2026-11-08

Scope: the two authentication defects identified in the four-role audit.
No hosted Supabase changes, schema cutover, account grants, Git commits or pushes.
The earlier functional audit remains a baseline; this change does not implement
the dashboard screens that still use mock data.

## Identity and authorization

- Supabase Auth is the product's sole identity source. The frontend's AuthProvider
  restores, refreshes and signs out SDK sessions; passwords are sent to Supabase.
- Django validates the bearer token with `GET /auth/v1/user`, using the public
  API key. This supports both local asymmetric tokens and hosted token schemes
  without sharing a signing secret or trusting an unverified JWT payload.
- `/api/auth/session/` supplies a versioned context bound to the authenticated
  UUID. System Admin requires Auth-server `app_metadata.platform_role` equal to
  `system_admin` (the exact server-managed `app_metadata.role=system_admin` is
  also supported). Editable `user_metadata`, email patterns and cached user roles
  grant nothing. Workspace `admin` is never promoted to System Admin.
- Workspace roles come only from `workspace_members` via the user's JWT and RLS.
  Current main uses legacy DB labels: `admin` → Marketing Manager, `manager` →
  Leader, `member` → Employee. This is not deployment of the separate v1.4 schema.
- No membership means pending access, not an invented Employee Workspace.
  Multiple memberships require selection; local storage saves only the selected
  Workspace UUID per user. The backend revalidates selection on every request.

The product transport sends bearer JWT plus `X-Workspace-ID` and explicitly omits
cookies. CORS allows these headers for configured frontend origins. Profile,
campaign imports/history and connection probes use the caller's Supabase Data API
client. Strategy generation requires authenticated Workspace membership before
calling a provider. A System Admin context cannot call these business endpoints.
Direct Supabase Data API permissions continue to be defined by existing RLS;
rendering a different frontend never grants database privileges.

## Retired parallel session flow

Product `/api/auth/login/`, `register/`, `logout/`, and `csrf/` return HTTP 410.
The frontend does not call them or fall back to Django accounts after an Auth
failure. Django `/admin/` remains a separate operator interface.

Existing Django users, passwords and SQLite business records are not copied or
merged by email. Product data now comes from the selected Supabase Workspace.
Accounts that formerly reached System Admin using unsafe hints will lose that
interface until an operator explicitly assigns the server-managed role. Nothing
in this patch automatically grants that role or changes a hosted account.

Expired/invalid API tokens fail closed; SDK refresh supplies subsequent tokens.
Signing out removes the local SDK session and revokes its refresh session.
As with normal Supabase JWT sessions, an already issued access token can remain
valid until expiration; this patch does not claim immediate global JWT revocation.
Supabase unavailability returns 503 rather than trying a Django session.

## Verification

- `python -m pytest -q`: 29 passed. Coverage includes cookies without JWT,
  foreign Workspace IDs, editable role hints, server role revocation, unconfirmed
  email, Auth outages, retired password routes, bearer-only profile/import calls,
  anonymous strategy rejection and cross-origin preflight.
- `cd CastraView && npm run test:auth`: 11 passed. Covers identity binding,
  role-source precedence, multiple Workspace selection, token refresh transport,
  cookie omission, missing sessions and API 401 handling.
- `python scripts/auth/verify_local_session.py`: 42 PASS checks against real
  local GoTrue/PostgREST, including all four roles plus an unassigned user,
  real JWTs, multi-Workspace ambiguity, RLS memberships, profile writes, CSV
  preview/commit/history, foreign Workspace rejection, refresh and logout.
  The script only accepts the separate `CastraVision-auth-sync-test` container,
  its project label and ports 56321/56322. Credentials stay in memory and fixture
  data is cleaned. The disposable stack uses current main migrations.
- Browser test on separate frontend 56300/backend 58000: a real signup carrying
  an editable System Admin hint remained pending; changing its authoritative
  membership and reloading produced Marketing Manager, Leader and Employee
  interfaces. Only a server-side platform-role grant produced System Admin.
  Real form login, reload/session restoration, profile save, business API 403 for
  Employee/System Admin and logout back to login were exercised. Test users and
  Workspace were deleted afterward. The normal app configuration was unchanged.
- Frontend build succeeds. Frontend lint has no errors; 16 pre-existing warnings
  remain. Targeted Ruff and `git diff --check` pass. Full backend Ruff still finds
  two pre-existing issues in untouched `CastraServices/supabase_auth_client.py`
  (unused import and import order).
- Gitleaks on changed/new authentication source: zero findings; `.env` was neither
  read nor included in the scan. This is not a claim that old Git history is clean.

The email callback must still use an origin reachable from the device opening
the confirmation link. This patch does not make desktop localhost reachable from
a phone, configure SMTP, or disable email confirmation on a hosted project.
