import React from 'react'

/**
 * MetricCard — 4-column KPI metric card used across System Admin screens
 */
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
  return (
    <div className={`sa-metric-card ${highlight ? 'highlight' : ''}`}>
      <div className="sa-metric-header">
        <span className="sa-metric-label">{label}</span>
        {icon && <span className="sa-metric-icon">{icon}</span>}
      </div>
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
    </div>
  )
}

/**
 * StatusBadge — Operational badge for company status
 */
export function StatusBadge({ status }) {
  const isInactive =
    status === 'Inactive' || status === 'Suspended' || status === 'Pending Setup'
  return (
    <span className={`sa-status-badge ${isInactive ? 'inactive' : 'active'}`}>
      <span className="sa-status-dot" />
      {status}
    </span>
  )
}

/**
 * CompanyAvatar — Avatar with initials and rounded square shape matching Figma
 */
export function CompanyAvatar({ initials, bg = '#2563eb', size = 36, rounded = 'square' }) {
  return (
    <div
      className="sa-avatar"
      style={{
        backgroundColor: bg,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: rounded === 'square' ? '6px' : '50%',
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
            <span className="sa-privacy-title">PHẠM VI QUẢN TRỊ NỀN TẢNG</span>
            <span className="sa-privacy-badge dark">ZERO PII POLICY</span>
          </div>
          <p className="sa-privacy-desc">
            Số thành viên là tổng hợp membership, không phải quota. Màn hình quản trị không cung cấp danh sách nhân viên hoặc nội dung chiến dịch.{' '}
            <span className="sa-privacy-note">
              Quota và thông số hạ tầng chỉ xuất hiện khi có nguồn dữ liệu được cấu hình.
            </span>
          </p>
        </div>
      </div>
    )
  }

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
          <span className="sa-privacy-title">Phạm vi quản trị doanh nghiệp</span>
          <span className="sa-privacy-badge">METADATA & AGGREGATE</span>
        </div>
        <p className="sa-privacy-desc">
          System Admin quản trị thông tin doanh nghiệp và số liệu tổng hợp; không có quyền truy cập nội dung chiến dịch hay danh sách nhân viên qua màn hình này.{' '}
          <span className="sa-privacy-note">
            Chưa cấu hình nguồn đo uptime, storage hoặc xác minh DNS.
          </span>
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
