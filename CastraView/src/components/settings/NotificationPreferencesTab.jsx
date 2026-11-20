import React, { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useLanguage } from '@/hooks/useLanguage'
import {
  Megaphone,
  CheckSquare,
  TrendingUp,
  Bell,
  RotateCcw,
  Save,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react'

const DEFAULT_PREFERENCES = {
  campaign_performance: true,
  campaign_status: true,
  approval_pending: true,
  approval_revision: true,
  approval_results: true,
  budget_deviation: true,
  budget_usage: true,
  general_announcements: true,
  general_product_updates: false,
}

/**
 * NotificationPreferencesTab
 * Shared tab for real-time notification alerts, persisted locally by user ID.
 */
export function NotificationPreferencesTab({ user, notify }) {
  const { t } = useLanguage()
  const userId = user?.id

  // Storage key format strictly scoped by user ID
  const storageKey = useMemo(() => {
    return userId ? `castravision_notif_prefs:${userId}` : null
  }, [userId])

  // Hydrate preferences from localStorage or fallback to defaults
  const [preferences, setPreferences] = useState(() => {
    if (!storageKey || typeof window === 'undefined') {
      return DEFAULT_PREFERENCES
    }
    try {
      const saved = window.localStorage.getItem(storageKey)
      if (saved) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) }
      }
    } catch {
      // LocalStorage read error
    }
    return DEFAULT_PREFERENCES
  })

  // Track committed preferences to detect unsaved changes
  const [committedPreferences, setCommittedPreferences] = useState(preferences)
  const [feedback, setFeedback] = useState({ text: '', type: '' })

  // Adjust state when storageKey changes without triggering effect cascading renders
  const [prevStorageKey, setPrevStorageKey] = useState(storageKey)
  if (storageKey !== prevStorageKey) {
    setPrevStorageKey(storageKey)
    let nextPrefs = DEFAULT_PREFERENCES
    if (storageKey && typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem(storageKey)
        if (saved) {
          nextPrefs = { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) }
        }
      } catch {
        // Ignore
      }
    }
    setPreferences(nextPrefs)
    setCommittedPreferences(nextPrefs)
  }

  // Compute unsaved changes flag
  const hasUnsavedChanges = useMemo(() => {
    return Object.keys(DEFAULT_PREFERENCES).some(
      (key) => preferences[key] !== committedPreferences[key]
    )
  }, [preferences, committedPreferences])

  // Toggle helper
  const handleToggle = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
    setFeedback({ text: '', type: '' })
  }

  // Save to localStorage
  const handleSave = () => {
    if (!storageKey || typeof window === 'undefined') {
      setFeedback({
        text: t('employeeSettings.prefsNoIdentity'),
        type: 'error',
      })
      return
    }

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(preferences))
      setCommittedPreferences(preferences)
      const successMsg = t('employeeSettings.prefsSaved')
      setFeedback({ text: successMsg, type: 'success' })
      if (notify) notify(successMsg)
    } catch {
      setFeedback({
        text: t('employeeSettings.prefsSaveError'),
        type: 'error',
      })
    }
  }

  // Reset to Defaults
  const handleReset = () => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(storageKey)
      } catch {
        setFeedback({ text: t('employeeSettings.prefsResetError'), type: 'error' })
        return
      }
    }
    setPreferences(DEFAULT_PREFERENCES)
    setCommittedPreferences(DEFAULT_PREFERENCES)
    const resetMsg = t('employeeSettings.prefsReset')
    setFeedback({ text: resetMsg, type: 'info' })
    if (notify) notify(resetMsg)
  }

  return (
    <div className="bg-[#1c1f2a] rounded-xl border border-[#464554] overflow-hidden flex flex-col shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#464554] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#171b26]/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-[#dfe2f1]">
              {t('settings.notificationPreferences.title')}
            </h2>
            {hasUnsavedChanges && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ffb4ab]/15 text-[#ffb4ab] border border-[#ffb4ab]/30">{t('employeeSettings.unsaved')}</span>
            )}
          </div>
          <p className="text-xs text-[#c7c4d7] mt-0.5">
            {t('settings.notificationPreferences.subtitle')}
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-lg border border-[#464554] hover:bg-[#353944] text-[#ffb4ab] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('common.reset')}</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!userId}
            className="px-5 py-2 rounded-lg bg-[#28a745] hover:bg-[#218838] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{t('settings.notificationPreferences.savePreferences')}</span>
          </button>
        </div>
      </div>

      {/* Identity Missing Warning */}
      {!userId && (
        <div className="mx-6 mt-6 p-4 rounded-lg bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 text-[#ffb4ab] text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{t('employeeSettings.prefsLogin')}</span>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback.text && (
        <div
          className={`mx-6 mt-6 p-3 rounded-lg text-xs flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-[#28a745]/15 text-[#28a745] border-[#28a745]/30'
              : feedback.type === 'error'
              ? 'bg-[#ffb4ab]/15 text-[#ffb4ab] border-[#ffb4ab]/30'
              : 'bg-[#262a35] text-[#dfe2f1] border-[#464554]'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Preference Groups Body */}
      <div className="p-6 space-y-8 divide-y divide-[#464554]/50">
        {/* ─── GROUP 1: Campaign Notifications ───────────────────────────────── */}
        <div className="pt-0 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#464554]/40">
            <Megaphone className="w-4 h-4 text-[#8083ff]" />
            <h3 className="text-xs font-bold text-[#dfe2f1] uppercase font-mono tracking-wider">{t('employeeSettings.campaignNotifications')}</h3>
          </div>

          <div className="space-y-3">
            {/* Toggle 1.1 */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#0a0e18] border border-[#464554]/60">
              <div className="space-y-0.5 pr-4">
                <p className="text-sm font-medium text-[#dfe2f1]">{t('employeeSettings.campaignPerformance')}</p>
                <p className="text-xs text-[#c7c4d7]">{t('employeeSettings.campaignPerformanceDescription')}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.campaign_performance}
                onClick={() => handleToggle('campaign_performance')}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center flex-shrink-0 cursor-pointer ${
                  preferences.campaign_performance
                    ? 'bg-[#8083ff]'
                    : 'bg-[#262a35] border border-[#464554]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-150 ${
                    preferences.campaign_performance
                      ? 'transform translate-x-5'
                      : 'transform translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 1.2 */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#0a0e18] border border-[#464554]/60">
              <div className="space-y-0.5 pr-4">
                <p className="text-sm font-medium text-[#dfe2f1]">{t('employeeSettings.campaignStatus')}</p>
                <p className="text-xs text-[#c7c4d7]">{t('employeeSettings.campaignStatusDescription')}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.campaign_status}
                onClick={() => handleToggle('campaign_status')}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center flex-shrink-0 cursor-pointer ${
                  preferences.campaign_status
                    ? 'bg-[#8083ff]'
                    : 'bg-[#262a35] border border-[#464554]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-150 ${
                    preferences.campaign_status
                      ? 'transform translate-x-5'
                      : 'transform translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ─── GROUP 2: Approval Notifications ───────────────────────────────── */}
        <div className="pt-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#464554]/40">
            <CheckSquare className="w-4 h-4 text-[#4cd7f6]" />
            <h3 className="text-xs font-bold text-[#dfe2f1] uppercase font-mono tracking-wider">{t('employeeSettings.approvalNotifications')}</h3>
          </div>

          <div className="space-y-3">
            {/* Toggle 2.1 */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#0a0e18] border border-[#464554]/60">
              <div className="space-y-0.5 pr-4">
                <p className="text-sm font-medium text-[#dfe2f1]">{t('employeeSettings.pendingContent')}</p>
                <p className="text-xs text-[#c7c4d7]">{t('employeeSettings.pendingContentDescription')}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.approval_pending}
                onClick={() => handleToggle('approval_pending')}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center flex-shrink-0 cursor-pointer ${
                  preferences.approval_pending
                    ? 'bg-[#8083ff]'
                    : 'bg-[#262a35] border border-[#464554]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-150 ${
                    preferences.approval_pending
                      ? 'transform translate-x-5'
                      : 'transform translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2.2 */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#0a0e18] border border-[#464554]/60">
              <div className="space-y-0.5 pr-4">
                <p className="text-sm font-medium text-[#dfe2f1]">{t('employeeSettings.revisionContent')}</p>
                <p className="text-xs text-[#c7c4d7]">{t('employeeSettings.revisionContentDescription')}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.approval_revision}
                onClick={() => handleToggle('approval_revision')}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center flex-shrink-0 cursor-pointer ${
                  preferences.approval_revision
                    ? 'bg-[#8083ff]'
                    : 'bg-[#262a35] border border-[#464554]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-150 ${
                    preferences.approval_revision
                      ? 'transform translate-x-5'
                      : 'transform translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2.3 */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#0a0e18] border border-[#464554]/60">
              <div className="space-y-0.5 pr-4">
                <p className="text-sm font-medium text-[#dfe2f1]">{t('employeeSettings.approvalResult')}</p>
                <p className="text-xs text-[#c7c4d7]">{t('employeeSettings.approvalResultDescription')}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.approval_results}
                onClick={() => handleToggle('approval_results')}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center flex-shrink-0 cursor-pointer ${
                  preferences.approval_results
                    ? 'bg-[#8083ff]'
                    : 'bg-[#262a35] border border-[#464554]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-150 ${
                    preferences.approval_results
                      ? 'transform translate-x-5'
                      : 'transform translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ─── GROUP 3: Budget Notifications ─────────────────────────────────── */}
        <div className="pt-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#464554]/40">
            <TrendingUp className="w-4 h-4 text-[#8083ff]" />
            <h3 className="text-xs font-bold text-[#dfe2f1] uppercase font-mono tracking-wider">{t('employeeSettings.budgetNotifications')}</h3>
          </div>

          <div className="space-y-3">
            {/* Toggle 3.1 */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#0a0e18] border border-[#464554]/60">
              <div className="space-y-0.5 pr-4">
                <p className="text-sm font-medium text-[#dfe2f1]">{t('employeeSettings.budgetDeviation')}</p>
                <p className="text-xs text-[#c7c4d7]">{t('employeeSettings.budgetDeviationDescription')}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.budget_deviation}
                onClick={() => handleToggle('budget_deviation')}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center flex-shrink-0 cursor-pointer ${
                  preferences.budget_deviation
                    ? 'bg-[#8083ff]'
                    : 'bg-[#262a35] border border-[#464554]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-150 ${
                    preferences.budget_deviation
                      ? 'transform translate-x-5'
                      : 'transform translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 3.2 */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#0a0e18] border border-[#464554]/60">
              <div className="space-y-0.5 pr-4">
                <p className="text-sm font-medium text-[#dfe2f1]">{t('employeeSettings.budgetUsage')}</p>
                <p className="text-xs text-[#c7c4d7]">{t('employeeSettings.budgetUsageDescription')}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.budget_usage}
                onClick={() => handleToggle('budget_usage')}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center flex-shrink-0 cursor-pointer ${
                  preferences.budget_usage
                    ? 'bg-[#8083ff]'
                    : 'bg-[#262a35] border border-[#464554]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-150 ${
                    preferences.budget_usage
                      ? 'transform translate-x-5'
                      : 'transform translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ─── GROUP 4: General Notifications ────────────────────────────────── */}
        <div className="pt-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#464554]/40">
            <Bell className="w-4 h-4 text-[#4cd7f6]" />
            <h3 className="text-xs font-bold text-[#dfe2f1] uppercase font-mono tracking-wider">{t('employeeSettings.generalNotifications')}</h3>
          </div>

          <div className="space-y-3">
            {/* Toggle 4.1 */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#0a0e18] border border-[#464554]/60">
              <div className="space-y-0.5 pr-4">
                <p className="text-sm font-medium text-[#dfe2f1]">{t('employeeSettings.workspaceAnnouncements')}</p>
                <p className="text-xs text-[#c7c4d7]">{t('employeeSettings.workspaceAnnouncementsDescription')}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.general_announcements}
                onClick={() => handleToggle('general_announcements')}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center flex-shrink-0 cursor-pointer ${
                  preferences.general_announcements
                    ? 'bg-[#8083ff]'
                    : 'bg-[#262a35] border border-[#464554]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-150 ${
                    preferences.general_announcements
                      ? 'transform translate-x-5'
                      : 'transform translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 4.2 */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#0a0e18] border border-[#464554]/60">
              <div className="space-y-0.5 pr-4">
                <p className="text-sm font-medium text-[#dfe2f1]">{t('employeeSettings.productUpdates')}</p>
                <p className="text-xs text-[#c7c4d7]">{t('employeeSettings.productUpdatesDescription')}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.general_product_updates}
                onClick={() => handleToggle('general_product_updates')}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center flex-shrink-0 cursor-pointer ${
                  preferences.general_product_updates
                    ? 'bg-[#8083ff]'
                    : 'bg-[#262a35] border border-[#464554]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-150 ${
                    preferences.general_product_updates
                      ? 'transform translate-x-5'
                      : 'transform translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Strip */}
      <div className="px-6 py-4 bg-[#171b26]/60 border-t border-[#464554] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-[#908fa0]">
          <Info className="w-3.5 h-3.5 text-[#8083ff] flex-shrink-0" />
          <span>{t('employeeSettings.prefsScope')}</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-lg border border-[#464554] hover:bg-[#353944] text-[#ffb4ab] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!userId}
            className="px-5 py-2 rounded-lg bg-[#28a745] hover:bg-[#218838] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{t('employeeSettings.savePrefs')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

NotificationPreferencesTab.propTypes = {
  user: PropTypes.object,
  notify: PropTypes.func,
}

export default NotificationPreferencesTab
