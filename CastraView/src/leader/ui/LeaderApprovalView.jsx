import PropTypes from 'prop-types'

import { proposalStatusLabel, proposalTypeIcon } from '../data/leaderMock'
import './leader.css'

const FILTERS = [
  ['all', 'All proposals'],
  ['pending', 'Pending'],
  ['edited', 'Needs review'],
  ['approved', 'Approved'],
]

const STATUS_TONES = {
  pending: 'pending',
  edited: 'attention',
  approved: 'on-track',
  rejected: 'rejected',
  signed: 'signed',
}

function SummaryCard({ label, value, detail, tone }) {
  return <article className={`leader-approval-stat ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

SummaryCard.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.number.isRequired, detail: PropTypes.string.isRequired, tone: PropTypes.string.isRequired }

export function LeaderApprovalView({ proposals, summaryCounts, selected, reviewCount, filter, query, typeFilter, dateFilter, page, pageCount, onFilter, onQuery, onTypeFilter, onDateFilter, onPage, onSelect, onApprove, onRequestChanges, onRefresh, onExport }) {
  const pageItems = proposals.slice((page - 1) * 6, page * 6)

  return (
    <div className="leader-approval-page">
      <header className="leader-page-intro leader-approval-intro">
        <div><span className="leader-eyebrow">LEADER WORKSPACE · GOVERNANCE</span><h1>Proposal Approval Queue</h1><p>Review campaign proposals before they move into production. Every decision is recorded.</p></div>
        <div className="leader-approval-actions"><button type="button" className="leader-secondary-button" onClick={onExport}>⇩ Export Queue (CSV)</button><button type="button" className="leader-primary-button" onClick={onRefresh}>↻ Refresh Pipeline</button></div>
      </header>

      <div className="leader-approval-governance"><span><b>✓ Governance active</b> · Human-in-the-loop approval is required before production.</span><span>Last audit sync: 4 min ago</span></div>

      <section className="leader-approval-stats" aria-label="Approval summary">
        <SummaryCard label="Pending" value={summaryCounts.pending || 0} detail="Awaiting decision" tone="coral" />
        <SummaryCard label="Approved" value={summaryCounts.approved || 0} detail="This review cycle" tone="green" />
        <SummaryCard label="Rejected" value={summaryCounts.rejected || 0} detail="Returned to owner" tone="red" />
        <SummaryCard label="Recently signed" value={summaryCounts.signed || 0} detail="Last 7 days" tone="violet" />
      </section>

      <section className="leader-card leader-queue-card">
        <div className="leader-queue-toolbar">
          <label className="leader-search leader-queue-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search proposals, IDs, or owners" aria-label="Search proposals" /></label>
          <label className="leader-select-wrap"><span>Proposal type</span><select value={typeFilter} onChange={(event) => onTypeFilter(event.target.value)}><option value="all">All types</option><option value="Content">Content</option><option value="Creative">Creative</option><option value="Campaign">Campaign</option></select></label>
          <label className="leader-select-wrap"><span>Status</span><select value={filter} onChange={(event) => onFilter(event.target.value)}><option value="all">All statuses</option><option value="pending">Pending</option><option value="edited">Needs review</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="signed">Recently signed</option></select></label>
          <label className="leader-select-wrap"><span>Date range</span><select value={dateFilter} onChange={(event) => onDateFilter(event.target.value)}><option value="all">All dates</option><option value="today">Today</option><option value="week">Last 7 days</option></select></label>
        </div>
        <div className="leader-quick-filters"><span>Quick filters</span>{FILTERS.map(([key, label]) => <button type="button" className={filter === key ? 'active' : ''} key={key} onClick={() => onFilter(key)}>{label}{key === 'pending' && <b>{reviewCount}</b>}</button>)}</div>
        <div className="leader-table-wrap leader-approval-table-wrap"><table className="leader-approval-table"><thead><tr><th>Proposal</th><th>Type</th><th>Submitted by</th><th>Submitted</th><th>Status</th><th>Confidence</th><th aria-label="Actions" /></tr></thead><tbody>{pageItems.map((proposal) => <tr className={selected?.id === proposal.id ? 'selected' : ''} key={proposal.id} onClick={() => onSelect(proposal.id)}><td><button type="button" className="leader-proposal-link" onClick={(event) => { event.stopPropagation(); onSelect(proposal.id) }}><span className={`leader-proposal-type ${proposal.type.toLowerCase()}`}>{proposalTypeIcon(proposal.type)}</span><span><strong>{proposal.title}</strong><small>{proposal.id} · {proposal.channel}</small></span></button></td><td><span className="leader-type-tag">{proposal.type}</span></td><td>{proposal.author}</td><td>{proposal.submitted}</td><td><span className={`leader-status-pill ${STATUS_TONES[proposal.status]}`}>{proposalStatusLabel(proposal.status)}</span></td><td><b className="leader-confidence">{proposal.confidence}</b></td><td><div className="leader-row-actions">{proposal.status !== 'approved' && proposal.status !== 'signed' && <><button type="button" className="leader-table-button" onClick={(event) => { event.stopPropagation(); onRequestChanges(proposal.id) }}>Request changes</button><button type="button" className="leader-table-button approve" onClick={(event) => { event.stopPropagation(); onApprove(proposal.id) }}>Approve</button></>}</div></td></tr>)}</tbody></table>{!pageItems.length && <p className="leader-empty-state">No proposals match the selected filters.</p>}</div>
        <div className="leader-pagination"><span>Showing {pageItems.length ? (page - 1) * 6 + 1 : 0}–{Math.min(page * 6, proposals.length)} of {proposals.length} proposals</span><span className="leader-page-buttons"><button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1}>‹</button><span>Page {page} of {pageCount}</span><button type="button" onClick={() => onPage(page + 1)} disabled={page >= pageCount}>›</button></span></div>
      </section>

      <div className="leader-stage-gate"><span>◎</span><div><strong>Human-in-the-loop stage gate</strong><p>Proposals cannot enter production until a Leader or Marketing Manager records an approval decision.</p></div><b>FR04 active</b></div>

      <section className="leader-health-grid" aria-label="Operational health">
        <article className="leader-card leader-health-card"><span className="leader-section-kicker">UPSTREAM WORKER HEALTH</span><h2>All workers nominal</h2><div className="leader-health-value"><strong>99.8%</strong><span className="leader-health-dot" /></div><p>Content and creative engines reporting within SLA.</p><div className="leader-health-bars"><i /><i /><i /><i /><i /><i /></div></article>
        <article className="leader-card leader-health-card"><span className="leader-section-kicker">QUEUE VELOCITY &amp; SLA</span><h2>Healthy throughput</h2><div className="leader-health-value"><strong>18.4/hr</strong><span className="leader-health-trend">↑ 12%</span></div><p>Median decision time is <b>42 minutes</b>.</p><div className="leader-sla-track"><span style={{ width: '78%' }} /></div></article>
        <article className="leader-card leader-health-card"><span className="leader-section-kicker">SIGNOFF POLICY FR04</span><h2>Policy enforced</h2><div className="leader-health-value"><strong>100%</strong><span className="leader-health-dot" /></div><p>Approval records and audit trails are required for production.</p><button type="button" className="leader-text-link">View policy details →</button></article>
      </section>
    </div>
  )
}

LeaderApprovalView.propTypes = {
  proposals: PropTypes.arrayOf(PropTypes.object).isRequired,
  summaryCounts: PropTypes.objectOf(PropTypes.number).isRequired,
  selected: PropTypes.object,
  reviewCount: PropTypes.number.isRequired,
  filter: PropTypes.string.isRequired,
  query: PropTypes.string.isRequired,
  typeFilter: PropTypes.string.isRequired,
  dateFilter: PropTypes.string.isRequired,
  page: PropTypes.number.isRequired,
  pageCount: PropTypes.number.isRequired,
  onFilter: PropTypes.func.isRequired,
  onQuery: PropTypes.func.isRequired,
  onTypeFilter: PropTypes.func.isRequired,
  onDateFilter: PropTypes.func.isRequired,
  onPage: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  onRequestChanges: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
}
