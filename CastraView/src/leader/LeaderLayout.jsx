import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import LeaderSidebar from './LeaderSidebar'

const PAGE_TITLES = {
  overview: 'Overview',
  approvals: 'Approvals',
  'content-reviews': 'Approvals',
  'content-review-detail': 'Content Proposal Review',
  'budget-review-detail': 'Budget Proposal Review',
  budget: 'Budget Proposal Review',
  campaigns: 'Campaigns',
  'assigned-campaigns': 'Campaigns',
  'my-proposals': 'My Proposals',
  submissions: 'My Proposals',
  strategy: 'Strategy Studio',
  content: 'Content Gen',
  import: 'Campaign Import',
  performance: 'Performance & Insights',
  reports: 'Performance & Insights',
  insights: 'Performance & Insights',
  'team-tasks': 'Team Tasks',
  profile: 'Account Settings',
  notifications: 'Notifications',
}

/**
 * LeaderLayout
 * Universal Shared Layout for Leader Workspace.
 * Conforms strictly to Google Stitch specification in leader_workspace_master_layout_shell:
 * - Header height 64px (h-16), background #171b26, border #464554
 * - Breadcrumbs: Leader Workspace > [Current Screen Title]
 * - Utility widgets: "All systems nominal" status badge, notification bell with pill, user profile widget
 * - Sidebar width 260px, pinned navigation, tenant identifier footer
 * - Responsive mobile drawer (< 768px) with backdrop overlay and escape dismissal
 */
export default function LeaderLayout({
  user,
  profile,
  page = 'overview',
  setPage,
  logout,
  children,
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const userName = user?.full_name || 'David Kross'
  const userEmail = user?.email || 'd.kross@acmecorp.com'
  const companyName = profile?.business_name || 'Acme Corp Enterprise'
  const companyCode = 'acme-corp-prod-01'

  const userInitials = userName
    ? userName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'DK'

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

  return (
    <div className="std-shell flex min-h-screen w-full bg-[#0f131d] text-[#dfe2f1]">
      {/* Persistent Desktop Sidebar */}
      <LeaderSidebar
        activeKey={page}
        onNavigate={setPage}
        companyName={companyName}
        companyCode={companyCode}
      />

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileMenuOpen && (
        <div
          className="std-drawer-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Drawer"
        >
          <div onClick={(e) => e.stopPropagation()}>
            <LeaderSidebar
              activeKey={page}
              onNavigate={(key) => {
                setPage?.(key)
                setMobileMenuOpen(false)
              }}
              isDrawer
              onClose={() => setMobileMenuOpen(false)}
              companyName={companyName}
              companyCode={companyCode}
            />
          </div>
        </div>
      )}

      {/* Main Wrapper */}
      <div className="std-main-wrap flex-1 flex flex-col min-w-0 bg-[#0f131d]">
        {/* HEADER: Top Bar (Fixed Height 64px) */}
        <header className="sticky top-0 h-16 bg-[#171b26] border-b border-[#464554] px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-20">
          {/* Left Side: Mobile Hamburger & Breadcrumb navigation */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="std-hamburger-btn md:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <div className="flex items-center gap-2 text-[13px] font-medium text-[#c7c4d7] truncate">
              <span
                className="hover:text-[#dfe2f1] cursor-pointer transition-colors whitespace-nowrap"
                onClick={() => setPage?.('overview')}
              >
                Leader Workspace
              </span>
              <svg
                className="w-3.5 h-3.5 text-[#464554] flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span className="text-[#dfe2f1] font-semibold truncate">
                {PAGE_TITLES[page] || 'Overview'}
              </span>
            </div>
          </div>

          {/* Right Side: Utility Widgets */}
          <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
            {/* System Status Widget */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0a0e18] border border-[#464554]/60">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#28A745] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#28A745]" />
              </span>
              <span className="text-[12px] font-medium text-[#c7c4d7]">
                All systems nominal
              </span>
            </div>

            <div className="hidden sm:block h-5 w-px bg-[#464554]" />

            {/* Notification Bell Icon */}
            <button
              type="button"
              className="relative p-2 text-[#c7c4d7] hover:text-[#dfe2f1] hover:bg-[#262a35] rounded-lg transition-colors focus:outline-none"
              aria-label="5 Notifications"
              onClick={() => setPage?.('notifications')}
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#ffb4ab] text-[#690005] text-[10px] font-extrabold flex items-center justify-center leading-none ring-2 ring-[#171b26]">
                5
              </span>
            </button>

            <div className="h-5 w-px bg-[#464554]" />

            {/* User Profile Widget */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-3 pl-1 text-left rounded-lg p-1 hover:bg-[#262a35]/40 transition-colors"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                aria-expanded={profileDropdownOpen}
                aria-label="Leader Account Menu"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3b82f6] to-[#8083ff] text-white flex items-center justify-center font-bold text-xs shadow-md shadow-[#8083ff]/10">
                    {userInitials}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#28A745] rounded-full ring-2 ring-[#171b26]" />
                </div>
                <div className="hidden md:flex flex-col text-left min-w-0">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-[13px] font-semibold text-[#dfe2f1] truncate">
                      {userName}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#8083ff]/15 border border-[#8083ff]/30 text-[9px] font-mono font-bold text-[#8083ff] uppercase leading-none">
                      LEADER
                    </span>
                  </div>
                  <span className="text-[11px] text-[#c7c4d7]/70 font-mono mt-1 truncate max-w-[140px]">
                    {userEmail}
                  </span>
                </div>
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 rounded-xl bg-[#171b26] border border-[#464554] shadow-2xl py-2 z-50 text-[13px]"
                  role="menu"
                >
                  <div className="px-3 py-2 border-b border-[#464554]/60">
                    <div className="font-semibold text-[#dfe2f1] truncate">
                      {userName}
                    </div>
                    <div className="text-[11px] text-[#c7c4d7]/70 truncate font-mono">
                      {userEmail}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-[#c7c4d7] hover:text-[#dfe2f1] hover:bg-[#262a35] transition-colors"
                    onClick={() => {
                      setProfileDropdownOpen(false)
                      setPage?.('profile')
                    }}
                  >
                    Account Settings
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-[#c7c4d7] hover:text-[#dfe2f1] hover:bg-[#262a35] transition-colors"
                    onClick={() => {
                      setProfileDropdownOpen(false)
                      setPage?.('notifications')
                    }}
                  >
                    Notifications
                  </button>
                  <div className="my-1 border-t border-[#464554]/60" />
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-[#ffb4ab] hover:bg-[#262a35] transition-colors flex items-center justify-between"
                    onClick={() => {
                      setProfileDropdownOpen(false)
                      logout?.()
                    }}
                  >
                    <span>Sign Out</span>
                    <span className="text-xs">→</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <div className="std-content flex-1 bg-[#0f131d]">
          {children}
        </div>
      </div>
    </div>
  )
}

LeaderLayout.propTypes = {
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
