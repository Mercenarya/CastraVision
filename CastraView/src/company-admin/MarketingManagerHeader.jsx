/**
 * MarketingManagerHeader.jsx — Shared top header across all Marketing Manager screens
 * Matches the approved Figma layout, typography, breadcrumbs, search, and system indicators.
 */

import { useState, useRef, useEffect } from 'react'
import {
  IconChevronRight,
  IconSearch,
  IconBell,
  IconSignOut,
  IconUser,
} from './ui/Icons'

export default function MarketingManagerHeader({
  workspaceName = 'Acme Corp',
  currentPageTitle = 'Marketing Manager Console',
  searchValue = '',
  onSearchChange,
  user,
  onSignOut,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Use authenticated user info if present, with graceful fallback
  const displayName =
    user?.full_name ||
    (user?.email ? user.email.split('@')[0].replace(/[._]/g, ' ') : null) ||
    'Sarah Jenkins'

  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') || 'SJ'

  const displayRole =
    user?.role === 'admin'
      ? 'Marketing Manager'
      : user?.role === 'manager'
        ? 'Leader'
        : user?.role === 'member'
          ? 'Employee'
          : 'Marketing Manager'

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  return (
    <header className="ca-header" aria-label="Marketing Manager Header">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="ca-breadcrumbs">
        <span className="ca-breadcrumb-item">CastraVision</span>
        <IconChevronRight size={13} className="ca-breadcrumb-sep" />
        <span className="ca-breadcrumb-item">{workspaceName}</span>
        <IconChevronRight size={13} className="ca-breadcrumb-sep" />
        <span className="ca-breadcrumb-item active">{currentPageTitle}</span>
      </nav>

      {/* Header Actions & Utilities */}
      <div className="ca-header-actions">
        {/* Global Search Field */}
        <div className="ca-search-input-wrap">
          <IconSearch size={15} className="ca-search-icon" />
          <input
            type="search"
            className="ca-search-input"
            placeholder="Search workspace, members, audit logs..."
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            aria-label="Global search"
          />
          <span className="ca-search-shortcut" title="Search shortcut (Ctrl+K / ⌘K)">
            ⌘K
          </span>
        </div>

        {/* System Status Indicator */}
        <div className="ca-system-status" title="Workspace API & Engine Status">
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
          <IconBell size={18} />
          <span className="ca-bell-badge">3</span>
        </button>

        {/* User Profile Info & Dropdown Trigger */}
        <div className="ca-user-profile-wrap" ref={menuRef}>
          <button
            type="button"
            className="ca-user-profile-btn"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            title={`Signed in as ${displayName} (${displayRole})`}
          >
            <div className="ca-user-meta">
              <span className="ca-user-name">{displayName}</span>
              <span className="ca-user-role">{displayRole}</span>
            </div>
            <div className="ca-user-avatar" aria-hidden="true">
              {initials}
            </div>
          </button>

          {/* User Profile Dropdown Menu */}
          {menuOpen && (
            <div className="ca-user-dropdown" role="menu">
              <div className="ca-dropdown-header">
                <div className="ca-dropdown-user-title">{displayName}</div>
                <div className="ca-dropdown-user-email">
                  {user?.email || 'sarah.jenkins@acmecorp.com'}
                </div>
                <div className="ca-dropdown-badge-row">
                  <span className="ca-badge ca-badge-admin">{displayRole}</span>
                  <span className="ca-badge ca-badge-live">Strict Tenant Isolation</span>
                </div>
              </div>
              <div className="ca-dropdown-divider" />
              <div className="ca-dropdown-item" role="menuitem">
                <IconUser size={15} />
                <span>Account Profile</span>
              </div>
              {onSignOut && (
                <button
                  type="button"
                  className="ca-dropdown-item ca-dropdown-signout"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    onSignOut()
                  }}
                >
                  <IconSignOut size={15} />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
