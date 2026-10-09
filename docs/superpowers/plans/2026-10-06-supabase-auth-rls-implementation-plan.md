# CastraVision Supabase Auth and RLS Implementation Plan

Date: 2026-10-06  
Status: Ready for implementation  
Design: `../specs/2026-10-06-supabase-auth-rls-design.md`

## Objective

Replace product-facing Django session authentication with Supabase Auth, make
`auth.users.id` the only product identity, enforce the Admin/Manager/Member
matrix with PostgreSQL RLS, and retain Django for protected import, RAG, LLM,
and Celery workloads. Preserve the current Sprint 1 behavior while making the
three actors receive distinct interfaces and permissions.

## Delivery rules

- Do not edit migrations that have already been applied. Add forward-only
  Supabase and Django migrations.
- Do not commit `.env`, database URLs, passwords, JWTs, anon/publishable keys,
  service-role keys, or provider secrets.
- Do not run a destructive schema operation or remove legacy Django data during
  this delivery.
- Do not push a live Supabase migration until the schema backup, migration
  history, role-policy tests, and target project ref have been verified.
- Implement each task test-first where practical and keep commits independently
  reviewable.

## Phase 0: Baseline and safeguards

### Task 1: Record the current application and database baseline

**Inspect:**

- `CastraServices/account_api.py`
- `CastraServices/views.py`
- `CastraServices/urls.py`
- `CastraServices/tests.py`
- `CastraVision/settings.py`
- `CastraView/src/App.jsx`
- `CastraView/src/App.test.jsx`
- `supabase/migrations/20261004083830_init_schema.sql`
- `supabase/migrations/20261005020000_harden_rls_policies.sql`
- `supabase/audit_schema.py`

**Actions:**

1. Run the existing Django, frontend, lint, build, database-audit, and Docker
   checks and save only non-secret results.
2. Inventory existing Django users, `BusinessAccount`, `CampaignImport`, and all
   Supabase business-table row counts.
3. Confirm the linked Supabase project ref is
   `oviqgptccjjdaaqxabwv` without printing credentials.
4. Scan tracked files for passwords, database URLs, service-role keys, and JWTs.
5. Stop the migration if baseline tests fail for an unrelated existing reason;
   document it before changing authentication.

**Verification:**

```powershell
python manage.py check
python manage.py test
npm.cmd --prefix CastraView run lint
npm.cmd --prefix CastraView run test
npm.cmd --prefix CastraView run build
docker compose config
```

## Phase 1: Database authorization foundation

### Task 2: Add role-aware RLS helpers and onboarding RPC

**Create:**

- `supabase/migrations/<timestamp>_supabase_auth_role_policies.sql`

**Modify:**

- `supabase/audit_schema.py`

**SQL changes:**

1. Keep the existing `workspace_role` enum values `admin`, `manager`, and
   `member`.
2. Add `workspace_role(uuid)` and
   `has_workspace_role(uuid, workspace_role[])` as stable, security-definer
   helpers with an empty search path and schema-qualified references.
3. Recreate table policies as separate `SELECT`, `INSERT`, `UPDATE`, and
   `DELETE` policies matching the approved permission matrix. Do not keep broad
   `FOR ALL` membership policies where write access differs by role.
4. Add `create_workspace_with_admin(text)` as an authenticated-only,
   transactional onboarding RPC. It must derive the caller from `auth.uid()`
   and reject duplicate onboarding.
5. Add final-Admin protection, member-management routines, immutable audit
   append behavior, and same-workspace validation for cross-table references.
6. Add a parameterized RAG matching RPC whose workspace is validated from the
   authenticated membership.
7. Explicitly revoke public execution and grant only the required functions to
   `authenticated` and, where justified, `service_role`.
8. Extend the audit script to fail when an exposed application table has RLS
   disabled, has no policy, or contains an unrestricted anonymous policy.

**Database acceptance tests:**

- Anonymous reads return no application rows.
- Admin, Manager, and Member receive exactly the permissions in the design.
- A user in workspace A cannot select or mutate workspace B.
- A Member cannot import data, regenerate a strategy, approve a proposal, or
  manage members through direct Data API calls.
- The last Admin cannot be demoted or removed, including concurrent attempts.
- Onboarding creates profile, workspace, and Admin membership atomically.

### Task 3: Prepare identity and domain-data migration tools

**Create:**

- `supabase/migrate_django_data.py`
- `supabase/create_demo_actors.py`
- `supabase/tests/test_migration_mapping.py`

**Modify:**

- `supabase/README.md`
- `.env.example`

**Actions:**

1. Implement a dry-run-first exporter that maps each legacy Django user ID to
   a real Supabase Auth UUID supplied by Auth/Admin API results.
2. Never migrate Django password hashes. Create/invite actor accounts through
   Supabase Auth Admin API with credentials supplied only through environment
   variables.
3. Make demo actor creation idempotent for Admin, Manager, and Member; do not
   place their passwords in source files, command history output, or logs.
4. Migrate the canonical business profile, normalized campaign rows, strategy
   context, and ownership fields into one verified workspace.
5. Produce a reconciliation report containing row counts and rejected-row
   reasons, but no secrets or access tokens.
6. Require an explicit `--apply` option after a successful dry run.

**Acceptance:** running the tool twice creates no duplicate identities,
memberships, workspaces, or domain rows.

## Phase 2: Django Bearer-token boundary

### Task 4: Add Supabase JWT authentication and workspace context

**Create:**

- `CastraServices/authentication.py`
- `CastraServices/permissions.py`
- `CastraServices/supabase_client.py`
- `CastraServices/tests/test_authentication.py`
- `CastraServices/tests/test_permissions.py`

**Modify:**

- `CastraVision/settings.py`
- `requirements.txt`
- `requirements-runtime.txt`
- `.env.example`

**Actions:**

1. Parse only `Authorization: Bearer <token>` for product APIs.
2. Verify the signature using Supabase signing metadata and validate issuer,
   audience, expiration, and subject.
3. Cache signing metadata with bounded lifetime and fail closed on invalid or
   stale signatures.
4. Resolve exactly one Sprint 1 workspace membership and attach immutable user,
   workspace, and role context to the request.
5. Provide deny-by-default permission decorators/helpers for Admin,
   Admin-or-Manager, and all workspace members.
6. Add a user-scoped Supabase client that forwards the caller's access token so
   RLS remains authoritative.
7. Add a separate backend-only service client for Celery; prevent it from being
   imported by browser-facing modules.
8. Redact authorization headers, tokens, database URLs, and service credentials
   from errors and logs.

**Tests:** missing, malformed, expired, wrong-issuer, wrong-audience, and
invalid-signature tokens return `401`; a valid user with insufficient role
returns `403`; valid context exposes the expected Supabase UUID, workspace, and
role.

### Task 5: Convert protected Django workloads

**Modify:**

- `CastraServices/views.py`
- `CastraServices/account_api.py`
- `CastraServices/urls.py`
- `CastraServices/rag.py`
- `CastraServices/strategy.py`
- `CastraServices/tasks.py`
- `CastraServices/tests.py`

**Actions:**

1. Protect CSV/XLSX preview, commit, Sandbox sync, and import history with the
   Admin-or-Manager permission.
2. Preserve file-size, extension, row-count, required-column, and numeric-range
   validation before persisting normalized campaign rows through the
   user-scoped Supabase client.
3. Protect RAG and strategy generation with Admin-or-Manager permission and use
   the validated workspace rather than any client-supplied tenant identifier.
4. Store strategy results through user-scoped Supabase calls.
5. Require validated workspace IDs in Celery payloads; use the service role only
   inside workers and append an audit event for privileged writes.
6. Remove `csrf_exempt` from any remaining cookie-authenticated endpoint. Bearer
   APIs must not depend on Django session or CSRF state.
7. Keep old Django session routes temporarily available only behind an explicit
   disabled-by-default compatibility flag; remove them from frontend usage.

**Tests:** verify authorization occurs before file parsing, RAG lookup, LLM
calls, or task enqueueing. Assert that cross-workspace identifiers are ignored
or rejected and never leak object existence.

## Phase 3: Frontend Auth and actor-specific interfaces

### Task 6: Install and isolate the Supabase browser client

**Create:**

- `CastraView/src/lib/supabase.js`
- `CastraView/src/lib/api.js`
- `CastraView/src/auth/AuthProvider.jsx`
- `CastraView/src/auth/RequirePermission.jsx`
- `CastraView/src/auth/permissions.js`
- `CastraView/src/auth/AuthProvider.test.jsx`

**Modify:**

- `CastraView/package.json`
- `CastraView/package-lock.json`
- `CastraView/src/main.jsx`
- `CastraView/.env.example`

**Actions:**

1. Add the official Supabase JavaScript client.
2. Permit only `VITE_SUPABASE_URL` and a publishable/anon key in the browser.
3. Centralize login, signup, logout, refresh, password reset, profile,
   workspace, and membership loading in `AuthProvider`.
4. Make Django API calls attach the current Supabase access token.
5. Centralize the capability matrix; never infer a role from email or local
   storage.
6. Handle `401` by one safe refresh attempt followed by logout, `403` as a role
   error, and `404` without cross-tenant disclosure.

### Task 7: Split the monolithic UI and implement role-aware routing

**Create:**

- `CastraView/src/layout/AppShell.jsx`
- `CastraView/src/pages/AdminDashboard.jsx`
- `CastraView/src/pages/ManagerDashboard.jsx`
- `CastraView/src/pages/MemberDashboard.jsx`
- `CastraView/src/pages/LoginPage.jsx`
- `CastraView/src/pages/SignupPage.jsx`
- `CastraView/src/pages/OnboardingPage.jsx`
- `CastraView/src/pages/BusinessProfilePage.jsx`
- `CastraView/src/pages/ImportPage.jsx`
- `CastraView/src/pages/StrategyPage.jsx`
- `CastraView/src/pages/ContentStudioPage.jsx`
- `CastraView/src/pages/MembersPage.jsx`
- `CastraView/src/pages/ApprovalsPage.jsx`
- `CastraView/src/pages/ReportsPage.jsx`
- `CastraView/src/pages/NotificationsPage.jsx`
- corresponding focused test files beside the components

**Modify:**

- `CastraView/src/App.jsx`
- `CastraView/src/App.test.jsx`
- `CastraView/src/App.css`
- `CastraView/src/index.css`

**Actions:**

1. Replace the static `NAV` list with navigation generated from the centralized
   capability map.
2. Send each actor to a distinct default dashboard:
   Admin governance/approvals, Manager operations/generation, Member shared
   strategy/content.
3. Reuse the existing Sprint 1 import and content-card behavior while moving it
   into focused pages.
4. Use Supabase Data API for RLS-protected ordinary CRUD and Django only for
   import, RAG, strategy generation, and background-job requests.
5. Revalidate the membership after auth changes. Redirect unauthorized routes
   to the actor dashboard with a Vietnamese permission explanation.
6. Hide forbidden controls, then prove direct API calls remain forbidden by
   database/backend tests.

**Frontend acceptance tests:**

- Admin sees members, settings, imports, approvals, and audit/report controls.
- Manager sees imports, strategy generation, content, budgets, and reports but
  cannot manage members or approve proposals.
- Member sees shared strategy, Content Studio, notifications, and read-only
  results but cannot import or regenerate strategy.
- Signup invokes the onboarding RPC without accepting a role from the form.
- Login refresh, logout, password reset, expired session, and permission errors
  render correctly.

## Phase 4: Cutover and documentation

### Task 8: Reconcile data and perform a controlled cutover

**Actions:**

1. Back up the live Supabase database and record pre-migration row counts.
2. Run migration lint/dry-run and the complete RLS actor matrix against a local
   or isolated database first.
3. Apply forward migrations to project `oviqgptccjjdaaqxabwv` only after the
   target and backup are confirmed.
4. Create/invite the three demo actors with passwords provided outside Git.
5. Run the domain migration in dry-run mode, review its reconciliation output,
   then run `--apply`.
6. Deploy backend compatibility mode, then frontend Supabase Auth, then disable
   product Django-session login.
7. Keep legacy Django auth/domain tables intact for the observation period.
8. Do not drop or rewrite legacy data in this delivery.

### Task 9: Align project documentation

**Modify:**

- `README.md`
- `docs/SPRINT1_SETUP.md`
- `docs/SPRINT1_UI.md`
- `docs/PROPOSAL_ALIGNMENT.md`
- `supabase/README.md`
- proposal/SRS artifacts only through their document-editing workflow

**Document:**

- Django rather than FastAPI as the implemented backend framework.
- Supabase Auth, Bearer JWT, RLS, and the React/Supabase/Django boundaries.
- Consistent Admin/Manager/Member terminology.
- Environment-variable names without real values.
- Demo actor creation/reset procedure without passwords.
- Local, Docker, test, migration, rollback, and troubleshooting commands.

## Phase 5: Three-pass verification gate

### Pass 1: Static and unit verification

```powershell
python manage.py check --deploy
python manage.py makemigrations --check --dry-run
python manage.py test
npm.cmd --prefix CastraView run lint
npm.cmd --prefix CastraView run test
npm.cmd --prefix CastraView run build
```

Expected: all commands exit zero; no migration drift; no secret appears in
tracked files or build output.

### Pass 2: Database and authorization verification

Run the database audit and actor matrix with separate Admin, Manager, Member,
anonymous, and second-workspace sessions. Exercise every protected table with
`SELECT`, `INSERT`, `UPDATE`, and `DELETE`, plus onboarding, final-Admin,
member-management, RAG, and audit routines.

Expected: permitted operations succeed; forbidden operations fail under RLS;
cross-workspace reads and writes return no data or a safe authorization error.

### Pass 3: Docker and end-to-end verification

```powershell
docker compose config
docker compose build
docker compose up -d
docker compose ps
```

Then run browser/API flows for all three actors: login, role-specific dashboard,
business profile, import, strategy generation, shared strategy read, content
editing, approval boundaries, logout, and expired-token recovery. Inspect
container health and logs for crashes, token leakage, cross-workspace queries,
or retry loops, then stop the stack cleanly.

Expected: frontend, Django, PostgreSQL/Supabase integration, Redis, and Celery
remain healthy; each actor receives a distinct interface; all security
boundaries still hold through direct requests.

## Commit sequence

1. `test: capture Supabase auth migration baseline`
2. `feat(db): add role-aware RLS and onboarding RPCs`
3. `feat(data): add Supabase identity and data migration tools`
4. `feat(auth): verify Supabase JWTs in Django`
5. `feat(api): enforce workspace roles on protected workloads`
6. `feat(frontend): integrate Supabase Auth and permissions`
7. `feat(frontend): add actor-specific dashboards and routes`
8. `docs: align CastraVision authentication architecture`
9. `test: verify Supabase cutover across three actors`

## Completion criteria

- Supabase Auth successfully authenticates the three real demo actors.
- `auth.users.id` is the only product identity in active request paths.
- Admin, Manager, and Member have distinct tested dashboards and permissions.
- Every exposed application table has enabled, role-correct RLS.
- Django verifies Supabase JWTs and never trusts client-supplied roles or tenant
  scope.
- Import, RAG, strategy, and Celery workloads remain functional and scoped.
- Data reconciliation has no unexplained loss or duplicate ownership.
- All three verification passes succeed.
- No secret, password, token, database URL, or service-role key is tracked.
- Legacy deletion is deferred to a separately approved contract migration.
