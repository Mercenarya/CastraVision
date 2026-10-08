# CastraVision Supabase setup

This directory was initialized with Supabase CLI 2.119.0. The first migration
is an exact text copy of `CastraVision_Supabase_Schema.sql` supplied by the
team. The demo data lives in `seed.sql`, so it can be applied after real Auth
users exist without inventing user IDs.

## Current state

- The remote Supabase project already contains Django tables and 20 Django
  migrations. It is not an empty database.
- The new schema names do not collide with the existing Django table names.
- The repo has not been linked to Supabase CLI and the new migration/seed has
  not been pushed to the remote project.
- The Django app still uses its own `auth_user` and `CastraServices_*` tables.
  Adding this Supabase schema does not switch the app to Supabase Auth or the
  new workspace tables.

## Before pushing

The source schema enables RLS on 13 tables, but
`public.strategy_context_embeddings` has no RLS enable statement or policy.
It also has no insert policy for creating a workspace or adding a workspace
member through the authenticated Data API. These are omissions in the source
schema, which is preserved verbatim in the migration. Review them with the
team before exposing the new tables through the Data API.

## Auth users and demo data

In the Supabase Dashboard for project `oviqgptccjjdaaqxabwv`, go to
**Authentication > Users > Add user** and create:

- `owner@demo.castravision.vn`
- `manager@demo.castravision.vn`
- Optional: `member@demo.castravision.vn`

Use passwords you choose in the Dashboard. Copy each real user UUID from
Authentication > Users. Do not create rows directly in `auth.users`.

`seed.sql` looks up the owner by email and inserts one workspace, one
business profile, 18 campaign records, three strategies, six ad contents,
two budget proposals, two approvals, four notifications, four audit logs,
one competitor insight, and one report. It skips all inserts if the owner
does not yet exist and skips a workspace that has already been seeded.
It creates the owner's workspace membership. To attach the manager and
replace demo actor/reviewer references, replace `UUID_OWNER` and
`UUID_MANAGER` in `seed_users_placeholder.sql` with the Dashboard UUIDs,
then run that file manually in the SQL Editor. That file is not run by the
CLI automatically.

## CLI commands

Run these from the repository root. The CLI is invoked through `npx`
because it is not installed globally on this machine.

```powershell
npx.cmd --yes supabase@2.119.0 login
npx.cmd --yes supabase@2.119.0 link --project-ref oviqgptccjjdaaqxabwv
npx.cmd --yes supabase@2.119.0 db push --dry-run
```

`login` opens a browser for your account. `link` may request the project
database password. Review the dry run before applying. After the owner
Auth user exists and the schema's RLS gap has been resolved with the team,
apply migrations and demo seed:

```powershell
npx.cmd --yes supabase@2.119.0 db push --include-seed
```

If the owner was created after the first push, execute `seed.sql` manually
in the Supabase SQL Editor, or run `db push --include-seed` again. The
seed is idempotent for the same owner/workspace pair. Apply demo data only
to the intended demo or development project.

## Verify through the Supabase client

Put the project URL and a backend-only secret/service-role key in the local
`.env` (which is ignored by Git):

```dotenv
SUPABASE_URL=https://oviqgptccjjdaaqxabwv.supabase.co
SUPABASE_SECRET_KEY=<your secret key from Dashboard > Settings > API Keys>
```

Then install the small check-script dependency and run:

```powershell
.venv\Scripts\python.exe -m pip install -r supabase/requirements-check.txt
.venv\Scripts\python.exe supabase/check_seed.py
```

The script counts rows in every workspace-scoped table and checks the
expected minimums. Never expose the secret/service-role key in frontend
code or commit it to Git.
