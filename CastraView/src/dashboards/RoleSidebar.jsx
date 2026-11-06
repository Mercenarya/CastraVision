import PropTypes from 'prop-types'
import { BrandLogoSvg } from './dashboardIcons'

/**
 * RoleSidebar — Standardized Sidebar Component for CastraVision Dashboards
 * Strictly adheres to Stitch visual target:
 * - 260px width, sticky 100vh layout
 * - Dark background (#0b1120) with slate border (#1e293b)
 * - Brand header with SME AI ENGINE tag
 * - Dynamic active item highlight, hover states, and role badge styling
 * - Bottom Copilot Quota card
 */
export default function RoleSidebar({
  navItems = [],
  activeKey = 'overview',
  onNavigate,
  sectionTitle = 'CORE NAVIGATION',
  quotaPct = 78,
  quotaOps = '78.4K / 100K ops',
  roleAriaLabel = 'Sidebar Navigation',
}) {
  return (
    <aside className="std-sidebar" aria-label={roleAriaLabel}>
      {/* Brand Header */}
      <div className="std-sidebar-brand">
        <div className="std-brand-logo">
          <BrandLogoSvg />
        </div>
        <div className="std-brand-text">
          <span className="std-brand-title">CastraVision</span>
          <span className="std-brand-subtitle">SME AI ENGINE</span>
        </div>
      </div>

      {/* Section Title */}
      <div className="std-nav-section-title">{sectionTitle}</div>

      {/* Navigation Items */}
      <nav className="std-nav-list" aria-label={sectionTitle}>
        {navItems.map((item) => {
          const isActive = activeKey === item.key
          const Icon = item.icon
          return (
            <button
              key={item.key}
              type="button"
              className={`std-nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate?.(item.key)}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="std-nav-icon" aria-hidden="true">
                <Icon className="w-4 h-4" />
              </span>
              <span className="std-nav-label">{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={`std-nav-badge ${
                    item.badgeColor === 'gray' ? 'badge-gray' : 'badge-cyan'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom AI Copilot Quota Card */}
      <div className="std-sidebar-bottom">
        <div className="std-quota-card">
          <div className="std-quota-header">
            <span className="std-quota-title">AI Copilot Quota</span>
            <span className="std-quota-pct">{quotaPct}%</span>
          </div>
          <div
            className="std-quota-track"
            role="progressbar"
            aria-valuenow={quotaPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="std-quota-fill" style={{ width: `${quotaPct}%` }} />
          </div>
          <div className="std-quota-footer">
            <span className="std-quota-ops">{quotaOps}</span>
            <span className="std-quota-icon" aria-hidden="true">
              ⚡
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}

RoleSidebar.propTypes = {
  navItems: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
      badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      badgeColor: PropTypes.oneOf(['cyan', 'gray']),
    })
  ).isRequired,
  activeKey: PropTypes.string,
  onNavigate: PropTypes.func,
  sectionTitle: PropTypes.string,
  quotaPct: PropTypes.number,
  quotaOps: PropTypes.string,
  roleAriaLabel: PropTypes.string,
}
