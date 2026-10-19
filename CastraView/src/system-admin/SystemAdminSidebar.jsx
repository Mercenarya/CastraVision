import React from 'react'

/**
 * SystemAdminSidebar
 * Shared sidebar for all System Admin screens with strictly scoped platform navigation.
 */
export function SystemAdminSidebar({ activeTab, onNavigate }) {
  const navItems = [
    {
      id: 'sa-dashboard',
      label: 'Dashboard',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      id: 'sa-company-mgmt',
      label: 'Company Management',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 21h18" />
          <path d="M9 8h1" />
          <path d="M9 12h1" />
          <path d="M9 16h1" />
          <path d="M14 8h1" />
          <path d="M14 12h1" />
          <path d="M14 16h1" />
          <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
        </svg>
      ),
    },
  ]

  // Map sub-screens to top-level sidebar highlight
  const isDashboardActive = activeTab === 'sa-dashboard'
  const isCompanyMgmtActive =
    activeTab === 'sa-company-mgmt' ||
    activeTab === 'sa-company-overview' ||
    activeTab === 'sa-create-company'

  return (
    <aside className="sa-sidebar">
      {/* Brand Header */}
      <div className="sa-sidebar-brand">
        <div className="sa-brand-row">
          <div className="sa-brand-logo">
            <span className="sa-brand-dot" />
            <span className="sa-brand-title">CastraVision</span>
          </div>
          <span className="sa-badge-purple">SYS ADMIN</span>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="sa-nav-section">
        <div className="sa-nav-section-title">INFRASTRUCTURE CONTROL</div>
        <nav className="sa-nav-list">
          {navItems.map((item) => {
            const isActive =
              item.id === 'sa-dashboard' ? isDashboardActive : isCompanyMgmtActive

            return (
              <button
                key={item.id}
                type="button"
                className={`sa-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="sa-nav-icon">{item.icon}</span>
                <span className="sa-nav-text">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom Privacy Notice */}
      <div className="sa-sidebar-footer">
        <div className="sa-privacy-badge-box">
          <div className="sa-privacy-badge-header">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="sa-privacy-badge-title">Strict Tenant Privacy</span>
          </div>
          <div className="sa-privacy-badge-subtext">
            Zero Employee PII Exposure active across all tenant clusters.
          </div>
        </div>
      </div>
    </aside>
  )
}
