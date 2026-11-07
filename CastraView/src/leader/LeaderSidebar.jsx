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
export default function LeaderSidebar({
  activeKey = 'overview',
  onNavigate,
  isDrawer = false,
  onClose,
  companyName = 'Acme Corp Enterprise',
  companyCode = 'acme-corp-prod-01',
}) {
  // Map internal/subpage navigation keys to active sidebar item
  const resolveActiveKey = (key) => {
    if (
      key === 'content-reviews' ||
      key === 'content-review-detail' ||
      key === 'budget-review-detail' ||
      key === 'budget'
    ) {
      return 'approvals'
    }
    if (key === 'assigned-campaigns') return 'campaigns'
    if (key === 'submissions') return 'my-proposals'
    if (key === 'reports' || key === 'insights' || key === 'team-tasks') {
      return 'performance'
    }
    return key
  }

  return (
    <RoleSidebar
      navItems={LEADER_NAV_ITEMS}
      activeKey={resolveActiveKey(activeKey)}
      onNavigate={onNavigate}
      sectionTitle="WORKSPACE NAVIGATION"
      roleBadge="LEADER"
      tenantName={companyName}
      tenantCode={companyCode}
      roleAriaLabel="Leader Workspace Navigation"
      isDrawer={isDrawer}
      onClose={onClose}
    />
  )
}

LeaderSidebar.propTypes = {
  activeKey: PropTypes.string,
  onNavigate: PropTypes.func,
  isDrawer: PropTypes.bool,
  onClose: PropTypes.func,
  companyName: PropTypes.string,
  companyCode: PropTypes.string,
}
