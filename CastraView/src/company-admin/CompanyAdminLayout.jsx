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
import {
  canAccessFR04ApprovalQueue,
  canAccessFR11AuditLog,
  resolveWorkspaceRole,
} from '../auth/permissions'

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
  const [proposals, setProposals] = useState(INITIAL_PROPOSALS)
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

  async function handleInviteMember({ email: _email, role: _role } = {}) {
    // Phase 4.1: Strictly prevent creating fake member records or claiming email delivery
    // when no authoritative backend invitation endpoint exists.
    notify?.('Invitations are not available yet. Email delivery has not been configured.', 'warning')
    return {
      success: false,
      error: 'Invitations are not available yet. Email delivery has not been configured.',
    }
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
  const canViewAudit = canAccessFR11AuditLog(user, profile)

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
        canViewAudit={canViewAudit}
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
            <RoleManagementScreen
              members={members}
              workspace={workspace}
              onNavigate={handleNavigate}
              notify={notify}
            />
          )}

          {/* Screen 7: Proposal Approval Queue (FR04 Gated) */}
          {page === 'approvals' && (
            <ApprovalQueueScreen
              user={user}
              workspaceRole={activeWorkspaceRole}
              onNavigate={handleNavigate}
              notify={notify}
              proposals={proposals}
              setProposals={setProposals}
            />
          )}

          {/* Screen 2 & 3: Audit Log and Details */}
          {page === 'audit' && !selectedAuditRecord && (
            <AuditLogScreen
              auditLogs={auditLogs}
              onSelectRecord={(rec) => setSelectedAuditRecord(rec)}
              notify={notify}
              user={user}
              workspaceRole={activeWorkspaceRole}
              workspace={workspace}
            />
          )}

          {page === 'audit' && selectedAuditRecord && (
            <AuditLogDetailsScreen
              record={selectedAuditRecord}
              onBack={() => setSelectedAuditRecord(null)}
              notify={notify}
              user={user}
              workspaceRole={activeWorkspaceRole}
              workspace={workspace}
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
