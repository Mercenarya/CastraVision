/**
 * MarketingManagerHeader.jsx — Shared top header across all Marketing Manager screens
 * Matches the approved Figma layout, typography, breadcrumbs, search, and system indicators.
 */

import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import { LanguageDropdownSubmenu } from '@/components/LanguageDropdownSubmenu'
import {
  IconSearch,
  IconSignOut,
  IconUser,
} from './ui/Icons'

export default function MarketingManagerHeader({
  workspaceName = 'Workspace',
  currentPageTitle = 'Marketing Manager Console',
  searchValue = '',
  onSearchChange,
  user,
  onSignOut,
  onOpenMobileMenu,
  onNavigate,
}) {
  const { t } = useLanguage()
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
    <header
      className="h-16 bg-[#171b26] border-b border-[#464554] px-6 flex items-center justify-between flex-shrink-0 z-20"
      aria-label="Marketing Manager Header"
    >
      {/* Left side: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="lg:hidden p-1.5 text-[#c7c4d7] hover:text-[#dfe2f1] hover:bg-[#262a35] rounded-md transition-colors cursor-pointer"
          onClick={onOpenMobileMenu}
          aria-label="Mở menu điều hướng"
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

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] font-medium text-[#c7c4d7]">
          <span
            className="hover:text-[#dfe2f1] cursor-pointer transition-colors"
            onClick={() => onNavigate?.('overview')}
          >
            {workspaceName}
          </span>
          <svg
            className="w-3.5 h-3.5 text-[#464554]"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-[#dfe2f1] font-semibold">{currentPageTitle}</span>
        </nav>
      </div>

      {/* Header Actions & Utilities */}
      <div className="flex items-center gap-4 sm:gap-5">
        {/* Global Search Field (optional) */}
        {onSearchChange && (
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a0e18] border border-[#464554]/60 text-xs text-[#c7c4d7] w-64">
            <IconSearch size={14} className="text-[#908fa0]" />
            <input
              type="search"
              className="bg-transparent border-0 outline-none text-[#dfe2f1] placeholder-[#908fa0] w-full text-xs"
              placeholder="Search workspace..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Global search"
            />
          </div>
        )}

        {/* System Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0a0e18] border border-[#464554]/60">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#03b5d3] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#03b5d3]" />
          </span>
          <span className="text-[12px] font-medium text-[#c7c4d7]">{t('header.allSystemsNominal')}</span>
        </div>

        <div className="hidden sm:block h-5 w-px bg-[#464554]" />

        {/* Notifications Icon Button */}
        <button
          type="button"
          className="relative p-2 text-[#c7c4d7] hover:text-[#dfe2f1] hover:bg-[#262a35] rounded-lg transition-colors focus:outline-none cursor-pointer"
          aria-label={t('navigation.notifications')}
          title="3 unread notifications"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#ffb4ab] text-[#690005] text-[10px] font-extrabold flex items-center justify-center leading-none ring-2 ring-[#171b26]">
            3
          </span>
        </button>

        <div className="h-5 w-px bg-[#464554]" />

        {/* User Profile Widget: Sarah Jenkins (Manager) */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="flex items-center gap-3 pl-1 cursor-pointer focus:outline-none"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            title={`Signed in as ${displayName} (${displayRole})`}
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6366f1] to-[#8083ff] text-white flex items-center justify-center font-bold text-xs shadow-md shadow-[#8083ff]/10">
                {initials}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#03b5d3] rounded-full ring-2 ring-[#171b26]" />
            </div>
            <div className="hidden md:flex flex-col text-left">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[13px] font-semibold text-[#dfe2f1]">{displayName}</span>
                <span className="px-1.5 py-0.5 rounded bg-[#8083ff]/15 border border-[#8083ff]/30 text-[9px] font-mono font-bold text-[#8083ff] uppercase leading-none">
                  {t('roles.managerBadge')}
                </span>
              </div>
              <span className="text-[11px] text-[#c7c4d7]/70 font-mono mt-1">
                {user?.email || 's.jenkins@acmecorp.com'}
              </span>
            </div>
          </button>

          {/* User Profile Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#171b26] border border-[#464554] shadow-2xl py-2 z-50 text-[13px]">
              <div className="px-3 py-2 border-b border-[#464554]/60">
                <div className="font-semibold text-[#dfe2f1] truncate">{displayName}</div>
                <div className="text-[11px] text-[#c7c4d7]/70 truncate font-mono">
                  {user?.email || 's.jenkins@acmecorp.com'}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-[#8083ff]/15 border border-[#8083ff]/30 text-[9px] font-mono font-bold text-[#8083ff] uppercase">
                    {t('roles.managerBadge')}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#03b5d3]/15 text-[#4cd7f6] text-[9px] font-mono">
                    {t('header.tenantIsolation')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-[#c7c4d7] hover:text-[#dfe2f1] hover:bg-[#262a35] transition-colors flex items-center gap-2 cursor-pointer"
                onClick={() => {
                  setMenuOpen(false)
                  onNavigate?.('profile')
                }}
              >
                <IconUser size={15} />
                <span>{t('navigation.accountProfileSettings')}</span>
              </button>
              <div className="my-1 border-t border-[#464554]/60" />
              <LanguageDropdownSubmenu />
              <div className="my-1 border-t border-[#464554]/60" />
              {onSignOut && (
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-[#ffb4ab] hover:bg-[#262a35] transition-colors flex items-center gap-2 cursor-pointer"
                  onClick={() => {
                    setMenuOpen(false)
                    onSignOut()
                  }}
                >
                  <IconSignOut size={15} />
                  <span>{t('header.signOut')}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

