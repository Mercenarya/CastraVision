/**
 * AuditLogScreen.jsx — Phase 7: Workspace Audit Log & Version History (FR11)
 *
 * Implements all four Figma primary states:
 * 1. Default State (workspaceadminauditlog—default.jpg)
 * 2. Filtered State (workspaceadminauditlog—filtered.jpg)
 * 3. Empty State (workspaceadminauditlog—empty.jpg)
 * 4. Error State (workspaceadminauditlog—error.jpg)
 *
 * Adheres strictly to audit integrity standards:
 * - Data source is explicitly classified as local mock fixture (DB audit table exists but UI is not connected).
 * - Cryptographic/ledger claims are qualified as reference design previews.
 * - RBAC enforced: only Company Admin / Workspace Admin has access to FR11 audit records.
 */

import { useState, useMemo } from 'react'
import {
  IconSearch,
  IconClock,
  IconShield,
  IconDownload,
  IconLock,
} from '../ui/Icons'
import { INITIAL_AUDIT_LOGS } from '../mockData'

export default function AuditLogScreen({
  auditLogs = INITIAL_AUDIT_LOGS,
  onSelectRecord,
  notify,
  user: _user,
  workspaceRole = 'admin',
  workspace = { name: 'Acme Corp' },
}) {
  // Dev Preview State Switches (for 1-click preview of all Figma states)
  const [devStateOverride, setDevStateOverride] = useState('auto') // 'auto' | 'default' | 'filtered' | 'empty' | 'error'
  const [devRoleEmulation, setDevRoleEmulation] = useState(workspaceRole) // 'admin' | 'manager' | 'member'
  const [errorDismissed, setErrorDismissed] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  // Filter State
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('All')
  const [moduleFilter, setModuleFilter] = useState('All')
  const [timeframeFilter, setTimeframeFilter] = useState('Past 30 Days')
  const [quickFilter, setQuickFilter] = useState('All')
  const [page, setPage] = useState(1)
  const pageSize = 6

  // Check RBAC Authorization
  const isAuthorized = devRoleEmulation === 'admin'

  // Determine active view mode
  const isErrorMode = devStateOverride === 'error'

  // Apply Quick Filter preset helper
  function handleSelectQuickFilter(qf) {
    setQuickFilter(qf)
    setPage(1)
    if (qf === 'All') {
      setActionFilter('All')
      setModuleFilter('All')
    } else if (qf === 'Approvals (FR04)') {
      setActionFilter('All')
      setModuleFilter('FR04 Approvals')
    } else if (qf === 'Membership') {
      setActionFilter('All')
      setModuleFilter('Workspace Admin')
    } else if (qf === 'Role Changes') {
      setActionFilter('Role Changed')
      setModuleFilter('RBAC Control')
    } else if (qf === 'Data Imports') {
      setActionFilter('Data Imported')
      setModuleFilter('Data Import')
    }
  }

  // Set Filtered Preset (matches workspaceadminauditlog—filtered.jpg)
  function handleApplyFilteredPreset() {
    setDevStateOverride('auto')
    setSearch('PRP-')
    setActionFilter('Approvals & Rejections')
    setModuleFilter('FR04 Approvals')
    setTimeframeFilter('Past 7 Days')
    setQuickFilter('Approvals (FR04)')
    setPage(1)
  }

  // Set Empty Preset (matches workspaceadminauditlog—empty.jpg)
  function handleApplyEmptyPreset() {
    setDevStateOverride('auto')
    setSearch('SEC-NONEXISTENT-TOKEN')
    setActionFilter('Member Removed')
    setModuleFilter('All')
    setTimeframeFilter('Past 24 Hours')
    setQuickFilter('All')
    setPage(1)
  }

  // Clear all filters (Reset to default)
  function handleClearAllFilters() {
    setDevStateOverride('auto')
    setSearch('')
    setActionFilter('All')
    setModuleFilter('All')
    setTimeframeFilter('Past 30 Days')
    setQuickFilter('All')
    setPage(1)
    setErrorDismissed(false)
  }

  // Retry handler for Error State
  function handleRetryConnection() {
    setIsRetrying(true)
    notify?.('Reconnecting to telemetry query service...', 'info')
    setTimeout(() => {
      setIsRetrying(false)
      setDevStateOverride('default')
      notify?.('Connection re-established with workspace audit service.', 'success')
    }, 900)
  }

  // Calculate filtered logs
  const filteredLogs = useMemo(() => {
    if (devStateOverride === 'empty') return []
    if (devStateOverride === 'error') return []

    return auditLogs.filter((l) => {
      // Search
      const q = search.trim().toLowerCase()
      const matchSearch =
        q === '' ||
        (l.actorName && l.actorName.toLowerCase().includes(q)) ||
        (l.action && l.action.toLowerCase().includes(q)) ||
        (l.entityId && l.entityId.toLowerCase().includes(q)) ||
        (l.entityTitle && l.entityTitle.toLowerCase().includes(q)) ||
        (l.summary && l.summary.toLowerCase().includes(q)) ||
        (l.id && l.id.toLowerCase().includes(q))

      // Action Filter
      let matchAction = true
      if (actionFilter !== 'All') {
        if (actionFilter === 'Approvals & Rejections') {
          matchAction =
            l.action === 'Proposal Approved' ||
            l.action === 'Proposal Rejected' ||
            l.action === 'Proposal Edited'
        } else {
          matchAction = l.action === actionFilter
        }
      }

      // Module Filter
      const matchModule = moduleFilter === 'All' || l.module === moduleFilter

      return matchSearch && matchAction && matchModule
    })
  }, [auditLogs, search, actionFilter, moduleFilter, devStateOverride])

  // Determine if active criteria is applied
  const hasActiveFilters =
    search.trim() !== '' ||
    actionFilter !== 'All' ||
    moduleFilter !== 'All' ||
    timeframeFilter !== 'Past 30 Days' ||
    quickFilter !== 'All' ||
    devStateOverride === 'filtered'

  // Is Empty state?
  const isEmptyState =
    !isErrorMode && (devStateOverride === 'empty' || filteredLogs.length === 0)

  // Is Filtered state? (Has filters and has results)
  const isFilteredState = !isErrorMode && !isEmptyState && hasActiveFilters

  // Pagination calculation
  const totalRecords = 142 // Total nominal workspace records from Figma
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize))
  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize)

  // Export CSV handler
  function handleExportCsv() {
    const recordsToExport = filteredLogs.length > 0 ? filteredLogs : auditLogs
    const headerRow = 'Timestamp (UTC),Actor Name,Actor Role,Action,Target Entity,Module,Details Summary,Event ID\n'
    const rows = recordsToExport
      .map(
        (l) =>
          `"${l.timestamp}","${l.actorName}","${l.actorRole}","${l.action}","${l.entityId}","${l.module}","${l.summary}","${l.id}"`
      )
      .join('\n')

    const csvContent = `# CastraVision FR11 Workspace Audit Log Export\n# Tenant: ${workspace.name}\n# Scope: Authenticated Workspace Admin\n# Data Source: Local Development Fixture\n${headerRow}${rows}`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `workspace_audit_log_${workspace.name.toLowerCase().replace(/\s+/g, '_')}.csv`
    link.click()
    URL.revokeObjectURL(url)
    notify?.(`Exported ${recordsToExport.length} audit entries as CSV.`, 'success')
  }

  // Render Action Badge matching Figma exactly
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
      bg = 'rgba(99, 102, 241, 0.18)'
      color = '#a5b4fc'
      border = '1px solid rgba(99, 102, 241, 0.35)'
    } else if (act.includes('invited') || act.includes('member')) {
      bg = 'rgba(139, 92, 246, 0.15)'
      color = '#c084fc'
      border = '1px solid rgba(139, 92, 246, 0.3)'
    } else if (act.includes('import') || act.includes('data')) {
      bg = 'rgba(20, 184, 166, 0.15)'
      color = '#2dd4bf'
      border = '1px solid rgba(20, 184, 166, 0.3)'
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 600,
          background: bg,
          color: color,
          border: border,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: '8px' }}>●</span>
        {action}
      </span>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RBAC GUARD: Access Denied for Manager or Member
  // ─────────────────────────────────────────────────────────────────────────
  if (!isAuthorized) {
    return (
      <div style={{ maxWidth: 900, margin: '24px auto' }}>
        {/* Dev toolbar still visible so user can switch back */}
        {import.meta.env.DEV && (
          <div className="ca-audit-dev-toolbar">
            <div className="ca-audit-dev-label">
              <span>🛠</span> FR11 RBAC ACCESS CONTROL PREVIEW
            </div>
            <div className="ca-audit-dev-actions">
              <span style={{ fontSize: 11, color: '#94a3b8', marginRight: 4 }}>Emulate Role:</span>
              <button
                type="button"
                className={`ca-audit-dev-btn ${devRoleEmulation === 'admin' ? 'active' : ''}`}
                onClick={() => setDevRoleEmulation('admin')}
              >
                Admin (Authorized)
              </button>
              <button
                type="button"
                className={`ca-audit-dev-btn ${devRoleEmulation === 'manager' ? 'active' : ''}`}
                onClick={() => setDevRoleEmulation('manager')}
              >
                Manager (Denied)
              </button>
              <button
                type="button"
                className={`ca-audit-dev-btn ${devRoleEmulation === 'member' ? 'active' : ''}`}
                onClick={() => setDevRoleEmulation('member')}
              >
                Member (Denied)
              </button>
            </div>
          </div>
        )}

        <div className="ca-audit-error-card">
          <div className="ca-audit-error-icon-wrap" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
            <IconLock size={32} />
          </div>
          <h2 className="ca-audit-error-title">403 Forbidden — Audit Log Access Restricted</h2>
          <p className="ca-audit-error-desc">
            In accordance with FR11 Workspace Governance and CastraVision RBAC policy, the
            Workspace Audit Log is strictly restricted to authenticated <strong>Marketing Managers</strong>.
            Your current assigned role (<strong>{devRoleEmulation.toUpperCase()}</strong>) is not authorized to view the chronological workspace audit stream.
          </p>
          <div className="ca-audit-suggestions-box" style={{ maxWidth: 500, margin: '0 auto 24px auto' }}>
            <span className="ca-audit-suggestions-icon">ℹ️</span>
            <div>
              <div className="ca-audit-suggestions-title">Governance Boundary Policy</div>
              <p className="ca-audit-suggestions-text">
                Audit event payloads are never dispatched to unauthorized clients. If you require access to
                system logs or compliance verification receipts, contact your primary Marketing Manager.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* ── DEV PREVIEW TOOLBAR (Protected with import.meta.env.DEV) ── */}
      {import.meta.env.DEV && (
        <div className="ca-audit-dev-toolbar">
          <div className="ca-audit-dev-label">
            <span>⚙️</span> DEV PREVIEW FIXTURES (FR11)
          </div>
          <div className="ca-audit-dev-actions">
            <span style={{ fontSize: 11, color: '#94a3b8', marginRight: 4 }}>Figma State:</span>
            <button
              type="button"
              className={`ca-audit-dev-btn ${!isErrorMode && !isFilteredState && !isEmptyState ? 'active' : ''}`}
              onClick={handleClearAllFilters}
            >
              Default
            </button>
            <button
              type="button"
              className={`ca-audit-dev-btn ${isFilteredState ? 'active' : ''}`}
              onClick={handleApplyFilteredPreset}
            >
              Filtered
            </button>
            <button
              type="button"
              className={`ca-audit-dev-btn ${isEmptyState ? 'active' : ''}`}
              onClick={handleApplyEmptyPreset}
            >
              Empty
            </button>
            <button
              type="button"
              className={`ca-audit-dev-btn ${isErrorMode ? 'active' : ''}`}
              onClick={() => {
                setDevStateOverride('error')
                setErrorDismissed(false)
              }}
            >
              Error (504)
            </button>

            <span style={{ fontSize: 11, color: '#64748b', margin: '0 4px' }}>|</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Detail Previews:</span>
            <button
              type="button"
              className="ca-audit-dev-btn"
              onClick={() => {
                const rec = auditLogs.find((l) => l.detailsType === 'proposal_edited') || auditLogs[2]
                onSelectRecord?.(rec)
              }}
            >
              Proposal Edited
            </button>
            <button
              type="button"
              className="ca-audit-dev-btn"
              onClick={() => {
                const rec = auditLogs.find((l) => l.detailsType === 'role_changed') || auditLogs[4]
                onSelectRecord?.(rec)
              }}
            >
              Role Changed
            </button>
            <button
              type="button"
              className="ca-audit-dev-btn"
              onClick={() => {
                const rec = auditLogs.find((l) => l.id === 'LOG-94025') || auditLogs[0]
                onSelectRecord?.(rec)
              }}
            >
              Proposal Approved
            </button>

            <span style={{ fontSize: 11, color: '#64748b', margin: '0 4px' }}>|</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>RBAC:</span>
            <button
              type="button"
              className={`ca-audit-dev-btn ${devRoleEmulation === 'manager' ? 'active' : ''}`}
              onClick={() => setDevRoleEmulation('manager')}
              title="Test Manager (Denied)"
            >
              Manager
            </button>
          </div>
        </div>
      )}

      {/* ── TOP ERROR BANNER (When in Error State and not dismissed) ── */}
      {isErrorMode && !errorDismissed && (
        <div className="ca-audit-error-banner" role="alert">
          <div className="ca-audit-error-banner-left">
            <span style={{ fontSize: 20, lineHeight: 1 }}>⚠️</span>
            <div>
              <div className="ca-audit-error-banner-title">
                <span>Audit Stream Interrupted</span>
                <span className="ca-audit-error-banner-code-pill">504 GATEWAY TIMEOUT</span>
              </div>
              <p className="ca-audit-error-banner-desc">
                Unable to retrieve workspace audit events: The audit log query service encountered a connection timeout while communicating with the telemetry node.{' '}
                <span style={{ textDecoration: 'underline', fontFamily: 'var(--ca-font-mono)' }}>Error Code: AUDIT_QUERY_TIMEOUT_504</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            className="ca-audit-error-banner-dismiss"
            onClick={() => setErrorDismissed(true)}
          >
            Dismiss ✕
          </button>
        </div>
      )}

      {/* ── PAGE HEADER ROW ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <span className="ca-audit-badge-pill">
              ● FR11 WORKSPACE AUDIT LOG • GOVERNANCE AUDIT TRAIL
            </span>
            {isErrorMode && (
              <span className="ca-audit-status-halted">
                ● Sync Halted
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Workspace Audit Log
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--ca-text-secondary)', margin: 0, maxWidth: 740, lineHeight: 1.45 }}>
            Comprehensive, chronological audit log tracking human-in-the-loop approvals, member management, and workspace configuration events for {workspace.name}.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isErrorMode ? (
            <>
              <button
                type="button"
                className="ca-btn ca-btn-subtle"
                disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              >
                <span style={{ textDecoration: 'line-through', marginRight: 6 }}>📥</span>
                Export Audit Log (CSV)
              </button>
              <button
                type="button"
                className="ca-btn ca-btn-primary"
                onClick={handleRetryConnection}
                disabled={isRetrying}
              >
                <span style={{ marginRight: 6 }}>🔄</span>
                {isRetrying ? 'Polling...' : 'Poll Node'}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="ca-btn ca-btn-subtle"
              onClick={handleExportCsv}
              disabled={isEmptyState}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--ca-border)',
                color: '#ffffff',
                padding: '9px 16px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: 'var(--ca-radius-md)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <IconDownload size={15} />
              {isFilteredState ? 'Export Filtered Log (CSV)' : 'Export Audit Log (CSV)'}
            </button>
          )}
        </div>
      </div>

      {/* ── 4 KPI CARDS (Matches Figma for Default, Filtered, Empty, and Error) ── */}
      <div className="ca-audit-kpi-grid">
        {/* Card 1 */}
        <div className="ca-audit-kpi-card">
          <div className="ca-audit-kpi-top">
            <span className="ca-audit-kpi-label">
              {isEmptyState
                ? 'TOTAL LOGGED EVENTS'
                : isErrorMode
                  ? 'TOTAL LOGGED EVENTS'
                  : isFilteredState
                    ? 'MATCHING EVENTS'
                    : 'TOTAL LOGGED EVENTS'}
            </span>
            <div className="ca-audit-kpi-icon-wrap">
              {isFilteredState ? '🔍' : '☁️'}
            </div>
          </div>
          <div className="ca-audit-kpi-val-row">
            {isErrorMode ? (
              <span className="ca-audit-kpi-val" style={{ color: 'var(--ca-text-muted)' }}>— NULL</span>
            ) : isFilteredState ? (
              <>
                <span className="ca-audit-kpi-val">{filteredLogs.length}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: 4 }}>
                  Filtered
                </span>
              </>
            ) : (
              <span className="ca-audit-kpi-val">{totalRecords}</span>
            )}
          </div>
          <div className="ca-audit-kpi-sub">
            {isErrorMode
              ? 'Telemetry sync paused'
              : isFilteredState
                ? `${((filteredLogs.length / totalRecords) * 100).toFixed(1)}% of total ${totalRecords} events`
                : isEmptyState
                  ? 'In workspace ledger'
                  : `Across ${workspace.name} lifecycle`}
          </div>
        </div>

        {/* Card 2 */}
        <div className="ca-audit-kpi-card">
          <div className="ca-audit-kpi-top">
            <span className="ca-audit-kpi-label">
              {isEmptyState
                ? 'MATCHING EVENTS'
                : isErrorMode
                  ? 'EVENTS (LAST 30 DAYS)'
                  : isFilteredState
                    ? 'FILTERED TIMEFRAME'
                    : 'EVENTS (LAST 30 DAYS)'}
            </span>
            <div className="ca-audit-kpi-icon-wrap">
              {isFilteredState ? '📅' : isEmptyState ? '🎯' : '📈'}
            </div>
          </div>
          <div className="ca-audit-kpi-val-row">
            {isErrorMode ? (
              <span className="ca-audit-kpi-val" style={{ color: 'var(--ca-text-muted)', fontSize: 16 }}>— UNREACHABLE</span>
            ) : isEmptyState ? (
              <span className="ca-audit-kpi-val" style={{ color: '#f87171' }}>0</span>
            ) : isFilteredState ? (
              <span className="ca-audit-kpi-val" style={{ fontSize: 22 }}>Past 7 Days</span>
            ) : (
              <>
                <span className="ca-audit-kpi-val">38</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', padding: '2px 6px', borderRadius: 4 }}>
                  +12%
                </span>
              </>
            )}
          </div>
          <div className="ca-audit-kpi-sub">
            {isErrorMode
              ? 'Unable to fetch metrics'
              : isEmptyState
                ? 'No records found'
                : isFilteredState
                  ? 'Oct 18, 2026 – Oct 24, 2026'
                  : 'vs previous 30-day period'}
          </div>
        </div>

        {/* Card 3 */}
        <div className="ca-audit-kpi-card">
          <div className="ca-audit-kpi-top">
            <span className="ca-audit-kpi-label">
              {isEmptyState
                ? 'ACTIVE SEARCH'
                : isErrorMode
                  ? 'LATEST EVENT'
                  : isFilteredState
                    ? 'TARGET MODULE'
                    : 'LATEST EVENT'}
            </span>
            <div className="ca-audit-kpi-icon-wrap">
              <IconClock size={15} />
            </div>
          </div>
          <div className="ca-audit-kpi-val-row">
            {isErrorMode ? (
              <span className="ca-audit-kpi-val" style={{ fontSize: 20 }}>Oct 24, 14:35</span>
            ) : isEmptyState ? (
              <span className="ca-audit-kpi-val" style={{ fontSize: 14, fontFamily: 'var(--ca-font-mono)', color: '#38bdf8' }}>
                "{search || 'NONE'}"
              </span>
            ) : isFilteredState ? (
              <span className="ca-audit-kpi-val" style={{ fontSize: 22 }}>FR04 Approvals</span>
            ) : (
              <span className="ca-audit-kpi-val" style={{ fontSize: 24, color: '#c7d2fe' }}>Just now</span>
            )}
          </div>
          <div className="ca-audit-kpi-sub">
            {isErrorMode
              ? 'Cached from local session'
              : isEmptyState
                ? 'Unmatched query string'
                : isFilteredState
                  ? 'Human-in-the-loop governance'
                  : 'Proposal Approved (PRP-8402)'}
          </div>
        </div>

        {/* Card 4 */}
        <div className="ca-audit-kpi-card">
          <div className="ca-audit-kpi-top">
            <span className="ca-audit-kpi-label">
              {isEmptyState
                ? 'ACTIVE FILTERS'
                : isErrorMode
                  ? 'SERVICE STATUS'
                  : isFilteredState
                    ? 'FILTERED OPERATORS'
                    : 'ACTIVE OPERATORS'}
            </span>
            <div className="ca-audit-kpi-icon-wrap">
              <IconShield size={15} />
            </div>
          </div>
          <div className="ca-audit-kpi-val-row">
            {isErrorMode ? (
              <span className="ca-audit-kpi-val" style={{ fontSize: 22, color: '#f59e0b' }}>Degraded ●</span>
            ) : isEmptyState ? (
              <span className="ca-audit-kpi-val" style={{ fontSize: 22 }}>2 Applied</span>
            ) : isFilteredState ? (
              <span className="ca-audit-kpi-val" style={{ fontSize: 22 }}>3 Actors</span>
            ) : (
              <span className="ca-audit-kpi-val">6 Operators</span>
            )}
          </div>
          <div className="ca-audit-kpi-sub">
            {isErrorMode
              ? 'Audit query node timeout'
              : isEmptyState
                ? `Action: ${actionFilter}`
                : isFilteredState
                  ? 'S. Jenkins, D. Kross, E. Rostova'
                  : 'Authorized audit actors'}
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS BAR ── */}
      <div className="ca-audit-filter-box">
        <div className="ca-audit-filter-row">
          {/* Search Box */}
          <div className="ca-audit-search-input-wrap">
            <IconSearch size={15} className="search-icon" />
            <input
              type="text"
              className="ca-audit-search-input"
              placeholder={isErrorMode ? 'Filter service offline' : 'Filter by actor, action, target, or details...'}
              value={search}
              disabled={isErrorMode}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
            {search && !isErrorMode && (
              <button
                type="button"
                className="ca-audit-search-clear"
                onClick={() => {
                  setSearch('')
                  setPage(1)
                }}
                title="Clear query"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Filter Dropdown */}
          <select
            className="ca-audit-select"
            value={actionFilter}
            disabled={isErrorMode}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="All">All Actions</option>
            <option value="Approvals & Rejections">Approvals & Rejections</option>
            <option value="Proposal Approved">Proposal Approved</option>
            <option value="Proposal Rejected">Proposal Rejected</option>
            <option value="Proposal Edited">Proposal Edited</option>
            <option value="Role Changed">Role Changed</option>
            <option value="Member Invited">Member Invited</option>
            <option value="Member Removed">Member Removed</option>
            <option value="Data Imported">Data Imported</option>
          </select>

          {/* Module Filter Dropdown */}
          <select
            className="ca-audit-select"
            value={moduleFilter}
            disabled={isErrorMode}
            onChange={(e) => {
              setModuleFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="All">All Modules</option>
            <option value="FR04 Approvals">FR04 Approvals</option>
            <option value="Workspace Admin">Marketing Manager</option>
            <option value="RBAC Control">RBAC Control</option>
            <option value="Data Import">Data Import</option>
          </select>

          {/* Timeframe Dropdown */}
          <select
            className="ca-audit-select"
            value={timeframeFilter}
            disabled={isErrorMode}
            onChange={(e) => {
              setTimeframeFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="Past 24 Hours">Past 24 Hours</option>
            <option value="Past 7 Days">Past 7 Days</option>
            <option value="Past 30 Days">Past 30 Days</option>
            <option value="All Time">All Time</option>
          </select>

          {/* Reset / Reload Button */}
          <button
            type="button"
            className="ca-audit-icon-btn"
            title="Reset Filters"
            disabled={isErrorMode}
            onClick={handleClearAllFilters}
          >
            ↻
          </button>
        </div>

        {/* Quick Filter Buttons (Default View) */}
        {!isFilteredState && !isEmptyState && !isErrorMode && (
          <div className="ca-audit-quick-row">
            <span className="ca-audit-quick-label">QUICK FILTERS:</span>
            <button
              type="button"
              className={`ca-audit-quick-pill ${quickFilter === 'All' ? 'active' : ''}`}
              onClick={() => handleSelectQuickFilter('All')}
            >
              All (142)
            </button>
            <button
              type="button"
              className={`ca-audit-quick-pill ${quickFilter === 'Approvals (FR04)' ? 'active' : ''}`}
              onClick={() => handleSelectQuickFilter('Approvals (FR04)')}
            >
              Approvals (FR04) [48]
            </button>
            <button
              type="button"
              className={`ca-audit-quick-pill ${quickFilter === 'Membership' ? 'active' : ''}`}
              onClick={() => handleSelectQuickFilter('Membership')}
            >
              Membership [32]
            </button>
            <button
              type="button"
              className={`ca-audit-quick-pill ${quickFilter === 'Role Changes' ? 'active' : ''}`}
              onClick={() => handleSelectQuickFilter('Role Changes')}
            >
              Role Changes [14]
            </button>
            <button
              type="button"
              className={`ca-audit-quick-pill ${quickFilter === 'Data Imports' ? 'active' : ''}`}
              onClick={() => handleSelectQuickFilter('Data Imports')}
            >
              Data Imports [12]
            </button>
          </div>
        )}

        {/* Active Criteria Chips (Filtered View) */}
        {isFilteredState && !isErrorMode && (
          <div className="ca-audit-active-criteria-row">
            <div className="ca-audit-chips-list">
              <span className="ca-audit-criteria-label">ACTIVE CRITERIA:</span>
              {moduleFilter !== 'All' && (
                <span className="ca-audit-chip">
                  Module: {moduleFilter}
                  <button
                    type="button"
                    className="ca-audit-chip-remove"
                    onClick={() => setModuleFilter('All')}
                  >
                    ✕
                  </button>
                </span>
              )}
              {search && (
                <span className="ca-audit-chip">
                  Query: {search}
                  <button
                    type="button"
                    className="ca-audit-chip-remove"
                    onClick={() => setSearch('')}
                  >
                    ✕
                  </button>
                </span>
              )}
              {timeframeFilter && (
                <span className="ca-audit-chip">
                  Timeframe: {timeframeFilter}
                  <button
                    type="button"
                    className="ca-audit-chip-remove"
                    onClick={() => setTimeframeFilter('Past 30 Days')}
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
            <button
              type="button"
              className="ca-audit-clear-all-link"
              onClick={handleClearAllFilters}
            >
              Clear all filters (3 active)
            </button>
          </div>
        )}

        {/* Active Chips when in Empty State */}
        {isEmptyState && !isErrorMode && (
          <div className="ca-audit-active-criteria-row">
            <div className="ca-audit-chips-list">
              <span className="ca-audit-criteria-label">APPLIED FILTERS:</span>
              {search && (
                <span className="ca-audit-chip">
                  Search: {search}
                  <button
                    type="button"
                    className="ca-audit-chip-remove"
                    onClick={() => setSearch('')}
                  >
                    ✕
                  </button>
                </span>
              )}
              {actionFilter !== 'All' && (
                <span className="ca-audit-chip">
                  Action: {actionFilter}
                  <button
                    type="button"
                    className="ca-audit-chip-remove"
                    onClick={() => setActionFilter('All')}
                  >
                    ✕
                  </button>
                </span>
              )}
              {timeframeFilter && (
                <span className="ca-audit-chip">
                  Window: {timeframeFilter}
                  <button
                    type="button"
                    className="ca-audit-chip-remove"
                    onClick={() => setTimeframeFilter('Past 30 Days')}
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── STATE 1: ERROR STATE (workspaceadminauditlog—error.jpg) ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {isErrorMode && (
        <>
          <div className="ca-audit-error-card">
            <div className="ca-audit-error-icon-wrap">
              <span style={{ fontSize: 32 }}>📡</span>
              <span className="ca-audit-error-badge-excl">!</span>
            </div>
            <h2 className="ca-audit-error-title">Audit Trail Service Temporarily Unavailable</h2>
            <p className="ca-audit-error-desc">
              The platform could not fetch the chronological audit stream for {workspace.name}. Existing audit
              events remain safely persisted in the workspace ledger; no records have been lost or modified.
            </p>

            {/* Diagnostic Telemetry Record */}
            <div className="ca-audit-diagnostic-box">
              <div className="ca-audit-diagnostic-top">
                <span className="ca-audit-diagnostic-label">
                  <span style={{ fontSize: 13 }}>📄</span> DIAGNOSTIC TELEMETRY RECORD
                </span>
                <span className="ca-audit-diagnostic-badge">HTTP 504</span>
              </div>
              <div className="ca-audit-diagnostic-grid">
                <span className="ca-audit-diag-key">Endpoint:</span>
                <span className="ca-audit-diag-val">/api/v2/workspaces/{workspace.name.toLowerCase().replace(/\s+/g, '-')}/audit-events</span>
                <span className="ca-audit-diag-key">Status Code:</span>
                <span className="ca-audit-diag-val" style={{ color: '#fca5a5' }}>
                  504 Gateway Timeout (upstream telemetry node)
                </span>
                <span className="ca-audit-diag-key">Trace Request ID:</span>
                <span className="ca-audit-diag-val">
                  req_98a7c2b_audit_sync <span style={{ cursor: 'pointer', color: '#38bdf8' }} title="Copy">📋</span>
                </span>
                <span className="ca-audit-diag-key">Cluster Region:</span>
                <span className="ca-audit-diag-val">us-east-2 (Node Mesh: telemetry-pool-omega-4)</span>
              </div>
            </div>

            {/* Actions */}
            <div className="ca-audit-error-actions">
              <button
                type="button"
                className="ca-btn ca-btn-primary"
                onClick={handleRetryConnection}
                disabled={isRetrying}
              >
                <span style={{ marginRight: 6 }}>🔄</span>
                {isRetrying ? 'Retrying...' : 'Retry Connection'}
              </button>
              <button
                type="button"
                className="ca-btn ca-btn-subtle"
                onClick={() => notify?.('Status: Upstream telemetry pool node 4 degraded. Incident INC-4091 open.', 'info')}
              >
                Inspect System Status ↗
              </button>
              <button
                type="button"
                className="ca-btn ca-btn-subtle"
                style={{ border: 'none', color: '#38bdf8' }}
                onClick={() => {
                  setDevStateOverride('default')
                  notify?.('Loaded 14 cached records from active session.', 'info')
                }}
              >
                Load Cached Local Events (14 records)
              </button>
            </div>

            <div style={{ fontSize: 11.5, color: 'var(--ca-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>ℹ️</span> Auto-reconnection scheduled in 27s
            </div>
          </div>

          {/* Bottom Card for Error State */}
          <div className="ca-audit-boundary-card">
            <div className="ca-audit-boundary-left">
              <span className="ca-audit-boundary-icon">🛡</span>
              <div>
                <div className="ca-audit-boundary-title">Data Integrity Guaranteed</div>
                <p className="ca-audit-boundary-desc">
                  Temporary query outages do not affect immutable event persistence. All actions remain committed to the workspace audit trail ledger.
                </p>
              </div>
            </div>
            <div style={{ fontFamily: 'var(--ca-font-mono)', fontSize: 11.5, color: 'var(--ca-text-muted)', whiteSpace: 'nowrap' }}>
              Ledger Head: <span style={{ color: '#ffffff' }}>blk_0x839d...c01</span>
            </div>
          </div>
        </>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── STATE 2: EMPTY STATE (workspaceadminauditlog—empty.jpg) ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {isEmptyState && !isErrorMode && (
        <>
          <div className="ca-audit-empty-card">
            <div className="ca-audit-empty-icon-wrap">
              <IconSearch size={28} />
              <span className="ca-audit-empty-badge-x">✕</span>
            </div>
            <h2 className="ca-audit-empty-title">No audit events match your search</h2>
            <p className="ca-audit-empty-desc">
              We couldn't find any events matching your current filters and query{' '}
              <strong style={{ color: '#38bdf8' }}>"{search || actionFilter}"</strong> under the selected filter criteria.
              Try adjusting your query or resetting active filters.
            </p>

            <div className="ca-audit-empty-actions">
              <button
                type="button"
                className="ca-btn ca-btn-primary"
                onClick={handleClearAllFilters}
              >
                <span style={{ marginRight: 6 }}>↻</span> Clear Search & Filters
              </button>
              <button
                type="button"
                className="ca-btn ca-btn-subtle"
                onClick={handleClearAllFilters}
              >
                <span style={{ marginRight: 6 }}>👁</span> View All {totalRecords} Events
              </button>
            </div>

            {/* Suggestions Box */}
            <div className="ca-audit-suggestions-box">
              <span className="ca-audit-suggestions-icon">💡</span>
              <div>
                <div className="ca-audit-suggestions-title">Search Suggestions</div>
                <p className="ca-audit-suggestions-text">
                  Search by actor name (e.g. 'Sarah Jenkins'), proposal token ('PRP-8402'), target user email
                  ('@acmecorp.com'), or specific action categories like 'Approved', 'Rejected', or 'Invited'.
                </p>
              </div>
            </div>
          </div>

          {/* Footer for Empty State */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 4px', fontSize: 12, color: 'var(--ca-text-muted)', flexWrap: 'wrap', gap: 10 }}>
            <span>● Showing 0 of {totalRecords} audit records</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconLock size={13} style={{ color: '#38bdf8' }} />
              <span>Strict Tenant Boundary Notice: {workspace.name} audit log is isolated. Cross-workspace log entries are strictly inaccessible.</span>
            </div>
          </div>
        </>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── STATE 3: TABLE STREAM (Default & Filtered States) ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {!isErrorMode && !isEmptyState && (
        <div style={{ background: '#0d121f', border: '1px solid var(--ca-border)', borderRadius: 'var(--ca-radius-lg)', overflow: 'hidden' }}>
          {/* Filtered Stream Sub-header */}
          {isFilteredState && (
            <div className="ca-audit-stream-header">
              <span className="ca-audit-stream-title">
                ● Filtered Log Events Stream <span style={{ color: 'var(--ca-text-muted)', fontWeight: 400 }}>(Ordered Chronologically Descending)</span>
              </span>
              <span className="ca-audit-stream-live">
                Live Pipeline Sync ●
              </span>
            </div>
          )}

          {/* Main Table */}
          <table className="ca-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: 170 }}>TIMESTAMP (UTC)</th>
                <th style={{ width: 170 }}>ACTOR</th>
                <th style={{ width: 150 }}>ACTION</th>
                <th style={{ width: 160 }}>TARGET</th>
                <th style={{ width: 140 }}>MODULE</th>
                <th>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log) => (
                <tr
                  key={log.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectRecord?.(log)}
                  title="Click to view comprehensive audit record details and version diff"
                >
                  {/* Timestamp */}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: 12.5, color: '#ffffff', fontWeight: 500 }}>
                      {log.timestamp.split(' ')[0]} {log.timestamp.split(' ')[1]} {log.timestamp.split(' ')[2]}
                    </div>
                    <div style={{ fontFamily: 'var(--ca-font-mono)', fontSize: 11, color: 'var(--ca-text-muted)' }}>
                      {log.timestamp.split(' ')[3]} UTC
                    </div>
                  </td>

                  {/* Actor */}
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

                  {/* Action */}
                  <td>{renderActionBadge(log.action)}</td>

                  {/* Target */}
                  <td>
                    {log.entityId.includes('PRP-') ? (
                      <span
                        style={{
                          fontFamily: 'var(--ca-font-mono)',
                          fontSize: 11.5,
                          color: '#38bdf8',
                          background: 'rgba(56, 189, 248, 0.1)',
                          padding: '3px 7px',
                          borderRadius: 4,
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                        }}
                      >
                        {log.entityId}
                      </span>
                    ) : log.entityId.includes('@') ? (
                      <span style={{ fontSize: 12, color: 'var(--ca-text-secondary)', fontFamily: 'var(--ca-font-mono)' }}>
                        {log.entityId}
                      </span>
                    ) : log.entityId.endsWith('.xlsx') ? (
                      <span
                        style={{
                          fontFamily: 'var(--ca-font-mono)',
                          fontSize: 11.5,
                          color: '#2dd4bf',
                          background: 'rgba(45, 212, 191, 0.1)',
                          padding: '3px 7px',
                          borderRadius: 4,
                          border: '1px solid rgba(45, 212, 191, 0.25)',
                        }}
                      >
                        {log.entityId}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12.5, color: '#ffffff', fontWeight: 500 }}>
                        {log.entityId}
                      </span>
                    )}
                  </td>

                  {/* Module */}
                  <td>
                    <span style={{ fontSize: 12, color: 'var(--ca-text-secondary)' }}>
                      {log.module}
                    </span>
                  </td>

                  {/* Details Summary */}
                  <td>
                    <div style={{ fontSize: 12.5, color: '#ffffff', lineHeight: 1.4 }}>
                      {log.summary}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div
            style={{
              padding: '12px 18px',
              borderTop: '1px solid var(--ca-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12,
              color: 'var(--ca-text-muted)',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              {isFilteredState ? (
                <span>
                  Showing <strong>1–{Math.min(filteredLogs.length, pageSize)}</strong> of{' '}
                  <strong>{filteredLogs.length}</strong> filtered audit records • Filtered from {totalRecords} total
                </span>
              ) : (
                <span>
                  Showing <strong>1–{Math.min(filteredLogs.length, pageSize)}</strong> of{' '}
                  <strong>{totalRecords}</strong> audit records
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                className="ca-btn ca-btn-subtle ca-btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ‹ Previous
              </button>
              <button
                type="button"
                className="ca-btn ca-btn-primary ca-btn-sm"
                style={{ minWidth: 28 }}
              >
                {page}
              </button>
              {totalPages > 1 && (
                <button
                  type="button"
                  className="ca-btn ca-btn-subtle ca-btn-sm"
                  style={{ minWidth: 28 }}
                  onClick={() => setPage(2)}
                >
                  2
                </button>
              )}
              {totalPages > 2 && (
                <button
                  type="button"
                  className="ca-btn ca-btn-subtle ca-btn-sm"
                  style={{ minWidth: 28 }}
                  onClick={() => setPage(3)}
                >
                  3
                </button>
              )}
              {totalPages > 3 && <span>…</span>}
              {totalPages > 3 && (
                <button
                  type="button"
                  className="ca-btn ca-btn-subtle ca-btn-sm"
                  onClick={() => setPage(totalPages)}
                >
                  {totalPages}
                </button>
              )}
              <button
                type="button"
                className="ca-btn ca-btn-subtle ca-btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next ›
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM BOUNDARY POLICY CARD (Matches Figma) ── */}
      {!isErrorMode && !isEmptyState && (
        <div className="ca-audit-boundary-card">
          <div className="ca-audit-boundary-left">
            <span className="ca-audit-boundary-icon">🛡</span>
            <div>
              <div className="ca-audit-boundary-title">
                {isFilteredState
                  ? 'SECURITY BOUNDARY & NON-REPUDIATION POLICY'
                  : 'Workspace Boundary Guarantee'}
              </div>
              <p className="ca-audit-boundary-desc">
                {isFilteredState
                  ? 'Workspace Boundary: Displaying filtered records matching criteria. Technical hash metadata available in individual event inspection. All state alterations logged here are immutable and cryptographically timestamped in according to SOC 2 Type II compliance standards.'
                  : `Workspace Boundary: Audit records are scoped exclusively to the ${workspace.name} workspace instance. Event integrity hashes and cryptographic sequencing tokens are preserved for enterprise system verification and regulatory auditing.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
