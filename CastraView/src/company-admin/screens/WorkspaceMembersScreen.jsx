import { useMemo, useState } from 'react'
import {
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  RoleBadge,
  StatusBadge,
  Pagination,
  NoticeBanner,
} from '../ui/Primitives'
import { INITIAL_MEMBERS, INITIAL_WORKSPACE } from '../mockData'

export default function WorkspaceMembersScreen({
  workspace = INITIAL_WORKSPACE,
  members = INITIAL_MEMBERS,
  onOpenInvite,
  onNavigate,
  notify,
}) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [page, setPage] = useState(1)
  const pageSize = 6

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase())
      const matchRole = roleFilter === 'All' || m.role === roleFilter
      const matchStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && m.status === 'active') ||
        (statusFilter === 'Pending' && m.status === 'pending')

      return matchSearch && matchRole && matchStatus
    })
  }, [members, search, roleFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize))
  const paginatedMembers = filteredMembers.slice((page - 1) * pageSize, page * pageSize)

  function handleExportDirectory() {
    const csvContent =
      'Name,Email,Role,Status,Joined,Permissions\n' +
      members
        .map((m) => `"${m.name}","${m.email}","${m.role}","${m.status}","${m.joined}","${m.permissionsSummary}"`)
        .join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `workspace_members_${workspace.id}.csv`
    link.click()
    URL.revokeObjectURL(url)
    notify?.('Member directory exported successfully.')
  }

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        badge="FR06 RBAC Engine · Security Layer v2.4"
        title="Workspace Members & Access Control"
        subtitle="Manage workspace members, assign RBAC privileges (Admin, Manager, Member), and govern workspace access."
        actions={
          <>
            <div className="ca-search-input-wrap" style={{ width: 260 }}>
              <span className="ca-search-icon" aria-hidden="true">⌕</span>
              <input
                type="search"
                className="ca-search-input"
                placeholder="Search member, email, role..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <PrimaryButton onClick={onOpenInvite} icon="👥">
              Invite Member
            </PrimaryButton>
          </>
        }
      />

      {/* Workspace Summary & Last Admin Protection Notice */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* Workspace Summary Card */}
        <div
          style={{
            background: 'var(--ca-surface)',
            border: '1px solid var(--ca-border)',
            borderRadius: 'var(--ca-radius-lg)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18, color: '#a5b4fc' }}>🏢</span>
            <strong style={{ fontSize: 16, color: '#ffffff' }}>{workspace.name}</strong>
            <span className="ca-ent-badge">Enterprise</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ca-text-secondary)' }}>
            <strong>{workspace.totalMembers} Total Members</strong> ·{' '}
            <span style={{ color: '#c7d2fe' }}>{workspace.adminCount} Admins</span> ·{' '}
            <span style={{ color: '#67e8f9' }}>{workspace.managerCount} Managers</span> ·{' '}
            <span style={{ color: '#cbd5e1' }}>{workspace.memberCount} Members</span>
          </div>
        </div>

        {/* Protection Notice */}
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.28)',
            borderRadius: 'var(--ca-radius-lg)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            color: '#fca5a5',
            fontSize: 12.5,
          }}
        >
          <span style={{ fontSize: 22, color: '#ef4444' }}>🛡</span>
          <div>
            <strong style={{ color: '#ffffff' }}>Policy Notice:</strong> Removing the last Admin from a workspace is strictly restricted by security policy FR06.
          </div>
        </div>
      </div>

      {/* Active Member Directory Table Card */}
      <div className="ca-table-wrap">
        {/* Table Filter Bar */}
        <div
          style={{
            padding: '14px 20px',
            background: 'var(--ca-bg-alt)',
            borderBottom: '1px solid var(--ca-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <strong style={{ fontSize: 14, color: '#ffffff' }}>Active Member Directory</strong>
            <span className="ca-badge ca-badge-member">
              Showing {paginatedMembers.length} of {filteredMembers.length}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setPage(1)
              }}
              style={{
                height: 32,
                padding: '0 10px',
                background: 'var(--ca-surface)',
                border: '1px solid var(--ca-border)',
                borderRadius: 'var(--ca-radius-md)',
                color: 'var(--ca-text)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <option value="All">Role: All</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Member">Member</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              style={{
                height: 32,
                padding: '0 10px',
                background: 'var(--ca-surface)',
                border: '1px solid var(--ca-border)',
                borderRadius: 'var(--ca-radius-md)',
                color: 'var(--ca-text)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <option value="All">Status: All</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Directory Table */}
        <table className="ca-table">
          <thead>
            <tr>
              <th>Member Name & Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined / Last Active</th>
              <th>Applicable Permissions Summary</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMembers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 48, color: 'var(--ca-text-muted)' }}>
                  No members match your criteria.
                </td>
              </tr>
            ) : (
              paginatedMembers.map((m) => (
                <tr key={m.id || m.email}>
                  <td>
                    <div className="ca-table-user-cell">
                      <div className="ca-cell-avatar">
                        {m.avatarInitials || m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="ca-cell-user-info">
                        <div className="ca-cell-name-row">
                          <span className="ca-cell-name">{m.name}</span>
                          {m.isYou && <span className="ca-you-pill">You</span>}
                        </div>
                        <span className="ca-cell-subtext">{m.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <RoleBadge role={m.role} />
                  </td>
                  <td>
                    <StatusBadge
                      status={m.status === 'active' ? 'active' : 'invited'}
                      label={m.status === 'active' ? 'Active' : 'Invited (Pending Registration)'}
                    />
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#ffffff', fontSize: 12 }}>{m.joined}</span>
                      <span style={{ color: 'var(--ca-text-muted)', fontSize: 11 }}>{m.lastActive}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: 'var(--ca-text-secondary)' }}>
                      {m.permissionsSummary}
                    </span>
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
          label={`Displaying records 1 through ${paginatedMembers.length} of ${filteredMembers.length}`}
        />
      </div>

      {/* Bottom Security Policy Banner */}
      <div style={{ marginTop: 24 }}>
        <NoticeBanner
          type="danger"
          icon="🔒"
          title="Security Policy Rule"
          description="Member role does not have access to the Approval screen (FR04). Only Admin and Manager roles are permitted to review and approve proposals."
          action={
            <div style={{ display: 'flex', gap: 10 }}>
              <SecondaryButton onClick={handleExportDirectory} icon="📥">
                Export Member Directory
              </SecondaryButton>
              <SecondaryButton onClick={() => onNavigate('roles')} icon="▦">
                Role Permissions Matrix
              </SecondaryButton>
            </div>
          }
        />
      </div>
    </div>
  )
}
