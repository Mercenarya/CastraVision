import {
  IconGrid,
  IconCheckSquare,
  IconSparkles,
  IconMegaphone,
  IconFolder,
  IconBookOpen,
  IconBell,
  IconUser,
  IconFileText,
  IconGlobe,
  IconUpload,
  IconBarChart,
  IconSettings,
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
 * Matches the Google Stitch Leader Workspace Master Layout Shell specification:
 * 1. Overview
 * 2. Approvals (badge: 3)
 * 3. My Proposals
 * 4. Campaigns
 * 5. Strategy Studio
 * 6. Content Gen
 * 7. Campaign Import
 * 8. Performance & Insights
 * 9. Account Settings
 */
export const LEADER_NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: IconGrid },
  { key: 'approvals', label: 'Approvals', icon: IconCheckSquare, badge: 3, badgeColor: 'accent' },
  { key: 'my-proposals', label: 'My Proposals', icon: IconFileText },
  { key: 'campaigns', label: 'Campaigns', icon: IconMegaphone },
  { key: 'strategy', label: 'Strategy Studio', icon: IconGlobe },
  { key: 'content', label: 'Content Gen', icon: IconSparkles },
  { key: 'import', label: 'Campaign Import', icon: IconUpload },
  { key: 'performance', label: 'Performance & Insights', icon: IconBarChart },
  { key: 'profile', label: 'Account Settings', icon: IconSettings },
]
