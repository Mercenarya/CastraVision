export const ROLE_LABELS = {
  system_admin: 'System Admin',
  manager: 'Marketing Manager',
  admin: 'Marketing Manager',
  leader: 'Leader',
  member: 'Employee',
}

const WORKSPACE_ROLES = new Set(['admin', 'manager', 'member'])

/**
 * Resolves the verified role in the active workspace.
 *
 * @param {object|null} user - Current user object
 * @param {object|null} membership - Optional active workspace membership context
 * @returns {'admin'|'manager'|'member'}
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

  return 'member'
}

export const KNOWN_USER_ROLES = {
  'tritran0932523321@gmail.com': 'system_admin',
  'grfdonk@gmail.com': 'manager',
  'tranthanhtri2@gmail.com': 'leader',
  'bengin2@gmail.com': 'member',
}

/**
 * Resolves the four canonical actor interface roles:
 * - 'system_admin' -> System Admin Layout
 * - 'manager'      -> Company Admin Layout (Marketing Manager)
 * - 'leader'       -> Leader Layout
 * - 'member'       -> Member Layout
 *
 * @param {object|null} user - Current user object from Supabase / API
 * @param {object|null} membership - Optional active workspace membership context
 * @returns {'system_admin'|'manager'|'leader'|'member'}
 */
export function resolveActorRole(user, membership = null) {
  if (!user) return 'member'

  const explicit =
    user?.app_metadata?.role ||
    user?.user_metadata?.role ||
    user?.role ||
    user?.workspaceRole ||
    membership?.role

  if (typeof explicit === 'string') {
    const r = explicit.trim().toLowerCase()
    if (r === 'system_admin' || r === 'sys_admin' || r === 'system admin' || r === 'systemadmin') {
      return 'system_admin'
    }
    if (r === 'manager' || r === 'company_admin' || r === 'admin' || r === 'marketing_manager') {
      return 'manager'
    }
    if (r === 'leader' || r === 'group_leader') {
      return 'leader'
    }
    if (r === 'member' || r === 'employee') {
      return 'member'
    }
  }

  if (membership?.role) {
    const mr = String(membership.role).trim().toLowerCase()
    if (mr === 'admin') return 'manager'
    if (mr === 'manager') return 'leader'
    if (mr === 'member') return 'member'
  }

  const email = (user?.email || '').trim().toLowerCase()
  if (KNOWN_USER_ROLES[email]) {
    return KNOWN_USER_ROLES[email]
  }
  if (email.startsWith('system') || email.includes('system_admin') || email.includes('sysadmin')) {
    return 'system_admin'
  }
  if (email.includes('company_admin') || email.includes('marketing_manager')) {
    return 'manager'
  }
  if (email.includes('leader')) {
    return 'leader'
  }
  if (email.includes('manager')) {
    return 'manager'
  }

  return 'member'
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
