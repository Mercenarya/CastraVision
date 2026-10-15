# CastraVision Runtime Architecture Diagram

## Goal

Create one interactive Archify architecture diagram that explains the high-level
runtime currently evidenced by this workspace. The diagram is for readers
orienting themselves to the app's running components and their main connections;
it is not a proposed or production deployment design.

## Scope

Represent the runtime configured in `docker-compose.yml`:

- Browser/user and the React/Vite frontend.
- Django HTTP API.
- The local PostgreSQL service and Redis service.
- The Celery worker.
- Supabase as an external Auth and Data API service.
- OpenAI as an optional external strategy/embedding provider.

Show only the main runtime relationships: browser to frontend; frontend to the
Django API with the user's bearer token; frontend to Supabase for authentication
and workspace/profile/campaign data; Django API to Supabase for JWT
verification/workspace membership; Django API to local PostgreSQL for its
knowledge/RAG data; Django API to OpenAI for optional strategy generation; and
the Celery worker's configured Redis/PostgreSQL/embedding-provider dependencies.

## Evidence and qualifications

The repository evidence establishes:

- Compose starts the frontend, Django backend, PostgreSQL, Redis, and Celery
  worker. Its backend command runs Django's development server. (`docker-compose.yml`,
  lines 1-111)
- Django routes `/api/` to `CastraServices`; the app exposes health,
  strategy-generation, and campaign-import endpoints. (`CastraVision/urls.py`,
  lines 20-23; `CastraServices/urls.py`, lines 1-12)
- The frontend uses React, gets a Supabase session, sends an authenticated
  request to the backend, and also reads/writes workspace, business-profile,
  and campaign data through Supabase. (`CastraView/src/main.jsx`, lines 1-10;
  `CastraView/src/lib/api.js`, lines 1-24;
  `CastraView/src/lib/workspace.js`, lines 92-142)
- The backend verifies Supabase JWTs and calls the Supabase REST Data API to
  obtain workspace membership. (`CastraServices/authentication.py`, lines 43-100;
  `CastraServices/supabase_client.py`, lines 31-91)
- Django uses `DATABASE_URL` when configured and otherwise falls back to
  SQLite. Compose supplies a PostgreSQL URL. Its RAG code accesses
  `KnowledgeChunk` through Django's ORM. (`CastraVision/settings.py`,
  lines 80-89; `docker-compose.yml`, lines 39-42;
  `CastraServices/rag.py`, lines 87-145)
- Compose configures Redis as the Celery broker and result backend, and starts
  a worker. `embed_pending_chunks` is registered and accesses `KnowledgeChunk`;
  no task dispatch/enqueue call was found in the inspected application paths.
  The diagram must not imply that a particular API request currently enqueues
  this task. (`docker-compose.yml`, lines 20-27, 66-91;
  `CastraVision/celery.py`, lines 5-9; `CastraVision/settings.py`, lines 155-159;
  `CastraServices/tasks.py`, lines 8-25)
- Strategy generation uses OpenAI when configured and otherwise falls back to
  deterministic generation; embedding selection also depends on configuration.
  (`CastraServices/strategy.py`, lines 18-36, 95-125;
  `CastraServices/rag.py`, lines 24-65)

Do not present the Compose setup as production infrastructure. Do not infer
Facebook/Google/TikTok runtime integrations from dependencies or product
documentation alone. Do not invent a cache service. Keep Supabase's managed
PostgreSQL internals abstracted behind the observed Auth/Data API surface.

## Diagram and artifact design

- Use Archify `architecture` with Vietnamese-authored labels. Omit
  `meta.locale` because Archify has no bundled Vietnamese catalog and reviewed
  Viewer translations are not available; disclose that Viewer controls and
  `<html lang>` remain English.
- Use a single high-level runtime view, with a local Docker Compose boundary
  around the five locally composed services and Supabase/OpenAI outside it.
- Include concise `path:line-range` citations as plain text in diagram cards.
  Do not use Archify `components[].sources`, which requires pinned repository
  metadata.
- This workspace has no `.git` metadata. Do not invent a pinned
  `meta.repository` identity; disclose that plain-text citations refer to the
  inspected local snapshot and are not revision-verified or clickable links.
- Save editable JSON and standalone HTML in
  `.archify/architecture-runtime-20261015-1607/`.

## Validation

Run Archify `finalize architecture` for the candidate and require its validation,
delivery, strict-check, and browser-check gates to pass. Since there is no Git
repository, do not pass `--repo-root`; the plain-text citations are not
provenance-verified by Archify. If a gate fails, repair the reported issue
without changing the documented runtime meaning. Perceptual review is not part
of the default acceptance criteria.

## Out of scope

No application code, deployment configuration, service behavior, or credentials
will be changed. No production topology, external marketing-platform integration,
unobserved task producer, or pin to a Git commit will be claimed.
