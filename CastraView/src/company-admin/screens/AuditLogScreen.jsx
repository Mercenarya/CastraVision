import { useMemo, useState } from 'react'
import { PageHeader, SecondaryButton, Pagination } from '../ui/Primitives'
import { INITIAL_AUDIT_LOGS } from '../mockData'

export default function AuditLogScreen({
  auditLogs = INITIAL_AUDIT_LOGS,
  onSelectRecord,
  notify,
}) {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('All')
  const [moduleFilter, setModuleFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('Past 7 Days')
  const [page, setPage] = useState(1)
  const pageSize = 6

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((l) => {
      const matchSearch =
        search.trim() === '' ||
        l.actorName.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.entityId.toLowerCase().includes(search.toLowerCase()) ||
        l.hash.toLowerCase().includes(search.toLowerCase()) ||
        l.summary.toLowerCase().includes(search.toLowerCase())

      const matchAction = actionFilter === 'All' || l.action === actionFilter
      const matchModule = moduleFilter === 'All' || l.module === moduleFilter

      return matchSearch && matchAction && matchModule
    })
  }, [auditLogs, search, actionFilter, moduleFilter])

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize))
  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize)

  function handleExportCsv() {
    const csvContent =
      'Timestamp (UTC),Actor,Role,Action,Entity,Module,Summary,Hash\n' +
      auditLogs
        .map(
          (l) =>
            `"${l.timestamp}","${l.actorName}","${l.actorRole}","${l.action}","${l.entityId}","${l.module}","${l.summary}","${l.hash}"`
        )
        .join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'system_audit_log.csv'
    link.click()
    URL.revokeObjectURL(url)
    notify?.('Audit log exported as CSV.')
  }

  function handleVerifyHashes() {
    notify?.('All 1,482 audit hashes verified successfully against cryptographic ledger (SHA-256).')
  }

  function renderActionBadge(action) {
    const act = (action || '').toLowerCase()
    let bg = 'rgba(99, 102, 241, 0.16)'
    let color = '#c7d2fe'
    let border = '1px solid rgba(99, 102, 241, 0.3)'

    if (act.includes('approved')) {
      bg = 'rgba(16, 185, 129, 0.15)'
      color = '#34d399'
      border = '1px solid rgba(16, 185, 129, 0.3)'
    } else if (act.includes('rejected')) {
      bg = 'rgba(239, 68, 68, 0.15)'
      color = '#f87171'
      border = '1px solid rgba(239, 68, 68, 0.3)'
    } else if (act.includes('edited')) {
      bg = 'rgba(6, 182, 212, 0.15)'
      color = '#67e8f9'
      border = '1px solid rgba(6, 182, 212, 0.3)'
    } else if (act.includes('role')) {
      bg = 'rgba(139, 92, 246, 0.18)'
      color = '#d8b4fe'
      border = '1px solid rgba(139, 92, 246, 0.35)'
    } else if (act.includes('member') || act.includes('invite')) {
      bg = 'rgba(79, 70, 229, 0.2)'
      color = '#a5b4fc'
      border = '1px solid rgba(79, 70, 229, 0.4)'
    } else if (act.includes('data') || act.includes('import')) {
      bg = 'rgba(16, 185, 129, 0.12)'
      color = '#6ee7b7'
      border = '1px solid rgba(16, 185, 129, 0.25)'
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 8px',
          borderRadius: 'var(--ca-radius-sm)',
          fontSize: 11,
          fontWeight: 600,
          background: bg,
          color: color,
          border: border,
        }}
      >
        {action}
      </span>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        badge="FR11 COMPLIANCE · Immutable Ledger"
        title="System Audit Log"
        subtitle="Immutable, cryptographically committed event log tracking all workspace actions, role changes, and AI proposal approvals."
        actions={
          <>
            <SecondaryButton onClick={handleExportCsv} icon="📥">
              Export Audit Log (CSV)
            </SecondaryButton>
            <button
              type="button"
              className="ca-btn"
              style={{
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#c7d2fe',
                border: '1px solid rgba(99, 102, 241, 0.4)',
              }}
              onClick={handleVerifyHashes}
            >
              ✓ Verify Cryptographic Hashes
            </button>
          </>
        }
      />

      {/* Summary KPI Cards */}
      <div className="ca-kpi-grid">
        <div className="ca-kpi-card">
          <div className="ca-kpi-top">
            <span className="ca-kpi-label">TOTAL EVENTS (30D)</span>
            <div className="ca-kpi-top-icon">📜</div>
          </div>
          <div className="ca-kpi-value-row">
            <span className="ca-kpi-value">1,482</span>
            <span style={{ fontSize: 11, color: 'var(--ca-success)', fontWeight: 600 }}>+14.2%</span>
          </div>
          <div className="ca-kpi-subtext">all events persisted</div>
        </div>

        <div className="ca-kpi-card">
          <div className="ca-kpi-top">
            <span className="ca-kpi-label">CRYPTOGRAPHIC INTEGRITY</span>
            <div className="ca-kpi-top-icon">🔒</div>
          </div>
          <div className="ca-kpi-value-row">
            <span className="ca-kpi-value" style={{ color: 'var(--ca-success)' }}>100%</span>
            <span style={{ fontSize: 13, color: 'var(--ca-success)', fontWeight: 600 }}>Valid</span>
          </div>
          <div className="ca-kpi-subtext">Merkle root signed</div>
        </div>

        <div className="ca-kpi-card">
          <div className="ca-kpi-top">
            <span className="ca-kpi-label">ACTIVE OPERATORS</span>
            <div className="ca-kpi-top-icon">🛡</div>
          </div>
          <div className="ca-kpi-value-row">
            <span className="ca-kpi-value">18</span>
            <span style={{ fontSize: 13, color: '#ffffff', fontWeight: 600 }}>Verified</span>
          </div>
          <div className="ca-kpi-subtext">2FA strictly enforced</div>
        </div>

        <div className="ca-kpi-card">
          <div className="ca-kpi-top">
            <span className="ca-kpi-label">LAST BLOCK HASH</span>
            <div className="ca-kpi-top-icon">🔑</div>
          </div>
          <div className="ca-kpi-value-row">
            <span style={{ fontFamily: 'var(--ca-font-mono)', fontSize: 12.5, color: 'var(--ca-cyan)', fontWeight: 600 }}>
              0x9b4f2c81...aa03
            </span>
          </div>
          <div className="ca-kpi-subtext">2m ago</div>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div
        style={{
          background: 'var(--ca-surface)',
          border: '1px solid var(--ca-border)',
          borderRadius: 'var(--ca-radius-lg)',
          padding: '16px 20px',
          marginBottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div className="ca-search-input-wrap" style={{ flex: 1, minWidth: 260 }}>
            <span className="ca-search-icon" aria-hidden="true">⌕</span>
            <input
              type="search"
              className="ca-search-input"
              placeholder="Filter by user, action, proposal ID, or log hash..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setPage(1)
            }}
            style={{
              height: 36,
              padding: '0 12px',
              background: 'var(--ca-bg-alt)',
              border: '1px solid var(--ca-border)',
              borderRadius: 'var(--ca-radius-md)',
              color: 'var(--ca-text)',
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            <option value="All">All Actions</option>
            <option value="Approved">Approved</option>
            <option value="Edited">Edited</option>
            <option value="Role Changed">Role Changed</option>
            <option value="Member Invited">Member Invited</option>
            <option value="Rejected">Rejected</option>
            <option value="Data Imported">Data Imported</option>
          </select>

          {/* Module Filter */}
          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value)
              setPage(1)
            }}
            style={{
              height: 36,
              padding: '0 12px',
              background: 'var(--ca-bg-alt)',
              border: '1px solid var(--ca-border)',
              borderRadius: 'var(--ca-radius-md)',
              color: 'var(--ca-text)',
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            <option value="All">All Modules</option>
            <option value="FR04 Approvals">FR04 Approvals</option>
            <option value="FR06 RBAC">FR06 RBAC</option>
            <option value="FR06 Workspace">FR06 Workspace</option>
            <option value="FR08 Data Import">FR08 Data Import</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              height: 36,
              padding: '0 12px',
              background: 'var(--ca-bg-alt)',
              border: '1px solid var(--ca-border)',
              borderRadius: 'var(--ca-radius-md)',
              color: 'var(--ca-text)',
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            <option value="Past 7 Days">Past 7 Days</option>
            <option value="Past 30 Days">Past 30 Days</option>
            <option value="All Time">All Time</option>
          </select>
        </div>

        {/* Active Filter Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ color: 'var(--ca-text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
            ACTIVE:
          </span>
          <span className="ca-badge ca-badge-member">Module: {moduleFilter}</span>
          <span className="ca-badge ca-badge-active">● Status: Verified</span>
          {(search || actionFilter !== 'All' || moduleFilter !== 'All') && (
            <button
              type="button"
              className="ca-btn ca-btn-subtle ca-btn-sm"
              style={{ border: 'none', padding: '0 6px', fontSize: 11, color: 'var(--ca-cyan)' }}
              onClick={() => {
                setSearch('')
                setActionFilter('All')
                setModuleFilter('All')
              }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Audit Table */}
      <div className="ca-table-wrap">
        <table className="ca-table">
          <thead>
            <tr>
              <th>Timestamp (UTC)</th>
              <th>User / Actor</th>
              <th>Action Type</th>
              <th>Object / Entity</th>
              <th>Module / Spec</th>
              <th>Details Summary</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--ca-text-muted)' }}>
                  No audit events found matching the filters.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => (
                <tr
                  key={log.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectRecord?.(log)}
                  title="Click to view full record diff and audit receipt"
                >
                  <td style={{ fontFamily: 'var(--ca-font-mono)', fontSize: 12, whiteSpace: 'nowrap', color: 'var(--ca-text)' }}>
                    {log.timestamp}
                  </td>
                  <td>
                    <div className="ca-table-user-cell">
                      <div
                        className="ca-cell-avatar"
                        style={{
                          background:
                            log.actorRole === 'Admin'
                              ? '#4f46e5'
                              : log.actorRole === 'Manager'
                              ? '#0284c7'
                              : '#475569',
                        }}
                      >
                        {log.actorInitials}
                      </div>
                      <div className="ca-cell-user-info">
                        <span className="ca-cell-name">{log.actorName}</span>
                        <span className="ca-cell-subtext">{log.actorRole}</span>
                      </div>
                    </div>
                  </td>
                  <td>{renderActionBadge(log.action)}</td>
                  <td>
                    <span
                      style={{
                        fontFamily: 'var(--ca-font-mono)',
                        fontSize: 12,
                        color: log.entityId.includes('PRP-') ? 'var(--ca-cyan)' : '#ffffff',
                      }}
                    >
                      {log.entityId}
                    </span>
                  </td>
                  <td>
                    <span className="ca-badge ca-badge-admin">{log.module}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: 'var(--ca-text)', fontSize: 12.5 }}>{log.summary}</span>
                      <span style={{ fontFamily: 'var(--ca-font-mono)', fontSize: 11, color: 'var(--ca-text-muted)' }}>
                        hash: {log.hash.slice(0, 6)}...{log.hash.slice(-4)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Table Pagination */}
        <Pagination
          current={page}
          total={totalPages}
          onPageChange={setPage}
          label={`Showing 1–${paginatedLogs.length} of ${filteredLogs.length} audit entries · All hashes verified (SHA-256)`}
        />
      </div>
    </div>
  )
}
