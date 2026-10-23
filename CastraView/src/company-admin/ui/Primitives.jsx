/**
 * Primitives.jsx — Reusable UI Components for CastraVision Company Admin
 */

export function PageHeader({ badge, title, subtitle, actions }) {
  return (
    <div className="ca-page-header">
      <div className="ca-page-titles">
        <div className="ca-page-heading-row">
          <h1 className="ca-page-title">{title}</h1>
          {badge && <span className="ca-badge ca-badge-live">{badge}</span>}
        </div>
        {subtitle && <p className="ca-page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="ca-header-actions-group">{actions}</div>}
    </div>
  )
}

export function PrimaryButton({ children, onClick, disabled, className = '', type = 'button', icon }) {
  return (
    <button
      type={type}
      className={`ca-btn ca-btn-primary ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="ca-btn-icon" aria-hidden="true">{icon}</span>}
      {children}
    </button>
  )
}

export function SecondaryButton({ children, onClick, disabled, className = '', type = 'button', icon }) {
  return (
    <button
      type={type}
      className={`ca-btn ca-btn-secondary ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="ca-btn-icon" aria-hidden="true">{icon}</span>}
      {children}
    </button>
  )
}

export function StatusBadge({ status, label }) {
  const normalized = (status || '').toLowerCase().replace(/\s+/g, '-')
  let badgeClass = 'ca-badge-active'
  let display = label || status

  if (normalized.includes('admin')) badgeClass = 'ca-badge-admin'
  else if (normalized.includes('manager')) badgeClass = 'ca-badge-manager'
  else if (normalized.includes('member')) badgeClass = 'ca-badge-member'
  else if (normalized.includes('active')) badgeClass = 'ca-badge-active'
  else if (normalized.includes('pending') || normalized.includes('invited')) badgeClass = 'ca-badge-pending'
  else if (normalized.includes('reject')) badgeClass = 'ca-badge-rejected'
  else if (normalized.includes('content')) badgeClass = 'ca-badge-content'
  else if (normalized.includes('budget')) badgeClass = 'ca-badge-budget'
  else if (normalized.includes('edited')) badgeClass = 'ca-badge-manager'
  else if (normalized.includes('live')) badgeClass = 'ca-badge-live'

  return (
    <span className={`ca-badge ${badgeClass}`}>
      {display}
    </span>
  )
}

export function RoleBadge({ role }) {
  const r = (role || '').toLowerCase()
  let cls = 'ca-badge-member'
  if (r.includes('admin')) cls = 'ca-badge-admin'
  else if (r.includes('manager')) cls = 'ca-badge-manager'

  return <span className={`ca-badge ${cls}`}>{role}</span>
}

export function MetricCard({ label, value, subtext, icon, linkText, onLinkClick, badge }) {
  return (
    <div className="ca-kpi-card">
      <div className="ca-kpi-top">
        <span className="ca-kpi-label">{label}</span>
        {icon && <div className="ca-kpi-top-icon">{icon}</div>}
      </div>
      <div>
        <div className="ca-kpi-value-row">
          <span className="ca-kpi-value">{value}</span>
          {badge && <span className="ca-badge ca-badge-action-req">{badge}</span>}
        </div>
        {subtext && <div className="ca-kpi-subtext">{subtext}</div>}
      </div>
      {linkText && (
        <button type="button" className="ca-kpi-footer-link" onClick={onLinkClick}>
          {linkText}
        </button>
      )}
    </div>
  )
}

export function NoticeBanner({ type = 'danger', icon = '🔒', title, description, action }) {
  return (
    <div className={`ca-banner ca-banner-${type}`}>
      <div className="ca-banner-content">
        <div className="ca-banner-icon">{icon}</div>
        <div>
          {title && <strong style={{ color: '#ffffff', marginRight: 6 }}>{title}:</strong>}
          <span>{description}</span>
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function Pagination({ current = 1, total = 1, onPageChange, label }) {
  return (
    <div className="ca-table-footer">
      <span>{label || `Showing page ${current} of ${total}`}</span>
      <div className="ca-pagination-btns">
        <button
          type="button"
          className="ca-page-btn"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
        >
          Previous
        </button>
        {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
          <button
            type="button"
            key={p}
            className={`ca-page-btn ${p === current ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          className="ca-page-btn"
          disabled={current >= total}
          onClick={() => onPageChange(current + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
