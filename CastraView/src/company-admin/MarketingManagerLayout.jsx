/**
 * MarketingManagerLayout.jsx — Universal Shared Layout for Marketing Manager
 * Integrates the standardized Sidebar, Header, and views matching approved Figma designs.
 */

import { useState, useEffect } from 'react'
import './company-admin.css'
import MarketingManagerSidebar from './MarketingManagerSidebar'
import MarketingManagerHeader from './MarketingManagerHeader'
import MarketingManagerDashboardScreen from './screens/MarketingManagerDashboardScreen'
import PersonnelPage from '../pages/membership/PersonnelPage'
import { membershipService } from '../services/membership'
import MembershipNotifications from '../pages/membership/MembershipNotifications'
import RoleManagementScreen from './screens/RoleManagementScreen'
import WorkflowInbox from '../leader/WorkflowInbox'
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

export default function MarketingManagerLayout({
  user,
  membership = null,
  profile,
  page = 'overview',
  setPage,
  onSignOut,
  notify,
  personnelService = membershipService,
  onSelectWorkspace,
  children,
}) {
  const [workspace] = useState(() => ({
    ...INITIAL_WORKSPACE,
    name: profile?.business_name || INITIAL_WORKSPACE.name,
    fullName: profile?.business_name
      ? `${profile.business_name} Holdings Inc.`
      : INITIAL_WORKSPACE.fullName,
  }))

  const [members] = useState(INITIAL_MEMBERS)
  const [proposals] = useState(INITIAL_PROPOSALS)
  const [auditLogs] = useState(INITIAL_AUDIT_LOGS)
  const [selectedAuditRecord, setSelectedAuditRecord] = useState(null)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [notificationTarget, setNotificationTarget] = useState(null)
  const [headerSearch, setHeaderSearch] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Manage drawer keyboard accessibility (Escape) and prevent background scrolling
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileMenuOpen])

  // Map internal page keys
  const activeKey = page === 'admin' ? 'overview' : page

  function handleNavigate(targetPage) {
    if (setPage) {
      setPage(targetPage)
    }
  }

  function handleOpenInvite() {
    handleNavigate('members')
    setInviteModalOpen(true)
  }

  const pageTitleMap = {
    overview: 'Cross-Channel Campaign Overview',
    admin: 'Marketing Manager Console',
    members: 'Workspace Members & Access Control',
    roles: 'Role Management & RBAC Permissions',
    audit: 'System Audit Log',
    'audit-details': 'Audit Log Record Details',
    approvals: 'Proposal Approval Queue',
    budget: 'Budget Optimization & ROAS',
    reports: 'Omnichannel Performance Reports',
    insights: 'Competitor Intelligence & Insights',
    import: 'Campaign Data Import',
    content: 'Content Studio',
    profile: 'Business Profile & Settings',
  }

  const currentTitle =
    page === 'audit' && selectedAuditRecord
      ? 'Audit Log Record Details'
      : pageTitleMap[page] || 'Marketing Manager Console'

  const activeWorkspaceRole = resolveWorkspaceRole(user, membership)
  const canApprove = canAccessFR04ApprovalQueue(user, membership)
  const canViewAudit = canAccessFR11AuditLog(user, membership)

  return (
    <div className="ca-shell">
      {/* ── UNIFIED SIDEBAR (Shared across all Marketing Manager screens) ── */}
      <MarketingManagerSidebar
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

      {/* ── MOBILE DRAWER NAVIGATION ── */}
      {mobileMenuOpen && (
        <div
          className="ca-drawer-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng di động"
        >
          <div onClick={(e) => e.stopPropagation()}>
            <MarketingManagerSidebar
              activeKey={selectedAuditRecord && page === 'audit' ? 'audit' : activeKey}
              onNavigate={(target) => {
                setSelectedAuditRecord(null)
                handleNavigate(target)
                setMobileMenuOpen(false)
              }}
              pendingApprovalsCount={
                proposals.filter((p) => p.status === 'pending' || p.status === 'edited').length
              }
              workspaceName={workspace.name}
              planName={workspace.tierShort}
              canApprove={canApprove}
              canViewAudit={canViewAudit}
              isDrawer
              onClose={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT WRAPPER ── */}
      <div className="ca-main-wrap">
        {/* ── UNIFIED HEADER (Shared across all Marketing Manager screens) ── */}
        <MarketingManagerHeader
          workspaceName={workspace.name}
          currentPageTitle={currentTitle}
          searchValue={headerSearch}
          onSearchChange={setHeaderSearch}
          user={user}
          onSignOut={onSignOut}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          notifications={<MembershipNotifications userId={user?.id} service={personnelService} onOpenResource={async item => {
            window.history.replaceState({}, '', window.location.pathname + window.location.search + '#personnel-requests')
            if (item.workspaceId !== membership?.workspaceId) onSelectWorkspace?.(item.workspaceId)
            setNotificationTarget(item.requestId || item.invitationId || 'requests')
            handleNavigate('members')
          }} />}
        />

        {/* ── PAGE CONTENT ── */}
        <main className="ca-content">
          {/* Screen 1: Marketing Manager Console Dashboard / Overview */}
          {(page === 'overview' || page === 'admin') && (
            (children && (!Array.isArray(children) || children.some(Boolean)))
              ? children
              : (
                <MarketingManagerDashboardScreen
                  workspace={workspace}
                  proposals={proposals}
                  auditLogs={auditLogs}
                  onNavigate={handleNavigate}
                  onOpenInvite={handleOpenInvite}
                  notify={notify}
                />
              )
          )}

          {/* Screen 6: Workspace Members & Access Control */}
          {page === 'members' && (
            <PersonnelPage
              key={`${membership?.workspaceId}:${notificationTarget || ''}`}
              initialTab={notificationTarget || window.location.hash === '#personnel-requests' ? 'requests' : 'members'}
              initialSearch={notificationTarget && notificationTarget !== 'requests' ? notificationTarget : ''}
              workspaceId={membership?.workspaceId}
              userId={user?.id}
              service={personnelService}
              openInvite={inviteModalOpen}
              onInviteClose={() => setInviteModalOpen(false)}
              notify={notify}
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
            <WorkflowInbox />
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
    </div>
  )
}
