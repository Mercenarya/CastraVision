import PropTypes from 'prop-types'
import RoleSidebar from '../dashboards/RoleSidebar'
import { LEADER_NAV_ITEMS } from '../navigation/roleNavConfig'

/**
 * LeaderSidebar
 * Dedicated sidebar for Leader role (Marcus Vance / Manager).
 * Expected navigation items:
 * - Dashboard Overview
 * - Assigned Campaigns
 * - Team Tasks
 * - Content Reviews (Badge: 4)
 * - Strategy & Insights
 * - Campaign Performance
 * - Notifications
 * - My Profile
 */
export default function LeaderSidebar({ activeKey = 'overview', onNavigate }) {
  // Map internal/subpage navigation keys to active sidebar item
  const resolveActiveKey = (key) => {
    if (key === 'approvals') return 'content-reviews'
    if (key === 'budget' || key === 'reports' || key === 'insights') return 'performance'
    return key
  }

  return (
    <RoleSidebar
      navItems={LEADER_NAV_ITEMS}
      activeKey={resolveActiveKey(activeKey)}
      onNavigate={onNavigate}
      sectionTitle="CORE NAVIGATION"
      quotaPct={78}
      quotaOps="78.4K / 100K ops"
      roleAriaLabel="Leader Sidebar Navigation"
    />
  )
}

LeaderSidebar.propTypes = {
  activeKey: PropTypes.string,
  onNavigate: PropTypes.func,
}
