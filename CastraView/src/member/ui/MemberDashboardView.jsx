import { MemberOverview } from './MemberWorkspacePages'

export function MemberDashboardView({
  user,
  profile,
  imports = [],
  latestRows = [],
  strategy,
  loading = false,
  proposalStatus = 'unavailable',
  proposals = [],
  onOpenPage,
}) {
  return (
    <MemberOverview
      user={user}
      profile={profile}
      imports={imports}
      latestRows={latestRows}
      strategy={strategy}
      loading={loading}
      proposalStatus={proposalStatus}
      proposals={proposals}
      onOpenPage={onOpenPage}
    />
  )
}
