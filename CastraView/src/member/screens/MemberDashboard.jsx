import { MemberDashboardView } from '../ui/MemberDashboardView'

export default function MemberDashboard({ profile, imports = [], strategy, setPage, notify }) {
  return (
    <MemberDashboardView
      profile={profile}
      imports={imports}
      strategy={strategy}
      onOpenPage={setPage}
      notify={notify}
    />
  )
}
