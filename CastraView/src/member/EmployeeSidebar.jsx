import PropTypes from 'prop-types'
import RoleSidebar from '../dashboards/RoleSidebar'
import { EMPLOYEE_NAV_ITEMS } from '../navigation/roleNavConfig'

/**
 * EmployeeSidebar
 * Dedicated sidebar for Employee role (Alex Mercer / Member).
 * Expected navigation items:
 * - My Dashboard
 * - My Tasks (Badge: 5)
 * - Content Studio
 * - Assigned Campaigns
 * - My Submissions
 * - Strategy Reference
 * - Notifications (Badge: 2)
 * - My Profile
 */
export default function EmployeeSidebar({ activeKey = 'overview', onNavigate }) {
  // Map internal/subpage navigation keys to active sidebar item
  const resolveActiveKey = (key) => {
    if (key === 'emp-tasks') return 'tasks'
    if (key === 'reports') return 'submissions'
    return key
  }

  return (
    <RoleSidebar
      navItems={EMPLOYEE_NAV_ITEMS}
      activeKey={resolveActiveKey(activeKey)}
      onNavigate={onNavigate}
      sectionTitle="CORE NAVIGATION"
      quotaPct={78}
      quotaOps="78.4K / 100K ops"
      roleAriaLabel="Employee Sidebar Navigation"
    />
  )
}

EmployeeSidebar.propTypes = {
  activeKey: PropTypes.string,
  onNavigate: PropTypes.func,
}
