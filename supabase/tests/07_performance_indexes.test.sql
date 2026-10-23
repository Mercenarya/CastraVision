begin;
create extension if not exists pgtap with schema extensions;
select plan(3);

select has_index(
  'public',
  'audit_logs',
  'idx_audit_logs_workspace_actor_time',
  'audit_logs has the workspace/actor/time performance index'
);

select hasnt_index(
  'public',
  'audit_logs',
  'idx_audit_logs_workspace_entity_action_time',
  'audit_logs omits the low-value workspace/entity/action/time index'
);

select has_index(
  'public',
  'notifications',
  'idx_notifications_user_created_time',
  'notifications has the user/newest-first performance index'
);

select * from finish();
rollback;
