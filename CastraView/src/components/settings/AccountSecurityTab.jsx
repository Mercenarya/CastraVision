import { useWorkflowError } from '@/hooks/useWorkflowError'
import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useLanguage } from '@/hooks/useLanguage'
import {
  User,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  Circle,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { changeAccountPassword } from '@/services/accountSecurityService'

/**
 * AccountSecurityTab
 * Shared tab containing Personal Information and Password Management matching approved Stitch designs.
 */
export function AccountSecurityTab({
  user,
  role = 'member',
  membership,
  notify,
  onUserUpdate,
}) {
  const { t } = useLanguage()
  const formatError = useWorkflowError()

  // ─── 1. Personal Information State ──────────────────────────────────────────
  const initialFullName =
    user?.full_name ||
    user?.user_metadata?.full_name ||
    user?.displayName ||
    (user?.email ? user.email.split('@')[0] : 'User')

  const initialJobTitle =
    user?.job_title ?? user?.user_metadata?.job_title ?? ''

  const [fullName, setFullName] = useState(initialFullName)
  const [jobTitle, setJobTitle] = useState(initialJobTitle)
  const [savingPersonal, setSavingPersonal] = useState(false)
  const [personalMsg, setPersonalMsg] = useState({ text: '', type: '' })

  // ─── 2. Password Form State ────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  // ─── 3. Computed Helpers ───────────────────────────────────────────────────
  const email = user?.email || 'user@castravision.internal'

  // Compute 2-letter uppercase initials
  const initials = (() => {
    if (fullName) {
      const parts = fullName.trim().split(/\s+/)
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return fullName.substring(0, 2).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  })()

  // Role display metadata
  const roleMeta = (() => {
    switch (role) {
      case 'manager':
        return {
          label: 'MANAGER',
          displayRole: 'Marketing Manager / Company Admin',
          badgeClass: 'bg-[#8083ff]/15 text-[#8083ff] border-[#8083ff]/30',
        }
      case 'leader':
        return {
          label: 'LEADER',
          displayRole: 'Leader / Workspace Lead',
          badgeClass: 'bg-[#4cd7f6]/15 text-[#4cd7f6] border-[#4cd7f6]/30',
        }
      case 'system_admin':
        return {
          label: 'SYS ADMIN',
          displayRole: 'System Administrator (Root)',
          badgeClass: 'bg-[#8083ff]/15 text-[#8083ff] border-[#8083ff]/30',
        }
      default:
        return {
          label: 'EMPLOYEE',
          displayRole: 'Employee / Contributor',
          badgeClass: 'bg-[#4cd7f6]/15 text-[#4cd7f6] border-[#4cd7f6]/30',
        }
    }
  })()

  // Password validation rules
  const ruleLen = newPassword.length >= 8
  const ruleUpper = /[A-Z]/.test(newPassword)
  const ruleNumOrSpec = /[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword)
  const allRulesPassed = ruleLen && ruleUpper && ruleNumOrSpec
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0
  const showMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword

  const isDemoUser = Boolean(
    user?.is_demo ||
    ['sa-001', 'mgr-001', 'ldr-001', 'mbr-001'].includes(user?.id) ||
    user?.id?.startsWith('sa-') ||
    user?.id?.startsWith('mgr-') ||
    user?.id?.startsWith('ldr-') ||
    user?.id?.startsWith('mbr-')
  )

  const handleResetPersonal = () => {
    setFullName(initialFullName)
    setJobTitle(initialJobTitle)
    setPersonalMsg({ text: t('employeeSettings.personalReset'), type: 'info' })
    setTimeout(() => setPersonalMsg({ text: '', type: '' }), 3000)
  }

  const handleSavePersonal = async (e) => {
    e.preventDefault()
    const cleanFullName = fullName.trim()
    const cleanJobTitle = jobTitle.trim()

    if (!cleanFullName) {
      setPersonalMsg({ text: t('employeeSettings.nameRequired'), type: 'error' })
      return
    }

    setSavingPersonal(true)
    setPersonalMsg({ text: '', type: '' })

    try {
      // If authentic Supabase session exists
      if (supabase && user?.id && !isDemoUser) {
        // --- Operation A: Supabase Auth Metadata ---
        const { data: authData, error: authError } = await supabase.auth.updateUser({
          data: {
            full_name: cleanFullName,
            job_title: cleanJobTitle,
          },
        })

        if (authError) {
          // Operation A failed: preserve existing profile data, report error, do not proceed to Operation B
          setPersonalMsg({
            text: t('employeeSettings.accountError', {message: authError.message || t('employeeSettings.authSaveError')}),
            type: 'error',
          })
          return
        }

        // Operation A succeeded -> Update global application user state
        if (onUserUpdate && authData?.user) {
          onUserUpdate(authData.user)
        }

        // --- Operation B: public.profiles table ---
        let profileSyncError = null
        try {
          const { data: savedProfile, error: pErr } = await supabase
            .from('profiles')
            .update({
              full_name: cleanFullName,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .select('id')
            .maybeSingle()

          if (pErr || !savedProfile) {
            profileSyncError = pErr || new Error(t('employeeSettings.profileMissing'))
          }
        } catch (syncEx) {
          profileSyncError = syncEx
        }

        // --- Evaluate persistence results ---
        if (!profileSyncError) {
          // Both operations succeeded
          const fullSuccessMsg = t('employeeSettings.personalSaved')
          setPersonalMsg({ text: fullSuccessMsg, type: 'success' })
          if (notify) notify(fullSuccessMsg)
        } else {
          // Partial Failure: Auth succeeded, but public.profiles failed
          const partialMsg = t('employeeSettings.partialError', {message: profileSyncError.message || t('employeeSettings.rlsError')})
          setPersonalMsg({ text: partialMsg, type: 'warning' })
          if (notify) notify(t('employeeSettings.partialNotice'))
        }
      } else {
        // Fallback for demo or local session
        if (onUserUpdate) {
          onUserUpdate({
            ...user,
            user_metadata: {
              ...(user?.user_metadata || {}),
              full_name: cleanFullName,
              job_title: cleanJobTitle,
            },
          })
        }
        const demoMsg = t('employeeSettings.demoPersonalSaved')
        setPersonalMsg({ text: demoMsg, type: 'success' })
        if (notify) notify(demoMsg)
      }
    } catch (err) {
      setPersonalMsg({
        text: err.message || t('employeeSettings.personalSaveError'),
        type: 'error',
      })
    } finally {
      setSavingPersonal(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    // 1. Validation check
    if (!currentPassword) {
      setPasswordError(t('employeeSettings.currentPasswordRequired'))
      return
    }
    if (!allRulesPassed) {
      setPasswordError(t('employeeSettings.passwordRulesError'))
      return
    }
    if (!passwordsMatch) {
      setPasswordError(t('employeeSettings.passwordMismatchError'))
      return
    }
    if (newPassword === currentPassword) {
      setPasswordError(t('employeeSettings.samePasswordError'))
      return
    }

    // 2. Demo mode check: strictly DO NOT simulate password updates
    if (!supabase || isDemoUser || !user?.id) {
      setPasswordError(
        t('employeeSettings.demoPasswordError')
      )
      return
    }

    setUpdatingPassword(true)
    try {
      // 3. Security verification: Verify current password first via re-authentication
      await changeAccountPassword(user.id, currentPassword, newPassword)

      // 5. Success confirmation
      setPasswordSuccess(t('employeeSettings.passwordSaved'))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      if (notify) notify(t('employeeSettings.passwordSuccess'))
    } catch (err) {
      setPasswordError(formatError(err) || t('employeeSettings.passwordSaveError'))
    } finally {
      setUpdatingPassword(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ─── CARD 1: Personal Information (7 Columns) ─────────────────────────── */}
      <section className="lg:col-span-7 bg-[#1c1f2a] rounded-xl border border-[#464554] overflow-hidden flex flex-col shadow-sm">
        {/* Card Header */}
        <div className="px-6 py-4 flex items-center justify-between bg-[#171b26]/60 border-b border-[#464554]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#8083ff]/15 border border-[#8083ff]/30 flex items-center justify-center text-[#8083ff]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#dfe2f1]">
                {t('settings.accountSecurity.personalInfoTitle')}
              </h2>
              <p className="text-xs text-[#c7c4d7]">
                {t('settings.accountSecurity.personalInfoSubtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-6">
          {/* User Profile Banner Strip */}
          <div className="p-4 rounded-lg bg-[#0a0e18] border border-[#464554]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#262a35] border border-[#464554] text-[#dfe2f1] font-bold text-lg ring-2 ring-[#8083ff]/20 shadow-md flex items-center justify-center flex-shrink-0">
                {initials}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-[#dfe2f1] truncate">
                    {fullName || 'User'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase leading-none border ${roleMeta.badgeClass}`}
                  >
                    {roleMeta.label}
                  </span>
                </div>
                <span className="text-xs text-[#4cd7f6] font-mono mt-0.5 truncate">
                  {email}
                </span>
                {membership?.workspaceName && (
                  <span className="text-[11px] text-[#c7c4d7]/70 font-mono truncate">
                    Workspace: {membership.workspaceName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Feedback Message */}
          {personalMsg.text && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                personalMsg.type === 'success'
                  ? 'bg-[#28a745]/15 text-[#28a745] border-[#28a745]/30'
                  : personalMsg.type === 'error'
                  ? 'bg-[#ffb4ab]/15 text-[#ffb4ab] border-[#ffb4ab]/30'
                  : personalMsg.type === 'warning'
                  ? 'bg-[#ff9800]/15 text-[#ffb74d] border-[#ff9800]/30'
                  : 'bg-[#262a35] text-[#dfe2f1] border-[#464554]'
              }`}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{personalMsg.text}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSavePersonal} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="input-fullname"
                  className="text-xs font-medium text-[#c7c4d7]"
                >{t('employeeSettings.fullName')}</label>
                <div className="relative">
                  <input
                    id="input-fullname"
                    maxLength={120}
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-11 px-3.5 bg-[#0a0e18] text-[#dfe2f1] placeholder:text-[#908fa0] rounded-lg text-sm border border-[#464554] focus:outline-none focus:border-[#8083ff] transition-all"
                    placeholder={t('employeeSettings.fullNamePlaceholder')}
                  />
                </div>
              </div>

              {/* Job Title */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="input-jobtitle"
                  className="text-xs font-medium text-[#c7c4d7]"
                >{t('employeeSettings.jobTitle')}</label>
                <div className="relative">
                  <input
                    id="input-jobtitle"
                    type="text"
                    maxLength={120}
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full h-11 px-3.5 bg-[#0a0e18] text-[#dfe2f1] placeholder:text-[#908fa0] rounded-lg text-sm border border-[#464554] focus:outline-none focus:border-[#8083ff] transition-all"
                    placeholder={t('employeeSettings.jobTitlePlaceholder')}
                  />
                </div>
              </div>

              {/* Email Address (Read-only) */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="input-email"
                  className="text-xs font-medium text-[#908fa0] flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-[#908fa0]" />
                  <span>{t('employeeSettings.emailAddress')}</span>
                </label>
                <div className="relative">
                  <input
                    id="input-email"
                    type="email"
                    disabled
                    readOnly
                    value={email}
                    className="w-full h-11 pl-3.5 pr-10 bg-[#171b26] text-[#908fa0] rounded-lg text-sm font-mono border border-[#464554]/60 cursor-not-allowed select-none focus:outline-none"
                  />
                  <Lock className="w-4 h-4 text-[#908fa0]/60 absolute right-3 top-3.5" />
                </div>
              </div>

              {/* Current Role (Read-only) */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="input-role"
                  className="text-xs font-medium text-[#908fa0] flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-[#908fa0]" />
                  <span>{t('employeeSettings.currentRole')}</span>
                </label>
                <div className="relative">
                  <input
                    id="input-role"
                    type="text"
                    disabled
                    readOnly
                    value={roleMeta.displayRole}
                    className="w-full h-11 pl-3.5 pr-10 bg-[#171b26] text-[#908fa0] rounded-lg text-sm border border-[#464554]/60 cursor-not-allowed select-none focus:outline-none"
                  />
                  <Lock className="w-4 h-4 text-[#908fa0]/60 absolute right-3 top-3.5" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#464554]/60">
              <button
                type="button"
                onClick={handleResetPersonal}
                className="px-4 py-2 rounded-lg border border-[#464554] text-[#dfe2f1] hover:bg-[#262a35] text-sm font-medium transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={savingPersonal}
                className="px-5 py-2 rounded-lg bg-[#28a745] hover:bg-[#218838] text-white text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingPersonal ? t('common.saving') : t('common.save')}</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ─── CARD 2: Authentication & Password (5 Columns) ────────────────────── */}
      <section className="lg:col-span-5 bg-[#1c1f2a] rounded-xl border border-[#464554] overflow-hidden flex flex-col shadow-sm">
        {/* Card Header */}
        <div className="px-6 py-4 flex items-center justify-between bg-[#171b26]/60 border-b border-[#464554]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#8083ff]/15 border border-[#8083ff]/30 flex items-center justify-center text-[#8083ff]">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#dfe2f1]">
                {t('settings.accountSecurity.passwordTitle')}
              </h2>
              <p className="text-xs text-[#c7c4d7]">
                {t('settings.accountSecurity.passwordSubtitle')}
              </p>
            </div>
          </div>
          <ShieldCheck className="w-5 h-5 text-[#908fa0]" />
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-4">
          {/* Error / Success Alerts */}
          {passwordError && (
            <div className="p-3 rounded-lg text-xs flex items-center gap-2 bg-[#ffb4ab]/15 text-[#ffb4ab] border border-[#ffb4ab]/30">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}
          {passwordSuccess && (
            <div className="p-3 rounded-lg text-xs flex items-center gap-2 bg-[#28a745]/15 text-[#28a745] border border-[#28a745]/30">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {/* Current Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="pwd-current"
                className="text-xs font-medium text-[#c7c4d7]"
              >{t('employeeSettings.currentPassword')}</label>
              <div className="relative">
                <input
                  id="pwd-current"
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t('employeeSettings.currentPasswordPlaceholder')}
                  className="w-full h-11 pl-3.5 pr-10 bg-[#0a0e18] text-[#dfe2f1] placeholder:text-[#908fa0] rounded-lg text-sm border border-[#464554] focus:outline-none focus:border-[#8083ff] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-3 text-[#908fa0] hover:text-[#dfe2f1] transition-colors"
                >
                  {showCurrent ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="pwd-new"
                className="text-xs font-medium text-[#c7c4d7]"
              >{t('employeeSettings.newPassword')}</label>
              <div className="relative">
                <input
                  id="pwd-new"
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('employeeSettings.newPasswordPlaceholder')}
                  className="w-full h-11 pl-3.5 pr-10 bg-[#0a0e18] text-[#dfe2f1] placeholder:text-[#908fa0] rounded-lg text-sm border border-[#464554] focus:outline-none focus:border-[#8083ff] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-3 text-[#908fa0] hover:text-[#dfe2f1] transition-colors"
                >
                  {showNew ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="pwd-confirm"
                className="text-xs font-medium text-[#c7c4d7]"
              >{t('employeeSettings.confirmPassword')}</label>
              <div className="relative">
                <input
                  id="pwd-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('employeeSettings.confirmPasswordPlaceholder')}
                  className="w-full h-11 pl-3.5 pr-10 bg-[#0a0e18] text-[#dfe2f1] placeholder:text-[#908fa0] rounded-lg text-sm border border-[#464554] focus:outline-none focus:border-[#8083ff] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-3 text-[#908fa0] hover:text-[#dfe2f1] transition-colors"
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {showMismatch && (
                <p className="text-[#ffb4ab] text-xs flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{t('employeeSettings.passwordMismatch')}</span>
                </p>
              )}
            </div>

            {/* Password Requirements Checklist */}
            <div className="p-3.5 rounded-lg bg-[#0a0e18] border border-[#464554]/60 space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#908fa0] font-semibold">{t('employeeSettings.passwordRequirements')}</span>
              <ul className="space-y-1.5 text-xs">
                <li
                  className={`flex items-center gap-2 ${
                    ruleLen ? 'text-[#28a745]' : 'text-[#c7c4d7]'
                  }`}
                >
                  {ruleLen ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#28a745]" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-[#908fa0]" />
                  )}
                  <span>{t('employeeSettings.passwordLength')}</span>
                </li>
                <li
                  className={`flex items-center gap-2 ${
                    ruleUpper ? 'text-[#28a745]' : 'text-[#c7c4d7]'
                  }`}
                >
                  {ruleUpper ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#28a745]" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-[#908fa0]" />
                  )}
                  <span>{t('employeeSettings.passwordUpper')}</span>
                </li>
                <li
                  className={`flex items-center gap-2 ${
                    ruleNumOrSpec ? 'text-[#28a745]' : 'text-[#c7c4d7]'
                  }`}
                >
                  {ruleNumOrSpec ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#28a745]" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-[#908fa0]" />
                  )}
                  <span>{t('employeeSettings.passwordNumber')}</span>
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={updatingPassword}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#8083ff] hover:bg-[#8083ff]/90 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-[#8083ff]/20 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {updatingPassword ? t('common.saving') : t('settings.accountSecurity.updatePassword')}
                </span>
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

AccountSecurityTab.propTypes = {
  user: PropTypes.object,
  role: PropTypes.string,
  membership: PropTypes.object,
  notify: PropTypes.func,
  onUserUpdate: PropTypes.func,
}

export default AccountSecurityTab
