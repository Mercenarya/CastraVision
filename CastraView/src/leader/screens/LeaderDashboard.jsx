import { useState } from 'react'

import { LeaderDashboardView } from '../ui/LeaderDashboardView'

export default function LeaderDashboard({ imports = [], setPage }) {
  const [refreshCount, setRefreshCount] = useState(0)

  return (
    <LeaderDashboardView
      key={refreshCount}
      importCount={imports.length}
      onOpenBudget={() => setPage?.('budget')}
      onRefresh={() => setRefreshCount((count) => count + 1)}
    />
  )
}
