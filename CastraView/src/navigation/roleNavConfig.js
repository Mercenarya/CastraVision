import {
  IconGrid,
  IconCheckSquare,
  IconSparkles,
  IconMegaphone,
  IconFolder,
  IconBookOpen,
  IconTrendingUp,
  IconUsers,
  IconMessageSquare,
  IconBell,
  IconUser,
} from '../dashboards/dashboardIcons'

/**
 * EMPLOYEE_NAV_ITEMS
 * Preserves the Employee-specific navigation structure matching Stitch standardized design.
 */
export const EMPLOYEE_NAV_ITEMS = [
  { key: 'overview', label: 'My Dashboard', icon: IconGrid },
  { key: 'tasks', label: 'My Tasks', icon: IconCheckSquare, badge: 5, badgeColor: 'cyan' },
  { key: 'content', label: 'Content Studio', icon: IconSparkles },
  { key: 'assigned-campaigns', label: 'Assigned Campaigns', icon: IconMegaphone },
  { key: 'submissions', label: 'My Submissions', icon: IconFolder },
  { key: 'strategy', label: 'Strategy Reference', icon: IconBookOpen },
  { key: 'notifications', label: 'Notifications', icon: IconBell, badge: 2, badgeColor: 'gray' },
  { key: 'profile', label: 'My Profile', icon: IconUser },
]

/**
 * LEADER_NAV_ITEMS
 * Preserves the Leader-specific navigation structure matching Stitch standardized design.
 */
export const LEADER_NAV_ITEMS = [
  { key: 'overview', label: 'Dashboard Overview', icon: IconGrid },
  { key: 'assigned-campaigns', label: 'Assigned Campaigns', icon: IconFolder },
  { key: 'team-tasks', label: 'Team Tasks', icon: IconUsers },
  { key: 'content-reviews', label: 'Content Reviews', icon: IconMessageSquare, badge: 4, badgeColor: 'cyan' },
  { key: 'strategy', label: 'Strategy & Insights', icon: IconSparkles },
  { key: 'performance', label: 'Campaign Performance', icon: IconTrendingUp },
  { key: 'notifications', label: 'Notifications', icon: IconBell },
  { key: 'profile', label: 'My Profile', icon: IconUser },
]
