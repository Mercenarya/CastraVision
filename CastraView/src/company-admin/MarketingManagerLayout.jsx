/**
 * MarketingManagerLayout.jsx — Universal Shared Layout for Marketing Manager
 * Integrates the standardized Sidebar, Header, and views matching approved Figma designs.
 */

import { useState, useEffect, useCallback } from 'react'
import LiveManagerDashboard from './screens/LiveManagerDashboard'
import LiveAuditLog from './screens/LiveAuditLog'
import ManagerSearch from './ManagerSearch'
import { managerSummary } from '../services/marketingManager'
import { useManagerQuery } from '../hooks/useManagerQuery'
import WorkflowPerformance from '../leader/screens/WorkflowPerformance'
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
  const [searchSelection, setSearchSelection] = useState(null)
  const [summaryRevision, setSummaryRevision] = useState(0)
  useEffect(() => {
    const update = () => setSummaryRevision(value => value + 1)
    window.addEventListener('castra:workflow-changed', update)
    return () => window.removeEventListener('castra:workflow-changed', update)
  }, [])
  const liveWorkspaceId = membership?.workspaceId
  const isLive = /^[0-9a-f-]{36}$/i.test(liveWorkspaceId || '')
  const summaryLoad = useCallback(signal => isLive ? managerSummary(liveWorkspaceId, signal) : Promise.resolve(null), [isLive, liveWorkspaceId])
  const summary = useManagerQuery(`${membership?.workspaceId}:${page}:${summaryRevision}`, summaryLoad)
  const liveName = isLive ? membership.workspaceName : workspace.name
  const pendingCount = isLive ? (summary.data?.pending ?? '—') : proposals.filter(p => p.status === 'pending' || p.status === 'edited').length

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
  const activeKey =
    page === 'admin'
      ? 'overview'
      : page === 'budget-review'
        ? 'budget'
        : page

  function handleNavigate(targetPage) {
    setSearchSelection(null)
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
    'budget-review': 'Budget Recommendation Review',
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
    <div className="flex h-screen overflow-hidden bg-[#0f131d] text-[#dfe2f1] font-sans antialiased">
      {/* ── UNIFIED SIDEBAR (Shared across all Marketing Manager screens) ── */}
      <MarketingManagerSidebar
        activeKey={selectedAuditRecord && page === 'audit' ? 'audit' : activeKey}
        onNavigate={(target) => {
          setSelectedAuditRecord(null)
          handleNavigate(target)
        }}
        pendingApprovalsCount={pendingCount}
        workspaceName={liveName}
        planName={isLive ? membership.workspaceId : workspace.tierShort}
        canApprove={canApprove}
        canViewAudit={canViewAudit}
      />

      {/* ── MOBILE DRAWER NAVIGATION ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng di động"
        >
          <div onClick={(e) => e.stopPropagation()} className="h-full">
            <MarketingManagerSidebar
              activeKey={selectedAuditRecord && page === 'audit' ? 'audit' : activeKey}
              onNavigate={(target) => {
                setSelectedAuditRecord(null)
                handleNavigate(target)
                setMobileMenuOpen(false)
              }}
              pendingApprovalsCount={pendingCount}
              workspaceName={liveName}
              planName={isLive ? membership.workspaceId : workspace.tierShort}
              canApprove={canApprove}
              canViewAudit={canViewAudit}
              isDrawer
              onClose={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT WRAPPER ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#0f131d]">
        {/* ── UNIFIED HEADER (Shared across all Marketing Manager screens) ── */}
        <MarketingManagerHeader
          workspaceName={liveName}
          onNavigate={handleNavigate}
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

        {/* ── PAGE CONTENT CANVAS ── */}
        <main className="flex-1 bg-[#0f131d] overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-6">
          <div className="max-w-7xl mx-auto space-y-6 w-full">
            {isLive && <ManagerSearch key={membership.workspaceId} query={headerSearch} workspaceId={membership.workspaceId} onSelect={item => { setSearchSelection(item); setHeaderSearch('') }} />}
            {searchSelection && (searchSelection.type === 'proposal' ? <WorkflowInbox key={searchSelection.id} initialId={searchSelection.id} /> : <WorkflowPerformance key={searchSelection.id} initialCampaign={searchSelection.id} onCreated={id => setSearchSelection({ type: 'proposal', id })} />)}
            {!searchSelection && <>
            {/* Screen 1: Marketing Manager Console Dashboard / Overview */}
            {!searchSelection && (page === 'overview' || page === 'admin') && (isLive ? <LiveManagerDashboard query={summary} membership={membership} user={user} onNavigate={handleNavigate} onInvite={handleOpenInvite} /> : (
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
            ))}

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
            {page === 'audit' && isLive && <LiveAuditLog key={membership.workspaceId} workspaceId={membership.workspaceId} />}
            {page === 'audit' && !isLive && !selectedAuditRecord && (
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

            {/* Pass-through for existing workspace screens (Import, Content, Settings/Profile, Budget, Reports, Insights) */}
            {!['overview', 'admin', 'members', 'roles', 'approvals', 'audit'].includes(page) && (
              children
            )}
            </>}
          </div>
        </main>
      </div>


      {/* ── REUSABLE INVITE MEMBER MODAL ── */}
    </div>
  )
}
