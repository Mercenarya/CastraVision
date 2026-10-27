import { MemberDashboardView } from '../ui/MemberDashboardView'

export default function MemberDashboard({ profile, imports = [], strategy, setPage }) {
  return (
    <MemberDashboardView
      profile={profile}
      imports={imports}
      strategy={strategy}
      onOpenPage={setPage}
    />
  )
}
