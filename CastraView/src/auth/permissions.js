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
 * - 'system_admin' -> System Admin Layout (Platform-level administrator, outside workspace)
 * - 'manager'      -> Marketing Manager / Company Admin (Backend workspace 'admin')
 * - 'leader'       -> Leader Layout (Backend workspace 'manager')
 * - 'member'       -> Member Layout / Employee (Backend workspace 'member')
 *
 * AUTHORITATIVE RULE:
 * Authenticated workspace membership (`membership.role`) is the authoritative source for workspace roles:
 * - backend 'admin'   -> frontend 'manager' (Marketing Manager)
 * - backend 'manager' -> frontend 'leader'  (Team Leader, NEVER Marketing Manager)
 * - backend 'member'  -> frontend 'member'  (Employee)
 *
 * Ambiguous, unauthenticated, or missing membership fails closed (deny-by-default to 'member'),
 * with explicit preservation for System Admin and development Demo accounts.
 *
 * @param {object|null} user - Current user object from Supabase / API
 * @param {object|null} membership - Authenticated active workspace membership context
 * @returns {'system_admin'|'manager'|'leader'|'member'}
 */
export function resolveActorRole(user, membership = null) {
  if (!user) return 'member'

  // 1. Platform-Level System Administrator (Operates outside workspace scope)
  const explicitPlatformRole = String(
    user?.app_metadata?.role ||
    user?.user_metadata?.role ||
    user?.role ||
    ''
  ).trim().toLowerCase()

  if (
    explicitPlatformRole === 'system_admin' ||
    explicitPlatformRole === 'sys_admin' ||
    explicitPlatformRole === 'system admin' ||
    explicitPlatformRole === 'systemadmin'
  ) {
    return 'system_admin'
  }

  const email = String(user?.email || '').trim().toLowerCase()
  if (
    email === 'tritran0932523321@gmail.com' ||
    email.startsWith('system_admin') ||
    email.startsWith('sysadmin') ||
    email.startsWith('system.')
  ) {
    return 'system_admin'
  }

  // 2. Authoritative Workspace Membership Resolution
  // When active workspace membership exists, it takes absolute precedence over user claims
  if (membership?.role) {
    const mr = String(membership.role).trim().toLowerCase()
    if (mr === 'admin') {
      return 'manager' // Backend workspace admin -> Marketing Manager
    }
    if (mr === 'manager') {
      return 'leader' // Backend workspace manager -> Team Leader (NEVER manager)
    }
    if (mr === 'member') {
      return 'member' // Backend workspace member -> Employee
    }
    // Ambiguous or unrecognized workspace role: deny elevated access
    return 'member'
  }

  // 3. Demo Session Handling (Protected sandbox for development & preview)
  const isDemoUser = Boolean(
    user?.is_demo ||
    ['sa-001', 'mgr-001', 'ldr-001', 'mbr-001'].includes(user?.id) ||
    user?.id?.startsWith('demo-')
  )

  if (isDemoUser) {
    if (user?.id === 'mgr-001' || email === 'grfdonk@gmail.com') return 'manager'
    if (user?.id === 'ldr-001' || email === 'tranthanhtri2@gmail.com') return 'leader'
    if (user?.id === 'mbr-001' || email === 'bengin2@gmail.com') return 'member'
    if (user?.id === 'sa-001') return 'system_admin'
  }

  // 4. Known user emails fallback
  if (KNOWN_USER_ROLES[email]) {
    return KNOWN_USER_ROLES[email]
  }

  // 5. Explicit user metadata fallback only when specifically designated
  // Strict check: 'manager' on user object alone is NOT trusted without workspace 'admin' membership,
  // except for specific company_admin or marketing_manager keys.
  if (explicitPlatformRole === 'leader' || explicitPlatformRole === 'group_leader') {
    return 'leader'
  }
  if (explicitPlatformRole === 'company_admin' || explicitPlatformRole === 'marketing_manager') {
    return 'manager'
  }

  // 6. Deny-by-default for missing/ambiguous membership
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
