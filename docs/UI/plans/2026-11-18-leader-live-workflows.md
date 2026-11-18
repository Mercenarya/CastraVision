# Leader live workflows — implementation and verification ledger

User request: attachment 0ab06153-9d9d-40a2-8a04-38b7e243798d, 18 November 2026.
Explicitly authorizes focused backend/frontend/new migrations; no commits or
hosted schema/data changes without separate approval. Preserve banner removal.

Working tree: .tmp/publish-dat, Dat, d14a54e. Existing modification App.jsx and
untracked audit artifacts are user work and must remain. Runtime 5173/8000.

| Dependency / function | Observed cause | Necessary surface | Proof |
|---|---|---|---|
| RAG | SQLite lacks KnowledgeChunk | Existing Django migrations, operational initialization | Real search + generate API |
| Import | Hosted lacks raw metric/batch fields | New additive reconciliation migration, campaign_api/import RPC | CSV/XLSX preview/commit, repeat, rollback, read-back |
| Campaign and Team scope | No persistent campaign entity or per-record Team link | Add campaigns and Team FK columns, narrow RLS/RPC | Two workspaces/two Teams; deny cross-scope writes/reads |
| Proposals and decisions | Fixtures and local state | Extend existing approvals and target tables; revisions + atomic RPC | Own submissions, edit/read-back, transitions, race/idempotency |
| Budget | Incomplete list contract and UI-only threshold | Detail contract and server validation | Numeric envelope, baseline zero, >20% escalation, self-approval denial |
| Strategy/content | RAG initialization, transient generated result | Save result to strategies/content through scoped RPC | Real generation, provider label, reload, submit/review |
| Overview/performance | Fixture data and no persisted operations | Leader service/hook + existing screen consumers | Empty states, scoped aggregates/date range/campaign filter |
| Notifications | Hard-coded badge/body | Reuse public.notifications for workflow events | Recipient/read status/entity links and reload |
| Settings/identity | Business-edit form shown to Leader | Own-profile endpoint/UI, layout metadata | Only self-editable fields; role/workspace unchanged |

Implementation order:
1. Reproduce baseline and write regression tests; initialize runtime Django DB.
2. New migrations and authenticated-role SQL tests on separate leader test stack.
3. JWT-forwarding API/contract, genuine local integration tests.
4. Replace fixture consumers in Leader screens, preserve layout and navigation.
5. Regression SQL reset/test, backend, Node/Vitest, lint/build and browser E2E.
6. Hosted rollout package only after local checks. Ask approval with concrete
   migration/data/permission impact and recovery steps. Never reset hosted.

Semantics:
- Legacy admin=Marketing Manager, manager=Leader, member=Employee, no enum cutover.
- Marketing Manager can govern workspace; Leader only assigned Teams. Unscoped
  legacy rows remain visible to authorized Marketing Managers, not silently
  assigned to a Team or exposed to Leaders.
- Reviewers cannot approve their own submissions. Existing approved exception
  for Marketing Manager strategy self-approval stays specific to that case.
- Budget envelope is fixed. Any channel above absolute 20% change requires MM;
  a zero baseline with positive proposed spend also requires escalation.
- Approval is an internal governance event, not ad dispatch. Pause is a governed
  request unless a real authorized adapter exists; never claim ad network pause.
- AI fallback/template outputs are labelled explicitly. Empty data is empty.

Progress and test results will be appended as each dependency is verified.
