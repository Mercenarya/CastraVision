import { useState } from 'react'
import { PrimaryButton, SecondaryButton } from '../ui/Primitives'

/**
 * InviteMemberModal.jsx — Screen 4
 * Interactive modal for adding/inviting new workspace employees by email and role.
 */
export default function InviteMemberModal({
  isOpen,
  onClose,
  onInvite,
  existingMembers = [],
  workspaceName = 'Acme Corp',
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Manager')
  const [busy, setBusy] = useState(false)
  const [error, setEmailError] = useState('')

  if (!isOpen) return null

  function handleSubmit(e) {
    e.preventDefault()
    setEmailError('')

    const trimmed = email.trim()
    if (!trimmed) {
      return setEmailError('Email address is required.')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return setEmailError('Please enter a valid work email address.')
    }
    if (existingMembers.some((m) => m.email?.toLowerCase() === trimmed.toLowerCase())) {
      return setEmailError('This member is already registered in the workspace.')
    }

    setBusy(true)
    setTimeout(() => {
      onInvite?.({
        email: trimmed,
        role,
      })
      setBusy(false)
      setEmail('')
      setRole('Manager')
      onClose()
    }, 600)
  }

  const roleOptions = [
    {
      key: 'Admin',
      name: 'Admin',
      tier: 'TIER 0',
      description: 'Full access to workspace configuration, member management, FR04 approvals, and FR11 audit logs.',
    },
    {
      key: 'Manager',
      name: 'Manager',
      tier: 'SIGN-OFF LEAD',
      badge: 'DEFAULT',
      description: 'Can approve, reject, and edit proposals (FR04), create campaigns and strategies.',
    },
    {
      key: 'Member',
      name: 'Member',
      tier: 'STANDARD USER',
      description: 'Can generate content, create strategies, import data. Strictly NO access to the Approval Queue.',
    },
  ]

  return (
    <div
      className="ca-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="ca-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ca-invite-title"
      >
        {/* Header */}
        <div className="ca-modal-header">
          <div className="ca-modal-header-left">
            <div className="ca-modal-icon-badge" aria-hidden="true">
              👤
            </div>
            <div>
              <h2 id="ca-invite-title" className="ca-modal-title">Invite New Member</h2>
              <p className="ca-modal-subtitle">
                Grant access to {workspaceName} workspace with role-based permissions.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="ca-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="ca-modal-body">
            {/* Email Field */}
            <div className="ca-form-group">
              <label htmlFor="ca-invite-email" className="ca-form-label">
                MEMBER EMAIL ADDRESS
              </label>
              <input
                id="ca-invite-email"
                type="email"
                className="ca-form-input"
                placeholder="jordan.lee@partnergroup.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setEmailError('')
                }}
                required
                autoComplete="off"
              />
              {error ? (
                <span className="ca-form-hint" style={{ color: 'var(--ca-red)' }}>
                  ⚠ {error}
                </span>
              ) : (
                <span className="ca-form-hint">
                  If the invitee does not have an existing CastraVision account, an invitation email with a secure registration link will be dispatched.
                </span>
              )}
            </div>

            {/* Assigned Role Section */}
            <div className="ca-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="ca-form-label">ASSIGNED ROLE</span>
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
                      onClick={() => setRole(opt.key)}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === ' ' && setRole(opt.key)}
                    >
                      <div className="ca-radio-indicator" />
                      <div className="ca-role-card-text">
                        <div className="ca-role-card-title-row">
                          <span className="ca-role-card-name">
                            {opt.name}
                            {opt.badge && (
                              <span
                                className="ca-badge ca-badge-admin"
                                style={{ marginLeft: 6, fontSize: 9.5, padding: '1px 5px' }}
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

            {/* Seat status notice */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 'var(--ca-radius-md)',
                fontSize: 12,
                color: '#6ee7b7',
              }}
            >
              <span>✓ Valid email format. 1 seat remaining in Enterprise allocation.</span>
              <strong style={{ color: '#ffffff' }}>24/25 Seats</strong>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="ca-modal-footer">
            <span className="ca-modal-footer-notice">
              🛡 FR06 Security Audit will log this invitation timestamp.
            </span>
            <div className="ca-modal-footer-actions">
              <SecondaryButton onClick={onClose} disabled={busy}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={busy} icon="✈">
                {busy ? 'Dispatching…' : 'Send Invitation'}
              </PrimaryButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
