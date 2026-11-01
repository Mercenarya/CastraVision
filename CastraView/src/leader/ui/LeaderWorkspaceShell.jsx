import PropTypes from 'prop-types'

import { Brand } from '@/dashboards/RoleDashboards'

const NAVIGATION = [
  ['overview', '▦', 'Overview'],
  ['campaigns', '◒', 'Campaigns'],
  ['approvals', '✓', 'Approval Queue'],
  ['content', '✦', 'Content Studio'],
  ['audience', '◎', 'Audience Intel'],
  ['automations', '↻', 'Automations'],
  ['attribution', '↗', 'Attribution'],
]

export default function LeaderWorkspaceShell({ user, profile, page, setPage, logout, children }) {
  const workspaceName = profile?.business_name || 'Acme Studios'
  const userName = user?.full_name || user?.email?.split('@')[0] || 'Leader'
  const workspaceInitials = workspaceName.slice(0, 2).toUpperCase()
  const userInitials = userName.slice(0, 2).toUpperCase()

  function navigate(nextPage) {
    setPage(nextPage === 'budget' ? 'overview' : nextPage)
  }

  return (
    <div className="leader-workspace-shell">
      <aside className="leader-workspace-sidebar">
        <div className="leader-sidebar-brand"><Brand /><span className="leader-sidebar-badge">LEADER</span></div>
        <button type="button" className="leader-workspace-switch" onClick={() => navigate('overview')}>
          <span className="leader-workspace-avatar">{workspaceInitials}</span>
          <span><strong>{workspaceName}</strong><small>Enterprise Workspace</small></span>
          <span aria-hidden="true">⌄</span>
        </button>
        <span className="leader-nav-label">CORE NAVIGATION</span>
        <nav aria-label="Leader navigation" className="leader-navigation">
          {NAVIGATION.map(([key, icon, label]) => <button type="button" key={key} className={`leader-nav-item ${page === key ? 'active' : ''}`} onClick={() => navigate(key)} aria-current={page === key ? 'page' : undefined}><span aria-hidden="true">{icon}</span>{label}{key === 'approvals' && <b className="leader-nav-count">3</b>}</button>)}
        </nav>
        <div className="leader-sidebar-bottom">
          <div className="leader-quota-header"><span>AI Copilot quota</span><strong>78.4%</strong></div>
          <div className="leader-quota-track"><span /></div>
          <div className="leader-quota-footer"><small>Adaptive SME Model</small><small>24ms latency</small></div>
          <div className="leader-sidebar-footer"><span className="leader-online-dot" /> All systems nominal</div>
        </div>
      </aside>

      <div className="leader-workspace-main">
        <header className="leader-workspace-header">
          <div className="leader-breadcrumb"><span>CastraVision</span><b>/</b><span>{workspaceName}</span><b>/</b><strong>{page === 'approvals' ? 'Approval Queue' : 'Leader Workspace'}</strong></div>
          <div className="leader-header-actions"><label className="leader-header-search"><span aria-hidden="true">⌕</span><input placeholder="Search workspace" aria-label="Search workspace" /></label><span className="leader-pipeline-status"><i /> Pipeline healthy</span><button type="button" className="leader-icon-button" aria-label="Notifications">🔔<b /></button><button type="button" className="leader-user-menu" onClick={logout} title="Sign out"><span className="leader-user-avatar">{userInitials}</span><span><strong>{userName}</strong><small>Leader · Campaign Lead</small></span></button></div>
        </header>
        <main className="leader-workspace-content">{children}</main>
      </div>
    </div>
  )
}

LeaderWorkspaceShell.propTypes = {
  user: PropTypes.shape({ email: PropTypes.string, full_name: PropTypes.string }),
  profile: PropTypes.shape({ business_name: PropTypes.string }),
  page: PropTypes.string.isRequired,
  setPage: PropTypes.func.isRequired,
  logout: PropTypes.func.isRequired,
  children: PropTypes.node,
}
