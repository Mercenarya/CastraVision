/**
 * CompanyAdminSidebar.jsx — Unified shared sidebar for CastraVision Company Admin
 * Renders the exact same structure, order, styling, and badges across all 7 screens.
 */

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview / Dashboard', icon: '▦' },
  { key: 'members', label: 'Workspace Members', icon: '👥' },
  { key: 'roles', label: 'Role Management', icon: '🛡' },
  { key: 'audit', label: 'Audit Log (FR11)', icon: '▤' },
  { key: 'approvals', label: 'Approvals', icon: '✓', hasBadge: true },
  { key: 'import', label: 'Campaign Import', icon: '⇥' },
  { key: 'content', label: 'Content Gen', icon: '✦' },
  { key: 'profile', label: 'Settings', icon: '⚙' },
]

export default function CompanyAdminSidebar({
  activeKey = 'overview',
  onNavigate,
  pendingApprovalsCount = 3,
  workspaceName = 'Acme Corp',
  planName = 'Enterprise Workspace',
}) {
  return (
    <aside className="ca-sidebar" aria-label="Company Admin Navigation">
      {/* Top Logo & Enterprise Badge */}
      <div className="ca-sidebar-top">
        <div className="ca-brand">
          <span className="ca-brand-glyph" aria-hidden="true">✣</span>
          <span>CastraVision</span>
        </div>
        <span className="ca-ent-badge">ENT</span>
      </div>

      {/* Navigation List */}
      <div className="ca-sidebar-nav-wrap">
        <div className="ca-nav-section-label">NAVIGATION</div>
        <ul className="ca-nav-list">
          {NAV_ITEMS.map((item) => {
            const isActive = activeKey === item.key ||
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
                  <span className="ca-nav-icon" aria-hidden="true">{item.icon}</span>
                  <span className="ca-nav-label">{item.label}</span>
                  {item.hasBadge && pendingApprovalsCount > 0 && (
                    <span className="ca-nav-badge" title={`${pendingApprovalsCount} pending approvals`}>
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
          <div className="ca-ws-icon" aria-hidden="true">🏢</div>
          <div className="ca-ws-info">
            <span className="ca-ws-name">{workspaceName}</span>
            <span className="ca-ws-plan">{planName}</span>
          </div>
          <span className="ca-ws-caret" aria-hidden="true">⇅</span>
        </div>
      </div>
    </aside>
  )
}
