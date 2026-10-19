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

  return (
    <div className="ca-shell">
      {/* ── UNIFIED SIDEBAR (Shared across all 7 screens) ── */}
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
      />

      {/* ── MAIN CONTENT WRAPPER ── */}
      <div className="ca-main-wrap">
        {/* ── UNIFIED HEADER (Shared across all 7 screens) ── */}
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
              notify={notify}
            />
          )}

          {/* Screen 5: Role Management & RBAC */}
          {page === 'roles' && (
            <RoleManagementScreen notify={notify} />
          )}

          {/* Screen 7: Proposal Approval Queue */}
          {page === 'approvals' && (
            <ApprovalQueueScreen notify={notify} />
          )}

          {/* Screen 2 & 3: Audit Log and Details */}
          {page === 'audit' && !selectedAuditRecord && (
            <AuditLogScreen
              auditLogs={auditLogs}
              onSelectRecord={(rec) => setSelectedAuditRecord(rec)}
              notify={notify}
            />
          )}

          {page === 'audit' && selectedAuditRecord && (
            <AuditLogDetailsScreen
              record={selectedAuditRecord}
              onBack={() => setSelectedAuditRecord(null)}
              notify={notify}
            />
          )}

          {/* Pass-through for existing workspace screens (Import, Content, Settings/Profile, Workgroups) */}
          {!['overview', 'admin', 'members', 'roles', 'approvals', 'audit'].includes(page) && (
            <div style={{ padding: '8px 0' }}>{children}</div>
          )}
        </main>
      </div>

      {/* ── REUSABLE INVITE MEMBER MODAL (Screen 4) ── */}
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
