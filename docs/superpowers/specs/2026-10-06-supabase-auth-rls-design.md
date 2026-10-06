# CastraVision Supabase Auth and RLS Design

Date: 2026-10-06  
Status: Approved design

## 1. Decision

CastraVision adopts Supabase Auth and PostgreSQL Row Level Security as the product identity and tenant-authorization foundation. React uses Supabase Auth and the Supabase Data API for ordinary workspace CRUD. Django remains the backend for CSV/XLSX ingestion, normalization, RAG, embeddings, LLM strategy generation, retry/fallback behavior, and Celery jobs.

This design supersedes `2026-10-06-role-based-workspaces-design.md`. Product actors are named `Admin`, `Manager`, and `Member`, matching FR06, the Proposal, SRS, and User Stories.

## 2. Goals

- Use `auth.users.id` as the only product-user identity.
- Enforce workspace isolation at the PostgreSQL layer with RLS.
- Give Admin, Manager, and Member distinct interfaces and capabilities.
- Preserve Django for server-only AI and ingestion workloads.
- Prevent browser access to service-role credentials.
- Migrate current Django-owned demo data without silent loss or cross-tenant exposure.
- Make project documentation accurately describe the implemented framework, identity flow, and role names.

## 3. Non-goals

- Maintaining Django session authentication for product users after cutover.
- Migrating Django password hashes into Supabase Auth.
- Supporting multiple active workspaces per user in Sprint 1.
- Exposing Celery, LLM provider keys, database owner credentials, or Supabase service-role keys to the browser.
- Removing legacy Django tables in the same release as identity cutover.

## 4. System Architecture

```text
React application
  ├── Supabase Auth
  │     signup, login, logout, refresh, password reset
  ├── Supabase Data API
  │     workspace CRUD protected by RLS
  └── Django API with Bearer JWT
        ├── CSV/XLSX parsing and normalization
        ├── campaign import orchestration
        ├── RAG retrieval and embeddings
        ├── LLM strategy generation
        └── Celery background jobs
```

Supabase Auth is the product authentication source of truth. `workspace_members` is the role source of truth. Django never derives a role from email, frontend state, or request data.

Django Admin may remain available to internal operators, but Django staff users are not CastraVision product actors and cannot substitute for Supabase workspace membership.

## 5. Identity and Token Handling

The frontend uses the official Supabase JavaScript client. Only the project URL and publishable/anon key may be present in the frontend build.

Every protected Django request sends:

```http
Authorization: Bearer <supabase-access-token>
```

Django authentication middleware must:

1. Reject missing or malformed Bearer headers with `401 AUTH_REQUIRED`.
2. Verify JWT signature using the project's supported signing configuration.
3. Validate issuer, audience, expiration, and subject.
4. Use the JWT subject UUID as `auth.users.id`.
5. Resolve the user's active workspace membership before entering a protected view.
6. Return `403 PERMISSION_DENIED` when the identity is valid but the role is insufficient.

Signing metadata may be cached for availability, but invalid or stale signatures must fail closed. Tokens, refresh tokens, cookies, database URLs, and authorization headers must never be written to application logs.

Bearer-token APIs do not rely on CSRF for authentication. CORS remains restricted to configured frontend origins. If any cookie-authenticated Django endpoint remains, normal Django CSRF protection continues to apply to that endpoint.

## 6. Signup and Workspace Onboarding

Public signup never accepts a role. After email/password signup, the authenticated user calls a database RPC:

`create_workspace_with_admin(workspace_name text)`

The RPC runs atomically and:

1. Reads the caller from `auth.uid()`.
2. Creates or completes the caller's `profiles` record.
3. Creates one workspace owned by the caller.
4. Inserts one `workspace_members` record with role `admin`.
5. Returns the new workspace ID and role.

The RPC is `SECURITY DEFINER`, pins an empty search path, schema-qualifies referenced objects, validates input length, prevents duplicate onboarding, and grants execute only to `authenticated`.

Sprint 1 selects the user's single membership as the active workspace. The schema and API responses keep workspace IDs explicit so a future workspace switcher can be added without redesigning tenant isolation.

## 7. Role and Capability Matrix

| Capability | Admin | Manager | Member |
|---|---:|---:|---:|
| View workspace overview | Yes | Yes | Yes |
| View business profile | Yes | Yes | Yes |
| Edit business profile | Yes | No | No |
| View campaign performance | Yes | Yes | No |
| Import campaign data | Yes | Yes | No |
| View strategy | Yes | Yes | Yes |
| Generate or re-analyze strategy | Yes | Yes | No |
| Create and edit ad content | Yes | Yes | Yes |
| Manage budget proposals | Yes | Yes | Read only |
| Approve/reject proposals | Yes | No | No |
| Read own notifications | Yes | Yes | Yes |
| Read audit logs | Yes | No | No |
| Generate reports | Yes | Yes | Read only |
| Manage members and roles | Yes | No | No |

The database and Django API are deny-by-default. Frontend menu visibility is not treated as authorization.

## 8. RLS Architecture

All application tables in the exposed schema have RLS enabled. No application table is left with an unrestricted `anon` policy.

Shared helper functions:

- `is_workspace_member(workspace_id uuid)`
- `workspace_role(workspace_id uuid)`
- `has_workspace_role(workspace_id uuid, allowed_roles workspace_role[])`

Each helper is stable, `SECURITY DEFINER`, uses `set search_path = ''`, schema-qualifies every relation, and is executable only by roles that require it.

Policy rules:

- `profiles`: user reads and edits only their own row.
- `workspaces`: members read; Admin updates workspace metadata.
- `workspace_members`: members may read the roster; only Admin may invite, change, or remove members.
- `business_profiles`: every member reads; Admin writes.
- `campaign_performance`: Admin and Manager read/write; Member has no access.
- `strategies`: every member reads; Admin and Manager create/update.
- `strategy_context_embeddings`: Admin and Manager access only through approved operations/RPCs.
- `ad_contents`: every member reads and creates; authors may edit drafts, while Admin and Manager may review all workspace content.
- `budget_proposals`: all members read; Admin and Manager create/update.
- `approvals`: all members read status; Admin approves or rejects.
- `notifications`: users access only rows whose `user_id = auth.uid()` and whose workspace membership is valid.
- `audit_logs`: Admin reads; application-owned routines append immutable entries.
- `competitor_insights`: all members read; Admin and Manager write.
- `reports`: all members read ready reports; Admin and Manager request generation.

An invariant prevents removal or demotion of the final Admin. Cross-workspace foreign references are rejected through composite constraints or validated database routines where a simple foreign key is insufficient.

## 9. Frontend Data and Interface Boundaries

The frontend directly uses Supabase for:

- Auth lifecycle and session refresh.
- Current profile, workspace, and membership role.
- Business profile reads and Admin updates.
- Member roster and Admin role management.
- Strategy/content/report reads allowed by RLS.
- Ordinary content and notification CRUD permitted by RLS.

Navigation and controls are derived from a centralized permission map using the role returned by `workspace_members`. Page state is revalidated whenever auth or membership changes. An unauthorized route redirects to the actor's default dashboard and displays an explanation.

- Admin dashboard emphasizes governance, workspace settings, members, campaign operations, and approvals.
- Manager dashboard emphasizes imports, strategy generation, content operations, budgets, and reports.
- Member dashboard emphasizes the latest shared strategy, Content Studio, notifications, and read-only results.

The frontend handles `401` by refreshing or ending the session, `403` as a permission error, and `404` without revealing another workspace's object existence.

## 10. Django API Boundaries

Django keeps only workloads that require server-side libraries, secrets, long-running work, or coordinated validation.

### Campaign ingestion

Admin or Manager uploads CSV/XLSX to Django. Django validates the JWT and role before reading the file, parses and normalizes rows, then writes through a user-scoped Supabase client so RLS evaluates the caller. File size, extension, row count, numeric ranges, and required columns remain validated server-side.

### Strategy generation and RAG

Admin or Manager calls Django with a Supabase token. Django retrieves business and campaign context through user-scoped Data API/RPC calls, performs RAG/LLM generation, validates structured output, and writes the resulting strategy under the same user identity.

Vector similarity is exposed through a parameterized database RPC that derives or verifies workspace scope from the authenticated identity. A caller cannot choose an unrelated workspace ID.

### Background jobs

Celery may use a backend-only service role for asynchronous embeddings and reports. Every task payload contains a validated workspace ID, queries are explicitly workspace-scoped, and task creation is authorized before enqueueing. Service-role operations emit audit records.

## 11. Secrets and Operational Controls

- Frontend: Supabase URL and publishable/anon key only.
- Django/Celery: server-only service-role key, JWT verification configuration, LLM keys, and database credentials.
- `.env`, `.env.*`, signing secrets, passwords, and service-role keys remain excluded from Git.
- Production keys are supplied by deployment secret storage, not baked into Docker images.
- Logs redact authorization headers and sensitive connection fields.
- CORS permits only configured frontend origins.
- Rate limiting applies to authentication-sensitive and costly AI endpoints.

## 12. Migration and Cutover

Migration follows an expand, migrate, verify, cutover, and contract sequence.

### Phase 1: Inventory and backup

- Back up the Supabase database.
- Count all Django and Supabase domain rows.
- Verify current migration history, constraints, RLS status, and policy definitions.
- Stop if duplicate or conflicting production data cannot be mapped deterministically.

### Phase 2: Expand Supabase schema

- Add role-aware RLS helpers and policies through forward migrations.
- Add transactional onboarding and member-management RPCs.
- Add required same-workspace constraints and indexes.
- Add RAG matching RPC and immutable audit routines.

### Phase 3: Create Supabase identities

- Create or invite Admin, Manager, and Member in Supabase Auth.
- Require new passwords or password-reset flow; Django password hashes are not copied.
- Maintain a temporary mapping of Django user ID to Supabase UUID.

### Phase 4: Migrate domain data

- Create the shared `Cafe Ông Bụt` workspace.
- Insert Admin/Manager/Member memberships.
- Migrate canonical business profile, campaign imports, strategy context, and related records.
- Preserve timestamps and source identifiers where possible.
- Record rejected or ambiguous rows rather than silently discarding them.

### Phase 5: Application cutover

- Deploy frontend Supabase Auth and role-aware navigation.
- Deploy Django Bearer authentication and user-scoped Supabase access.
- Disable product login through Django session endpoints.
- Run actor and cross-workspace acceptance tests before declaring cutover complete.

### Phase 6: Contract later

- Retain legacy Django auth/domain tables during an observation period.
- Remove obsolete endpoints and dependencies only after parity and backup verification.
- Drop legacy tables in a separate, explicitly approved migration; never in the initial cutover migration.

## 13. Documentation Alignment

The implementation is incomplete until documentation and code agree:

- Proposal/SRS/User Stories consistently use `Admin`, `Manager`, and `Member`.
- Proposal Technology Stack names Django rather than FastAPI.
- Authentication documentation names Supabase Auth and Bearer JWT.
- Authorization documentation describes both RLS and Django endpoint checks.
- Architecture views show React communicating with Supabase and Django.
- Database documentation identifies Supabase migrations as schema history and explains workspace policies.
- Test cases include the role matrix, token failures, and cross-workspace denial.

## 14. Testing and Acceptance Criteria

### Database

- Migration dry-run and push complete without drift.
- Every exposed application table has RLS enabled and expected policies.
- Database lint reports no errors.
- Anonymous access returns no application data.
- Cross-workspace SELECT, INSERT, UPDATE, and DELETE attempts fail.
- Final-Admin protection succeeds under concurrent attempts.

### Django

- Missing, malformed, expired, wrong-issuer, wrong-audience, and invalid-signature JWTs return 401.
- Valid identities with insufficient roles return 403 before file parsing or LLM calls.
- Import and strategy endpoints preserve workspace scope.
- Background tasks cannot operate without a validated workspace ID.

### Frontend

- Signup, login, refresh, logout, and password-reset flows work with Supabase Auth.
- Admin, Manager, and Member see distinct navigation and dashboards.
- Hidden controls are also forbidden through direct API calls.
- Member can use shared strategy context in Content Studio but cannot import or regenerate strategy.

### Migration and end-to-end

- Pre/post-migration row counts and ownership mappings reconcile.
- The three demo actors authenticate through Supabase Auth and share one workspace.
- Manager-generated strategy is readable by Admin and Member.
- Backend tests, frontend tests/build, database audit, and Docker health checks pass.
- Secret scanning confirms no password, service key, signing key, or database URL is tracked.

## 15. Rollback and Failure Handling

Before cutover, failure rolls back the new deployment while legacy Django authentication remains available. Schema changes are forward-only; corrective migrations repair database state instead of editing applied migrations.

After cutover, authentication rollback requires restoring the previous application version and its preserved Django tables. Domain data created after cutover must be exported and reconciled before reverting. No destructive cleanup occurs until the observation period and explicit approval are complete.
