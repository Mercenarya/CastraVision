import React, { useState } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import { LanguageDropdownSubmenu } from '@/components/LanguageDropdownSubmenu'
import { PlatformNotifications } from './PlatformNotifications'

/**
 * SystemAdminHeader
 * Shared top header for System Admin interface with breadcrumb, node status, search, and admin profile.
 */
export function SystemAdminHeader({
  activeTab,
  selectedCompany,
  user,
  onLogout,
  onNavigate,
  searchTerm = '',
  onSearchChange,
  onOpenMobileMenu,
  service,
}) {
  const { t } = useLanguage()
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Construct breadcrumb items based on current route
  const getBreadcrumbs = () => {
    switch (activeTab) {
      case 'sa-dashboard':
        return [
          { label: 'Platform Governance', clickable: false },
          { label: 'Dashboard', clickable: false, active: true },
        ]
      case 'sa-company-mgmt':
        return [
          { label: 'Platform Governance', clickable: false },
          { label: 'Company Management', clickable: false, active: true },
        ]
      case 'sa-company-overview':
        return [
          { label: 'Platform Governance', clickable: false },
          {
            label: 'Company Management',
            clickable: true,
            onClick: () => onNavigate('sa-company-mgmt'),
          },
          {
            label: selectedCompany ? selectedCompany.name : 'Company Overview',
            clickable: false,
          },
          { label: 'Overview', clickable: false, active: true },
        ]
      case 'create-company':
      case 'sa-create-company':
        return [
          { label: 'Platform Governance', clickable: false },
          {
            label: 'Company Management',
            clickable: true,
            onClick: () => onNavigate('sa-company-mgmt'),
          },
          { label: 'Create Company Account', clickable: false, active: true },
        ]
      case 'profile':
        return [
          { label: 'Platform Governance', clickable: false },
          { label: 'Settings', clickable: false, active: true },
        ]
      default:
        return [
          { label: 'Platform Governance', clickable: false },
          { label: 'Dashboard', clickable: false, active: true },
        ]
    }
  }

  const breadcrumbs = getBreadcrumbs()
  const displayName = user?.full_name || user?.fullName || user?.username || 'System Administrator'
  const userInitials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <header className="sa-header">
      {/* Left: Breadcrumbs */}
      <div className="sa-header-left">
        <button
          type="button"
          className="sa-hamburger-btn"
          onClick={onOpenMobileMenu}
          aria-label="Mở menu điều hướng"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <nav className="sa-breadcrumbs" aria-label="Breadcrumb">
          {breadcrumbs.map((bc, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="sa-breadcrumb-separator">/</span>}
              {bc.clickable ? (
                <button
                  type="button"
                  className="sa-breadcrumb-link"
                  onClick={bc.onClick}
                >
                  {bc.label}
                </button>
              ) : (
                <span
                  className={`sa-breadcrumb-item ${bc.active ? 'active' : ''}`}
                >
                  {bc.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Center / Right controls */}
      <div className="sa-header-right">
        {/* Platform Node Status */}
        <div className="sa-node-status">
          <span className="sa-node-pulse-dot" />
          <span className="sa-node-status-text">Telemetry: chưa cấu hình</span>
        </div>

        {/* Global Company Search */}
        <div className="sa-header-search">
          <svg
            className="sa-search-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="sa-search-input"
            placeholder={t('header.searchTenants')}
            value={searchTerm}
            onChange={(e) => {
              if (onSearchChange) onSearchChange(e.target.value)
            }}
          />
        </div>

        {/* Notification Icon */}
        <PlatformNotifications service={service} />

        {/* User Profile */}
        <div className="sa-user-profile-wrapper">
          <button
            type="button"
            className="sa-user-profile-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="sa-header-avatar">{userInitials}</div>
            <div className="sa-header-user-info">
              <span className="sa-header-user-name">{displayName}</span>
              <span className="sa-header-user-role">{t('header.rootPlatformRole')}</span>
            </div>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                marginLeft: '4px',
                transform: showProfileMenu ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s ease',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showProfileMenu && (
            <div className="sa-profile-dropdown">
              <div className="sa-profile-dropdown-header">
                <div className="sa-dropdown-name">{displayName}</div>
                <div className="sa-dropdown-email">{user?.email || 'admin@castravision.internal'}</div>
                <span className="sa-badge-purple" style={{ marginTop: '6px', display: 'inline-block' }}>
                  {t('header.platformSystemAdmin')}
                </span>
              </div>
              <div className="sa-profile-dropdown-divider" />
              <div className="sa-profile-dropdown-item privacy-info">
                {t('header.tenantIsolationNotice')}
              </div>
              <div className="sa-profile-dropdown-divider" />
              <button
                type="button"
                className="sa-profile-dropdown-item"
                onClick={() => {
                  setShowProfileMenu(false)
                  if (onNavigate) onNavigate('profile')
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                {t('navigation.accountSettings')}
              </button>
              <div className="sa-profile-dropdown-divider" />
              <LanguageDropdownSubmenu variant="system-admin" />
              <div className="sa-profile-dropdown-divider" />
              <button
                type="button"
                className="sa-profile-dropdown-item logout"
                onClick={() => {
                  setShowProfileMenu(false)
                  if (onLogout) onLogout()
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {t('header.signOut')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
