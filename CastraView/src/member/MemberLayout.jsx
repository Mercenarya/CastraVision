import { useState } from 'react'
import PropTypes from 'prop-types'
import EmployeeSidebar from './EmployeeSidebar'
import { IconBell } from '../dashboards/dashboardIcons'

/**
 * MemberLayout
 * Universal Shared Layout for Employee (Alex Mercer / Member).
 * Reusable layout encapsulating EmployeeSidebar and the standardized topbar.
 */
export default function MemberLayout({
  user,
  profile: _profile,
  page = 'overview',
  setPage,
  logout,
  children,
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  const userName = user?.full_name || 'Alex Mercer'
  const userInitials = 'AM'
  const roleSubtitle = 'Marketing Specialist • Growth Squad Alpha'

  return (
    <div className="std-shell">
      {/* Role-Specific Employee Sidebar */}
      <EmployeeSidebar activeKey={page} onNavigate={setPage} />

      {/* Main Content Area */}
      <div className="std-main-wrap">
        <header className="std-topbar" aria-label="Employee Top Header">
          {/* Left: Active Campaign & Language Selectors */}
          <div className="std-topbar-left">
            <button
              type="button"
              className="std-pill-btn std-campaign-pill"
              aria-label="Active Campaign Selector"
            >
              <span className="std-pill-icon" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                  <path d="m3 11 18-5v12L3 14v-3z" />
                  <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
                </svg>
              </span>
              <span className="std-pill-text">Summer Campaign 2025 – SneakerX Streetwear</span>
              <span className="std-pill-chevron" aria-hidden="true">⌄</span>
            </button>

            <button
              type="button"
              className="std-pill-btn std-lang-pill"
              aria-label="Language Selector"
            >
              <span className="std-pill-icon" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
              </span>
              <span className="std-pill-text">English (US)</span>
              <span className="std-pill-chevron" aria-hidden="true">⌄</span>
            </button>
          </div>

          {/* Right: Engine metrics, Notifications, User info */}
          <div className="std-topbar-right">
            {/* Compute Engines Pill */}
            <div className="std-engine-pill">
              <span className="std-engine-icon" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                  <rect width="16" height="16" x="4" y="4" rx="2" />
                  <rect width="6" height="6" x="9" y="9" rx="1" />
                  <path d="M15 2v2" />
                  <path d="M15 20v2" />
                  <path d="M2 15h2" />
                  <path d="M2 9h2" />
                  <path d="M20 15h2" />
                  <path d="M20 9h2" />
                  <path d="M9 2v2" />
                  <path d="M9 20v2" />
                </svg>
              </span>
              <div className="std-engine-info">
                <span className="std-engine-label">Compute Engines</span>
                <span className="std-engine-val">78,450 / 100K ops</span>
              </div>
            </div>

            {/* Notifications Bell */}
            <button
              type="button"
              className="std-bell-btn"
              aria-label="Notifications"
              onClick={() => setPage?.('notifications')}
            >
              <IconBell className="w-4 h-4 text-slate-300" />
            </button>

            {/* User Profile Pill */}
            <div className="std-user-container">
              <button
                type="button"
                className="std-user-pill"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                aria-expanded={profileDropdownOpen}
                aria-label="Employee Account Menu"
              >
                <div className="std-user-avatar">{userInitials}</div>
                <div className="std-user-info">
                  <div className="std-user-name-row">
                    <span className="std-user-name">{userName}</span>
                    <span className="std-role-badge">EMPLOYEE</span>
                  </div>
                  <span className="std-user-squad">{roleSubtitle}</span>
                </div>
                <span className="std-user-chevron" aria-hidden="true">⌄</span>
              </button>

              {profileDropdownOpen && (
                <div className="std-profile-dropdown" role="menu">
                  <div className="std-dropdown-header">
                    <strong>{userName}</strong>
                    <small>alex.mercer@acmecorp.com</small>
                  </div>
                  <div className="std-dropdown-divider" />
                  <button
                    type="button"
                    className="std-dropdown-item"
                    onClick={() => {
                      setProfileDropdownOpen(false)
                      setPage?.('profile')
                    }}
                  >
                    Employee Profile &amp; Settings
                  </button>
                  <button
                    type="button"
                    className="std-dropdown-item"
                    onClick={() => {
                      setProfileDropdownOpen(false)
                      setPage?.('tasks')
                    }}
                  >
                    My Tasks (5)
                  </button>
                  <div className="std-dropdown-divider" />
                  <button
                    type="button"
                    className="std-dropdown-item text-rose-400"
                    onClick={() => {
                      setProfileDropdownOpen(false)
                      logout?.()
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <div className="std-content">{children}</div>
      </div>
    </div>
  )
}

MemberLayout.propTypes = {
  user: PropTypes.shape({
    email: PropTypes.string,
    full_name: PropTypes.string,
    role: PropTypes.string,
  }),
  profile: PropTypes.object,
  page: PropTypes.string,
  setPage: PropTypes.func,
  logout: PropTypes.func,
  children: PropTypes.node,
}
