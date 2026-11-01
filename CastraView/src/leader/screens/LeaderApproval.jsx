import { useMemo, useState } from 'react'

import { PROPOSALS } from '../data/leaderMock'
import { LeaderApprovalView } from '../ui/LeaderApprovalView'

const PAGE_SIZE = 6

export default function LeaderApproval({ notify }) {
  const [proposals, setProposals] = useState(PROPOSALS)
  const [selectedId, setSelectedId] = useState(PROPOSALS[0].id)
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const selected = proposals.find((proposal) => proposal.id === selectedId) || null
  const summaryCounts = proposals.reduce((result, proposal) => ({ ...result, [proposal.status]: (result[proposal.status] || 0) + 1 }), {})
  const reviewCount = (summaryCounts.pending || 0) + (summaryCounts.edited || 0)

  const filteredProposals = useMemo(() => proposals.filter((proposal) => {
    const matchesFilter = filter === 'all' || proposal.status === filter
    const matchesType = typeFilter === 'all' || proposal.type === typeFilter
    const matchesDate = dateFilter === 'all' || (dateFilter === 'today' ? proposal.date === '2026-05-30' : proposal.date >= '2026-05-24')
    const matchesQuery = `${proposal.id} ${proposal.title} ${proposal.author} ${proposal.channel}`.toLowerCase().includes(query.toLowerCase())
    return matchesFilter && matchesType && matchesDate && matchesQuery
  }), [dateFilter, filter, proposals, query, typeFilter])

  const pageCount = Math.max(1, Math.ceil(filteredProposals.length / PAGE_SIZE))

  function updateFilter(setter, value) {
    setter(value)
    setPage(1)
  }

  function updateStatus(id, status) {
    setProposals((current) => current.map((proposal) => proposal.id === id ? { ...proposal, status } : proposal))
    setSelectedId(id)
    notify?.(`${id} ${status === 'approved' ? 'đã được phê duyệt.' : 'đã được gửi trả để chỉnh sửa.'}`)
  }

  function exportQueue() {
    const header = 'Proposal ID,Title,Type,Author,Status,Submitted\n'
    const body = proposals.map((proposal) => [proposal.id, proposal.title, proposal.type, proposal.author, proposal.status, proposal.submitted].map((value) => `"${value}"`).join(',')).join('\n')
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'castravision-approval-queue.csv'
    link.click()
    URL.revokeObjectURL(url)
    notify?.('Đã xuất approval queue CSV.')
  }

  function refreshPipeline() {
    setPage(1)
    notify?.('Approval pipeline đã được làm mới.')
  }

  return <LeaderApprovalView
    proposals={filteredProposals}
    summaryCounts={summaryCounts}
    selected={selected}
    reviewCount={reviewCount}
    filter={filter}
    query={query}
    typeFilter={typeFilter}
    dateFilter={dateFilter}
    page={page}
    pageCount={pageCount}
    onFilter={(value) => updateFilter(setFilter, value)}
    onQuery={(value) => updateFilter(setQuery, value)}
    onTypeFilter={(value) => updateFilter(setTypeFilter, value)}
    onDateFilter={(value) => updateFilter(setDateFilter, value)}
    onPage={(value) => setPage(Math.min(Math.max(value, 1), pageCount))}
    onSelect={setSelectedId}
    onApprove={(id) => updateStatus(id, 'approved')}
    onRequestChanges={(id) => updateStatus(id, 'edited')}
    onRefresh={refreshPipeline}
    onExport={exportQueue}
  />
}
