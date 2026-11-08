import { useState } from 'react'
import { LeaderDashboardView } from '../ui/LeaderDashboardView'

export default function LeaderDashboard({ imports = [], setPage, notify }) {
  const [refreshCount, setRefreshCount] = useState(0)

  return (
    <LeaderDashboardView
      key={refreshCount}
      importCount={imports.length}
      onOpenBudget={() => setPage?.('budget')}
      onOpenPage={setPage}
      onRefresh={() => setRefreshCount((count) => count + 1)}
      notify={notify}
    />
  )
}
