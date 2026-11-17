import { useMemo, useState, useEffect, useRef } from 'react'
import {
  PageHeader,
  PrimaryButton,
  SecondaryButton,
} from '../ui/Primitives'
import {
  IconShield,
  IconShieldCheck,
  IconShieldAlert,
  IconDownload,
  IconUserMinus,
  IconUserSearch,
  IconFilterReset,
  IconLightbulb,
  IconSave,
  IconClock,
  IconChevronDown,
  IconLock,
  IconArrowRight,
  IconX,
} from '../ui/Icons'
import { INITIAL_MEMBERS, INITIAL_WORKSPACE } from '../mockData'

export default function WorkspaceMembersScreen({
  workspace = INITIAL_WORKSPACE,
  members = INITIAL_MEMBERS,
  onOpenInvite,
  onNavigate,
  onUpdateMemberRole,
  onRemoveMember,
  notify,
  currentUser,
}) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Action popover state
  const [activeMenuId, setActiveMenuId] = useState(null)
  const menuRef = useRef(null)

  // Modal dialog states
  const [roleChangeTarget, setRoleChangeTarget] = useState(null)
  const [selectedTargetRole, setSelectedTargetRole] = useState('Manager')
  const [roleChangeBusy, setRoleChangeBusy] = useState(false)

  const [removeTarget, setRemoveTarget] = useState(null)
  const [removeConfirmed, setRemoveConfirmed] = useState(false)
  const [removeBusy, setRemoveBusy] = useState(false)

  const [lastAdminTarget, setLastAdminTarget] = useState(null)

  // Close action menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Calculate live counts
  const totalCount = members.length
  const activeCount = members.filter((m) => m.status === 'active').length
  const pendingCount = members.filter((m) => m.status === 'pending').length
  const adminCount = members.filter((m) => m.role === 'Admin').length
  const managerCount = members.filter((m) => m.role === 'Manager').length
  const memberCount = members.filter((m) => m.role === 'Member').length

  // Segment widths for progress bar
  const adminPct = totalCount ? Math.round((adminCount / totalCount) * 100) : 0
  const managerPct = totalCount ? Math.round((managerCount / totalCount) * 100) : 0
  const memberPct = totalCount ? Math.max(0, 100 - adminPct - managerPct) : 0

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = search.trim().toLowerCase()
      const matchSearch =
        !q ||
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.role?.toLowerCase().includes(q)

      const matchRole =
        roleFilter === 'All Roles' ||
        roleFilter === 'All' ||
        m.role === roleFilter

      const matchStatus =
        statusFilter === 'All Statuses' ||
        statusFilter === 'All' ||
        (statusFilter === 'Active' && m.status === 'active') ||
        (statusFilter === 'Pending' && m.status === 'pending')

      return matchSearch && matchRole && matchStatus
    })
  }, [members, search, roleFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize))
  const paginatedMembers = filteredMembers.slice((page - 1) * pageSize, page * pageSize)

  function handleResetFilters() {
    setSearch('')
    setRoleFilter('All Roles')
    setStatusFilter('All Statuses')
    setPage(1)
  }

  function handleExportDirectory() {
    const csvContent =
      'Name,Email,Role,Status,Joined,Permissions\n' +
      members
        .map(
          (m) =>
            `"${m.name}","${m.email}","${m.role}","${m.status}","${m.joined}","${m.permissionsSummary || ''}"`
        )
        .join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `workspace_members_${workspace.id || 'acme'}.csv`
    link.click()
    URL.revokeObjectURL(url)
    notify?.('Member directory exported successfully.')
  }

  // Open Change Role Modal
  function handleOpenChangeRole(member) {
    setActiveMenuId(null)
    setRoleChangeTarget(member)
    setSelectedTargetRole(member.role)
  }

  // Save Role Change
  function handleSaveRoleChange() {
    if (!roleChangeTarget) return

    // Last Admin Protection rule:
    // If user is currently an Admin and adminCount <= 1, and new role is NOT Admin:
    if (roleChangeTarget.role === 'Admin' && adminCount <= 1 && selectedTargetRole !== 'Admin') {
      const target = roleChangeTarget
      setRoleChangeTarget(null)
      setLastAdminTarget(target)
      return
    }

    setRoleChangeBusy(true)
    setTimeout(() => {
      onUpdateMemberRole?.(roleChangeTarget.id, selectedTargetRole)
      notify?.(`Role successfully updated for ${roleChangeTarget.name} to ${selectedTargetRole}.`)
      setRoleChangeBusy(false)
      setRoleChangeTarget(null)
    }, 300)
  }

  // Open Remove Member Confirmation or Last Admin Guard
  function handleOpenRemove(member) {
    setActiveMenuId(null)
    // If target is an Admin and only 1 admin remains in the workspace:
    if (member.role === 'Admin' && adminCount <= 1) {
      setLastAdminTarget(member)
      return
    }
    setRemoveTarget(member)
    setRemoveConfirmed(false)
  }

  // Confirm Removal
  function handleConfirmRemoval() {
    if (!removeTarget || !removeConfirmed) return

    // Re-verify Last Admin Guardrail
    if (removeTarget.role === 'Admin' && adminCount <= 1) {
      const target = removeTarget
      setRemoveTarget(null)
      setLastAdminTarget(target)
      return
    }

    setRemoveBusy(true)
    setTimeout(() => {
      onRemoveMember?.(removeTarget.id)
      notify?.(`${removeTarget.name} was removed from ${workspace.name}.`)
      setRemoveBusy(false)
      setRemoveTarget(null)
      setRemoveConfirmed(false)
    }, 350)
  }

  return (
    <div className="ca-members-view-container">
      {/* ─── 1. PAGE HEADER (Figma Exact) ──────────────────────────────────── */}
      <PageHeader
        badge="● FR06 RBAC ENGINE • CASTRAVISION ENGINE V4.2.1 • Policy Active"
        title="Workspace Members & Access Control"
        subtitle="Manage workspace members, assign RBAC privileges (Admin, Manager, Member), and govern workspace access."
        actions={
          <div className="ca-members-header-actions">
            <SecondaryButton onClick={handleExportDirectory}>
              <IconDownload size={15} style={{ marginRight: 6 }} />
              Export Directory
            </SecondaryButton>
            <SecondaryButton onClick={() => onNavigate?.('roles')}>
              <IconShield size={15} style={{ marginRight: 6 }} />
              Role Permissions Matrix
            </SecondaryButton>
            <PrimaryButton onClick={onOpenInvite}>
              + Invite Member
            </PrimaryButton>
          </div>
        }
      />

      {/* ─── 2. TOP POLICY BANNER (Figma Exact) ────────────────────────────── */}
      <div className="ca-policy-top-banner">
        <div className="ca-policy-top-left">
          <div className="ca-policy-icon-badge">
            <IconShield size={18} />
          </div>
          <div>
            <strong style={{ color: '#ffffff' }}>Policy Notice:</strong> The last Marketing Manager cannot be removed or demoted from this tenant.
          </div>
        </div>
        <div className="ca-policy-enforced-pill">
          <IconLock size={12} />
          <span>ENFORCED BY PLATFORM ROUTER</span>
        </div>
      </div>

      {/* ─── 3. WORKSPACE SUMMARY & ALLOCATION CARDS (Figma Exact) ─────────── */}
      <div className="ca-members-summary-row">
        {/* Left Card: Workspace Info & Metric Counters */}
        <div className="ca-workspace-summary-card">
          <div className="ca-workspace-summary-header">
            <div className="ca-workspace-avatar-sq">
              AC
            </div>
            <div className="ca-workspace-titles">
              <div className="ca-workspace-name-badges">
                <span className="ca-workspace-brand-name">{workspace.name || 'Acme Corp'}</span>
                <span className="ca-tier-pill-purple">ENTERPRISE TIER</span>
                <span className="ca-session-pill-cyan">
                  <span className="ca-session-dot" />
                  Active Session
                </span>
              </div>
              <span className="ca-workspace-uid-sub">
                Workspace UID: 9a7b-castra-8812-corp
              </span>
            </div>
          </div>

          <div className="ca-members-stat-strip">
            <div className="ca-member-metric-col">
              <span className="ca-member-metric-num">{totalCount}</span>
              <span className="ca-member-metric-label">TOTAL MEMBERS</span>
            </div>
            <div className="ca-member-metric-col">
              <span className="ca-member-metric-num">{activeCount}</span>
              <span className="ca-member-metric-label">ACTIVE</span>
            </div>
            <div className="ca-member-metric-col">
              <span className="ca-member-metric-num">{pendingCount}</span>
              <span className="ca-member-metric-label">PENDING</span>
            </div>
          </div>
        </div>

        {/* Right Card: Role Distribution & Allocation */}
        <div className="ca-role-distribution-card">
          <div className="ca-distribution-header">
            <span className="ca-distribution-title">Role Distribution & Allocation</span>
            <span className="ca-compliance-status">100% capacity compliant</span>
          </div>

          {/* Segmented bar */}
          <div className="ca-segmented-progress-bar" title={`Marketing Managers: ${adminPct}%, Leaders: ${managerPct}%, Employees: ${memberPct}%`}>
            <div
              className="ca-prog-seg-admin"
              style={{ width: `${adminPct}%` }}
            />
            <div
              className="ca-prog-seg-manager"
              style={{ width: `${managerPct}%` }}
            />
            <div
              className="ca-prog-seg-member"
              style={{ width: `${memberPct}%` }}
            />
          </div>

          {/* Legend */}
          <div className="ca-distribution-legend">
            <span className="ca-dist-legend-item">
              <span className="ca-legend-dot" style={{ background: '#8b5cf6' }} />
              <strong>Marketing Managers ({adminCount})</strong> — Full control & compliance authority
            </span>
            <span className="ca-dist-legend-item">
              <span className="ca-legend-dot" style={{ background: '#06b6d4' }} />
              <strong>Leaders ({managerCount})</strong> — Campaign execution & review
            </span>
            <span className="ca-dist-legend-item">
              <span className="ca-legend-dot" style={{ background: '#4f46e5' }} />
              <strong>Employees ({memberCount})</strong> — Standard read & edit scope
            </span>
          </div>

          {/* Sparkline footer */}
          <div className="ca-churn-footer-row">
            <div className="ca-churn-stat-left">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              <span>Access churn rate over 30 days: <strong>0.00%</strong></span>
            </div>
            <svg width="90" height="20" viewBox="0 0 90 20" fill="none">
              <path
                d="M 2 15 Q 25 12, 45 14 T 88 5"
                stroke="#06b6d4"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ─── 4. SEARCH & FILTER TOOLBAR (Figma Exact) ──────────────────────── */}
      <div className="ca-members-filter-bar">
        <div className="ca-filter-bar-left">
          {/* Search box with clear button */}
          <div className="ca-search-box-pill">
            <span className="ca-search-box-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className="ca-search-box-input"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
            {search && (
              <button
                type="button"
                className="ca-search-box-clear"
                onClick={() => setSearch('')}
                title="Clear search"
              >
                <IconX size={14} />
              </button>
            )}
          </div>

          {/* Role Filter Dropdown */}
          <select
            className="ca-select-pill"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="All Roles">Role: All Roles</option>
            <option value="Admin">Role: Marketing Manager</option>
            <option value="Manager">Role: Leader</option>
            <option value="Member">Role: Employee</option>
          </select>

          {/* Status Filter Dropdown */}
          <select
            className="ca-select-pill"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="All Statuses">Status: All Statuses</option>
            <option value="Active">Status: Active</option>
            <option value="Pending">Status: Pending</option>
          </select>

          {/* Reset Filters Link */}
          {(search || roleFilter !== 'All Roles' || statusFilter !== 'All Statuses') && (
            <button
              type="button"
              className="ca-reset-filters-btn"
              onClick={handleResetFilters}
            >
              Reset filters
            </button>
          )}
        </div>

        <div className="ca-filter-bar-right">
          <div className="ca-showing-count-indicator">
            <span className="ca-showing-dot" />
            <span>Showing {filteredMembers.length} of {totalCount} workspace members</span>
          </div>
        </div>
      </div>

      {/* ─── 5. MEMBERS TABLE OR EMPTY STATE ───────────────────────────────── */}
      <div className="ca-table-wrap">
        {filteredMembers.length === 0 ? (
          /* ─── 5A. EMPTY SEARCH RESULTS STATE (Figma Exact) ─── */
          <div className="ca-empty-search-container">
            <div className="ca-empty-search-icon-circle">
              <IconUserSearch size={32} />
            </div>
            <h3 className="ca-empty-search-title">No members found matching your search</h3>
            <p className="ca-empty-search-desc">
              No active seats or pending invitations matched &ldquo;<strong>{search || 'your filters'}</strong>&rdquo;. Check for typos or try clearing your active search filters.
            </p>
            <div className="ca-empty-search-actions">
              <SecondaryButton onClick={handleResetFilters}>
                <IconFilterReset size={14} style={{ marginRight: 6 }} />
                Clear Search Filters
              </SecondaryButton>
              <SecondaryButton onClick={onOpenInvite}>
                + Invite New Member
              </SecondaryButton>
            </div>
            <div className="ca-search-suggestions-card">
              <div className="ca-suggestions-icon">
                <IconLightbulb size={20} />
              </div>
              <div className="ca-suggestions-content">
                <span className="ca-suggestions-heading">Search Suggestions</span>
                <span className="ca-suggestions-body">
                  Search by exact domain syntax (@acmecorp.com), user full name, or assigned role keywords like &ldquo;Marketing Manager&rdquo;, &ldquo;Leader&rdquo;, or &ldquo;Employee&rdquo;.
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* ─── 5B. POPULATED TABLE (Figma Exact) ─── */
          <table className="ca-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>
                  NAME &amp; WORK EMAIL <span style={{ fontSize: 11 }}>↓</span>
                </th>
                <th style={{ width: '18%' }}>WORKSPACE ROLE</th>
                <th style={{ width: '20%' }}>MEMBERSHIP STATUS</th>
                <th style={{ width: '20%' }}>JOINED DATE</th>
                <th style={{ width: '12%', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMembers.map((m) => {
                const isYou = m.isYou || m.email === currentUser?.email
                return (
                  <tr key={m.id || m.email}>
                    {/* Name & Work Email */}
                    <td>
                      <div className="ca-table-user-cell">
                        <div className="ca-cell-avatar">
                          {m.avatarInitials || m.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="ca-cell-user-info">
                          <div className="ca-cell-name-row">
                            <span className="ca-cell-name" style={{ color: '#ffffff', fontWeight: 600 }}>
                              {m.name}
                            </span>
                            {isYou && <span className="ca-you-pill">You</span>}
                          </div>
                          <span className="ca-cell-subtext">{m.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Workspace Role */}
                    <td>
                      <span className={`ca-role-dot-pill ca-role-${m.role.toLowerCase()}`}>
                        <span className="ca-role-dot" />
                        {m.role}
                      </span>
                    </td>

                    {/* Membership Status */}
                    <td>
                      {m.status === 'active' ? (
                        <span className="ca-status-dot-pill ca-status-active">
                          <span className="ca-status-active-dot" />
                          Active
                        </span>
                      ) : (
                        <span className="ca-status-dot-pill ca-status-pending">
                          <IconClock size={13} style={{ marginRight: 2 }} />
                          Pending Invitation
                        </span>
                      )}
                    </td>

                    {/* Joined Date & Activity */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ color: '#ffffff', fontSize: 12 }}>{m.joined}</span>
                        <span
                          style={{
                            fontSize: 11,
                            color: m.lastActive === 'Active now' ? '#38bdf8' : 'var(--ca-text-muted)',
                          }}
                        >
                          {m.lastActive}
                        </span>
                      </div>
                    </td>

                    {/* Actions Menu */}
                    <td style={{ textAlign: 'right' }}>
                      <div
                        className="ca-actions-menu-wrap"
                        ref={activeMenuId === m.id ? menuRef : null}
                      >
                        <button
                          type="button"
                          className="ca-actions-trigger-btn"
                          onClick={() => setActiveMenuId(activeMenuId === m.id ? null : m.id)}
                          aria-label={`Actions for ${m.name}`}
                        >
                          <span>Actions</span>
                          <IconChevronDown size={12} />
                        </button>

                        {activeMenuId === m.id && (
                          <div className="ca-actions-popover-menu">
                            <button
                              type="button"
                              className="ca-menu-item-btn"
                              onClick={() => handleOpenChangeRole(m)}
                            >
                              <span>Change Role</span>
                            </button>
                            <button
                              type="button"
                              className="ca-menu-item-btn ca-menu-item-destructive"
                              onClick={() => handleOpenRemove(m)}
                            >
                              <span>Remove Member</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Table Pagination Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            background: 'var(--ca-bg-alt)',
            borderTop: '1px solid var(--ca-border)',
            fontSize: 12,
            color: 'var(--ca-text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Rows per page: 10</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span>
              Page {filteredMembers.length === 0 ? 0 : page} of {filteredMembers.length === 0 ? 0 : totalPages}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                className="ca-page-btn"
                disabled={page <= 1 || filteredMembers.length === 0}
                onClick={() => setPage(page - 1)}
                aria-label="Previous Page"
              >
                ‹
              </button>
              <button
                type="button"
                className="ca-page-btn"
                disabled={page >= totalPages || filteredMembers.length === 0}
                onClick={() => setPage(page + 1)}
                aria-label="Next Page"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 6. BOTTOM TENANT ISOLATION BOUNDARY (Figma Exact) ─────────────── */}
      <div className="ca-isolation-boundary-banner">
        <div className="ca-isolation-left">
          <IconLock size={16} style={{ color: '#94a3b8' }} />
          <span>
            <strong>Strict Tenant Isolation Boundary:</strong> Membership management is scoped exclusively to Acme Corp. Cross-workspace management is strictly prevented.
          </span>
        </div>
        <div className="ca-enclave-verified-badge">
          <span className="ca-session-dot" />
          <span>Enclave Verified</span>
        </div>
      </div>

      {/* ─── 7. MODAL: CHANGE WORKSPACE ROLE (Figma Exact) ─────────────────── */}
      {roleChangeTarget && (
        <div
          className="ca-modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setRoleChangeTarget(null)}
        >
          <div
            className="ca-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ca-change-role-title"
          >
            {/* Modal Header */}
            <div className="ca-modal-header">
              <div className="ca-modal-header-left">
                <div className="ca-modal-icon-badge" style={{ background: 'rgba(124, 58, 237, 0.15)', color: '#c4b5fd' }}>
                  <IconShield size={18} />
                </div>
                <div>
                  <h2 id="ca-change-role-title" className="ca-modal-title">Change Workspace Role</h2>
                  <p className="ca-modal-subtitle">
                    Update access tier and organizational workflow authorities
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="ca-modal-close"
                onClick={() => setRoleChangeTarget(null)}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="ca-modal-body">
              {/* Member Summary Card */}
              <div className="ca-member-preview-card">
                <div className="ca-member-preview-left">
                  <div className="ca-member-preview-avatar">
                    {roleChangeTarget.avatarInitials || roleChangeTarget.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="ca-member-preview-meta">
                    <span className="ca-member-preview-name">{roleChangeTarget.name}</span>
                    <span className="ca-member-preview-email">{roleChangeTarget.email}</span>
                    <span className="ca-member-preview-uid">
                      {roleChangeTarget.uid || 'usr_99482_acme'}
                    </span>
                  </div>
                </div>
                <div className="ca-role-dot-pill ca-role-manager">
                  <span className="ca-role-dot" />
                  CURRENT ROLE: {roleChangeTarget.role}
                </div>
              </div>

              {/* Target Role Selector */}
              <div className="ca-form-group">
                <span className="ca-form-label">SELECT TARGET ROLE</span>
                <div className="ca-role-cards-grid">
                  {/* Admin Option */}
                  <div
                    className={`ca-role-option-card ${selectedTargetRole === 'Admin' ? 'selected' : ''}`}
                    onClick={() => setSelectedTargetRole('Admin')}
                    role="radio"
                    aria-checked={selectedTargetRole === 'Admin'}
                    tabIndex={0}
                  >
                    <div className="ca-radio-indicator" />
                    <div className="ca-role-card-text" style={{ width: '100%' }}>
                      <div className="ca-role-card-title-row">
                        <span className="ca-role-card-name">Marketing Manager</span>
                        <span className="ca-role-tier-badge ca-role-tier-admin">Marketing Manager Tier</span>
                        {roleChangeTarget.role === 'Admin' && (
                          <span style={{ fontSize: 11, color: 'var(--ca-text-muted)', marginLeft: 'auto' }}>
                            (Current Role)
                          </span>
                        )}
                      </div>
                      <p className="ca-role-card-desc">
                        Full authority over workspace lifecycle, membership management, and financial or proposal approvals.
                      </p>
                      <div className="ca-role-card-footer-tags">
                        Root Access • Budget Controls
                      </div>
                    </div>
                  </div>

                  {/* Manager Option */}
                  <div
                    className={`ca-role-option-card ${selectedTargetRole === 'Manager' ? 'selected' : ''}`}
                    onClick={() => setSelectedTargetRole('Manager')}
                    role="radio"
                    aria-checked={selectedTargetRole === 'Manager'}
                    tabIndex={0}
                  >
                    <div className="ca-radio-indicator" />
                    <div className="ca-role-card-text" style={{ width: '100%' }}>
                      <div className="ca-role-card-title-row">
                        <span className="ca-role-card-name">Leader</span>
                        <span className="ca-role-tier-badge ca-role-tier-reviewer">Reviewer Tier</span>
                        {roleChangeTarget.role === 'Manager' && (
                          <span style={{ fontSize: 11, color: 'var(--ca-text-muted)', marginLeft: 'auto' }}>
                            (Current Selection)
                          </span>
                        )}
                      </div>
                      <p className="ca-role-card-desc">
                        Supervises campaign proposals with human-in-the-loop review, edit, and signoff authority (FR04).
                      </p>
                      <div className="ca-role-card-footer-tags">
                        Signoff Authority • HITL Gatekeeper
                      </div>
                    </div>
                  </div>

                  {/* Member Option */}
                  <div
                    className={`ca-role-option-card ${selectedTargetRole === 'Member' ? 'selected' : ''}`}
                    onClick={() => setSelectedTargetRole('Member')}
                    role="radio"
                    aria-checked={selectedTargetRole === 'Member'}
                    tabIndex={0}
                  >
                    <div className="ca-radio-indicator" />
                    <div className="ca-role-card-text" style={{ width: '100%' }}>
                      <div className="ca-role-card-title-row">
                        <span className="ca-role-card-name">Employee</span>
                        <span className="ca-role-tier-badge ca-role-tier-standard">Standard Tier</span>
                        {roleChangeTarget.role === 'Member' && (
                          <span style={{ fontSize: 11, color: 'var(--ca-text-muted)', marginLeft: 'auto' }}>
                            (Current Role)
                          </span>
                        )}
                      </div>
                      <p className="ca-role-card-desc">
                        Campaign specialist executing creative workflows, drafting proposals (FR04), and generating variants.
                      </p>
                      <div className="ca-role-card-footer-tags">
                        Workflow Creator • Asset Synthesis
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Immediate Audit Notice */}
              <div className="ca-audit-enforce-notice">
                <span style={{ fontSize: 15 }}>ℹ</span>
                <span>
                  <strong>Immediate Audit Enforcement:</strong> Changes to member roles take effect immediately upon saving and are logged in the Workspace Audit Log.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="ca-modal-footer">
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                <SecondaryButton
                  onClick={() => setRoleChangeTarget(null)}
                  disabled={roleChangeBusy}
                >
                  Cancel
                </SecondaryButton>
                <PrimaryButton
                  onClick={handleSaveRoleChange}
                  disabled={roleChangeBusy || selectedTargetRole === roleChangeTarget.role}
                >
                  <IconSave size={14} style={{ marginRight: 6 }} />
                  {roleChangeBusy ? 'Saving Changes…' : 'Save Role Change'}
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 8. MODAL: CONFIRM MEMBER REMOVAL (Figma Exact) ────────────────── */}
      {removeTarget && (
        <div
          className="ca-modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setRemoveTarget(null)}
        >
          <div
            className="ca-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ca-remove-title"
          >
            {/* Header */}
            <div className="ca-modal-header">
              <div className="ca-modal-header-left">
                <div className="ca-modal-icon-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                  <IconUserMinus size={18} />
                </div>
                <div>
                  <h2 id="ca-remove-title" className="ca-modal-title">Confirm Member Removal</h2>
                </div>
              </div>
              <button
                type="button"
                className="ca-modal-close"
                onClick={() => setRemoveTarget(null)}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="ca-modal-body">
              {/* Member Card */}
              <div className="ca-member-preview-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="ca-member-preview-left">
                    <div className="ca-member-preview-avatar">
                      {removeTarget.avatarInitials || removeTarget.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="ca-member-preview-meta">
                      <span className="ca-member-preview-name">{removeTarget.name}</span>
                      <span className="ca-member-preview-email">{removeTarget.email}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className="ca-role-dot-pill ca-role-member">{removeTarget.role}</span>
                    <span className="ca-status-dot-pill ca-status-active">
                      <span className="ca-status-active-dot" />
                      Active
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    paddingTop: 10,
                    borderTop: '1px solid var(--ca-border-subtle)',
                    fontSize: 11.5,
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--ca-text-muted)', display: 'block', fontSize: 10, fontWeight: 700 }}>
                      SEAT ADDED
                    </span>
                    <span style={{ color: '#ffffff' }}>{removeTarget.joined || 'Oct 22, 2026'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ca-text-muted)', display: 'block', fontSize: 10, fontWeight: 700 }}>
                      DELEGATED AUTHORITY
                    </span>
                    <span style={{ color: '#ffffff' }}>
                      {removeTarget.delegatedAuthority || 'Campaign Assets, ML Pipelines'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Confirmation Prompt */}
              <div>
                <h4 style={{ color: '#ffffff', fontSize: 15, margin: '0 0 6px 0', fontWeight: 600 }}>
                  Are you sure you want to remove {removeTarget.name} from {workspace.name}?
                </h4>
                <p style={{ color: 'var(--ca-text-secondary)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                  This action will immediately revoke all access to this Workspace, campaign proposals, and creative assets. {removeTarget.name} can only regain access if invited again by a Marketing Manager.
                </p>
              </div>

              {/* Asset Protection Callout */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 14px',
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: 'var(--ca-radius-md)',
                  fontSize: 12,
                  color: '#a5f3fc',
                  lineHeight: 1.45,
                }}
              >
                <IconShieldCheck size={18} style={{ color: '#06b6d4', flexShrink: 0, marginTop: 1 }} />
                <span>
                  <strong>Asset Protection:</strong> Any existing proposals, node topologies, or generated campaign assets drafted by this member will be preserved intact within the Workspace.
                </span>
              </div>

              {/* Mandatory Confirmation Checkbox */}
              <label className="ca-danger-checkbox-wrap">
                <input
                  type="checkbox"
                  className="ca-danger-checkbox"
                  checked={removeConfirmed}
                  onChange={(e) => setRemoveConfirmed(e.target.checked)}
                />
                <span>
                  I understand that this action immediately terminates this user&apos;s active session and RBAC privileges across all instances.
                </span>
              </label>
            </div>

            {/* Footer */}
            <div className="ca-modal-footer">
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                <SecondaryButton
                  onClick={() => setRemoveTarget(null)}
                  disabled={removeBusy}
                >
                  Cancel
                </SecondaryButton>
                <button
                  type="button"
                  className="ca-btn-destructive"
                  disabled={!removeConfirmed || removeBusy}
                  onClick={handleConfirmRemoval}
                >
                  <IconUserMinus size={15} />
                  {removeBusy ? 'Removing…' : 'Remove Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 9. MODAL: LAST ADMIN PROTECTED (FR06) (Figma Exact) ──────────── */}
      {lastAdminTarget && (
        <div
          className="ca-modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setLastAdminTarget(null)}
        >
          <div
            className="ca-modal ca-modal-last-admin-guard"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ca-last-admin-title"
          >
            {/* Header */}
            <div className="ca-modal-header">
              <div className="ca-modal-header-left">
                <div className="ca-modal-icon-badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                  <IconLock size={18} />
                </div>
                <div>
                  <h2 id="ca-last-admin-title" className="ca-modal-title">Action Restricted: Last Marketing Manager</h2>
                  <div className="ca-protocol-sub-pill">
                    PROTOCOL ENFORCEMENT • SYSTEM RULE 0X489F
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="ca-modal-close"
                onClick={() => setLastAdminTarget(null)}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="ca-modal-body">
              {/* Target Member Card */}
              <div className="ca-member-preview-card">
                <div className="ca-member-preview-left">
                  <div className="ca-member-preview-avatar">
                    {lastAdminTarget.avatarInitials || lastAdminTarget.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="ca-member-preview-meta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="ca-member-preview-name">{lastAdminTarget.name}</span>
                      <span className="ca-role-tier-badge ca-role-tier-reviewer" style={{ fontSize: 9 }}>
                        Primary Marketing Manager
                      </span>
                      <span className="ca-role-tier-badge ca-role-tier-admin" style={{ fontSize: 9 }}>
                        You
                      </span>
                    </div>
                    <span className="ca-member-preview-email">{lastAdminTarget.email}</span>
                  </div>
                </div>
                <div className="ca-role-dot-pill ca-role-admin">
                  <IconLock size={11} style={{ marginRight: 2 }} />
                  Marketing Manager
                </div>
              </div>

              {/* Guardrail Explanation Card */}
              <div className="ca-guard-explanation-card">
                <div className="ca-guard-explanation-title">
                  <IconShieldAlert size={18} style={{ color: '#ef4444' }} />
                  <span>Cannot Remove or Demote the Final Marketing Manager</span>
                </div>
                <p className="ca-guard-explanation-body">
                  According to <strong>CastraVision Security Policy FR06</strong>, every enterprise workspace must retain at least one active Marketing Manager to prevent orphaned enterprise accounts, broken automated pipeline webhooks, and unmanaged access control.
                </p>
              </div>

              {/* Resolution Required Callout */}
              <div className="ca-guard-resolution-box">
                <strong style={{ color: '#ffffff' }}>ℹ Resolution Required</strong>
                <span>
                  To remove or demote this account, first promote another active member to the <strong>Marketing Manager</strong> role, or assign co-administrative privileges via your Okta/SAML directory.
                </span>
              </div>

              {/* Bottom Guardrail Banner */}
              <div className="ca-guard-bottom-strip">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
                  <span>SECURITY GUARDRAIL: ENFORCED BY PLATFORM ROUTER</span>
                </div>
                <span style={{ fontFamily: 'var(--ca-font-mono)' }}>Policy FR06-ORPHAN-DEFENSE</span>
              </div>
            </div>

            {/* Footer */}
            <div className="ca-modal-footer">
              <PrimaryButton
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setLastAdminTarget(null)}
              >
                <span>Understood, Return to Members</span>
                <IconArrowRight size={14} style={{ marginLeft: 6 }} />
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
