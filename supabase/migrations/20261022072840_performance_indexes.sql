-- SCRUM-206: indexes retained only after local EXPLAIN (ANALYZE, BUFFERS)
-- benchmarks at 200k audit rows and 100k notifications.
-- Production note: if these tables are already large, build equivalent
-- indexes with CREATE INDEX CONCURRENTLY outside the migration transaction.

-- Serves workspace-scoped audit filtering by actor and newest-first paging.
create index if not exists idx_audit_logs_workspace_actor_time
  on public.audit_logs (workspace_id, actor_id, created_at desc);

comment on index public.idx_audit_logs_workspace_actor_time is
  'SCRUM-206: audit actor/time filter; use CREATE INDEX CONCURRENTLY on large production tables';

-- Serves the notification bell newest-first query with LIMIT 20.
create index if not exists idx_notifications_user_created_time
  on public.notifications (user_id, created_at desc);

comment on index public.idx_notifications_user_created_time is
  'SCRUM-206: latest notifications per user; use CREATE INDEX CONCURRENTLY on large production tables';
