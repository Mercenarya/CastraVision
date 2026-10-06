# CastraVision Role-Based Workspaces Design

Date: 2026-10-06  
Status: Approved design

## 1. Problem

CastraVision currently authenticates three demo accounts, but the application has no role field, shared workspace model, or backend authorization matrix. The session API returns only user ID and email, the frontend renders one static navigation list, and most protected endpoints only distinguish authenticated from anonymous users. Each demo user also owns a separate `BusinessAccount`, so hiding menu items alone would create cosmetic roles without tenant-safe authorization or shared business data.

## 2. Goals

- Give Owner, Manager, and Member distinct interfaces and capabilities.
- Enforce every permission on the Django backend; frontend visibility is only a usability layer.
- Put the three demo actors in one shared workspace named `Cafe Ông Bụt`.
- Scope profiles, campaign imports, and generated strategies to a workspace.
- Preserve current accounts and business data through forward-only migrations.
- Keep the existing Django session authentication for Sprint 1.
- Return predictable `401`, `403`, and `404` responses without exposing another workspace's existence or data.

## 3. Non-goals

- Replacing Django authentication with Supabase Auth.
- Supporting a user switching between multiple workspaces in Sprint 1.
- Persisting every inline Content Studio edit or implementing approval workflows beyond the current Sprint 1 screens.
- Dual-writing Django domain data into the separate Supabase `public.workspaces` schema.

## 4. Actor and Permission Matrix

| Capability | Owner | Manager | Member |
|---|---:|---:|---:|
| View role-specific overview | Yes | Yes | Yes |
| View business profile | Yes | Yes | Yes |
| Edit business profile | Yes | No | No |
| View/import campaign data | Yes | Yes | No |
| Generate or re-analyze strategy | Yes | Yes | No |
| View latest shared strategy | Yes | Yes | Yes |
| Use Content Studio | Yes | Yes | Yes |
| View/manage workspace members and roles | Yes | No | No |
| Delete the workspace | Not exposed in Sprint 1 | No | No |

The backend is deny-by-default: an endpoint explicitly lists its permitted roles. A superuser is not silently treated as a workspace owner unless a membership exists.

## 5. Data Model

### Workspace

- UUID primary key.
- `name`, `created_at`, and `updated_at`.
- Represents the tenant boundary used by all role checks.

### WorkspaceMembership

- Foreign keys to Workspace and Django User.
- Role choice: `owner`, `manager`, or `member`.
- Unique constraint on `(workspace, user)`.
- Indexes on `(user, workspace)` and `(workspace, role)`.
- At least one owner must remain. The API rejects demoting or removing the last owner.

### BusinessAccount

- Add a nullable workspace relation in the expand migration.
- Backfill a canonical profile for each workspace.
- Application reads and writes by workspace after deployment.
- Keep the legacy user relation during Sprint 1 migration compatibility; remove it only in a later contract migration after all code has stopped reading it.

### CampaignImport

- Add nullable `workspace` and `created_by` relations.
- Backfill workspace from the importing user's membership.
- New queries filter by active workspace, not only by user, so Owner and Manager share import history.
- Retain the legacy user field during the compatibility phase.

### StrategySnapshot

- Workspace foreign key, creator foreign key, response JSON, provider, warning, and timestamps.
- Stores the latest successful strategy response so Member can open Content Studio without regenerating a strategy.
- Retrieval always filters by the authenticated user's active workspace.

## 6. Migration and Backfill

Use forward-only expand/migrate/contract steps:

1. Add Workspace, WorkspaceMembership, StrategySnapshot, and nullable workspace references.
2. For ordinary existing users, create one workspace and owner membership per user, preserving their current profile and imports.
3. For the three known demo emails, create or reuse one `Cafe Ông Bụt` workspace, assign Owner/Manager/Member roles, use the Owner profile as the canonical workspace profile, and attach existing demo imports to the shared workspace.
4. Validate that every existing profile/import has a workspace before the application switches reads.
5. Keep legacy user columns for compatibility; a later migration may remove them after production verification.

The migration must be repeatable at the management-command layer and must not identify roles by arbitrary email suffixes outside the explicit demo seed data.

## 7. Backend Authorization Architecture

Create one RBAC module responsible for:

- Resolving the authenticated user's active membership.
- Returning the active workspace and role.
- Checking an explicit allowed-role set.
- Returning `401 AUTH_REQUIRED` for anonymous requests.
- Returning `403 PERMISSION_DENIED` for authenticated users without permission.
- Returning `404` for workspace-scoped objects outside the active workspace.

Authorization is applied before parsing uploads, calling an LLM, or mutating data.

Endpoint behavior:

- Session/login/register responses include `role`, `permissions`, and active workspace summary.
- Registration atomically creates a provisional workspace and Owner membership; onboarding renames it to the submitted business name.
- Business profile GET allows all roles; PUT allows Owner only.
- Campaign import history/upload/sandbox allows Owner and Manager only.
- Strategy generation requires Owner or Manager, removes the current CSRF exemption, and stores a StrategySnapshot after success.
- A new latest-strategy GET endpoint allows all three roles.
- Workspace member list/create/update/delete endpoints allow Owner only and protect the last owner.

## 8. Frontend Design

Navigation is derived from permissions returned by the backend, never from email addresses.

- Owner sees Overview, Strategy, Content Studio, Campaign Import, Business Profile, and Members & Roles.
- Manager sees Overview, Strategy, Content Studio, Campaign Import, and read-only Business Profile.
- Member sees Overview, Content Studio, read-only Business Profile, and the latest shared strategy as supporting context; no generation or import controls are rendered.

Each dashboard has a distinct heading, role badge, primary actions, and explanatory empty state. The router/state layer validates the current page whenever role or session changes and redirects to that role's default page if the page is not permitted. A server `403` is displayed as an authorization notice and never treated as a successful empty response.

The Members & Roles screen supports listing members, changing Manager/Member roles, and removing members. It does not expose password controls and cannot remove or demote the last Owner.

## 9. Supabase Boundary

For Sprint 1, Supabase is the hosted PostgreSQL provider while Django sessions and Django tables remain the application's authentication and authorization source of truth. The separate Supabase Auth/RLS business tables remain secured but are not dual-written by this feature. This avoids two conflicting role sources.

A later Supabase Auth migration must be designed separately because Django user IDs and `auth.users` IDs are not currently the same identity domain.

## 10. Error Handling and Security

- Preserve CSRF protection on every session-authenticated write endpoint.
- Never accept a client-provided role during public registration.
- Never trust a workspace ID from the client without membership validation.
- Use database constraints for membership uniqueness and role choices.
- Use transactions for registration, demo seeding, membership changes, and last-owner protection.
- Do not reveal member lists, workspace names, or object existence across tenants.
- Audit permission failures in server logs without recording passwords, session cookies, or API keys.

## 11. Testing and Acceptance Criteria

Backend tests must cover:

- Role/workspace fields in registration, login, and session responses.
- Owner-only profile mutation and member management.
- Owner/Manager campaign import and strategy generation.
- Member denial with HTTP 403 for import, generation, and profile mutation.
- All roles reading the latest shared strategy.
- Cross-workspace query isolation and object-not-found behavior.
- Last-owner protection and repeatable demo seed behavior.
- CSRF enforcement on strategy generation.
- Data migration preserving existing users, profiles, and imports.

Frontend tests must cover:

- Distinct navigation and dashboard content for all three roles.
- Hidden controls plus graceful handling of a backend 403.
- Member loading the latest strategy into Content Studio.
- Redirect away from a page not allowed by the current role.

End-to-end acceptance:

1. Seed the three demo accounts into one workspace.
2. Log in as each actor and verify the permission matrix.
3. Confirm Manager-created import/strategy data is visible to Owner and usable by Member.
4. Run Django checks, migrations, backend tests, frontend tests/build, and Docker health checks.
5. Confirm no `.env`, password, Supabase key, or database URL is added to Git.
