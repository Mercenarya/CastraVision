import { MemberDashboardView } from '../ui/MemberDashboardView'

export default function MemberDashboard({
  user,
  profile,
  imports = [],
  latestRows = [],
  strategy,
  setPage,
  loading = false,
  proposalStatus = 'unavailable',
  proposals = [],
}) {
  return (
    <MemberDashboardView
      user={user}
      profile={profile}
      imports={imports}
      latestRows={latestRows}
      strategy={strategy}
      loading={loading}
      proposalStatus={proposalStatus}
      proposals={proposals}
      onOpenPage={setPage}
    />
  )
}
