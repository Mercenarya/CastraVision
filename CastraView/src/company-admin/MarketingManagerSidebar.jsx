/**
 * MarketingManagerSidebar.jsx — Unified shared sidebar for CastraVision Marketing Manager
 * Matches the approved Figma design system across all screens.
 */

import {
  BrandLogo,
  IconOverview,
  IconMembers,
  IconRoles,
  IconAudit,
  IconApprovals,
  IconImport,
  IconContent,
  IconSettings,
  IconBuilding,
  IconChevronsUpDown,
  IconLock,
  IconTrendingUp,
  IconBarChart,
  IconSparkles,
} from './ui/Icons'

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview / Dashboard', Icon: IconOverview },
  { key: 'members', label: 'Workspace Members', Icon: IconMembers },
  { key: 'roles', label: 'Role Management', Icon: IconRoles },
  { key: 'approvals', label: 'Approvals', Icon: IconApprovals, hasBadge: true },
  { key: 'audit', label: 'Audit Log', Icon: IconAudit },
  { key: 'budget', label: 'Budget & ROAS', Icon: IconTrendingUp, hasAiBadge: true },
  { key: 'reports', label: 'Reports', Icon: IconBarChart, hasAiBadge: true },
  { key: 'insights', label: 'Competitor Insights', Icon: IconSparkles, hasAiBadge: true },
  { key: 'import', label: 'Campaign Import', Icon: IconImport },
  { key: 'content', label: 'Content Studio', Icon: IconContent },
  { key: 'profile', label: 'Settings', Icon: IconSettings },
]

export default function MarketingManagerSidebar({
  activeKey = 'overview',
  onNavigate,
  pendingApprovalsCount = 3,
  workspaceName = 'Acme Corp',
  planName = 'Enterprise Workspace',
  canApprove = true,
  canViewAudit = true,
}) {
  return (
    <aside className="ca-sidebar" aria-label="Marketing Manager Navigation">
      {/* Top Logo & Admin Badge */}
      <div className="ca-sidebar-top">
        <div className="ca-brand" role="button" tabIndex={0} onClick={() => onNavigate('overview')} onKeyDown={(e) => e.key === 'Enter' && onNavigate('overview')}>
          <span className="ca-brand-glyph" aria-hidden="true">
            <BrandLogo size={22} />
          </span>
          <span className="ca-brand-text">CastraVision</span>
        </div>
        <span className="ca-admin-badge" title="Marketing Manager Context">MARKETING MANAGER</span>
      </div>

      {/* Navigation List */}
      <div className="ca-sidebar-nav-wrap">
        <div className="ca-nav-section-label">NAVIGATION</div>
        <ul className="ca-nav-list">
          {NAV_ITEMS.map((item) => {
            const isApprovals = item.key === 'approvals'
            const isAudit = item.key === 'audit'
            const isLocked = (isApprovals && !canApprove) || (isAudit && !canViewAudit)
            const Icon = isLocked ? IconLock : item.Icon
            const isActive =
              activeKey === item.key ||
              (item.key === 'overview' && activeKey === 'admin') ||
              (item.key === 'audit' && activeKey === 'audit-details')
            return (
              <li key={item.key}>
                <button
                  type="button"
                  className={`ca-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => onNavigate(item.key)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="ca-nav-icon" aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <span className="ca-nav-label">{item.label}</span>
                  {isApprovals && isLocked && (
                    <span className="ca-nav-badge-locked" title="Restricted by FR04 Governance">
                      Locked
                    </span>
                  )}
                  {isAudit && isLocked && (
                    <span className="ca-nav-badge-locked" title="Marketing Manager only by FR11 Governance">
                      Locked
                    </span>
                  )}
                  {item.hasAiBadge && (
                    <span className="ca-nav-badge-ai" title="AI Powered Module">
                      AI
                    </span>
                  )}
                  {isApprovals && !isLocked && pendingApprovalsCount > 0 && (
                    <span
                      className="ca-nav-badge"
                      title={`${pendingApprovalsCount} pending approvals`}
                    >
                      {pendingApprovalsCount}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Bottom Workspace Selector */}
      <div className="ca-sidebar-bottom">
        <div
          className="ca-workspace-selector"
          role="button"
          tabIndex={0}
          title="Active Company Workspace"
          onClick={() => onNavigate('overview')}
          onKeyDown={(e) => e.key === 'Enter' && onNavigate('overview')}
        >
          <div className="ca-ws-icon" aria-hidden="true">
            <IconBuilding size={16} />
          </div>
          <div className="ca-ws-info">
            <span className="ca-ws-name">{workspaceName}</span>
            <span className="ca-ws-plan">{planName}</span>
          </div>
          <span className="ca-ws-caret" aria-hidden="true">
            <IconChevronsUpDown size={15} />
          </span>
        </div>
      </div>
    </aside>
  )
}
