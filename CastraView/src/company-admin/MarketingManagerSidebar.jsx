/**
 * MarketingManagerSidebar.jsx — Unified shared sidebar for CastraVision Marketing Manager
 * Matches the approved Figma design system across all screens.
 */

import {
  IconOverview,
  IconMembers,
  IconRoles,
  IconAudit,
  IconApprovals,
  IconImport,
  IconContent,
  IconSettings,
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
  planName = 'acme-corp-prod-01',
  canApprove = true,
  canViewAudit = true,
  isDrawer = false,
  onClose,
}) {
  return (
    <aside
      className={`w-[260px] flex-shrink-0 bg-[#171b26] border-r border-[#464554] flex flex-col h-full z-30 select-none ${
        isDrawer ? 'shadow-2xl' : ''
      }`}
      aria-label="Marketing Manager Navigation"
    >
      {/* Top Logo Area */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-[#464554] flex-shrink-0 gap-3">
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          role="button"
          tabIndex={0}
          onClick={() => {
            onNavigate('overview')
            if (isDrawer && onClose) onClose()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onNavigate('overview')
              if (isDrawer && onClose) onClose()
            }
          }}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6366f1] via-[#8083ff] to-[#a5b4fc] flex items-center justify-center shadow-lg shadow-[#8083ff]/20 flex-shrink-0">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold tracking-tight text-[#dfe2f1] leading-none">
              CastraVision
            </span>
            <span className="text-[9px] font-mono tracking-wider text-[#a078ff] font-semibold mt-1">
              SME AI ENGINE
            </span>
          </div>
        </div>

        {isDrawer && (
          <button
            type="button"
            className="text-[#c7c4d7] hover:text-[#dfe2f1] p-1 rounded-md text-base leading-none"
            onClick={onClose}
            aria-label="Đóng menu điều hướng"
          >
            ✕
          </button>
        )}
      </div>

      {/* Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-4 px-3 space-y-6">
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold tracking-wider text-[#c7c4d7] uppercase">
              Workspace Navigation
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#262a35] text-[#a078ff] font-mono font-semibold">
              MANAGER
            </span>
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isApprovals = item.key === 'approvals'
              const isAudit = item.key === 'audit'
              const isLocked = (isApprovals && !canApprove) || (isAudit && !canViewAudit)
              const Icon = isLocked ? IconLock : item.Icon
              const isActive =
                activeKey === item.key ||
                (item.key === 'overview' && activeKey === 'admin') ||
                (item.key === 'audit' && activeKey === 'audit-details') ||
                (item.key === 'budget' && activeKey === 'budget-review')
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-[#8083ff]/15 text-[#c0c1ff] font-semibold border-l-2 border-[#8083ff]'
                      : 'text-[#c7c4d7] hover:text-[#dfe2f1] hover:bg-[#262a35]/60'
                  }`}
                  onClick={() => {
                    onNavigate(item.key)
                    if (isDrawer && onClose) onClose()
                  }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span
                    className={`flex-shrink-0 transition-colors ${
                      isActive ? 'text-[#c0c1ff]' : 'text-[#c7c4d7] group-hover:text-[#dfe2f1]'
                    }`}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="truncate text-left flex-1">{item.label}</span>
                  {isApprovals && isLocked && (
                    <span
                      className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/30 font-mono"
                      title="Restricted by FR04 Governance"
                    >
                      Locked
                    </span>
                  )}
                  {isAudit && isLocked && (
                    <span
                      className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/30 font-mono"
                      title="Marketing Manager only by FR11 Governance"
                    >
                      Locked
                    </span>
                  )}
                  {item.hasAiBadge && (
                    <span
                      className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-[#03b5d3]/15 text-[#4cd7f6] font-mono font-semibold border border-[#03b5d3]/30"
                      title="AI Powered Module"
                    >
                      AI
                    </span>
                  )}
                  {isApprovals && !isLocked && pendingApprovalsCount > 0 && (
                    <span
                      className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[#ffb4ab]/15 text-[#ffb4ab] border border-[#ffb4ab]/30 font-mono font-bold"
                      title={`${pendingApprovalsCount} pending approvals`}
                    >
                      {pendingApprovalsCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Footer Area (Inside Sidebar) */}
      <div className="p-3 border-t border-[#464554] bg-[#171b26] flex-shrink-0">
        <div
          className="bg-[#0a0e18] border border-[#464554]/70 rounded-lg p-2.5 flex items-center justify-between cursor-pointer hover:border-[#8083ff]/50 transition-colors"
          role="button"
          tabIndex={0}
          title="Active Company Workspace"
          onClick={() => onNavigate('overview')}
          onKeyDown={(e) => e.key === 'Enter' && onNavigate('overview')}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded bg-[#262a35] border border-[#464554] flex items-center justify-center text-[11px] font-bold text-[#dfe2f1] flex-shrink-0">
              {workspaceName ? workspaceName.slice(0, 2).toUpperCase() : 'AC'}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-[12px] font-semibold text-[#dfe2f1] truncate leading-tight">
                {workspaceName || 'Acme Corp Enterprise'}
              </p>
              <p className="text-[10px] font-mono text-[#c7c4d7]/70 truncate">
                {planName || 'acme-corp-prod-01'}
              </p>
            </div>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#a078ff]/15 border border-[#a078ff]/40 text-[#a078ff] font-mono font-bold uppercase leading-none">
            MANAGER
          </span>
        </div>
      </div>
    </aside>
  )
}

