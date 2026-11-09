import PropTypes from 'prop-types'

/**
 * RoleSidebar — Master Layout Sidebar Component for CastraVision
 * Strictly adheres to Google Stitch specifications in leader_workspace_master_layout_shell:
 * - 260px fixed width, pinned layout
 * - Dark background (#171b26) with border (#464554)
 * - Brand header with gradient layers logo and SME AI ENGINE tag
 * - Workspace Navigation section with LEADER/MEMBER role badge
 * - Active item indicator (border-l-[3px] border-[#8083ff] bg-[#262a35])
 * - Tenant identifier footer (Acme Corp Enterprise / acme-corp-prod-01)
 * - Mobile drawer support with close button and backdrop dismissal
 */
export default function RoleSidebar({
  navItems = [],
  activeKey = 'overview',
  onNavigate,
  sectionTitle = 'WORKSPACE NAVIGATION',
  roleBadge = 'LEADER',
  tenantName = 'Acme Corp Enterprise',
  tenantCode = 'acme-corp-prod-01',
  roleAriaLabel = 'Workspace Navigation',
  isDrawer = false,
  onClose,
}) {
  const tenantInitials = tenantName
    ? tenantName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : 'AC'

  return (
    <aside
      className={`std-sidebar w-[260px] flex-shrink-0 bg-[#171b26] border-r border-[#464554] flex flex-col z-30 select-none ${
        isDrawer ? 'std-sidebar-drawer' : 'hidden md:flex sticky top-0 h-screen'
      }`}
      aria-label={roleAriaLabel}
    >
      {/* Top Logo Area */}
      <div className="h-16 px-5 flex items-center border-b border-[#464554] flex-shrink-0 gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6366f1] via-[#8083ff] to-[#a5b4fc] flex items-center justify-center shadow-lg shadow-[#8083ff]/20 flex-shrink-0">
          <svg
            className="w-4 h-4 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[15px] font-bold tracking-tight text-[#dfe2f1] leading-none">
            CastraVision
          </span>
          <span className="text-[9px] font-mono tracking-wider text-[#a078ff] font-semibold mt-1">
            SME AI ENGINE
          </span>
        </div>
        {isDrawer && (
          <button
            type="button"
            className="std-drawer-close-btn ml-auto"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        )}
      </div>

      {/* Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold tracking-wider text-[#c7c4d7] uppercase">
              {sectionTitle}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#262a35] text-[#8083ff] font-mono font-medium uppercase">
              {roleBadge}
            </span>
          </div>

          <nav className="space-y-1" aria-label={sectionTitle}>
            {navItems.map((item) => {
              const isActive = activeKey === item.key
              const Icon = item.icon
              return (
                <button
                  key={item.key}
                  type="button"
                  className={
                    isActive
                      ? 'w-full flex items-center justify-between px-3 py-2.5 rounded-r-lg bg-[#262a35] border-l-[3px] border-[#8083ff] text-[#dfe2f1] font-semibold text-[13px] transition-all duration-150 text-left'
                      : 'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[#c7c4d7] hover:text-[#dfe2f1] hover:bg-[#262a35]/60 text-[13px] font-medium transition-all group text-left'
                  }
                  onClick={() => {
                    onNavigate?.(item.key)
                    if (isDrawer && onClose) onClose()
                  }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={
                        isActive
                          ? 'text-[#8083ff] flex-shrink-0'
                          : 'text-[#c7c4d7] group-hover:text-[#dfe2f1] transition-colors flex-shrink-0'
                      }
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#8083ff] text-[#0d0096] flex-shrink-0">
                      {item.badge}
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
        <div className="bg-[#0a0e18] border border-[#464554]/70 rounded-lg p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded bg-[#262a35] border border-[#464554] flex items-center justify-center text-[11px] font-bold text-[#dfe2f1] flex-shrink-0">
              {tenantInitials}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[#dfe2f1] truncate leading-tight">
                {tenantName}
              </p>
              <p className="text-[10px] font-mono text-[#c7c4d7]/70 truncate">
                {tenantCode}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

RoleSidebar.propTypes = {
  navItems: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
      badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      badgeColor: PropTypes.string,
    })
  ).isRequired,
  activeKey: PropTypes.string,
  onNavigate: PropTypes.func,
  sectionTitle: PropTypes.string,
  roleBadge: PropTypes.string,
  tenantName: PropTypes.string,
  tenantCode: PropTypes.string,
  roleAriaLabel: PropTypes.string,
  isDrawer: PropTypes.bool,
  onClose: PropTypes.func,
}
