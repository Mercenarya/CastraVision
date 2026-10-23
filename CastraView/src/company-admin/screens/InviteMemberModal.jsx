import { useState } from 'react'
import { PrimaryButton, SecondaryButton } from '../ui/Primitives'
import {
  IconMail,
  IconSend,
  IconAlertTriangle,
  IconAlertCircle,
  IconRotateCw,
  IconUsers,
  IconCheckCircle,
  IconClock,
  IconX,
  IconChevronRight,
} from '../ui/Icons'

/**
 * InviteMemberModal.jsx — Screen 4 / FR06: Invite Workspace Member
 * Complete state-machine matching the six Figma reference screenshots:
 * 1. invitemember—default.jpg
 * 2. invitemember—invalidemail.jpg
 * 3. invitemember—alreadyinvited.jpg
 * 4. invitemember—sending.jpg
 * 5. invitemember—success.jpg
 * 6. invitemember—error.jpg
 *
 * Phase 4.1 Integrity Fix:
 * - Separates Figma design previews from real invitation operations.
 * - Preview interactions NEVER mutate workspace membership or invitation records.
 * - Preview bar is hidden in production builds (import.meta.env.DEV only).
 * - Real submission checks for operational backend. When unavailable, displays:
 *   "Invitations are not available yet. Email delivery has not been configured."
 *   without fake success or roster mutation.
 */
export default function InviteMemberModal({
  isOpen,
  onClose,
  onInvite,
  existingMembers = [],
  workspaceName = 'Acme Corp',
}) {
  // Primary workflow states: 'default' | 'invalid-email' | 'already-invited' | 'sending' | 'success' | 'error'
  const [viewState, setViewState] = useState('default')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Manager')
  const [errorMessage, setErrorMessage] = useState('')
  const [pendingMeta, setPendingMeta] = useState(null)
  const [lastDelivered, setLastDelivered] = useState(null)
  const [isResend, setIsResend] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [backendUnavailable, setBackendUnavailable] = useState(false)

  function handleClose() {
    setViewState('default')
    setEmail('')
    setRole('Manager')
    setErrorMessage('')
    setPendingMeta(null)
    setIsResend(false)
    setIsPreviewMode(false)
    setBackendUnavailable(false)
    onClose()
  }

  if (!isOpen) return null

  // Role tier specifications matching Figma
  const roleOptions = [
    {
      key: 'Admin',
      name: 'Admin',
      badge: 'FULL ACCESS',
      tier: 'TIER 0',
      description: 'Full access to workspace configuration, member management, FR04 approvals, and FR11 audit logs.',
    },
    {
      key: 'Manager',
      name: 'Manager',
      badge: 'RECOMMENDED',
      tier: 'SIGN-OFF LEAD',
      description: 'Can approve, reject, and edit proposals (FR04), create campaigns and strategies.',
    },
    {
      key: 'Member',
      name: 'Member',
      badge: 'STANDARD',
      tier: 'STANDARD USER',
      description: 'Can generate content, create strategies, import data. Strictly NO access to the Approval Queue.',
    },
  ]

  // Email input validation handler
  function handleEmailChange(val) {
    setEmail(val)
    if (backendUnavailable) setBackendUnavailable(false)
    const trimmed = val.trim().toLowerCase()

    if (!trimmed) {
      if (viewState !== 'default') setViewState('default')
      setErrorMessage('')
      setPendingMeta(null)
      return
    }

    // Client-side duplicate check (immediate feedback; does not replace server-side checks)
    const existing = existingMembers.find((m) => m.email?.toLowerCase() === trimmed)
    if (existing) {
      if (existing.status === 'pending') {
        setViewState('already-invited')
        setPendingMeta({
          email: existing.email,
          date: existing.joined || 'Oct 19, 2026',
          relativeTime: '4 days ago',
        })
        setErrorMessage('')
        return
      } else {
        setViewState('invalid-email')
        setErrorMessage(`This user (${existing.name || trimmed}) is already an active member in this workspace.`)
        return
      }
    }

    // Clear duplicate/error when typing a new email
    if (viewState === 'already-invited' || viewState === 'error') {
      setViewState('default')
      setPendingMeta(null)
      setErrorMessage('')
    }
  }

  // Handle invitation submission in real mode
  async function handleSubmit(e) {
    if (e) e.preventDefault()
    setErrorMessage('')
    setBackendUnavailable(false)

    const trimmed = email.trim()

    // 1. Missing required email
    if (!trimmed) {
      setViewState('invalid-email')
      setErrorMessage('Please enter a valid work email address (e.g., name@organization.com).')
      return
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      setViewState('invalid-email')
      setErrorMessage('Please enter a valid work email address (e.g., name@organization.com).')
      return
    }

    // 3. Client-side duplicate check
    const existing = existingMembers.find((m) => m.email?.toLowerCase() === trimmed.toLowerCase())
    if (existing) {
      if (existing.status === 'pending') {
        setViewState('already-invited')
        setPendingMeta({
          email: existing.email,
          date: existing.joined || 'Oct 19, 2026',
          relativeTime: '4 days ago',
        })
        return
      } else {
        setViewState('invalid-email')
        setErrorMessage(`This user is already an active member of ${workspaceName}.`)
        return
      }
    }

    // 4. Normal Submission with Backend Availability Verification
    setViewState('sending')
    try {
      const res = await onInvite?.({ email: trimmed, role })
      if (!res || !res.success) {
        // Backend invitation endpoint is unavailable or not configured
        setViewState('default')
        setBackendUnavailable(true)
        return
      }

      // If backend successfully confirms persistence:
      setLastDelivered({
        email: trimmed,
        role,
        workspace: workspaceName,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      })
      setIsPreviewMode(false)
      setViewState('success')
    } catch {
      setViewState('default')
      setBackendUnavailable(true)
    }
  }

  // Handle Resend invitation
  async function handleResend() {
    if (backendUnavailable) setBackendUnavailable(false)
    if (isPreviewMode) {
      setIsResend(true)
      setViewState('sending')
      setTimeout(() => {
        setLastDelivered({
          email: email.trim() || pendingMeta?.email || 'chloe.nguyen@acmecorp.com',
          role,
          workspace: workspaceName,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        })
        setViewState('success')
      }, 700)
      return
    }

    // Real resend:
    setViewState('sending')
    try {
      const res = await onInvite?.({ email: email.trim() || pendingMeta?.email, role })
      if (!res || !res.success) {
        setViewState('default')
        setBackendUnavailable(true)
        return
      }
      setLastDelivered({
        email: email.trim() || pendingMeta?.email,
        role,
        workspace: workspaceName,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      })
      setViewState('success')
    } catch {
      setViewState('default')
      setBackendUnavailable(true)
    }
  }

  // Finalize and close modal without mutating if in preview
  function handleDone() {
    handleClose()
  }

  // Preset quick state switchers for design review and verification (non-mutating)
  function applyPreset(stateKey) {
    setIsPreviewMode(true)
    setBackendUnavailable(false)

    if (stateKey === 'default') {
      setViewState('default')
      setEmail('')
      setRole('Manager')
      setErrorMessage('')
      setPendingMeta(null)
    } else if (stateKey === 'invalid-email') {
      setViewState('invalid-email')
      setEmail('jordan.lee-incomplete-email')
      setErrorMessage('Please enter a valid work email address (e.g., name@organization.com).')
    } else if (stateKey === 'already-invited') {
      setViewState('already-invited')
      setEmail('chloe.nguyen@acmecorp.com')
      setPendingMeta({
        email: 'chloe.nguyen@acmecorp.com',
        date: 'Oct 19, 2026',
        relativeTime: '4 days ago',
      })
    } else if (stateKey === 'sending') {
      setEmail('marcus.cole@acmecorp.com')
      setViewState('sending')
    } else if (stateKey === 'success') {
      setLastDelivered({
        email: 'marcus.cole@acmecorp.com',
        role: 'Manager',
        workspace: 'Acme Corp Global',
        date: 'Oct 23, 2026',
      })
      setViewState('success')
    } else if (stateKey === 'error') {
      setViewState('error')
      setEmail('alex.turner@upstream-unreachable.io')
    }
  }

  const isLocked = viewState === 'sending'

  return (
    <div
      className="ca-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="ca-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ca-invite-title"
        style={{ maxWidth: 560 }}
      >
        {/* Figma Reference States Switcher Bar (Visible only in Development) */}
        {import.meta.env.DEV && (
          <div className="ca-invite-dev-preview-bar">
            <span style={{ color: 'var(--ca-amber)', fontWeight: 600, fontSize: 10.5 }}>
              [DEV PREVIEW ONLY — Non-mutating design fixtures]:
            </span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[
                { id: 'default', label: 'Default' },
                { id: 'invalid-email', label: 'Invalid Email' },
                { id: 'already-invited', label: 'Already Invited' },
                { id: 'sending', label: 'Sending' },
                { id: 'success', label: 'Success' },
                { id: 'error', label: 'Error' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.id)}
                  style={{
                    background: isPreviewMode && viewState === p.id ? 'var(--ca-purple)' : 'rgba(255,255,255,0.05)',
                    border: 'none',
                    borderRadius: 4,
                    padding: '2px 7px',
                    color: isPreviewMode && viewState === p.id ? '#ffffff' : 'var(--ca-text-secondary)',
                    fontSize: 10.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="ca-modal-header">
          <div className="ca-modal-header-left">
            <div className="ca-modal-icon-badge" aria-hidden="true" style={{ color: 'var(--ca-purple)' }}>
              <IconMail size={18} />
            </div>
            <div>
              <h2 id="ca-invite-title" className="ca-modal-title">
                Invite Workspace Member
              </h2>
              <p className="ca-modal-subtitle">
                Send a secure invitation link with role-based workspace access permissions.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="ca-modal-close"
            onClick={handleClose}
            aria-label="Close dialog"
            disabled={isLocked}
          >
            <IconX size={16} />
          </button>
        </div>

        {/* ── SUCCESS STATE VIEW (invitemember—success.jpg) ── */}
        {viewState === 'success' ? (
          <div className="ca-modal-body">
            <div className="ca-invite-success-view">
              <div className="ca-invite-success-icon-badge">
                <IconCheckCircle size={26} />
              </div>
              <div>
                <h3 className="ca-invite-success-title">
                  {isResend ? 'Invitation Token Re-dispatched!' : 'Invitation Dispatched!'}
                </h3>
                <p className="ca-invite-success-subtitle">
                  A secure 7-day workspace onboarding link has been dispatched to the invitee.
                </p>
              </div>

              {/* Development Preview Qualification Banner */}
              {isPreviewMode && (
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: 'var(--ca-radius-md)',
                    padding: '8px 12px',
                    fontSize: 11.5,
                    color: '#fde68a',
                    textAlign: 'left',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <strong>FIGMA DESIGN PREVIEW:</strong> This screen is a static visual representation matching Figma (invitemember—success.jpg). Workspace membership is not mutated and no actual email was sent.
                </div>
              )}

              {/* Delivery Metadata Box */}
              <div className="ca-invite-delivery-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="ca-invite-delivery-icon">
                    <IconSend size={18} />
                  </div>
                  <div>
                    <div className="ca-invite-delivery-heading">
                      {lastDelivered?.email || 'marcus.cole@acmecorp.com'}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#6ee7b7' }}>
                      Single-use cryptographic registration token active
                    </div>
                  </div>
                </div>

                <div className="ca-invite-metadata-grid">
                  <div className="ca-invite-metadata-row">
                    <span className="ca-invite-metadata-label">Assigned Role</span>
                    <span className="ca-invite-metadata-val cyan">
                      {lastDelivered?.role || 'Manager'} (Sign-Off Lead)
                    </span>
                  </div>
                  <div className="ca-invite-metadata-row">
                    <span className="ca-invite-metadata-label">Target Workspace</span>
                    <span className="ca-invite-metadata-val">
                      {lastDelivered?.workspace || workspaceName}
                    </span>
                  </div>
                  <div className="ca-invite-metadata-row">
                    <span className="ca-invite-metadata-label">Expiration</span>
                    <span className="ca-invite-metadata-val" style={{ color: '#fbbf24' }}>
                      7 days remaining (Single-use token)
                    </span>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 12, color: 'var(--ca-text-muted)', lineHeight: 1.45, margin: 0 }}>
                The invitee will receive onboarding instructions. Once they accept, their workspace seat status will update automatically.
              </p>
            </div>

            {/* Success Actions */}
            <div className="ca-modal-footer" style={{ marginTop: 16 }}>
              <SecondaryButton onClick={() => applyPreset('default')}>
                + Invite Another Member
              </SecondaryButton>
              <PrimaryButton onClick={handleDone}>
                Done & Return to Members <IconChevronRight size={14} />
              </PrimaryButton>
            </div>
          </div>
        ) : (
          /* ── STANDARD FORM (Default, Invalid, Already Invited, Sending, Error) ── */
          <form onSubmit={handleSubmit} noValidate>
            <div className="ca-modal-body">
              {/* Backend Unavailable Notice (Phase 4.1 Requirement) */}
              {backendUnavailable && (
                <div className="ca-invite-unavailable-banner" role="alert">
                  <IconAlertCircle size={20} style={{ flexShrink: 0, marginTop: 2, color: 'var(--ca-red)' }} />
                  <div>
                    <strong>Invitations are not available yet. Email delivery has not been configured.</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: 11.5, opacity: 0.9 }}>
                      No operational backend invitation endpoint or outbound email gateway is connected. Your inputs have been preserved and no workspace membership changes were made.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Banner (invitemember—error.jpg) */}
              {viewState === 'error' && (
                <div className="ca-invite-error-banner" role="alert">
                  <div className="ca-invite-error-header">
                    <IconAlertCircle size={18} />
                    <span>Unable to Dispatch Invitation</span>
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: 10,
                        background: 'rgba(0,0,0,0.3)',
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      DISPATCH_GATEWAY_TIMEOUT (Code 504)
                    </span>
                  </div>
                  <p className="ca-invite-error-body">
                    The workspace email gateway returned an upstream timeout while attempting to deliver the invitation token. The member record was not created. Your input has been preserved.
                  </p>
                </div>
              )}

              {/* Work Email Address Field */}
              <div className="ca-invite-email-container">
                <div
                  className={`ca-invite-email-box ${
                    viewState === 'invalid-email'
                      ? 'has-error'
                      : viewState === 'already-invited'
                      ? 'has-warning'
                      : ''
                  } ${isLocked ? 'is-locked' : ''}`}
                >
                  <div className="ca-invite-email-fields">
                    <label htmlFor="ca-invite-email-input" className="ca-invite-email-label">
                      WORK EMAIL ADDRESS
                    </label>
                    <input
                      id="ca-invite-email-input"
                      type="email"
                      className="ca-invite-email-input"
                      placeholder="colleague@company.com"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      disabled={isLocked}
                      autoFocus
                      autoComplete="off"
                    />
                  </div>

                  <div className="ca-invite-email-status-icon">
                    {viewState === 'invalid-email' ? (
                      <span style={{ color: 'var(--ca-red)' }} title="Invalid email format">
                        <IconAlertCircle size={18} />
                      </span>
                    ) : viewState === 'already-invited' ? (
                      <span style={{ color: 'var(--ca-amber)' }} title="Pending invitation detected">
                        <IconAlertTriangle size={18} />
                      </span>
                    ) : (
                      <span style={{ color: 'var(--ca-text-muted)' }}>
                        <IconMail size={18} />
                      </span>
                    )}
                  </div>
                </div>

                {/* Validation and Helper messages */}
                {viewState === 'invalid-email' ? (
                  <div className="ca-invite-helper-text ca-invite-helper-error">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <IconAlertCircle size={14} />
                      {errorMessage || 'Please enter a valid work email address (e.g., name@organization.com).'}
                    </span>
                  </div>
                ) : viewState === 'already-invited' ? (
                  /* Amber Warning Banner (invitemember—alreadyinvited.jpg) */
                  <div className="ca-invite-duplicate-banner" role="alert">
                    <div className="ca-invite-duplicate-header">
                      <div className="ca-invite-duplicate-title">
                        <IconAlertTriangle size={16} />
                        <span>Pending Invitation Already Exists</span>
                      </div>
                      <span className="ca-invite-duplicate-time">
                        {pendingMeta?.relativeTime ? `Dispatched ${pendingMeta.relativeTime}` : 'Active token'}
                      </span>
                    </div>
                    <p style={{ margin: 0 }}>
                      An active invitation was dispatched to <strong>{email}</strong> on {pendingMeta?.date || 'Oct 19, 2026'}. Resending will invalidate the previous security token and issue a fresh 7-day registration link.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                      <button
                        type="button"
                        className="ca-btn-cyan"
                        onClick={handleResend}
                        disabled={isLocked}
                      >
                        Resend Invite
                      </button>
                      <button
                        type="button"
                        className="ca-invite-view-dir-link"
                        onClick={handleClose}
                      >
                        View in Workspace Directory <IconChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="ca-invite-helper-text">
                    <span>
                      An invitation token valid for 7 days will be emailed with single-use registration instructions.
                    </span>
                  </div>
                )}
              </div>

              {/* Assigned Workspace Role Section */}
              <div className="ca-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="ca-form-label">ASSIGNED WORKSPACE ROLE</span>
                  <span style={{ fontSize: 11, color: 'var(--ca-text-muted)' }}>
                    FR04 / FR11 Protocol Rules
                  </span>
                </div>

                <div className="ca-role-cards-grid">
                  {roleOptions.map((opt) => {
                    const isSelected = role === opt.key
                    return (
                      <div
                        key={opt.key}
                        className={`ca-role-option-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => !isLocked && setRole(opt.key)}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={isLocked ? -1 : 0}
                        onKeyDown={(e) => !isLocked && e.key === ' ' && setRole(opt.key)}
                        style={{ opacity: isLocked ? 0.7 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}
                      >
                        <div className="ca-radio-indicator" />
                        <div className="ca-role-card-text">
                          <div className="ca-role-card-title-row">
                            <span className="ca-role-card-name">
                              {opt.name}
                              {opt.badge && (
                                <span
                                  className="ca-badge ca-badge-admin"
                                  style={{
                                    marginLeft: 6,
                                    fontSize: 9.5,
                                    padding: '1px 5px',
                                    background: opt.key === 'Manager' ? 'rgba(99,102,241,0.2)' : undefined,
                                    color: opt.key === 'Manager' ? '#a5b4fc' : undefined,
                                  }}
                                >
                                  {opt.badge}
                                </span>
                              )}
                            </span>
                            <span className="ca-role-card-tier">{opt.tier}</span>
                          </div>
                          <p className="ca-role-card-desc">{opt.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* In-Flight Sending Indicator (invitemember—sending.jpg) */}
              {viewState === 'sending' && (
                <div className="ca-invite-dispatching-card">
                  <div className="ca-invite-spinner" style={{ color: 'var(--ca-purple)' }}>
                    <IconRotateCw size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                      Dispatching Invitation Token...
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--ca-text-muted)' }}>
                      Generating single-use cryptographic token and routing delivery via workspace email gateway.
                    </div>
                  </div>
                </div>
              )}

              {/* Seat Allocation Card */}
              <div className="ca-invite-seat-box">
                <div className="ca-invite-seat-left">
                  <div className="ca-invite-seat-icon">
                    <IconUsers size={16} />
                  </div>
                  <div className="ca-invite-seat-meta">
                    <span className="ca-invite-seat-title">Enterprise Plan Seat Allocation</span>
                    <span className="ca-invite-seat-sub">
                      1 seat remaining in Enterprise allocation
                    </span>
                  </div>
                </div>
                <strong style={{ color: '#ffffff', fontSize: 13 }}>24 / 25 Seats Active</strong>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="ca-modal-footer">
              <span className="ca-modal-footer-notice" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <IconClock size={13} />
                Invitations expire after 7 days if unaccepted
              </span>
              <div className="ca-modal-footer-actions">
                <SecondaryButton onClick={handleClose} disabled={isLocked}>
                  Cancel
                </SecondaryButton>
                {viewState === 'error' ? (
                  <PrimaryButton
                    type="submit"
                    disabled={isLocked}
                    icon={<IconRotateCw size={14} />}
                  >
                    Retry Invitation
                  </PrimaryButton>
                ) : (
                  <PrimaryButton
                    type="submit"
                    disabled={isLocked || viewState === 'invalid-email'}
                    icon={<IconSend size={14} />}
                  >
                    {isLocked ? 'Dispatching...' : 'Send Invitation'}
                  </PrimaryButton>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
