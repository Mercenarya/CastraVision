/**
 * navigation.js — CastraVision RBAC Navigation Configuration
 *
 * Three distinct actor roles, each with a completely separate navigation set.
 * No role ever sees another role's navigation items.
 *
 * Actor roles (platform-level):
 *   'system_admin'   — Platform admin.  Manages company accounts only.
 *   'company_admin'  — Company admin.   Manages employees, workgroups, workspace.
 *
 * Workspace roles (inside a company's workspace):
 *   'admin'          — Workspace Admin. Full workspace governance.
 *   'manager'        — Workspace Manager. Approvals, campaigns, reports.
 *   'member'         — Workspace Member. Strategy, content, data import.
 *
 * Navigation item shape: [pageKey, icon, label, requiredCapability | null]
 * A null capability means the item is always shown for that role.
 */

import { can } from './auth/permissions'

// ─── Icon constants (simple unicode glyphs) ─────────────────────────────────
const ICON = {
  dashboard: '▦',
  company: '🏢',
  employees: '👤',
  workgroups: '◉',
  workspace: '⚙',
  strategy: '◈',
  content: '✦',
  import: '⇥',
  profile: '☷',
  approvals: '✓',
  reports: '▤',
  performance: '↗',
  competitor: '◎',
  budget: '↗',
  notifications: '🔔',
}

// ─── System Admin navigation ─────────────────────────────────────────────────
// Sidebar caption: PLATFORM
const SYSTEM_ADMIN_NAV = [
  ['sa-dashboard', ICON.dashboard, 'Dashboard', null],
  ['sa-company-mgmt', ICON.company, 'Company Management', null],
]

// ─── Company Admin navigation ────────────────────────────────────────────────
// Sidebar caption: COMPANY
const COMPANY_ADMIN_NAV = [
  ['ca-overview', ICON.dashboard, 'Company Overview', null],
  ['ca-employees', ICON.employees, 'Employee Management', null],
  ['ca-workgroups', ICON.workgroups, 'Workgroup Management', null],
  ['ca-workspace', ICON.workspace, 'Workspace Management', null],
]

// ─── Employee (workspace member) navigation ──────────────────────────────────
// Items filtered by workspace-level RBAC capabilities.
// Sidebar caption: WORKSPACE
const EMPLOYEE_NAV_ALL = [
  ['emp-dashboard', ICON.dashboard, 'Dashboard', 'overview'],
  ['emp-strategy', ICON.strategy, 'Strategy Creation', 'strategy:read'],
  ['emp-content', ICON.content, 'Content Generation', 'content:write'],
  ['emp-import', ICON.import, 'Campaign Data Import', 'campaign:import'],
  ['emp-performance', ICON.performance, 'Performance Monitoring', 'campaign:read'],
  ['emp-budget', ICON.budget, 'Budget Optimization', 'budget:write'],
  ['emp-competitor', ICON.competitor, 'Competitor Analysis', 'competitor:read'],
  ['emp-reports', ICON.reports, 'Reports', 'reports:write'],
  ['emp-approvals', ICON.approvals, 'Approval Queue', 'approval:write'],
  ['emp-notifications', ICON.notifications, 'Notifications', 'notifications:read'],
  ['emp-profile', ICON.profile, 'My Profile', null],
]

// ─── Onboarding-only nav ─────────────────────────────────────────────────────
const ONBOARDING_NAV = [
  ['emp-onboarding', ICON.profile, 'Complete Your Profile', null],
]

/**
 * Returns the navigation array for the given actor role.
 *
 * @param {'system_admin'|'company_admin'|'admin'|'manager'|'member'} role
 * @param {boolean} needsOnboarding  true when employee hasn't completed profile
 * @returns {Array<[string, string, string]>}  [pageKey, icon, label]
 */
export function navigationFor(role, needsOnboarding = false) {
  switch (role) {
    case 'system_admin':
      return SYSTEM_ADMIN_NAV.map(([key, icon, label]) => [key, icon, label])

    case 'company_admin':
      return COMPANY_ADMIN_NAV.map(([key, icon, label]) => [key, icon, label])

    case 'admin':
    case 'manager':
    case 'member': {
      if (needsOnboarding) {
        return ONBOARDING_NAV.map(([key, icon, label]) => [key, icon, label])
      }
      return EMPLOYEE_NAV_ALL
        .filter(([, , , cap]) => cap === null || can(role, cap))
        .map(([key, icon, label]) => [key, icon, label])
    }

    default:
      return []
  }
}

/**
 * Returns the default landing page key for a given role.
 *
 * @param {'system_admin'|'company_admin'|'admin'|'manager'|'member'} role
 * @returns {string}
 */
export function defaultPage(role) {
  switch (role) {
    case 'system_admin': return 'sa-dashboard'
    case 'company_admin': return 'ca-overview'
    default: return 'emp-dashboard'
  }
}

/**
 * Returns the sidebar section caption for a given role.
 *
 * @param {'system_admin'|'company_admin'|'admin'|'manager'|'member'} role
 * @returns {string}
 */
export function navCaption(role) {
  switch (role) {
    case 'system_admin': return 'PLATFORM'
    case 'company_admin': return 'COMPANY'
    default: return 'WORKSPACE'
  }
}

/**
 * Human-readable role label for the sidebar / header badge.
 *
 * @param {'system_admin'|'company_admin'|'admin'|'manager'|'member'} role
 * @returns {string}
 */
export function roleLabel(role) {
  const labels = {
    system_admin: 'System Admin',
    company_admin: 'Company Admin',
    admin: 'Workspace Admin',
    manager: 'Manager',
    member: 'Member',
  }
  return labels[role] || 'User'
}
