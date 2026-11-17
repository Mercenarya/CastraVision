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
export default function EmployeeSidebar({
  activeKey = 'overview',
  onNavigate,
  isDrawer = false,
  onClose,
  companyName = 'Acme Corp Enterprise',
  companyCode = 'acme-corp-prod-01',
}) {
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
      sectionTitle="WORKSPACE NAVIGATION"
      roleBadge="MEMBER"
      tenantName={companyName}
      tenantCode={companyCode}
      roleAriaLabel="Employee Workspace Navigation"
      isDrawer={isDrawer}
      onClose={onClose}
    />
  )
}

EmployeeSidebar.propTypes = {
  activeKey: PropTypes.string,
  onNavigate: PropTypes.func,
  isDrawer: PropTypes.bool,
  onClose: PropTypes.func,
  companyName: PropTypes.string,
  companyCode: PropTypes.string,
}
