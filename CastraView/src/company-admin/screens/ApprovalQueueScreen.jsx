import { useMemo, useState } from 'react'
import { PageHeader, SecondaryButton, StatusBadge, NoticeBanner } from '../ui/Primitives'
import { INITIAL_PROPOSALS } from '../mockData'

export default function ApprovalQueueScreen({ notify }) {
  const [proposals, setProposals] = useState(INITIAL_PROPOSALS)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedProposal, setSelectedProposal] = useState(null)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const counts = useMemo(() => {
    return {
      total: proposals.length,
      pending: proposals.filter((p) => p.status === 'pending' || p.status === 'edited').length,
      approved: proposals.filter((p) => p.status === 'approved').length,
      rejected: proposals.filter((p) => p.status === 'rejected').length,
    }
  }, [proposals])

  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        p.author.toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === 'All' || p.type === typeFilter
      const matchStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Pending' && (p.status === 'pending' || p.status === 'edited')) ||
        (statusFilter === 'Approved' && p.status === 'approved') ||
        (statusFilter === 'Rejected' && p.status === 'rejected')
      return matchSearch && matchType && matchStatus
    })
  }, [proposals, search, typeFilter, statusFilter])

  function handleApprove(id) {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p))
    )
    setSelectedProposal(null)
    notify?.(`Proposal ${id} approved and recorded in FR11 Audit Log.`)
  }

  function handleRejectSubmit(e) {
    e.preventDefault()
    if (!rejectTarget) return
    const id = rejectTarget.id
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'rejected' } : p))
    )
    setRejectModalOpen(false)
    setRejectTarget(null)
    setRejectReason('')
    setSelectedProposal(null)
    notify?.(`Proposal ${id} rejected with reason logged.`)
  }

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        badge="FR04 / GOVERNANCE ENGINE · Stage Gate 03"
        title="Proposal Approval Queue"
        subtitle="Admin oversight: Review, edit, approve, or reject AI-generated campaign proposals prior to deployment."
        actions={
          <>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: 'rgba(99, 102, 241, 0.16)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: 'var(--ca-radius-md)',
                fontSize: 12,
                color: '#c7d2fe',
                fontWeight: 600,
              }}
            >
              🛡 Admin Full Authority
            </span>
            <SecondaryButton onClick={() => notify?.('Approval queue refreshed from database.')} icon="↻">
              Refresh
            </SecondaryButton>
          </>
        }
      />

      {/* Access Control Notice */}
      <NoticeBanner
        type="info"
        icon="🛡"
        title="Access Control Policy Active (FR04 · FR06)"
        description="Admins and Managers have authorization to review, edit, and approve proposals. Members do not have access to this queue."
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--ca-text-muted)' }}>
            <span style={{ color: 'var(--ca-cyan)' }}>● Strict Enforcement</span>
            <span>ISO-27001 Gate</span>
          </div>
        }
      />

      {/* Summary Cards (4 Columns) */}
      <div className="ca-kpi-grid">
        <div className="ca-kpi-card">
          <div className="ca-kpi-top">
            <span className="ca-kpi-label">TOTAL IN QUEUE</span>
            <div className="ca-kpi-top-icon">📄</div>
          </div>
          <div className="ca-kpi-value-row">
            <span className="ca-kpi-value">{counts.total}</span>
          </div>
          <div className="ca-kpi-subtext">proposals registered · 100% indexed</div>
        </div>

        <div className="ca-kpi-card">
          <div className="ca-kpi-top">
            <span className="ca-kpi-label">PENDING REVIEW</span>
            <div className="ca-kpi-top-icon">✍</div>
          </div>
          <div className="ca-kpi-value-row">
            <span className="ca-kpi-value" style={{ color: '#38bdf8' }}>{counts.pending}</span>
            <span className="ca-badge ca-badge-action-req">action required</span>
          </div>
          <div style={{ height: 4, background: 'var(--ca-bg-alt)', borderRadius: 2, marginTop: 8 }}>
            <div style={{ width: `${(counts.pending / (counts.total || 1)) * 100}%`, height: '100%', background: 'var(--ca-cyan)', borderRadius: 2 }} />
          </div>
        </div>

        <div className="ca-kpi-card">
          <div className="ca-kpi-top">
            <span className="ca-kpi-label">APPROVED</span>
            <div className="ca-kpi-top-icon">✓</div>
          </div>
          <div className="ca-kpi-value-row">
            <span className="ca-kpi-value" style={{ color: 'var(--ca-success)' }}>{counts.approved}</span>
          </div>
          <div className="ca-kpi-subtext">live pipeline</div>
          <div style={{ height: 4, background: 'var(--ca-bg-alt)', borderRadius: 2, marginTop: 8 }}>
            <div style={{ width: `${(counts.approved / (counts.total || 1)) * 100}%`, height: '100%', background: 'var(--ca-success)', borderRadius: 2 }} />
          </div>
        </div>

        <div className="ca-kpi-card">
          <div className="ca-kpi-top">
            <span className="ca-kpi-label">REJECTED</span>
            <div className="ca-kpi-top-icon">✕</div>
          </div>
          <div className="ca-kpi-value-row">
            <span className="ca-kpi-value" style={{ color: 'var(--ca-red)' }}>{counts.rejected}</span>
          </div>
          <div className="ca-kpi-subtext">archived</div>
          <div style={{ height: 4, background: 'var(--ca-bg-alt)', borderRadius: 2, marginTop: 8 }}>
            <div style={{ width: `${(counts.rejected / (counts.total || 1)) * 100}%`, height: '100%', background: 'var(--ca-red)', borderRadius: 2 }} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: 'var(--ca-surface)',
          border: '1px solid var(--ca-border)',
          borderRadius: 'var(--ca-radius-lg)',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Type Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ca-text-muted)', textTransform: 'uppercase' }}>
              TYPE
            </span>
            <div style={{ display: 'flex', gap: 4, background: 'var(--ca-bg-alt)', padding: 3, borderRadius: 'var(--ca-radius-md)' }}>
              {['All', 'Content', 'Budget'].map((t) => (
                <button
                  type="button"
                  key={t}
                  className={`ca-btn ca-btn-sm ${typeFilter === t ? 'ca-btn-primary' : 'ca-btn-subtle'}`}
                  style={{ border: 'none', height: 26, fontSize: 11 }}
                  onClick={() => setTypeFilter(t)}
                >
                  {t === 'All' ? 'All Types' : t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: 1, height: 20, background: 'var(--ca-border)' }} />

          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ca-text-muted)', textTransform: 'uppercase' }}>
              STATUS
            </span>
            <div style={{ display: 'flex', gap: 4, background: 'var(--ca-bg-alt)', padding: 3, borderRadius: 'var(--ca-radius-md)' }}>
              {['All', 'Pending', 'Approved', 'Rejected'].map((s) => (
                <button
                  type="button"
                  key={s}
                  className={`ca-btn ca-btn-sm ${statusFilter === s ? 'ca-btn-primary' : 'ca-btn-subtle'}`}
                  style={{ border: 'none', height: 26, fontSize: 11 }}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'All' ? 'All Statuses' : s === 'Pending' ? `Pending (${counts.pending})` : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="ca-search-input-wrap" style={{ width: 280 }}>
          <span className="ca-search-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            className="ca-search-input"
            placeholder="Search proposals by ID or initiator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Proposal Table */}
      <div className="ca-table-wrap">
        <table className="ca-table">
          <thead>
            <tr>
              <th>Proposal Name & ID</th>
              <th>Type</th>
              <th>Engine / Initiator</th>
              <th>Created Date</th>
              <th>Workspace</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProposals.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--ca-text-muted)' }}>
                  No proposals match your filters.
                </td>
              </tr>
            ) : (
              filteredProposals.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div>
                      <strong style={{ fontSize: 13, color: '#ffffff', display: 'block' }}>{item.name}</strong>
                      <span style={{ fontFamily: 'var(--ca-font-mono)', fontSize: 11, color: 'var(--ca-text-muted)' }}>
                        {item.id}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`ca-badge ca-badge-${item.type.toLowerCase()}`}>
                      {item.type}
                    </span>
                  </td>
                  <td>
                    <div>
                      <strong style={{ color: '#ffffff', fontSize: 12 }}>{item.engine}</strong>
                      <div style={{ color: 'var(--ca-text-muted)', fontSize: 11 }}>{item.author}</div>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--ca-text-secondary)', whiteSpace: 'nowrap' }}>
                    {item.createdDate}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--ca-text-secondary)' }}>
                    {item.workspace}
                  </td>
                  <td>
                    <StatusBadge
                      status={item.status}
                      label={
                        item.status === 'pending'
                          ? 'Pending'
                          : item.status === 'edited'
                          ? 'Edited'
                          : item.status === 'approved'
                          ? 'Approved'
                          : 'Rejected'
                      }
                    />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <SecondaryButton className="ca-btn-sm" onClick={() => setSelectedProposal(item)}>
                        Review
                      </SecondaryButton>
                      {item.status !== 'approved' && (
                        <button
                          type="button"
                          className="ca-btn ca-btn-success ca-btn-sm"
                          onClick={() => handleApprove(item.id)}
                          title="Approve Proposal"
                        >
                          ✓
                        </button>
                      )}
                      {item.status !== 'rejected' && (
                        <button
                          type="button"
                          className="ca-btn ca-btn-danger ca-btn-sm"
                          onClick={() => {
                            setRejectTarget(item)
                            setRejectModalOpen(true)
                          }}
                          title="Reject Proposal"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="ca-table-footer">
          <span>Showing {filteredProposals.length} of {proposals.length} proposals · Auto-sync active (60s poll)</span>
          <div className="ca-pagination-btns">
            <button type="button" className="ca-page-btn" disabled>Previous</button>
            <button type="button" className="ca-page-btn active">1</button>
            <button type="button" className="ca-page-btn" disabled>Next</button>
          </div>
        </div>
      </div>

      {/* Review Drawer / Panel when proposal is selected */}
      {selectedProposal && (
        <div style={{ marginTop: 20 }}>
          <section className="ca-card" style={{ borderColor: 'var(--ca-primary)' }}>
            <div className="ca-card-header">
              <h2 className="ca-card-title">
                <span>Review Proposal {selectedProposal.id}</span>
                <span className={`ca-badge ca-badge-${selectedProposal.type.toLowerCase()}`}>
                  {selectedProposal.type}
                </span>
              </h2>
              <button
                type="button"
                className="ca-modal-close"
                onClick={() => setSelectedProposal(null)}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: 16 }}>
                  {selectedProposal.name}
                </h3>
                <p style={{ color: 'var(--ca-text-secondary)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                  Generated by {selectedProposal.engine} under initiator {selectedProposal.author}. AI recommends execution based on cross-channel engagement signals. All reviewer actions commit an immutable entry into the FR11 audit trail.
                </p>
                <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                  <div style={{ padding: '8px 12px', background: 'var(--ca-bg-alt)', borderRadius: 'var(--ca-radius-md)', fontSize: 12 }}>
                    <span style={{ color: 'var(--ca-text-muted)' }}>Created:</span>{' '}
                    <strong style={{ color: '#ffffff' }}>{selectedProposal.createdDate}</strong>
                  </div>
                  <div style={{ padding: '8px 12px', background: 'var(--ca-bg-alt)', borderRadius: 'var(--ca-radius-md)', fontSize: 12 }}>
                    <span style={{ color: 'var(--ca-text-muted)' }}>Policy Check:</span>{' '}
                    <strong style={{ color: 'var(--ca-success)' }}>12 / 12 Conditions Met</strong>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                <button
                  type="button"
                  className="ca-btn ca-btn-success"
                  onClick={() => handleApprove(selectedProposal.id)}
                >
                  ✓ Approve Proposal
                </button>
                <button
                  type="button"
                  className="ca-btn ca-btn-danger"
                  onClick={() => {
                    setRejectTarget(selectedProposal)
                    setRejectModalOpen(true)
                  }}
                >
                  ✕ Reject Proposal
                </button>
                <SecondaryButton onClick={() => setSelectedProposal(null)}>
                  Close Review
                </SecondaryButton>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalOpen && (
        <div
          className="ca-modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setRejectModalOpen(false)}
        >
          <div className="ca-modal" role="dialog" aria-modal="true" style={{ maxWidth: 440 }}>
            <div className="ca-modal-header">
              <h2 className="ca-modal-title">Reject Proposal {rejectTarget?.id}</h2>
              <button
                type="button"
                className="ca-modal-close"
                onClick={() => setRejectModalOpen(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleRejectSubmit}>
              <div className="ca-modal-body">
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ca-text-secondary)' }}>
                  State the rejection justification. This will be stamped into the FR11 audit log and notified to {rejectTarget?.author}.
                </p>
                <div className="ca-form-group">
                  <label className="ca-form-label">REJECTION REASON</label>
                  <textarea
                    rows={3}
                    className="ca-form-input"
                    style={{ height: 'auto', padding: '10px 12px' }}
                    placeholder="e.g. Headline copy exceeds maximum character boundary or violates tone guidelines..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="ca-modal-footer">
                <SecondaryButton onClick={() => setRejectModalOpen(false)}>
                  Cancel
                </SecondaryButton>
                <button type="submit" className="ca-btn ca-btn-danger">
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Informational Cards (3 Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginTop: 24 }}>
        <div className="ca-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 18, color: 'var(--ca-cyan)' }}>🛡</span>
            <strong style={{ fontSize: 13, color: '#ffffff' }}>Auto-Escalation Safeguards</strong>
          </div>
          <p style={{ fontSize: 12, color: 'var(--ca-text-secondary)', lineHeight: 1.4, margin: '0 0 12px 0' }}>
            Budget proposals exceeding $25,000 threshold trigger mandatory dual-signature admin authorization under corporate rule FR06-B.
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: 'var(--ca-text-muted)' }}>Dual Signature: Required</span>
            <strong style={{ color: 'var(--ca-success)' }}>Compliant</strong>
          </div>
        </div>

        <div className="ca-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 18, color: '#a5b4fc' }}>📜</span>
            <strong style={{ fontSize: 13, color: '#ffffff' }}>Immutable Ledger Sync</strong>
          </div>
          <p style={{ fontSize: 12, color: 'var(--ca-text-secondary)', lineHeight: 1.4, margin: '0 0 12px 0' }}>
            Every review decision, modifier diff, and approval hash is stamped to the audit log (FR11) with user IP signature and timestamps.
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: 'var(--ca-text-muted)' }}>Block ID: #9842-881</span>
            <strong style={{ color: 'var(--ca-success)' }}>Synchronized</strong>
          </div>
        </div>

        <div className="ca-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 18, color: '#f472b6' }}>✦</span>
            <strong style={{ fontSize: 13, color: '#ffffff' }}>Model Guardrails Active</strong>
          </div>
          <p style={{ fontSize: 12, color: 'var(--ca-text-secondary)', lineHeight: 1.4, margin: '0 0 12px 0' }}>
            CastraLM-V4 generative runs undergo automatic brand safety checks and copy toxicity scoring prior to arriving in this staging lane.
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: 'var(--ca-text-muted)' }}>Toxicity Pass Rate: 99.8%</span>
            <strong style={{ color: 'var(--ca-success)' }}>Passed</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
