import React, { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Building2, ShieldCheck, Bell } from 'lucide-react'
import SettingsHeader from '@/components/settings/SettingsHeader'
import BusinessProfileTab from '@/components/settings/BusinessProfileTab'
import AccountSecurityTab from '@/components/settings/AccountSecurityTab'
import NotificationPreferencesTab from '@/components/settings/NotificationPreferencesTab'

/**
 * SettingsPage
 * Master role-aware Settings container for all four CastraVision actors.
 * - Marketing Manager: Full access to Business Profile (edit), Account & Security, Notification Preferences.
 * - Leader: Read-only access to Business Profile, Account & Security, Notification Preferences.
 * - Employee: Read-only access to Business Profile, Account & Security, Notification Preferences.
 * - System Admin: Account & Security, Notification Preferences only (Business Profile strictly excluded).
 */
export function SettingsPage({
  user,
  actorRole = 'member',
  membership,
  profile,
  saveProfile,
  busy = false,
  error = '',
  notify,
  onUserUpdate,
  onProfileUpdated,
}) {
  // Normalize role key
  const normalizedRole = useMemo(() => {
    if (!actorRole) return 'member'
    const roleKey = actorRole.toLowerCase().trim()
    if (roleKey === 'admin' || roleKey === 'company_admin' || roleKey === 'manager') {
      return 'manager'
    }
    if (roleKey === 'leader') return 'leader'
    if (roleKey === 'system_admin') return 'system_admin'
    return 'member'
  }, [actorRole])

  // Build role-specific tab configuration
  const availableTabs = useMemo(() => {
    // System Admin is outside workspace -> Business Profile is strictly hidden
    if (normalizedRole === 'system_admin') {
      return [
        {
          id: 'security',
          label: 'Tài khoản & Bảo mật',
          icon: ShieldCheck,
        },
        {
          id: 'notifications',
          label: 'Tùy chọn thông báo',
          icon: Bell,
        },
      ]
    }

    // Workspace actors (Manager, Leader, Member) have all 3 tabs
    // Manager has edit rights; Leader and Member have read-only rights
    return [
      {
        id: 'business',
        label: normalizedRole === 'manager' ? 'Hồ sơ doanh nghiệp' : 'Hồ sơ doanh nghiệp (Chỉ xem)',
        icon: Building2,
      },
      {
        id: 'security',
        label: 'Tài khoản & Bảo mật',
        icon: ShieldCheck,
      },
      {
        id: 'notifications',
        label: 'Tùy chọn thông báo',
        icon: Bell,
      },
    ]
  }, [normalizedRole])

  // Default active tab: 'business' for Manager, 'security' for other roles
  const defaultTab = normalizedRole === 'manager' ? 'business' : 'security'
  const [selectedTab, setSelectedTab] = useState(defaultTab)

  // Derive valid tab (guarantee role cannot access invalid tabs like business profile for system_admin)
  const isTabValid = availableTabs.some((t) => t.id === selectedTab)
  const activeTab = isTabValid ? selectedTab : defaultTab

  return (
    <div className="w-full space-y-6">
      {/* Shared Header with Breadcrumb and Tab Pills */}
      <SettingsHeader
        title="Cài đặt"
        subtitle="Quản lý thông tin tài khoản, bảo mật cá nhân và cấu hình nhận thông báo."
        tabs={availableTabs}
        activeTab={activeTab}
        onTabChange={setSelectedTab}
      />

      {/* Role-Guarded Tab Content Area */}
      <main className="w-full">
        {/* TAB 1: Business Profile (Workspace actors only; strictly forbidden for System Admin) */}
        {activeTab === 'business' && normalizedRole !== 'system_admin' && (
          <BusinessProfileTab
            user={user}
            actorRole={normalizedRole}
            membership={membership}
            profile={profile}
            saveProfile={saveProfile}
            busy={busy}
            error={error}
            notify={notify}
            onProfileUpdated={onProfileUpdated}
          />
        )}

        {/* TAB 2: Account & Security (All 4 roles) */}
        {activeTab === 'security' && (
          <AccountSecurityTab
            user={user}
            role={normalizedRole}
            membership={membership}
            notify={notify}
            onUserUpdate={onUserUpdate}
          />
        )}

        {/* TAB 3: Notification Preferences (All 4 roles) */}
        {activeTab === 'notifications' && (
          <NotificationPreferencesTab
            user={user}
            notify={notify}
          />
        )}
      </main>
    </div>
  )
}

SettingsPage.propTypes = {
  user: PropTypes.object,
  actorRole: PropTypes.string,
  membership: PropTypes.object,
  profile: PropTypes.object,
  saveProfile: PropTypes.func,
  busy: PropTypes.bool,
  error: PropTypes.string,
  notify: PropTypes.func,
  onUserUpdate: PropTypes.func,
  onProfileUpdated: PropTypes.func,
}

export default SettingsPage
