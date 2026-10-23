import React from 'react'

/**
 * MetricCard — 4-column KPI metric card used across System Admin screens
 */
export function MetricCard({ label, value, subtext, badge, icon, highlight = false }) {
  return (
    <div className={`sa-metric-card ${highlight ? 'highlight' : ''}`}>
      <div className="sa-metric-header">
        <span className="sa-metric-label">{label}</span>
        {icon && <span className="sa-metric-icon">{icon}</span>}
      </div>
      <div className="sa-metric-value">{value}</div>
      <div className="sa-metric-footer">
        {badge && <span className="sa-metric-badge">{badge}</span>}
        {subtext && <span className="sa-metric-subtext">{subtext}</span>}
      </div>
    </div>
  )
}

/**
 * StatusBadge — Operational badge for company status
 */
export function StatusBadge({ status }) {
  const isInactive = status === 'Inactive' || status === 'Suspended' || status === 'Pending Setup'
  return (
    <span className={`sa-status-badge ${isInactive ? 'inactive' : 'active'}`}>
      <span className="sa-status-dot" />
      {status}
    </span>
  )
}

/**
 * CompanyAvatar — Circular avatar with initials and unique background color
 */
export function CompanyAvatar({ initials, bg = '#2563eb', size = 36 }) {
  return (
    <div
      className="sa-avatar"
      style={{
        backgroundColor: bg,
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${Math.round(size * 0.38)}px`,
      }}
    >
      {initials}
    </div>
  )
}

/**
 * TenantPrivacyNotice — Full-width or compact tenant privacy sentinel notice
 */
export function TenantPrivacyNotice({ compact = false }) {
  if (compact) {
    return (
      <div className="sa-privacy-banner compact">
        <div className="sa-privacy-icon">🛡</div>
        <div className="sa-privacy-content">
          <div className="sa-privacy-title">
            TENANT PRIVACY BOUNDARY ENFORCED
            <span className="sa-privacy-tag">ZERO-KNOWLEDGE GUARD</span>
          </div>
          <p className="sa-privacy-desc">
            System Admin manages platform tenant accounts only. Individual employee records, internal workgroups,
            and private marketing campaigns remain strictly isolated and inaccessible under zero-exposure platform policies.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="sa-privacy-banner">
      <div className="sa-privacy-icon">🛡</div>
      <div className="sa-privacy-content">
        <div className="sa-privacy-title">
          TENANT PRIVACY BOUNDARY ENFORCED
          <span className="sa-privacy-tag">ZERO-KNOWLEDGE GUARD</span>
        </div>
        <p className="sa-privacy-desc">
          System Admin has tenant-level account oversight only. CastraVision platform architecture strictly prohibits platform-level
          access to internal employee directories, employee names/emails, internal company workgroups, workspace membership lists, or tenant-private marketing campaign data.
        </p>
      </div>
    </div>
  )
}

/**
 * AlertBanner — Form and operational status banners (Error, Warning, Success)
 */
export function AlertBanner({ type = 'info', title, message, tag, onDismiss }) {
  const icons = {
    error: '✕',
    warning: '⚠',
    success: '✓',
    info: 'ℹ',
  }

  return (
    <div className={`sa-alert-banner ${type}`}>
      <div className="sa-alert-icon">{icons[type] || 'ℹ'}</div>
      <div className="sa-alert-body">
        <div className="sa-alert-title-row">
          <span className="sa-alert-title">{title}</span>
          {tag && <span className={`sa-alert-tag ${type}`}>{tag}</span>}
        </div>
        {message && <p className="sa-alert-message">{message}</p>}
      </div>
      {onDismiss && (
        <button type="button" className="sa-alert-dismiss" onClick={onDismiss} aria-label="Dismiss alert">
          ×
        </button>
      )}
    </div>
  )
}
