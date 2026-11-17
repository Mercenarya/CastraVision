# Dat integration verification — 2026-11-17

Integrated the tested Supabase Auth and personnel onboarding work with both
`origin/Dat` (1d845b1) and `origin/main` (6c4aeb5), preserving both histories.
Work was assembled in an isolated worktree; original source trees were retained.
No hosted database migration was applied.

## Verification

- Backend: 43 pytest tests passed. Ruff passed for CastraVision, CastraServices,
  and the modified Utils/supabase_client.py.
- Frontend: 21 Vitest tests, 11 Node Auth security tests and 11 Node membership
  tests passed. Production build passed. Oxlint reports 16 inherited warnings,
  no errors; production bundle has an inherited size warning.
- Combined migrations: 11 pgTAP files, 175 assertions passed before and after
  resetting the separate CastraVision-publish-dat-test local database.
- Real local GoTrue/PostgREST and Django integration passed six groups:
  four-role and cross-company isolation, concurrent join requests, concurrent
  approvals, email verification and password setup, invitation delivery and
  recipient-bound acceptance, and existing password login. Fixtures were cleaned.
- Gitleaks scan of the proposed current tree: zero findings. This does not
  certify or rewrite historical commits. Actual .env and credential files are
  excluded; template environment variable files contain no operational keys.

## Integration adjustments

- Preserve Dat's datasource credential removal, audit triggers, performance
  indexes and startup/CI fixes.
- Keep membership table writes restricted to RPCs. Update audit fixture setup
  without restoring direct authenticated writes. Check the approved Employee
  membership under that Employee's JWT, respecting self-only SELECT policies.
- Update old component tests to current UI exports and navigation contracts.
  Run Node tests separately from Vitest's browser environment.
- Initialize the legacy datasource Supabase client lazily, so importing Django
  does not require operational credentials. Missing configuration still fails
  clearly when that datasource client is actually requested.

## Known inherited test gap

`src/marketing/tests/storeSeparation.test.js` imports
`../services/proposalDecisionService.js`, which is absent on the integrated
main source. Its standalone Node run fails with ERR_MODULE_NOT_FOUND. It is a
Node test, not a Vitest suite; the Vitest configuration separates runners.
This unfinished marketing service/test is outside the verified Auth/personnel
workflow and remains for its owner. No claim is made that it passes.

Hosted email delivery, hosted schema and production deployment remain separate
from this Git publication and require their own verification.
