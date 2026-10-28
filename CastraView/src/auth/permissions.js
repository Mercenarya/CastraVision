export const ROLE_LABELS = {
  admin: 'Marketing Manager',
  manager: 'Leader',
  member: 'Employee',
}

const WORKSPACE_ROLES = new Set(Object.keys(ROLE_LABELS))

/**
 * Resolves the verified role in the active workspace.
 *
 * @param {object|null} user - Current user object
 * @param {object|null} membership - Optional active workspace membership context
 * @returns {'admin'|'manager'|'member'|null}
 */
export function resolveWorkspaceRole(user, membership = null) {
  const membershipRole = membership?.role
  if (WORKSPACE_ROLES.has(membershipRole)) {
    return membershipRole
  }

  const workspaceRole = user?.workspaceRole
  if (WORKSPACE_ROLES.has(workspaceRole)) {
    return workspaceRole
  }

  const userRole = user?.role
  if (WORKSPACE_ROLES.has(userRole)) {
    return userRole
  }

  if (userRole === 'company_admin') {
    return 'admin'
  }

  return null
}

/**
 * FR04 Access Check:
 * Only Workspace Admin and Workspace Manager can access the approval queue.
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
 * Only Workspace Administrators can access the workspace audit log.
 *
 * @param {object|null} user - Current user object
 * @param {object|null} membership - Optional active workspace membership context
 * @returns {boolean}
 */
export function canAccessFR11AuditLog(user, membership = null) {
  if (!user) return false

  return resolveWorkspaceRole(user, membership) === 'admin'
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