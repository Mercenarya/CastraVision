/**
 * CompanyAdminHeader.jsx — Shared top header across all Company Admin screens
 */

export default function CompanyAdminHeader({
  workspaceName = 'Acme Corp',
  currentPageTitle = 'Admin Console',
  searchValue = '',
  onSearchChange,
  user,
  onSignOut,
}) {
  // Use authenticated user info if present, with graceful fallback
  const displayName = user?.full_name ||
    (user?.email ? user.email.split('@')[0].replace(/[._]/g, ' ') : null) ||
    'Sarah Jenkins'

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'SJ'

  const displayRole = user?.role === 'admin' ? 'Admin' :
    user?.role === 'manager' ? 'Manager' :
    user?.role === 'member' ? 'Member' : 'Admin'

  return (
    <header className="ca-header">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="ca-breadcrumbs">
        <span className="ca-breadcrumb-item">CastraVision</span>
        <span className="ca-breadcrumb-sep">/</span>
        <span className="ca-breadcrumb-item">{workspaceName}</span>
        <span className="ca-breadcrumb-sep">/</span>
        <span className="ca-breadcrumb-item active">{currentPageTitle}</span>
      </nav>

      {/* Header Actions & Utilities */}
      <div className="ca-header-actions">
        {/* Search Field */}
        <div className="ca-search-input-wrap">
          <span className="ca-search-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            className="ca-search-input"
            placeholder="Search workspace, members, audit logs..."
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            aria-label="Global search"
          />
        </div>

        {/* System Status Indicator */}
        <div className="ca-system-status">
          <span className="ca-status-dot" aria-hidden="true" />
          <span>All systems nominal</span>
        </div>

        {/* Notifications Icon Button */}
        <button
          type="button"
          className="ca-header-btn-icon"
          aria-label="Notifications"
          title="3 unread notifications"
        >
          <span aria-hidden="true">🔔</span>
          <span className="ca-bell-dot" aria-hidden="true" />
        </button>

        {/* User Profile Info & Sign Out Trigger */}
        <div className="ca-user-profile-btn" title={`Signed in as ${displayName}`}>
          <div className="ca-user-avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="ca-user-meta">
            <span className="ca-user-name">{displayName}</span>
            <span className="ca-user-role">{displayRole}</span>
          </div>
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="ca-btn ca-btn-subtle ca-btn-sm"
              style={{ marginLeft: 8 }}
              title="Sign Out"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
