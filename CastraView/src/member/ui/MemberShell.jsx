import { useEffect, useRef, useState } from 'react'

import { getMemberPageLabel, MEMBER_NAV_ITEMS, normalizeMemberPage } from '../memberContract'
import './member.css'

function Brand() {
  return (
    <div className="member-shell__brand">
      <span className="member-shell__brand-mark" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 2 9 5-9 5-9-5 9-5Z" />
          <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
        </svg>
      </span>
      <span>
        <strong>CastraVision</strong>
        <small>SME AI ENGINE</small>
      </span>
    </div>
  )
}

function NavigationIcon({ name }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const drawings = {
    dashboard: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>,
    description: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
    campaign: <><path d="m3 11 18-5v12L3 14v-3Z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></>,
    explore: <><circle cx="12" cy="12" r="10" /><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3 6.3-2.1Z" /></>,
    auto_awesome: <><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" /></>,
    cloud_upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5M12 3v12" /></>,
    notifications: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M10 21h4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.8 1.2v.2a2 2 0 1 1-4 0V19a1.7 1.7 0 0 0-2.8-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 12a2 2 0 1 1 0-4h.2A1.7 1.7 0 0 0 4.4 5.2l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 1.2V1a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 2.8 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 8a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 3Z" /></>,
  }

  const size = name === 'notifications' ? 20 : 16
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...common}>{drawings[name]}</svg>
}

function initials(value) {
  return (value || 'CV')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export default function MemberShell({
  user,
  profile,
  page,
  setPage,
  logout,
  children,
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const sidebarRef = useRef(null)
  const accountMenuRef = useRef(null)
  const accountTriggerRef = useRef(null)
  const wasMobileOpen = useRef(false)
  const activePage = normalizeMemberPage(page)
  const workspaceName = profile?.business_name || 'CastraVision Workspace'
  const userName = user?.full_name || user?.user_metadata?.full_name || user?.email || 'Member'

  useEffect(() => {
    if (!wasMobileOpen.current && mobileOpen) {
      sidebarRef.current?.querySelector('button:not(.member-shell__close)')?.focus()
    }
    if (wasMobileOpen.current && !mobileOpen) {
      menuButtonRef.current?.focus()
    }
    wasMobileOpen.current = mobileOpen
  }, [mobileOpen])

  useEffect(() => {
    if (!accountMenuOpen) return undefined
    function closeAccountMenu(event) {
      if (event.type === 'keydown' && event.key === 'Escape') {
        setAccountMenuOpen(false)
        accountTriggerRef.current?.focus()
      } else if (event.type === 'mousedown' && !accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false)
      }
    }
    window.addEventListener('mousedown', closeAccountMenu)
    window.addEventListener('keydown', closeAccountMenu)
    return () => {
      window.removeEventListener('mousedown', closeAccountMenu)
      window.removeEventListener('keydown', closeAccountMenu)
    }
  }, [accountMenuOpen])

  function navigate(nextPage) {
    setPage(nextPage)
    setMobileOpen(false)
    setAccountMenuOpen(false)
  }

  return (
    <div className="member-shell">
      <button
        type="button"
        className={`member-shell__scrim ${mobileOpen ? 'is-visible' : ''}`}
        aria-label="Close navigation"
        aria-hidden={!mobileOpen}
        tabIndex={mobileOpen ? 0 : -1}
        onClick={() => setMobileOpen(false)}
      />
      <aside ref={sidebarRef} className={`member-shell__sidebar ${mobileOpen ? 'is-open' : ''}`} aria-label="Member workspace navigation panel">
        <div className="member-shell__sidebar-top">
          <div className="member-shell__brand-row">
            <Brand />
            <span className="member-shell__role-badge">MEMBER</span>
            <button
              type="button"
              className="member-shell__close"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
            >
              ×
            </button>
          </div>

          <p className="member-shell__nav-label">Workspace</p>
          <nav className="member-shell__nav" aria-label="Member workspace navigation">
            {MEMBER_NAV_ITEMS.map((item) => (
              <button
                type="button"
                key={item.key}
                className={`member-shell__nav-item ${activePage === item.key ? 'is-active' : ''}`}
                onClick={() => navigate(item.key)}
                aria-current={activePage === item.key ? 'page' : undefined}
              >
                <span className="member-shell__nav-icon"><NavigationIcon name={item.icon} /></span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="member-shell__footer">
          <div className="member-shell__tenant">
            <span className="member-shell__tenant-avatar">{initials(workspaceName)}</span>
            <span className="member-shell__tenant-copy">
              <strong>{workspaceName}</strong>
              <small>Business workspace</small>
            </span>
          </div>
        </div>
      </aside>

      <div className="member-shell__main">
        <header className="member-shell__header">
          <button
            type="button"
            ref={menuButtonRef}
            className="member-shell__menu"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
          <div className="member-shell__header-branding">
            <Brand />
            <span className="member-shell__header-divider" aria-hidden="true" />
            <div className="member-shell__breadcrumb" aria-label="Breadcrumb">
              <span>Member Workspace</span>
              <b aria-hidden="true">›</b>
              <strong>{getMemberPageLabel(activePage)}</strong>
            </div>
          </div>
          <div className="member-shell__header-actions">
            <span className="member-shell__system-status">
              <i aria-hidden="true" /> All systems nominal
            </span>
            <button
              type="button"
              className={`member-shell__header-button ${activePage === 'notifications' ? 'is-active' : ''}`}
              aria-label="Open notifications"
              onClick={() => navigate('notifications')}
            >
              <NavigationIcon name="notifications" />
            </button>
            <span className="member-shell__header-divider" aria-hidden="true" />
            <div className="member-shell__account" ref={accountMenuRef}>
              <button
                type="button"
                ref={accountTriggerRef}
                className="member-shell__account-trigger"
                aria-label={`Account menu for ${userName}`}
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                onClick={() => setAccountMenuOpen((open) => !open)}
              >
                <span className="member-shell__user-avatar">{initials(userName)}</span>
                <span className="member-shell__user-copy">
                  <span className="member-shell__user-identity">
                    <strong>{userName}</strong>
                    <span className="member-shell__role-badge">MEMBER</span>
                  </span>
                  <small>{user?.email || 'Member account'}</small>
                </span>
                <span className="member-shell__account-chevron" aria-hidden="true">⌄</span>
              </button>
              {accountMenuOpen && (
                <div className="member-shell__account-menu" role="menu" aria-label="Member account">
                  <div className="member-shell__account-menu-identity">
                    <strong>{userName}</strong>
                    <span>{user?.email || 'Member account'}</span>
                    <span className="member-shell__role-badge">MEMBER</span>
                  </div>
                  <button type="button" role="menuitem" onClick={() => navigate('account')}>
                    <NavigationIcon name="settings" /> Account Settings
                  </button>
                  <button type="button" role="menuitem" className="is-signout" onClick={logout}>
                    <span aria-hidden="true">↪</span> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="member-shell__content">{children}</main>
      </div>
    </div>
  )
}
