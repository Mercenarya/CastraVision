/**
 * CompanyAdminLayout.jsx — Universal Shared Layout for Workspace Admin
 * Integrates the standardized Sidebar, Header, and views matching approved Figma designs.
 */

import { useState } from 'react'
import './company-admin.css'
import CompanyAdminSidebar from './CompanyAdminSidebar'
import CompanyAdminHeader from './CompanyAdminHeader'
import InviteMemberModal from './screens/InviteMemberModal'
import AdminDashboardScreen from './screens/AdminDashboardScreen'
import WorkspaceMembersScreen from './screens/WorkspaceMembersScreen'
import RoleManagementScreen from './screens/RoleManagementScreen'
import ApprovalQueueScreen from './screens/ApprovalQueueScreen'
import AuditLogScreen from './screens/AuditLogScreen'
import AuditLogDetailsScreen from './screens/AuditLogDetailsScreen'
import {
  INITIAL_WORKSPACE,
  INITIAL_MEMBERS,
  INITIAL_PROPOSALS,
  INITIAL_AUDIT_LOGS,
} from './mockData'
<<<<<<< HEAD
import { canAccessFR04ApprovalQueue, resolveWorkspaceRole } from '../auth/permissions'
=======
import {
  canAccessFR04ApprovalQueue,
  canAccessFR11AuditLog,
  resolveWorkspaceRole,
} from '../auth/permissions'
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232

export default function CompanyAdminLayout({
  user,
  profile,
  page = 'overview',
  setPage,
  onSignOut,
  notify,
  children,
}) {
  const [workspace] = useState(() => ({
    ...INITIAL_WORKSPACE,
    name: profile?.business_name || INITIAL_WORKSPACE.name,
    fullName: profile?.business_name
      ? `${profile.business_name} Holdings Inc.`
      : INITIAL_WORKSPACE.fullName,
  }))

  const [members, setMembers] = useState(INITIAL_MEMBERS)
<<<<<<< HEAD
  const [proposals] = useState(INITIAL_PROPOSALS)
=======
  const [proposals, setProposals] = useState(INITIAL_PROPOSALS)
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232
  const [auditLogs] = useState(INITIAL_AUDIT_LOGS)
  const [selectedAuditRecord, setSelectedAuditRecord] = useState(null)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [headerSearch, setHeaderSearch] = useState('')

  // Map internal page keys
  const activeKey = page === 'admin' ? 'overview' : page

  function handleNavigate(targetPage) {
    if (setPage) {
      setPage(targetPage)
    }
  }

  function handleOpenInvite() {
    setInviteModalOpen(true)
  }

<<<<<<< HEAD
  function handleInviteMember({ email, role }) {
    const newMember = {
      id: `mem-${Date.now()}`,
      name: email.split('@')[0].replace(/[._]/g, ' '),
      email,
      role,
      status: 'pending',
      joined: 'Just now',
      lastActive: 'Invite Sent',
      permissionsSummary:
        role === 'Admin'
          ? 'Full access, RBAC, Approvals, Billing & Audit'
          : role === 'Manager'
          ? 'FR04 Proposal Approval, Edit Proposals, Strategy'
          : 'Strategy & Content Creation, Data Import',
      avatarInitials: email.slice(0, 2).toUpperCase(),
    }
    setMembers((prev) => [newMember, ...prev])
    notify?.(`Invitation dispatched to ${email} as ${role}.`)
=======
  async function handleInviteMember({ email: _email, role: _role } = {}) {
    // Phase 4.1: Strictly prevent creating fake member records or claiming email delivery
    // when no authoritative backend invitation endpoint exists.
    notify?.('Invitations are not available yet. Email delivery has not been configured.', 'warning')
    return {
      success: false,
      error: 'Invitations are not available yet. Email delivery has not been configured.',
    }
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232
  }

  function handleUpdateMemberRole(memberId, newRole) {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          return {
            ...m,
            role: newRole,
            permissionsSummary:
              newRole === 'Admin'
                ? 'Full access, RBAC, Approvals, Billing & Audit'
                : newRole === 'Manager'
                ? 'FR04 Proposal Approval, Edit Proposals, Strategy'
                : 'FR02 Strategy & FR03 Content Creation, Data Import',
          }
        }
        return m
      })
    )
  }

  function handleRemoveMember(memberId) {
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
  }

  const pageTitleMap = {
    overview: 'Admin Console',
    admin: 'Admin Console',
    members: 'Workspace Members & Access Control',
    roles: 'Role Management & RBAC Permissions',
    audit: 'System Audit Log',
    'audit-details': 'Audit Log Record Details',
    approvals: 'Proposal Approval Queue',
    import: 'Campaign Data Import',
    content: 'Content Studio',
    profile: 'Business Profile & Settings',
  }

  const currentTitle =
    page === 'audit' && selectedAuditRecord
      ? 'Audit Log Record Details'
      : pageTitleMap[page] || 'Admin Console'

  const activeWorkspaceRole = resolveWorkspaceRole(user, profile)
  const canApprove = canAccessFR04ApprovalQueue(user, profile)
<<<<<<< HEAD
=======
  const canViewAudit = canAccessFR11AuditLog(user, profile)
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232

  return (
    <div className="ca-shell">
      {/* ── UNIFIED SIDEBAR (Shared across all Workspace Admin screens) ── */}
      <CompanyAdminSidebar
        activeKey={selectedAuditRecord && page === 'audit' ? 'audit' : activeKey}
        onNavigate={(target) => {
          setSelectedAuditRecord(null)
          handleNavigate(target)
        }}
        pendingApprovalsCount={
          proposals.filter((p) => p.status === 'pending' || p.status === 'edited').length
        }
        workspaceName={workspace.name}
        planName={workspace.tierShort}
        canApprove={canApprove}
<<<<<<< HEAD
=======
        canViewAudit={canViewAudit}
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232
      />

      {/* ── MAIN CONTENT WRAPPER ── */}
      <div className="ca-main-wrap">
        {/* ── UNIFIED HEADER (Shared across all Workspace Admin screens) ── */}
        <CompanyAdminHeader
          workspaceName={workspace.name}
          currentPageTitle={currentTitle}
          searchValue={headerSearch}
          onSearchChange={setHeaderSearch}
          user={user}
          onSignOut={onSignOut}
        />

        {/* ── PAGE CONTENT ── */}
        <main className="ca-content">
          {/* Screen 1: Admin Console Dashboard */}
          {(page === 'overview' || page === 'admin') && (
            <AdminDashboardScreen
              workspace={workspace}
              proposals={proposals}
              auditLogs={auditLogs}
              onNavigate={handleNavigate}
              onOpenInvite={handleOpenInvite}
              notify={notify}
            />
          )}

          {/* Screen 6: Workspace Members & Access Control */}
          {page === 'members' && (
            <WorkspaceMembersScreen
              workspace={workspace}
              members={members}
              onOpenInvite={handleOpenInvite}
              onNavigate={handleNavigate}
              onUpdateMemberRole={handleUpdateMemberRole}
              onRemoveMember={handleRemoveMember}
              notify={notify}
              currentUser={user}
            />
          )}

          {/* Screen 5: Role Management & RBAC */}
          {page === 'roles' && (
<<<<<<< HEAD
            <RoleManagementScreen notify={notify} />
=======
            <RoleManagementScreen
              members={members}
              workspace={workspace}
              onNavigate={handleNavigate}
              notify={notify}
            />
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232
          )}

          {/* Screen 7: Proposal Approval Queue (FR04 Gated) */}
          {page === 'approvals' && (
<<<<<<< HEAD
            canApprove ? (
              <ApprovalQueueScreen
                user={user}
                workspaceRole={activeWorkspaceRole}
                notify={notify}
              />
            ) : (
              <div className="ca-card" style={{ padding: '48px 32px', textAlign: 'center', margin: '24px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🛡️</div>
                <h2 style={{ color: '#ffffff', fontSize: 18, marginBottom: 8 }}>Access Denied (FR04 · RBAC)</h2>
                <p style={{ color: 'var(--ca-text-secondary)', maxWidth: 520, margin: '0 auto 20px', fontSize: 14 }}>
                  The Proposal Approval Queue is strictly restricted to Workspace Admins and Workspace Managers. Members do not have authorization to view, edit, approve, or reject proposals.
                </p>
                <button
                  type="button"
                  className="ca-btn ca-btn-secondary"
                  onClick={() => handleNavigate('overview')}
                >
                  Return to Overview
                </button>
              </div>
            )
=======
            <ApprovalQueueScreen
              user={user}
              workspaceRole={activeWorkspaceRole}
              onNavigate={handleNavigate}
              notify={notify}
              proposals={proposals}
              setProposals={setProposals}
            />
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232
          )}

          {/* Screen 2 & 3: Audit Log and Details */}
          {page === 'audit' && !selectedAuditRecord && (
            <AuditLogScreen
              auditLogs={auditLogs}
              onSelectRecord={(rec) => setSelectedAuditRecord(rec)}
              notify={notify}
<<<<<<< HEAD
=======
              user={user}
              workspaceRole={activeWorkspaceRole}
              workspace={workspace}
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232
            />
          )}

          {page === 'audit' && selectedAuditRecord && (
            <AuditLogDetailsScreen
              record={selectedAuditRecord}
              onBack={() => setSelectedAuditRecord(null)}
              notify={notify}
<<<<<<< HEAD
=======
              user={user}
              workspaceRole={activeWorkspaceRole}
              workspace={workspace}
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232
            />
          )}

          {/* Pass-through for existing workspace screens (Import, Content, Settings/Profile, Workgroups) */}
          {!['overview', 'admin', 'members', 'roles', 'approvals', 'audit'].includes(page) && (
            <div style={{ padding: '8px 0' }}>{children}</div>
          )}
        </main>
      </div>

      {/* ── REUSABLE INVITE MEMBER MODAL ── */}
      <InviteMemberModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvite={handleInviteMember}
        existingMembers={members}
        workspaceName={workspace.name}
      />
    </div>
  )
}
