# SDD ledger — plan: docs/UI/plans/2026-11-17-membership-invitations-onboarding-plan.md

Spec approved and Native execution approved in conversation, 17/11/2026.

## Setup and rulings
- Isolated detached worktree `.tmp/mship` at baseline 6c4aeb5, overlaid 34 current uncommitted files; backup `.tmp/membership-native/before-membership.zip`; original hashes recorded. No commits/reset/push.
- Ruling: Windows path length prevented first worktree checkout; runtime Git longpaths and shorter ignored worktree used. No user changes discarded.
- Ruling: Use this persistent ledger rather than commit-oriented bash SDD helpers; Windows environment and user no-commit constraint. Do not delete ledger at finish.
- Native execution remains serial. One fresh reviewer after implementation, per executing-plans skill; no implementer subagents.
- Baseline: 18 tests failed because isolated worktree intentionally has no .env; Utils imports require Supabase env at module import. Ruling: provide local fixture env to test process, not copy real .env or alter product to satisfy environment setup.
- Preflight Tasks 1→2/3/4→8/9: camelCase HTTP contract, snake_case RPC parameters fixed in approved plan.
- Preflight Tasks 5→6/7: separate schema/workflow migrations, tables RLS deny direct writes, RPC alone mutates state.
- Preflight Tasks 6/7→8: user JWT for business RPC, service credential only delivery acknowledgment. Auth/password never mirrored into Django.
- Preflight Task 10: local project/port guard first; hosted apply only after local evidence and schema/history inspection.

## Tasks
- Task 1: complete — observed RED module missing; 6/6 Node service tests PASS; lint has only 16 existing warnings. DEV preview fixture created; activation accompanies Task 2 integration.
- Baseline with process-local fixture Supabase settings: 29/29 pytest PASS.
- Task 2: frontend implementation ready — old browser lacked three tabs (RED); new DEV personnel tabs/review dialog observed, no Vite error; lint/build pass. Full real-data and mobile/race acceptance in Task 9/10.
- Task 3: frontend implementation ready — 5 email-onboarding Node tests RED missing module → GREEN; email-only entry, callback, password/company pages and Auth gate wired. Backend credential state pending.
- Task 4: frontend implementation ready — replaced fixed badge with recipient notifications component; 30s visibility polling, read errors preserved. Real recipient-isolation acceptance pending API/DB.
- Tasks 5–8: implemented. Fresh local migration reset succeeds; 8 SQL files / 122 assertions PASS. New backend HTTP tests RED 404/missing module → 10/10 PASS; entire pytest 39/39 PASS. SupabaseDataClient forwards caller JWT; delivery acknowledgment alone uses service client.
- Task 9: integrated. Auth/session provides database onboarding state; existing members have an explicit invitations/join entry. Lint/build verification and real browser tests ongoing.
- Task 10: real GoTrue email delivered to local Mailpit and callback verified; password gating, actual password change, opted-in directory, two HTTP connections for duplicate requests/approvals, manager/employee notification isolation, four-role API boundary, local invitation delivery and explicit recipient accept PASS. Fixtures removed after each integration run.
- Ruling: observed GoTrue creates an internal password hash for new OTP users; encrypted_password presence cannot prove user setup. Added an unexposed, RLS-protected password-completion table and Auth password-change trigger. Existing password users are grandfathered at migration time; new users must change their Auth password. No user_metadata-based authority. Real email integration failed before this correction and passed afterward.
- Ruling: SQL suite and integration fixture mutations must run sequentially on their shared dedicated stack. An overlapped run temporarily changed a directory count; rerun after fixture cleanup passed all 122 assertions. Do not parallelize shared-database mutation tests.
- No hosted migration, commit or push performed. Final browser/race/upgrade/security review and rollout inspection pending.
