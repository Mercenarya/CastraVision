export const ROLE_LABELS = {
  system_admin: 'System Admin',
  manager: 'Marketing Manager',
  admin: 'Marketing Manager',
  leader: 'Leader',
  member: 'Employee',
}

const WORKSPACE_ROLES = new Set(['admin', 'manager', 'member'])

// Membership is supplied by the authenticated server context. User fields,
// editable metadata, email patterns and cached profile data confer no authority.
export function resolveWorkspaceRole(user, membership = null) {
  if (!user || !WORKSPACE_ROLES.has(membership?.role)) return null
  return membership.role
}

export function resolveActorRole(user, membership = null, authorization = null) {
  if (!user) return null
  if (authorization?.platformRole === 'system_admin') return 'system_admin'
  const role = resolveWorkspaceRole(user, membership)
  return { admin: 'manager', manager: 'leader', member: 'member' }[role] || null
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
