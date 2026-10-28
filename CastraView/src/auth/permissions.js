export const ROLE_LABELS = {
  admin: 'Admin',
  manager: 'Manager',
  member: 'Member',
}

const WORKSPACE_ROLES = new Set(Object.keys(ROLE_LABELS))

export function resolveWorkspaceRole(user) {
  const candidates = [user?.role, user?.workspaceRole, user?.membership?.role]
  return candidates.find((role) => WORKSPACE_ROLES.has(role)) || 'member'
}

export function canAccessFR04ApprovalQueue(user) {
  return ['admin', 'manager'].includes(resolveWorkspaceRole(user))
}

export const CAPABILITIES = {
  admin: new Set([
    'overview', 'business:read', 'business:write', 'campaign:read',
    'campaign:import', 'strategy:read', 'strategy:generate', 'content:write',
    'budget:write', 'approval:write', 'reports:write', 'members:manage',
    'audit:read', 'notifications:read', 'competitor:read',
  ]),
  manager: new Set([
    'overview', 'business:read', 'campaign:read', 'campaign:import',
    'strategy:read', 'strategy:generate', 'content:write', 'budget:write',
    'reports:write', 'notifications:read', 'approval:write', 'competitor:read',
  ]),
  member: new Set([
    'overview', 'business:read', 'campaign:read', 'campaign:import',
    'strategy:read', 'content:write', 'budget:read', 'reports:read',
    'notifications:read', 'competitor:read',
  ]),
}

export function can(role, capability) {
  return CAPABILITIES[role]?.has(capability) || false
}

export function defaultPage(role) {
  if (role === 'admin') return 'admin-dashboard'
  if (role === 'manager') return 'manager-dashboard'
  return 'member-dashboard'
}
<<<<<<< HEAD
=======

/**
 * Resolves the verified role in the active workspace.
 *
 * @param {object|null} user - Current user object
 * @param {object|null} membership - Optional active workspace membership context
 * @returns {'admin'|'manager'|'member'|null}
 */
export function resolveWorkspaceRole(user, membership = null) {
  if (membership?.role && ['admin', 'manager', 'member'].includes(membership.role)) {
    return membership.role
  }
  if (user?.workspaceRole && ['admin', 'manager', 'member'].includes(user.workspaceRole)) {
    return user.workspaceRole
  }
  if (user?.role && ['admin', 'manager', 'member'].includes(user.role)) {
    return user.role
  }
  if (user?.role === 'company_admin') {
    return 'admin'
  }
  return null
}

/**
 * FR04 Access Check:
 * Proposal v1.3 specifies that only Workspace Admin and Workspace Manager
 * can access the approval queue and review, edit, approve, or reject proposals.
 * Workspace Members, unknown roles, and unauthenticated users are strictly denied.
 *
 * @param {object|null} user - Current user object
 * @param {object|null} membership - Optional active workspace membership context
 * @returns {boolean}
 */
export function canAccessFR04ApprovalQueue(user, membership = null) {
  if (!user) return false
  const role = resolveWorkspaceRole(user, membership)
  return role === 'admin' || role === 'manager'
}

/**
 * FR11 Access Check:
 * FR11 Workspace Audit Log is restricted to Workspace Administrator (Company Admin).
 * Workspace Managers, Members, unknown roles, and unauthenticated users are strictly denied.
 *
 * @param {object|null} user - Current user object
 * @param {object|null} membership - Optional active workspace membership context
 * @returns {boolean}
 */
export function canAccessFR11AuditLog(user, membership = null) {
  if (!user) return false
  const role = resolveWorkspaceRole(user, membership)
  return role === 'admin'
}

>>>>>>> 8f6a327dbc08ac7541da11a4dc9c65ea1f868658
