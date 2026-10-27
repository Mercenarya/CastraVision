#!/usr/bin/env bash
set -euo pipefail

DB_URL="${1:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
WORKSPACE_ID="23000000-0000-0000-0000-000000000001"
ADMIN_X="13000000-0000-0000-0000-000000000001"
ADMIN_Y="13000000-0000-0000-0000-000000000002"
A_LOG="$(mktemp)"
B_LOG="$(mktemp)"

cleanup_files() {
  rm -f "$A_LOG" "$B_LOG"
}
trap cleanup_files EXIT

cleanup_data() {
  psql "$DB_URL" -v ON_ERROR_STOP=1 \
    -v workspace_id="$WORKSPACE_ID" -v admin_x="$ADMIN_X" -v admin_y="$ADMIN_Y" <<'SQL' >/dev/null
delete from public.workspaces where id = :'workspace_id'::uuid;
delete from auth.users where id in (:'admin_x'::uuid, :'admin_y'::uuid);
SQL
}

cleanup_data

psql "$DB_URL" -v ON_ERROR_STOP=1 \
  -v workspace_id="$WORKSPACE_ID" -v admin_x="$ADMIN_X" -v admin_y="$ADMIN_Y" <<'SQL' >/dev/null
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (:'admin_x'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'race-x@example.test', '', '{}', '{}', now(), now()),
  (:'admin_y'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'race-y@example.test', '', '{}', '{}', now(), now());

insert into public.workspaces (id, name, owner_id)
values (:'workspace_id'::uuid, 'Last Admin Race Test', :'admin_y'::uuid);

insert into public.workspace_members (workspace_id, user_id, role)
values
  (:'workspace_id'::uuid, :'admin_x'::uuid, 'admin'),
  (:'workspace_id'::uuid, :'admin_y'::uuid, 'admin');
SQL

psql "$DB_URL" -v ON_ERROR_STOP=1 \
  -v workspace_id="$WORKSPACE_ID" -v admin_x="$ADMIN_X" >"$A_LOG" 2>&1 <<'SQL' &
begin;
update public.workspace_members
set role = 'manager'
where workspace_id = :'workspace_id'::uuid and user_id = :'admin_x'::uuid;
select pg_sleep(3);
commit;
SQL
A_PID=$!

sleep 1
set +e
psql "$DB_URL" -v ON_ERROR_STOP=1 \
  -v workspace_id="$WORKSPACE_ID" -v admin_y="$ADMIN_Y" >"$B_LOG" 2>&1 <<'SQL'
begin;
update public.workspace_members
set role = 'manager'
where workspace_id = :'workspace_id'::uuid and user_id = :'admin_y'::uuid;
commit;
SQL
B_STATUS=$?
set -e

wait "$A_PID"

ADMIN_COUNT="$(psql "$DB_URL" -At -v ON_ERROR_STOP=1 -v workspace_id="$WORKSPACE_ID" <<'SQL'
select count(*)
from public.workspace_members
where workspace_id = :'workspace_id'::uuid and role = 'admin';
SQL
)"

if [[ "$B_STATUS" -ne 0 ]] \
  && grep -q 'LAST_ADMIN_PROTECTED:' "$B_LOG" \
  && [[ "$ADMIN_COUNT" = "1" ]]; then
  cleanup_data
  echo "PASS: concurrent demotions were serialized and one admin remains"
  exit 0
fi

echo "FAIL: expected session B to receive LAST_ADMIN_PROTECTED and one admin to remain" >&2
echo "Session A output:" >&2
sed 's/^/  /' "$A_LOG" >&2
echo "Session B output:" >&2
sed 's/^/  /' "$B_LOG" >&2
echo "Remaining admins: $ADMIN_COUNT" >&2
cleanup_data
exit 1
