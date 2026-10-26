import React from 'react'

/**
 * MetricCard — 4-column KPI metric card used across System Admin screens
 */
<<<<<<< HEAD
export function MetricCard({ label, value, subtext, badge, icon, highlight = false }) {
=======
export function MetricCard({
  label,
  value,
  subtext,
  badge,
  badgeType = 'green', // 'green' | 'green-solid' | 'blue' | 'dark' | 'amber' | 'cyan'
  icon,
  highlight = false,
  unit,
  dotColor,
}) {
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232
  return (
    <div className={`sa-metric-card ${highlight ? 'highlight' : ''}`}>
      <div className="sa-metric-header">
        <span className="sa-metric-label">{label}</span>
        {icon && <span className="sa-metric-icon">{icon}</span>}
      </div>
<<<<<<< HEAD
      <div className="sa-metric-value">{value}</div>
      <div className="sa-metric-footer">
        {badge && <span className="sa-metric-badge">{badge}</span>}
        {subtext && <span className="sa-metric-subtext">{subtext}</span>}
      </div>
=======
      <div className="sa-metric-body-row">
        <span className="sa-metric-value">{value}</span>
        {unit && <span className="sa-metric-unit">{unit}</span>}
        {badge && <span className={`sa-metric-badge ${badgeType}`}>{badge}</span>}
      </div>
      {subtext && (
        <div className="sa-metric-subtext">
          {dotColor && <span className={`sa-kpi-dot ${dotColor}`} />}
          {subtext}
        </div>
      )}
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232
    </div>
  )
}

/**
 * StatusBadge — Operational badge for company status
 */
export function StatusBadge({ status }) {
<<<<<<< HEAD
  const isInactive = status === 'Inactive' || status === 'Suspended' || status === 'Pending Setup'
=======
  const isInactive =
    status === 'Inactive' || status === 'Suspended' || status === 'Pending Setup'
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232
  return (
    <span className={`sa-status-badge ${isInactive ? 'inactive' : 'active'}`}>
      <span className="sa-status-dot" />
      {status}
    </span>
  )
}

/**
<<<<<<< HEAD
 * CompanyAvatar — Circular avatar with initials and unique background color
 */
export function CompanyAvatar({ initials, bg = '#2563eb', size = 36 }) {
=======
 * CompanyAvatar — Avatar with initials and rounded square shape matching Figma
 */
export function CompanyAvatar({ initials, bg = '#2563eb', size = 36, rounded = 'square' }) {
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232
  return (
    <div
      className="sa-avatar"
      style={{
        backgroundColor: bg,
        width: `${size}px`,
        height: `${size}px`,
<<<<<<< HEAD
=======
        borderRadius: rounded === 'square' ? '6px' : '50%',
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232
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
<<<<<<< HEAD
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
=======
export function TenantPrivacyNotice({ variant = 'overview', compact = false }) {
  if (variant === 'management') {
    return (
      <div className={`sa-privacy-banner ${compact ? 'compact' : ''}`}>
        <div className="sa-privacy-icon-box">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <div className="sa-privacy-content">
          <div className="sa-privacy-title-row">
            <span className="sa-privacy-title">TENANT PRIVACY BOUNDARY ACTIVE</span>
            <span className="sa-privacy-badge dark">ZERO PII POLICY</span>
          </div>
          <p className="sa-privacy-desc">
            Employee count reflects aggregated tenant seat quota. Individual employee identities, profiles, directory rosters, and workspace marketing strategies remain strictly inaccessible to System Admin console accounts.{' '}
            <span className="sa-privacy-note">
              *(Demonstration sandbox note: Architecture isolates tenant data; cryptographic enclave claims represent planned production specification.)*
            </span>
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232
          </p>
        </div>
      </div>
    )
  }

  return (
<<<<<<< HEAD
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
=======
    <div className={`sa-privacy-banner ${compact ? 'compact' : ''}`}>
      <div className="sa-privacy-icon-box">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </div>
      <div className="sa-privacy-content">
        <div className="sa-privacy-title-row">
          <span className="sa-privacy-title">Tenant Privacy Boundary Enforced</span>
          <span className="sa-privacy-badge">ZERO-KNOWLEDGE GUARD</span>
        </div>
        <p className="sa-privacy-desc">
          System Admin role possesses tenant-level operational oversight only. Access to company-internal employee rosters,
          personal identifiable information (PII), workgroups, and private AI campaign outputs is strictly isolated by
          cryptographic zero-knowledge tenant partitions.{' '}
          <span className="sa-privacy-note">
            *(Demonstration sandbox note: Architecture isolates tenant data; cryptographic enclave claims represent planned production specification.)*
          </span>
>>>>>>> 758d59f8d6cef023d3ca537aaf5d908b4756d232
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
