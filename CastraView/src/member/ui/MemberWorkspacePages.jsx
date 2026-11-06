import { useEffect, useMemo, useState } from 'react'

import { useProposals } from '../../marketing/data/marketingStore'
import { normalizeMemberPage } from '../memberContract'
import { proposalReferencePreview } from '../memberProposalPreview'
import { proposalDetailsReferencePreview } from '../memberProposalDetailsPreview'
import {
  CAMPAIGN_PLATFORMS,
  createProposalDraft,
  PROPOSAL_CHARACTER_LIMITS,
} from '../memberModalContract'
import './member.css'

function useEscapeToClose(onClose) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])
}

function formatDate(value) {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.valueOf())
    ? value
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function statusLabel(status) {
  return String(status || 'draft').replace(/_/g, ' ')
}

const CAMPAIGN_REFERENCE_ROWS = [
  { channel: 'TikTok Ads', period: 'Example · Last 30 days', spend: 4820, clicks: 12460, conversions: 318, revenue: 14280 },
  { channel: 'Meta Ads', period: 'Example · Last 30 days', spend: 3960, clicks: 9810, conversions: 244, revenue: 10950 },
  { channel: 'Google Ads', period: 'Example · Last 30 days', spend: 5275, clicks: 8470, conversions: 291, revenue: 16820 },
]

const NOTIFICATION_REFERENCE_ITEMS = [
  { title: 'Proposal review example', detail: 'A manager left feedback on a sample content proposal.', when: 'Example activity · 2 hours ago', status: 'Review example' },
  { title: 'Campaign data example', detail: 'A sample import is ready for workspace review.', when: 'Example activity · Yesterday', status: 'Data example' },
  { title: 'Strategy update example', detail: 'A sample strategy recommendation was refreshed.', when: 'Example activity · 2 days ago', status: 'Strategy example' },
]

function EmptyState({ icon = '◌', title, body, action, onAction }) {
  return (
    <div className="member-empty-state">
      <span className="member-empty-state__icon" aria-hidden="true">{icon}</span>
      <h2>{title}</h2>
      <p>{body}</p>
      {action && (
        <button type="button" className="member-button member-button--primary" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  )
}

function Metric({ label, value, detail, tone = 'primary' }) {
  return (
    <article className={`member-metric member-metric--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

export function LegacyMemberOverview({ user, profile, imports = [], latestRows = [], strategy, onOpenPage }) {
  const proposals = useProposals()
  const identities = useMemo(() => [
    user?.id,
    user?.memberId,
    user?.email,
    user?.full_name,
    user?.user_metadata?.full_name,
  ].filter(Boolean).map((value) => String(value).toLowerCase()), [user])
  const ownProposals = useMemo(() => proposals.filter((proposal) => {
    const authors = [proposal.authorId, proposal.author, proposal.authorEmail]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase())
    return authors.some((author) => identities.includes(author))
  }), [identities, proposals])
  const hasProfile = Boolean(profile?.business_name)
  const hasCampaignData = imports.length > 0 || latestRows.length > 0
  const strategyReady = Boolean(strategy?.strategy)
  const completed = [hasProfile, hasCampaignData, strategyReady].filter(Boolean).length
  const businessName = profile?.business_name || 'your workspace'
  const displayName = user?.full_name || user?.user_metadata?.full_name || 'Member'
  const pendingProposals = ownProposals.filter((item) => ['pending', 'pending_review', 'edited'].includes(item.status)).length
  const approvedProposals = ownProposals.filter((item) => item.status === 'approved').length
  const revisionProposals = ownProposals.filter((item) => item.status === 'rejected').length

  return (
    <div className="member-page member-overview">
      <div className="member-page__intro">
        <div>
          <span className="member-eyebrow">Member workspace · Overview</span>
          <span className="member-status member-status--success">Workspace active · {businessName}</span>
          <h1>Welcome back, {displayName.split(' ')[0]}!</h1>
          <p>Review your available proposals, campaign data, and recommendations.</p>
        </div>
        <div className="member-overview__actions">
          <button type="button" className="member-button member-button--secondary" onClick={() => onOpenPage('proposals')}>View my proposals</button>
          <button type="button" className="member-button member-button--primary" onClick={() => onOpenPage('content')}>Open Content Studio</button>
        </div>
      </div>

      <section className="member-metrics" aria-label="Member workspace metrics">
        <Metric label="My proposals" value={ownProposals.length} detail="Records visible to your account" />
        <Metric label="Pending submissions" value={pendingProposals} detail="Awaiting a decision" tone="cyan" />
        <Metric label="Approved" value={approvedProposals} detail="Reviewed proposals" tone="success" />
        <Metric label="Revisions requested" value={revisionProposals} detail="Read manager feedback" tone="violet" />
        <Metric label="Campaign data rows" value={latestRows.length} detail={imports.length ? `${imports.length} import batches` : 'No imported dataset'} tone="cyan" />
      </section>

      {!hasProfile && (
        <section className="member-callout member-callout--attention" aria-label="Profile setup task">
          <span className="member-callout__icon" aria-hidden="true">!</span>
          <div>
            <strong>Complete your business profile</strong>
            <p>Strategy and content recommendations need business context before they can be generated.</p>
          </div>
          <button type="button" className="member-button member-button--primary" onClick={() => onOpenPage('account')}>
            Open account settings
          </button>
        </section>
      )}

      <div className="member-overview-grid">
        <section className="member-panel member-panel--wide">
          <div className="member-panel__header">
            <div>
              <span className="member-eyebrow">Priority tasks</span>
              <h2>Next best actions</h2>
            </div>
            <span className="member-panel__meta">{3 - completed} remaining</span>
          </div>
          <div className="member-task-list">
            <button type="button" className={`member-task ${hasProfile ? 'is-complete' : ''}`} onClick={() => onOpenPage('account')}>
              <span className="member-task__marker">{hasProfile ? '✓' : '01'}</span>
              <span><strong>Set up business context</strong><small>{hasProfile ? 'Profile is ready for recommendations.' : 'Tell CastraVision about your business and audience.'}</small></span>
              <b aria-hidden="true">›</b>
            </button>
            <button type="button" className={`member-task ${hasCampaignData ? 'is-complete' : ''}`} onClick={() => onOpenPage('import')}>
              <span className="member-task__marker">{hasCampaignData ? '✓' : '02'}</span>
              <span><strong>Bring in campaign history</strong><small>{hasCampaignData ? `${latestRows.length} rows are available to the strategy engine.` : 'Upload CSV or XLSX campaign performance data.'}</small></span>
              <b aria-hidden="true">›</b>
            </button>
            <button type="button" className={`member-task ${strategyReady ? 'is-complete' : ''}`} onClick={() => onOpenPage('strategy')}>
              <span className="member-task__marker">{strategyReady ? '✓' : '03'}</span>
              <span><strong>Review a strategy recommendation</strong><small>{strategyReady ? 'A recommendation is ready for review.' : 'Use your profile and campaign data to generate one.'}</small></span>
              <b aria-hidden="true">›</b>
            </button>
          </div>
        </section>

        <section className="member-panel">
          <div className="member-panel__header">
            <div>
              <span className="member-eyebrow">Quick actions</span>
              <h2>Workspace tools</h2>
            </div>
          </div>
          <div className="member-action-list">
            <button type="button" onClick={() => onOpenPage('proposals')}><span>▤</span> My proposals <b>›</b></button>
            <button type="button" onClick={() => onOpenPage('campaigns')}><span>⚑</span> Assigned campaigns <b>›</b></button>
            <button type="button" onClick={() => onOpenPage('content')}><span>✦</span> Generate content <b>›</b></button>
          </div>
        </section>
      </div>

      <div className="member-overview-grid member-overview-grid--lower">
        <section className="member-panel member-panel--wide">
          <div className="member-panel__header">
            <div>
              <span className="member-eyebrow">Recent activity</span>
              <h2>Campaign data pulse</h2>
            </div>
            <button type="button" className="member-text-button" onClick={() => onOpenPage('import')}>View imports ›</button>
          </div>
          {hasCampaignData ? (
            <div className="member-activity-row">
              <span className="member-activity-row__icon">⇧</span>
              <div><strong>{imports[0]?.filename || 'Campaign performance history'}</strong><small>{imports[0]?.row_count || latestRows.length} rows available · Last available import {formatDate(imports[0]?.created_at)}</small></div>
              <span className="member-status member-status--success">Available</span>
            </div>
          ) : (
            <EmptyState icon="⇧" title="No campaign history yet" body="Import a CSV or XLSX file to unlock data-backed strategy recommendations." action="Start an import" onAction={() => onOpenPage('import')} />
          )}
        </section>

        <section className="member-panel">
          <div className="member-panel__header">
            <div>
              <span className="member-eyebrow">Strategy signal</span>
              <h2>Recommendation state</h2>
            </div>
          </div>
          <div className="member-signal">
            <span className={`member-signal__dot ${strategyReady ? 'is-ready' : ''}`} />
            <strong>{strategyReady ? `${strategy.strategy.confidence}% confidence` : 'Waiting for inputs'}</strong>
            <p>{strategyReady ? strategy.strategy.recommended_channel : 'Complete profile and import data before generating a strategy.'}</p>
            <button type="button" className="member-text-button" onClick={() => onOpenPage('strategy')}>{strategyReady ? 'Review strategy ›' : 'Open strategy studio ›'}</button>
          </div>
        </section>
      </div>

      <section className="member-panel member-overview__submissions" aria-label="Recent proposals">
        <div className="member-panel__header">
          <div>
            <span className="member-eyebrow">Proposal review</span>
            <h2>My recent submissions</h2>
            <p>Track review status and manager feedback on proposals linked to your account.</p>
          </div>
          <button type="button" className="member-text-button" onClick={() => onOpenPage('proposals')}>View all proposals →</button>
        </div>
        {ownProposals.length ? (
          <div className="member-table-wrap">
            <table className="member-table">
              <thead><tr><th>Proposal</th><th>Channel</th><th>Submitted</th><th>Status</th><th>Feedback</th><th>Action</th></tr></thead>
              <tbody>{ownProposals.slice(0, 5).map((proposal) => (
                <tr key={proposal.id}>
                  <td><strong>{proposal.title || proposal.name || 'Untitled proposal'}</strong></td>
                  <td>{proposal.targetChannel || 'Not specified'}</td>
                  <td>{formatDate(proposal.submittedAt || proposal.createdDate)}</td>
                  <td><span className={`member-status member-status--${proposal.status}`}>{statusLabel(proposal.status)}</span></td>
                  <td>{proposal.revisionNote || proposal.noticeText || 'No feedback recorded'}</td>
                  <td><button type="button" className="member-text-button" onClick={() => onOpenPage('proposals')}>View details</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="▤" title="No submissions to display" body="Proposal activity will appear here when records are associated with your account." action="Open proposals" onAction={() => onOpenPage('proposals')} />
        )}
      </section>
    </div>
  )
}

export function MemberProposalsPage({ user, proposalStatus = 'unavailable', proposals = [], onOpenPage }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const ownProposals = useMemo(() => proposalStatus === 'loaded' && user?.id
    ? proposals.filter((proposal) => proposal.authorId === user.id)
    : [], [proposalStatus, proposals, user?.id])
  const filtered = useMemo(() => ownProposals.filter((proposal) => {
    const matchesQuery = !query || `${proposal.title || proposal.name} ${proposal.targetChannel || ''}`.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = status === 'all' || proposal.status === status
    return matchesQuery && matchesStatus
  }), [ownProposals, query, status])
  const referenceRows = useMemo(() => proposalReferencePreview.rows.filter((proposal) => {
    const matchesQuery = !query || `${proposal.title} ${proposal.channel} ${proposal.id}`.toLowerCase().includes(query.toLowerCase())
    const proposalStatusValue = proposal.status.toLowerCase().replace(/\s+/g, '_')
    return matchesQuery && (status === 'all' || proposalStatusValue === status)
  }), [query, status])
  const showingExamples = proposalStatus === 'unavailable'
  const visibleMetrics = showingExamples ? proposalReferencePreview.metrics : [
    { label: 'My proposals', value: ownProposals.length, note: 'Personal scope' },
    { label: 'Pending review', value: ownProposals.filter((item) => ['pending', 'pending_review', 'edited'].includes(item.status)).length, note: 'In manager queue' },
    { label: 'Approved', value: ownProposals.filter((item) => item.status === 'approved').length, note: 'Reviewed proposals' },
    { label: 'Rejected', value: ownProposals.filter((item) => item.status === 'rejected').length, note: 'Needs revision' },
  ]
  const rows = showingExamples ? referenceRows : filtered
  const priorityFeedback = showingExamples ? proposalReferencePreview.priorityFeedback : ownProposals.find((proposal) => proposal.status === 'rejected' && (proposal.revisionNote || proposal.noticeText))
  const feedbackManager = typeof priorityFeedback?.manager === 'string' ? priorityFeedback.manager : 'Workspace Manager'
  const openProposal = (proposal) => setSelected(showingExamples
    ? { ...proposal, isExample: true, targetChannel: proposal.channel, createdDate: proposal.submitted, revisionNote: proposal.id === proposalReferencePreview.priorityFeedback.proposalId ? proposalReferencePreview.priorityFeedback.message : '' }
    : proposal)

  if (selected?.isExample) return <ProposalDetailsPage onBack={() => setSelected(null)} />

  return (
    <div className="member-page member-proposals">
      <header className="member-proposals__intro">
        <div>
          <div className="member-proposals__context"><span>CONTRIBUTOR WORKSPACE</span><i>•</i><span>◈ RBAC Profile: Member</span></div>
          <h1>My Proposals</h1>
          <p>Personal submission pipeline, manager triage feedback, and contributor authoring tasks.</p>
        </div>
        <div className="member-proposals__intro-actions">
          <span className="member-proposals__data-state">{proposalStatus === 'loaded' ? 'Account data' : proposalStatus === 'loading' ? 'Loading account data' : 'Reference preview'}</span>
          <button type="button" className="member-button member-button--primary" onClick={() => setCreateOpen(true)}>＋ Create Proposal</button>
        </div>
      </header>
      {showingExamples && <div className="member-proposals__disclaimer" role="status"><strong>{proposalReferencePreview.label}</strong><span>{proposalReferencePreview.disclaimer} The API does not currently provide an authoritative proposal list, so examples are excluded from account decisions.</span></div>}
      {proposalStatus === 'loading' && <div className="member-source-note" role="status">Loading verified proposal records…</div>}
      {proposalStatus === 'unavailable' && <div className="member-unavailable" role="note"><span aria-hidden="true">ⓘ</span><div><strong>Account proposal data is unavailable</strong><p>The backend does not expose an authoritative proposal-list endpoint. The reference preview below is not account activity.</p></div></div>}
      <section className={`member-proposals__metrics ${showingExamples ? 'is-preview' : ''}`} aria-label="Proposal metrics">
        {visibleMetrics.map((metric, index) => <article className={`member-proposals__metric tone-${index}`} key={metric.label}><div><span>{metric.label}</span><strong>{metric.value}</strong></div><small>{metric.note}</small></article>)}
      </section>
      <div className="member-proposals__columns">
        <section className="member-proposals__list">
          <header className="member-proposals__list-header"><div className="member-proposals__list-icon" aria-hidden="true">▤</div><div><h2>Recent Proposals</h2><p>Track submission statuses with independent revision versions</p></div><label className="member-proposals__search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter proposals…" aria-label="Filter proposals" /></label><label className="member-proposals__status-filter"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by proposal status"><option value="all">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="draft">Draft</option></select></label></header>
          <div className="member-proposals__table-wrap"><table className="member-proposals__table"><thead><tr><th>Proposal ID &amp; name</th><th>Type</th><th>Submitted</th><th>Approval status</th><th>Actions</th></tr></thead><tbody>{rows.map((proposal) => {
            const rowStatus = showingExamples ? proposal.status.toLowerCase().replace(/\s+/g, '_') : proposal.status
            return <tr key={proposal.id}><td><div className="member-proposals__identity"><button type="button" onClick={() => openProposal(proposal)}>{proposal.id}</button><span>{proposal.version}</span>{proposal.modified && <em>Modified</em>}</div><strong>{proposal.title || proposal.name}</strong><small>{showingExamples ? `${proposal.channel} · ${proposal.campaign}` : proposal.targetChannel || 'Not specified'}</small></td><td><span className="member-proposals__type">{proposal.type || 'Proposal'}</span></td><td>{showingExamples ? proposal.submitted : formatDate(proposal.submittedAt || proposal.createdDate)}</td><td><span className={`member-proposals__status status-${rowStatus}`}>{statusLabel(rowStatus)}</span></td><td><button type="button" className="member-proposals__row-action" onClick={() => openProposal(proposal)}>{rowStatus === 'rejected' ? 'Revise' : 'View'}</button></td></tr>
          })}{rows.length === 0 && <tr><td colSpan="5"><EmptyState icon="▤" title={showingExamples ? 'No examples match this filter' : 'No proposals match this filter'} body="Try a different search or status filter." action="Clear filters" onAction={() => { setQuery(''); setStatus('all') }} /></td></tr>}</tbody></table></div>
          <footer className="member-proposals__list-footer"><span>◈ Approval status is governed under <strong>FR04 Human-in-the-Loop</strong> review.</span><span>{showingExamples ? '4 reference examples' : `${ownProposals.length} account proposals`}</span></footer>
        </section>
        <aside className="member-proposals__side">
          <section className="member-proposals__feedback"><header><span>▣</span><h2>Priority Manager Feedback</h2><b>{priorityFeedback ? priorityFeedback.status : 'No action'}</b></header>{priorityFeedback ? <article><div className="member-proposals__manager"><span>{feedbackManager.split(' ').map((name) => name[0]).join('')}</span><div><strong>{feedbackManager}</strong><small>{priorityFeedback.role}</small></div><time>{priorityFeedback.timestamp}</time></div><span className="member-proposals__reference">Ref: {priorityFeedback.proposalId} ({priorityFeedback.isExample ? 'example' : priorityFeedback.proposalTitle})</span><p>“{priorityFeedback.message || priorityFeedback.revisionNote || priorityFeedback.noticeText}”</p><footer><small>{priorityFeedback.version || 'Review feedback'}</small><button type="button" onClick={() => { const row = proposalReferencePreview.rows.find((item) => item.id === priorityFeedback.proposalId) || priorityFeedback; openProposal(row) }}>{priorityFeedback.isExample ? 'View example' : 'Open details'} →</button></footer></article> : <p className="member-proposals__quiet">No verified manager feedback is available for this account.</p>}</section>
          <section className="member-proposals__quick"><header><span>ϟ</span><h2>Quick Actions</h2><b>CONTRIBUTOR</b></header><button type="button" onClick={() => setCreateOpen(true)}><span>＋</span><div><strong>Create Proposal</strong><small>Start a new copy or budget draft</small></div><i>›</i></button><button type="button" onClick={() => { setQuery(''); setStatus('all') }}><span>≡</span><div><strong>View My Proposals</strong><small>{showingExamples ? 'Browse labeled examples' : `See ${ownProposals.length} submissions`}</small></div><i>›</i></button><button type="button" onClick={() => onOpenPage?.('notifications')}><span>♧</span><div><strong>View Notifications</strong><small>Open workspace activity</small></div><i>›</i></button></section>
        </aside>
      </div>
      {selected && <ProposalDetailsModal proposal={selected} onClose={() => setSelected(null)} />}
      {createOpen && <CreateProposalModal onClose={() => setCreateOpen(false)} />}
    </div>
  )
}

function ProposalDetailsModal({ proposal, onClose }) {
  useEscapeToClose(onClose)
  const history = proposal.history || []
  const isExample = proposal.isExample === true || String(proposal.id).startsWith('example-')
  return (
    <div className="member-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="member-modal" role="dialog" aria-modal="true" aria-labelledby="proposal-details-title">
        <div className="member-modal__header"><div><span className="member-eyebrow">{isExample ? 'Illustrative example · not an account record' : `Submitted version · ${proposal.version || 'v1.0'}`}</span><h2 id="proposal-details-title">{proposal.title || proposal.name}</h2></div><button type="button" className="member-modal__close" onClick={onClose} aria-label="Close details">×</button></div>
        <div className="member-modal__body">
          <div className="member-detail-grid"><div><span>Channel</span><strong>{proposal.targetChannel || 'Not specified'}</strong></div><div><span>Status</span><strong className={`member-status member-status--${proposal.status}`}>{statusLabel(proposal.status)}</strong></div><div><span>Submitted</span><strong>{formatDate(proposal.submittedAt || proposal.createdDate)}</strong></div><div><span>Group</span><strong>{proposal.groupName || 'Workspace'}</strong></div></div>
          <div className="member-feedback-box"><span className="member-eyebrow">Manager feedback</span><p>{proposal.revisionNote || proposal.noticeText || 'No manager feedback has been recorded for this proposal.'}</p></div>
          {proposal.primaryHeadline && <div className="member-copy-preview"><span className="member-eyebrow">Read-only submitted copy</span><h3>{proposal.primaryHeadline}</h3><p>{proposal.primaryBodyCopy || 'No body copy recorded.'}</p><strong>{proposal.cta || 'No call to action recorded'}</strong></div>}
          {history.length > 0 && <div className="member-history"><span className="member-eyebrow">Version lineage</span>{history.map((event) => <div key={event.id || `${event.version}-${event.timestamp}`}><b>{event.version || 'Event'}</b><span>{event.title || event.type}</span><small>{event.timestamp || 'Timestamp unavailable'}</small></div>)}</div>}
        </div>
        <div className="member-modal__footer"><span>Member accounts cannot approve, reject, or edit proposals.</span><button type="button" className="member-button member-button--secondary" onClick={onClose}>Close</button></div>
      </section>
    </div>
  )
}

function ProposalDetailsPage({ onBack }) {
  const example = proposalReferencePreview.priorityFeedback
  const details = proposalDetailsReferencePreview
  const jumpToHistory = () => document.getElementById('member-proposal-history')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="member-page member-proposal-detail">
      <div className="member-proposal-detail__notice" role="note"><strong>{details.disclaimer}</strong><span>Every identity, decision, timestamp, copy sample, and history event below is illustrative. No revision or manager action is connected.</span></div>
      <a className="member-proposal-detail__back" href="#proposals" onClick={(event) => { event.preventDefault(); onBack() }}>← Back to My Proposals</a>
      <header className="member-proposal-detail__heading">
        <div><div className="member-proposal-detail__badges"><span>{details.id}</span><span>{details.type}</span><span className="is-rejected">{details.status} · example</span><span>{details.version} · example</span></div><h1>{details.title}</h1><p>{details.submitted} · Reference preview, not a live proposal</p></div>
        <div className="member-proposal-detail__actions"><button type="button" className="member-button member-button--secondary" onClick={jumpToHistory}>Version History</button><button type="button" className="member-button member-button--secondary" disabled title="Revision submission is not connected">Revise Proposal · unavailable</button></div>
      </header>
      <section className="member-proposal-detail__summary" aria-label="Illustrative proposal summary">
        {[['Author', details.author, 'Member · example'], ['Target campaign', details.campaign, 'Example campaign'], ['Placement channel', details.channel, details.placement], ['Submission date', details.submitted, 'Example timestamp'], ['Assigned reviewer', details.reviewer, 'Example reviewer']].map(([label, value, note]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}
      </section>
      <section className="member-proposal-detail__feedback" aria-labelledby="member-proposal-feedback-title">
        <header><div><span className="member-eyebrow">Review feedback · example</span><h2 id="member-proposal-feedback-title">Priority Manager Feedback</h2></div><b>Decision: Rejected · example</b></header>
        <div className="member-proposal-detail__reviewer"><span aria-hidden="true">EX</span><div><strong>{details.reviewer}</strong><small>{details.reviewerRole}</small></div><time>{example.timestamp} · example</time></div>
        <blockquote><span>Reviewer direct feedback · example</span><p>“{details.feedback}”</p></blockquote>
        <h3>Required corrections &amp; constraints · example</h3>
        <div className="member-proposal-detail__corrections"><article><strong>Headline and copy revision requested · example</strong><p>{details.corrections}</p></article><article><strong>Illustrative unchanged fields</strong><p>{details.approvedAsIs}</p></article></div>
        <div className="member-proposal-detail__feedback-actions"><a href="#member-proposal-content">↓ Jump to content inspection</a><button type="button" disabled title="Revision submission is not connected">Start revision · unavailable</button></div>
      </section>
      <section id="member-proposal-content" className="member-proposal-detail__content">
        <header><div><h2>Submitted Proposal Content</h2><p>Illustrative, read-only content specimen · {details.version}</p></div><span>🔒 Preview only</span></header>
        <div className="member-proposal-detail__copy"><div><h3>Ad headline variants · example</h3>{details.variants.map((variant) => <article className={variant.flagged ? 'is-flagged' : ''} key={variant.label}><strong>{variant.label}</strong><p>“{variant.text}”</p>{variant.flagged && <small>Example manager note: tone down promotional urgency.</small>}</article>)}<article><h3>Primary description / body · example</h3><p>{details.body}</p></article><div className="member-proposal-detail__copy-meta"><article><span>Call to action · example</span><strong>{details.cta}</strong></article><article><span>Target audience · example</span><p>{details.audience}</p></article></div></div><aside><h3>Bound creative asset</h3><div className="member-proposal-detail__asset"><span aria-hidden="true">▧</span><strong>Asset unavailable</strong><p>The Stitch reference includes a sample asset, but no verified asset belongs to this account proposal.</p></div></aside></div>
      </section>
      <section className="member-proposal-detail__workflow">
        <header><h2>Revision &amp; Resubmission Workflow</h2><p>Example lifecycle only · this workspace cannot revise or resubmit this sample.</p></header>
        <div>{[['1', 'Review feedback', 'Example review notes are shown above.', 'Completed · example'], ['2', 'Author revision', 'No revision draft is connected to this account.', 'Unavailable'], ['3', 'Resubmit for triage', 'No submission or manager notification will be sent.', 'Unavailable']].map(([step, title, text, state]) => <article key={step}><span>{step}</span><small>{state}</small><strong>{title}</strong><p>{text}</p></article>)}</div>
        <aside>FR04 governance remains enforced by the existing application. These preview controls do not create versions, change proposal status, or contact a reviewer.</aside>
      </section>
      <section id="member-proposal-history" className="member-proposal-detail__history">
        <header><h2>Proposal Version History &amp; Decision Logs</h2><span>Example events · not an audit record</span></header>
        {details.history.map((event) => <article key={event.id}><span aria-hidden="true">◉</span><div><div><strong>{event.title}</strong><b>{event.version}</b></div><p>{event.detail}</p><small>Reference example · not account activity</small></div></article>)}
      </section>
    </div>
  )
}

function CreateProposalModal({ onClose }) {
  useEscapeToClose(onClose)
  const [draft, setDraft] = useState(createProposalDraft)
  const [notice, setNotice] = useState('')
  const setField = (field) => (event) => {
    const value = event.target.value
    setDraft((current) => ({ ...current, [field]: value }))
    setNotice('')
  }
  const isBudget = draft.classification === 'budget'

  return (
    <div className="member-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="member-modal member-proposal-modal" role="dialog" aria-modal="true" aria-labelledby="create-proposal-title">
        <div className="member-modal__accent" />
        <header className="member-modal__header member-proposal-modal__header">
          <div className="member-proposal-modal__heading">
            <span className="member-proposal-modal__icon" aria-hidden="true">✦</span>
            <div>
              <div className="member-proposal-modal__title-row"><h2 id="create-proposal-title">Create New Proposal</h2><span className="member-status member-status--edited">Member draft</span></div>
              <p>Draft an original marketing proposal for human-in-the-loop review by your Workspace Manager.</p>
            </div>
          </div>
          <button type="button" className="member-modal__close" onClick={onClose} aria-label="Close proposal form">×</button>
        </header>
        <form className="member-proposal-form" onSubmit={(event) => { event.preventDefault(); setNotice('Proposal submission is not connected. Your entries remain only in this open form.') }}>
          <div className="member-proposal-form__group">
            <span className="member-proposal-form__label">Proposal Classification</span>
            <div className="member-proposal-tabs" role="tablist" aria-label="Proposal classification">
              <button type="button" role="tab" aria-selected={!isBudget} className={!isBudget ? 'is-active' : ''} onClick={() => setDraft((current) => ({ ...current, classification: 'content' }))}>Content Copy (Ad Headline &amp; Body)</button>
              <button type="button" role="tab" aria-selected={isBudget} className={isBudget ? 'is-active' : ''} onClick={() => setDraft((current) => ({ ...current, classification: 'budget' }))}>Budget Allocation Suggestion</button>
            </div>
          </div>
          <label className="member-float-field"><span>Proposal Title</span><input value={draft.title} onChange={setField('title')} autoComplete="off" /></label>
          <div className="member-proposal-form__row">
            <label className="member-float-field"><span>Target Campaign</span><select value={draft.campaign} onChange={setField('campaign')}><option value="">Select a campaign</option><option value="q4-perf">Q4 Performance Winter Flight · example</option><option value="q4-holiday">Holiday Seasonal Sprint · example</option><option value="q1-warmup">Q1 Early Athletic Launch · example</option></select></label>
            <label className="member-float-field"><span>Placement Channel</span><select value={draft.channel} onChange={setField('channel')}><option value="meta-ads">Meta Ads (Instagram Stories &amp; Feed)</option><option value="tiktok">TikTok Video Ads</option><option value="google-search">Google Search Ads &amp; Extensions</option><option value="email-crm">Customer Retention Email</option></select></label>
          </div>
          {isBudget ? <label className="member-float-field"><span>Budget allocation rationale</span><textarea rows="4" value={draft.body} maxLength={PROPOSAL_CHARACTER_LIMITS.body} onChange={setField('body')} /></label> : <>
            <label className="member-float-field member-float-field--textarea"><span>Primary Ad Headline &amp; Message <small>{draft.headline.length} / {PROPOSAL_CHARACTER_LIMITS.headline} chars</small></span><textarea rows="2" maxLength={PROPOSAL_CHARACTER_LIMITS.headline} value={draft.headline} onChange={setField('headline')} /></label>
            <label className="member-float-field member-float-field--textarea"><span>Body Copy &amp; Offer Details <small>{draft.body.length} / {PROPOSAL_CHARACTER_LIMITS.body} chars</small></span><textarea rows="3" maxLength={PROPOSAL_CHARACTER_LIMITS.body} value={draft.body} onChange={setField('body')} /></label>
          </>}
          <label className="member-float-field"><span>{isBudget ? 'Recommendation summary' : 'Call to Action (CTA)'}</span><input value={draft.cta} onChange={setField('cta')} /></label>
          <label className="member-float-field member-float-field--textarea"><span>Author Notes for Reviewer (optional) <small>Internal context</small></span><textarea rows="2" value={draft.reviewerNotes} onChange={setField('reviewerNotes')} /></label>
          <div className="member-proposal-guardrail"><span aria-hidden="true">⚖</span><div><strong>FR04 Submission Guardrail</strong><p>Submitted proposals are routed to your Workspace Manager for review. Workspace Members cannot self-approve or publish directly to ad networks.</p></div></div>
          {notice && <p className="member-modal__notice" role="status">{notice}</p>}
          <footer className="member-proposal-form__footer"><button type="button" className="member-button member-button--secondary" onClick={() => setNotice('Draft is temporary and has not been saved to the workspace.')}>Save as Draft</button><div><button type="button" className="member-button member-proposal-cancel" onClick={onClose}>Cancel</button><button type="submit" className="member-button member-button--primary">Submit</button></div></footer>
        </form>
      </section>
    </div>
  )
}

export function MemberCampaignsPage({ latestRows = [], imports = [] }) {
  const [createOpen, setCreateOpen] = useState(false)
  const isPresentationExamples = latestRows.length === 0
  const rows = (isPresentationExamples ? CAMPAIGN_REFERENCE_ROWS : latestRows).slice(0, 25)
  return (
    <div className="member-page">
      <div className="member-page__intro"><div><span className="member-eyebrow">Workspace execution</span><h1>Campaigns</h1><p>Review campaign performance data already available to your workspace.</p></div><button type="button" className="member-button member-button--secondary" onClick={() => setCreateOpen(true)}>＋ Create campaign</button></div>
      <section className="member-callout member-callout--info"><span className="member-callout__icon">ⓘ</span><div><strong>Campaign creation is not connected</strong><p>There is no campaign-creation API in the current backend. Existing imported performance data remains available below.</p></div></section>
      <div className="member-metrics member-metrics--compact"><Metric label="Imported rows" value={latestRows.length || '—'} detail="Available performance records" tone="cyan" /><Metric label="Import batches" value={imports.length || '—'} detail="History returned by the API" /><Metric label="Channels" value={new Set(latestRows.map((row) => row.channel)).size || '—'} detail="Detected in imported data" tone="violet" /></div>
      <section className="member-panel"><div className="member-panel__header"><div><span className="member-eyebrow">{isPresentationExamples ? 'Illustrative reference rows' : 'Workspace campaign data'}</span><h2>Campaign performance</h2></div><span className="member-panel__meta">{rows.length} shown</span></div>{isPresentationExamples && <div className="member-source-note" role="note">Example values for layout illustration only. These are not imported campaign records and do not represent account performance.</div>}{rows.length === 0 ? <EmptyState icon="⚑" title="No campaign data yet" body="Import campaign history to populate this workspace view." /> : <div className="member-table-wrap"><table className="member-table"><thead><tr><th>Channel</th><th>Period</th><th>Spend</th><th>Clicks</th><th>Conversions</th><th>Revenue</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.channel}-${row.period}-${index}`}><td><strong>{row.channel}</strong></td><td>{row.period}</td><td>{Number(row.spend || 0).toLocaleString()}</td><td>{row.clicks ?? '—'}</td><td>{row.conversions ?? '—'}</td><td>{Number(row.revenue || 0).toLocaleString()}</td></tr>)}</tbody></table></div>}</section>
      {createOpen && <CreateCampaignModal onClose={() => setCreateOpen(false)} />}
    </div>
  )
}

function CreateCampaignModal({ onClose }) {
  useEscapeToClose(onClose)
  const [selectedId, setSelectedId] = useState(CAMPAIGN_PLATFORMS[0].id)
  const [step, setStep] = useState(1)
  const selected = CAMPAIGN_PLATFORMS.find((platform) => platform.id === selectedId)

  return (
    <div className="member-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="member-modal member-campaign-modal" role="dialog" aria-modal="true" aria-labelledby="create-campaign-title">
        <header className="member-modal__header member-campaign-modal__header"><div><div className="member-campaign-modal__step"><span>Step {step} of 2</span><span>{step === 1 ? 'Select Advertising Platform' : 'Campaign Setup'}</span></div><h2 id="create-campaign-title">Create New Campaign Record</h2><p>{step === 1 ? 'Select an advertising platform to initialize an internal campaign and associate strategy pipelines.' : `Set up an internal ${selected.name} campaign record. No live campaign will be created from this screen.`}</p></div><button type="button" className="member-modal__close" onClick={onClose} aria-label="Close campaign setup">×</button></header>
        {step === 1 ? <div className="member-campaign-modal__body"><div className="member-platform-grid">{CAMPAIGN_PLATFORMS.map((platform) => <button key={platform.id} type="button" className={`member-platform-card ${selectedId === platform.id ? 'is-selected' : ''}`} aria-pressed={selectedId === platform.id} onClick={() => setSelectedId(platform.id)}><span className="member-platform-card__check" aria-hidden="true">{selectedId === platform.id ? '✓' : ''}</span><span className="member-platform-card__icon" aria-hidden="true">{platform.icon}</span><strong>{platform.name}</strong><p>{platform.description}</p><span className="member-platform-card__meta"><small>{platform.integration}</small><b>{platform.status}</b></span></button>)}</div><aside className="member-campaign-governance"><span aria-hidden="true">ⓘ</span><div><strong>Security &amp; Governance Notice</strong><p>Direct API synchronization requires active workspace OAuth token. If credentials are not present, an Internal Governed Record will be generated without pushing live spends. This interface does not currently create or persist that record.</p></div></aside></div> : <div className="member-campaign-modal__body"><div className="member-campaign-setup"><span className="member-platform-card__icon" aria-hidden="true">{selected.icon}</span><div><span className="member-eyebrow">Selected platform</span><h3>{selected.name}</h3><p>Campaign setup is a visual preview only. The application has no campaign creation endpoint, so nothing will be sent to {selected.name} or saved.</p></div></div><div className="member-campaign-form-preview"><label>Campaign name<input disabled placeholder="Campaign name (setup unavailable)" /></label><label>Campaign objective<select disabled defaultValue=""><option value="">Configure after campaign service is connected</option></select></label></div><div className="member-unavailable" role="status"><span aria-hidden="true">ⓘ</span><div><strong>Campaign creation is not connected</strong><p>Close this setup preview or return to platform selection. No campaign has been created.</p></div></div></div>}
        <footer className="member-campaign-modal__footer"><button type="button" className="member-button member-button--secondary" onClick={step === 1 ? onClose : () => setStep(1)}>{step === 1 ? 'Cancel' : 'Back to platform selection'}</button><div><span>Selected: <strong>{selected.name}</strong></span>{step === 1 ? <button type="button" className="member-button member-button--primary" onClick={() => setStep(2)}>Continue to Campaign Setup <b aria-hidden="true">→</b></button> : <button type="button" className="member-button member-button--secondary" onClick={onClose}>Close setup</button>}</div></footer>
      </section>
    </div>
  )
}

export function MemberNotificationsPage() {
  return (
    <div className="member-page member-notifications-page">
      <header className="member-import-view__header"><div><div className="member-import-view__crumb">Member Workspace <span>›</span> Notifications</div><span className="member-eyebrow">Workspace activity · Notification center</span><h1>Notifications</h1><p>Stay informed about activity when notification services are available.</p></div><span className="member-status">Feed unavailable</span></header>
      <section className="member-callout member-callout--attention" role="status"><span className="member-callout__icon" aria-hidden="true">!</span><div><strong>Notification feed unavailable</strong><p>The current backend does not provide notification events, unread counts, refresh, or read-state actions. Sample items below are not account activity.</p></div></section>
      <div className="member-notification-summary"><article><span>Unread</span><strong>—</strong><small>Unavailable from current service</small></article><article><span>Recent activity</span><strong>—</strong><small>No account feed returned</small></article><article><span>Delivery status</span><strong>Unavailable</strong><small>Notification preferences are not exposed</small></article></div>
      <section className="member-panel" aria-labelledby="member-notifications-title"><div className="member-panel__header"><div><span className="member-eyebrow">Activity stream</span><h2 id="member-notifications-title">Recent notifications</h2><p>Example entries preserve the reference layout only.</p></div><span className="member-status">Example view</span></div>
        <div className="member-notification-toolbar"><div className="member-notification-filters" aria-label="Example categories"><span className="is-current">All examples</span><span>Proposals</span><span>Campaigns</span><span>Workspace</span></div><span className="member-notification-search">Search unavailable · not connected</span></div>
        <div className="member-unavailable" role="note"><span aria-hidden="true">ⓘ</span><div><strong>Reference examples only — not account notifications</strong><p>These entries are static illustrations. They cannot be marked read, filtered as real activity, or refreshed.</p></div></div>
        <div className="member-notification-examples">{NOTIFICATION_REFERENCE_ITEMS.map((item) => <article key={item.title}><span className="member-notification-examples__dot" aria-hidden="true" /><div><strong>{item.title}</strong><p>{item.detail}</p><small>{item.when}</small></div><span className="member-status">{item.status}</span></article>)}</div>
      </section>
    </div>
  )
}

export function MemberAccountPage({ user, profile, onEditProfile, logout }) {
  const displayName = user?.full_name || user?.user_metadata?.full_name || 'Member'
  const workspaceName = profile?.business_name || 'Business profile incomplete'
  const initials = displayName.split(/\s+/).map((part) => part[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
  const profileFields = [
    ['Full name', displayName],
    ['Email address', user?.email || 'Not available'],
    ['Business name', profile?.business_name || 'Not configured'],
    ['Industry', profile?.industry || 'Not configured'],
    ['Business size', profile?.business_size || 'Not configured'],
  ]
  const preferenceLabels = ['Proposal status updates', 'Manager feedback', 'Campaign announcements', 'Product updates', 'Security alerts']

  return (
    <div className="member-page member-account-page member-account-settings">
      <header className="member-account-settings__heading"><div><span className="member-eyebrow">Member workspace · Settings</span><h1>Account Settings</h1><p>Manage your profile and review the access information available to this workspace.</p></div><button type="button" className="member-button member-button--secondary" onClick={onEditProfile}>Edit business profile <span aria-hidden="true">↗</span></button></header>
      <section className="member-panel member-account-settings__identity" aria-label="Member identity summary"><div className="member-account-identity__avatar" aria-hidden="true">{initials || 'M'}</div><div><span className="member-eyebrow">SIGNED-IN MEMBER</span><h2>{displayName}</h2><p>{user?.email || 'Email address not available'}</p></div><span className="member-status member-status--success">Member</span><div className="member-account-settings__workspace"><span>Workspace</span><strong>{workspaceName}</strong></div><p className="member-account-settings__truth">Identity and business details shown here are read from the current session and profile.</p></section>
      <div className="member-account-settings__grid">
        <section className="member-panel member-account-settings__profile"><header className="member-account-settings__section-heading"><div><span className="member-eyebrow">PROFILE</span><h2>Personal Information</h2></div><span aria-hidden="true">▣</span></header><p className="member-account-settings__section-copy">Review the account identity and business context currently associated with your workspace.</p><dl className="member-account-settings__fields">{profileFields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}<div><dt>Primary goal</dt><dd>{profile?.primary_goal || 'Not configured'}</dd></div><div><dt>Preferred channels</dt><dd>{profile?.preferred_channels?.length ? profile.preferred_channels.join(', ') : 'Not configured'}</dd></div></dl><button type="button" className="member-button member-button--primary" onClick={onEditProfile}>Edit business profile <span aria-hidden="true">→</span></button></section>
        <section className="member-panel member-account-settings__preferences"><header className="member-account-settings__section-heading"><div><span className="member-eyebrow">PREFERENCES</span><h2>Notification Alerts</h2></div><span className="member-status">Unavailable</span></header><p className="member-account-settings__section-copy">Notification preferences are not provided by the current account service.</p><div className="member-account-settings__preference-list">{preferenceLabels.map((label) => <label key={label}><span>{label}<small>Preference controls are not connected</small></span><input type="checkbox" name={`unavailable-${label.toLowerCase().replace(/\s+/g, '-')}`} disabled aria-label={`${label} unavailable`} /></label>)}</div><div className="member-unavailable" role="note"><span aria-hidden="true">ⓘ</span><div><strong>Preference saving is unavailable</strong><p>These disabled controls are shown for layout reference only and cannot change account settings.</p></div></div></section>
        <section className="member-panel member-account-settings__session"><header className="member-account-settings__section-heading"><div><span className="member-eyebrow">SECURITY</span><h2>Active Session</h2></div><span className="member-status">Current session</span></header><dl className="member-account-settings__fields"><div><dt>Signed-in account</dt><dd>{user?.email || 'Email address not available'}</dd></div><div><dt>Workspace role</dt><dd>Member</dd></div><div><dt>Session details</dt><dd>Not provided by the current service</dd></div><div><dt>Device and location</dt><dd>Not provided by the current service</dd></div></dl><button type="button" className="member-button member-button--secondary" onClick={logout}>Sign out</button></section>
        <section className="member-panel member-account-settings__security"><header className="member-account-settings__section-heading"><div><span className="member-eyebrow">ACCOUNT SECURITY</span><h2>Account Security</h2></div><span aria-hidden="true">◇</span></header><p className="member-account-settings__section-copy">Password management is handled by the configured authentication provider.</p><form aria-label="Password controls unavailable"><label>Password<input type="password" name="password-change-unavailable" value="" placeholder="Password change unavailable" disabled /></label><label>New password<input type="password" name="new-password-unavailable" value="" placeholder="Not connected" disabled /></label><button type="button" className="member-button member-button--secondary" disabled>Update Password · Unavailable</button></form><p className="member-account-settings__hint">No password, session, or security information is stored or changed on this page.</p></section>
        <section className="member-panel member-account-settings__governance"><header className="member-account-settings__section-heading"><div><span className="member-eyebrow">WORKSPACE GOVERNANCE</span><h2>Workspace Access &amp; Governance</h2></div><span aria-hidden="true">⌘</span></header><dl className="member-account-settings__fields"><div><dt>Workspace</dt><dd>{workspaceName}</dd></div><div><dt>Assigned role</dt><dd>Member</dd></div><div><dt>Business profile</dt><dd>{profile ? 'Available' : 'Incomplete'}</dd></div><div><dt>Manager and policy</dt><dd>Not provided by the current service</dd></div></dl><p className="member-account-settings__hint">Role assignment and governance policies are managed by your workspace administrator.</p></section>
      </div>
    </div>
  )
}

export function MemberLegacyPageNotice({ title, body }) {
  return <section className="member-panel"><EmptyState icon="◌" title={title} body={body} /></section>
}

export { MemberOverview } from './MemberOverview'

export function normalizeMemberView(page) {
  return normalizeMemberPage(page)
}
