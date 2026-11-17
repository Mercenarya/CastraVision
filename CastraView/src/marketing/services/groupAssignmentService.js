/**
 * groupAssignmentService.js — Marketing Group Assignment & Scope Access Service
 *
 * CastraVision 4-Actor Hierarchy:
 *   - System Admin: Platform-level (No tenant workspace governance)
 *   - Marketing Manager: Department-wide authority across all marketing groups
 *   - Leader: Supervise assigned Marketing Groups only (BR-CM-04)
 *   - Employee: Contributor within assigned groups; no approval access (BR-CM-06)
 *
 * Responsibilities:
 *   - Marketing Group assignment workflows
 *   - Leader assignment and revocation rules
 *   - Group-scoped access helpers and query selectors
 *   - Official Leader alias exports
 */

import {
  INITIAL_MARKETING_GROUPS,
  INITIAL_MANAGER_ASSIGNMENTS,
  INITIAL_PROPOSALS,
  getActiveMarketingGroups,
  getActiveManagerAssignments,
  setStoreManagerAssignments,
} from '../data/marketingStore.js'

// ─── 1. GROUP AUTHORIZATION & FILTERING FUNCTIONS ─────────────────────────────

/**
 * Resolves all Marketing Group IDs assigned to a given Manager.
 *
 * @param {string} managerId - Member ID or User ID (e.g. 'mem-004' or user.id)
 * @param {Array} assignments - Active assignments array
 * @returns {Array<string>} Group IDs
 */
export function getAssignedGroupIdsForManager(managerId, assignments = INITIAL_MANAGER_ASSIGNMENTS) {
  if (!managerId) return []
  return assignments
    .filter(a => a.managerId === managerId || a.managerEmail === managerId)
    .map(a => a.groupId)
}

/**
 * Resolves full Marketing Group objects assigned to a given Manager.
 *
 * @param {string} managerId - Member ID or User ID
 * @param {Array} groups - Groups array
 * @param {Array} assignments - Assignments array
 * @returns {Array<object>} Assigned Marketing Groups
 */
export function getAssignedGroupsForManager(
  managerId,
  groups = INITIAL_MARKETING_GROUPS,
  assignments = INITIAL_MANAGER_ASSIGNMENTS
) {
  const assignedIds = new Set(getAssignedGroupIdsForManager(managerId, assignments))
  return groups.filter(g => assignedIds.has(g.id))
}

/**
 * Checks whether a Manager is authorized to access a specific Marketing Group.
 *
 * @param {string} managerId
 * @param {string} groupId
 * @param {Array} assignments
 * @returns {boolean}
 */
export function canManagerAccessGroup(
  managerId,
  groupId,
  assignments = INITIAL_MANAGER_ASSIGNMENTS
) {
  if (!managerId || !groupId) return false
  const assignedIds = getAssignedGroupIdsForManager(managerId, assignments)
  return assignedIds.includes(groupId)
}

/**
 * Checks whether a Manager is authorized to access a specific Proposal.
 * BR-CM-04: Manager may access only proposals belonging to authorized groups.
 *
 * @param {string} managerId
 * @param {object} proposal
 * @param {Array} assignments
 * @param {string} companyId
 * @param {string} workspaceId
 * @returns {boolean}
 */
export function canManagerAccessProposal(
  managerId,
  proposal,
  assignments = INITIAL_MANAGER_ASSIGNMENTS,
  companyId = 'comp-acme-global',
  workspaceId = 'ws-acme-8920'
) {
  if (!managerId || !proposal) return false
  if (!proposal.groupId) return false
  if (companyId && proposal.companyId && proposal.companyId !== companyId) return false
  if (workspaceId && proposal.workspaceId && proposal.workspaceId !== workspaceId) return false
  return canManagerAccessGroup(managerId, proposal.groupId, assignments)
}

/**
 * Filters a proposal list according to a Manager's authorized groups.
 * If selectedGroupId is provided, additionally filters to that single group
 * (provided the Manager is authorized for it).
 *
 * Requirements:
 * - Always enforces manager group assignment before any UI filtering.
 * - Rejects unauthorized group IDs immediately by returning empty list.
 * - Validates company and workspace boundary isolation.
 *
 * @param {string} managerId
 * @param {Array} proposals
 * @param {Array} assignments
 * @param {string|null} selectedGroupId - Optional single group filter
 * @param {string|null} companyId
 * @param {string|null} workspaceId
 * @returns {Array} Authorized proposals
 */
export function filterProposalsForManager(
  managerId,
  proposals = INITIAL_PROPOSALS,
  assignments = INITIAL_MANAGER_ASSIGNMENTS,
  selectedGroupId = null,
  companyId = 'comp-acme-global',
  workspaceId = 'ws-acme-8920'
) {
  const assignedGroupIds = new Set(getAssignedGroupIdsForManager(managerId, assignments))

  // If a specific group filter is requested and it is NOT assigned to the manager, reject immediately
  if (selectedGroupId && selectedGroupId !== 'all' && !assignedGroupIds.has(selectedGroupId)) {
    return []
  }

  return proposals.filter(p => {
    // Validate company and workspace boundaries
    if (companyId && p.companyId && p.companyId !== companyId) return false
    if (workspaceId && p.workspaceId && p.workspaceId !== workspaceId) return false

    // Must belong strictly to one of manager's assigned groups
    if (!assignedGroupIds.has(p.groupId)) return false

    // If an explicit group filter is selected, check match
    if (selectedGroupId && selectedGroupId !== 'all') {
      return p.groupId === selectedGroupId
    }

    return true
  })
}

/**
 * Global Actor Proposal Scoping Engine.
 * Enforces strict governance based on the 4 official actors:
 *   - System Admin: Empty (Platform operator has no workspace governance)
 *   - Company Admin: Full access to all proposals within the Company/Workspace
 *   - Manager: Scoped strictly to assigned Marketing Groups (BR-CM-04)
 *   - Employee: Denied approval queue access (BR-CM-06); view own proposals only
 *
 * @param {object} user - Current user object { role, id, email, ... }
 * @param {Array} proposals
 * @param {Array} assignments
 * @param {string|null} selectedGroupId
 * @returns {Array}
 */
export function filterProposalsForActor(
  user,
  proposals = INITIAL_PROPOSALS,
  assignments = INITIAL_MANAGER_ASSIGNMENTS,
  selectedGroupId = null
) {
  if (!user) return []

  const role = user.role || user.workspaceRole

  // 1. System Admin has no company proposal governance
  if (role === 'system_admin' || role === 'sys_admin') {
    return []
  }

  // 2. Marketing Manager (Company Admin) has full department/workspace-wide visibility
  if (role === 'company_admin' || role === 'admin' || role === 'marketing_manager') {
    if (selectedGroupId && selectedGroupId !== 'all') {
      return proposals.filter(p => p.groupId === selectedGroupId)
    }
    return proposals
  }

  // 3. Leader (Manager) is strictly scoped to assigned Marketing Groups
  if (role === 'manager' || role === 'leader') {
    const managerIdentifier = user.memberId || user.id || user.email
    return filterProposalsForManager(managerIdentifier, proposals, assignments, selectedGroupId)
  }

  // 4. Employee (role: 'member' | 'employee') is restricted: cannot access approval queue
  if (role === 'member' || role === 'employee') {
    // Only return proposals authored by this employee for their personal tracker
    return proposals.filter(
      p => p.authorId === user.id || p.author === user.name || p.authorId === user.memberId
    )
  }

  return []
}

// ─── 2. IMMUTABLE ASSIGNMENT STATE HELPERS (FOR MARKETING MANAGER ACTIONS) ───

/**
 * Assigns a Manager to a Marketing Group (Marketing Manager action).
 * Ensures idempotency: will not create duplicate assignments.
 */
export function assignManagerToGroup(
  managerId,
  managerEmail,
  groupId,
  assignedBy,
  currentAssignments = INITIAL_MANAGER_ASSIGNMENTS
) {
  const exists = currentAssignments.some(
    a => a.managerId === managerId && a.groupId === groupId
  )
  if (exists) return currentAssignments

  const newAssignment = {
    id: `mga-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    managerId,
    managerEmail: managerEmail || '',
    groupId,
    assignedAt: new Date().toISOString(),
    assignedBy: assignedBy || 'admin',
  }
  return [...currentAssignments, newAssignment]
}

/**
 * Removes an assignment connecting a Manager to a Marketing Group (Marketing Manager action).
 */
export function unassignManagerFromGroup(
  managerId,
  groupId,
  currentAssignments = INITIAL_MANAGER_ASSIGNMENTS
) {
  return currentAssignments.filter(
    a => !(a.managerId === managerId && a.groupId === groupId)
  )
}

/**
 * Sets the complete list of assigned groups for a Manager (bulk assignment update).
 */
export function setManagerGroupAssignments(
  managerId,
  managerEmail,
  groupIds = [],
  assignedBy = 'admin',
  currentAssignments = INITIAL_MANAGER_ASSIGNMENTS
) {
  // Remove existing assignments for this manager
  const withoutManager = currentAssignments.filter(a => a.managerId !== managerId)

  // Create new assignments
  const newAssignments = groupIds.map(gId => ({
    id: `mga-${Date.now()}-${gId}`,
    managerId,
    managerEmail: managerEmail || '',
    groupId: gId,
    assignedAt: new Date().toISOString(),
    assignedBy,
  }))

  return [...withoutManager, ...newAssignments]
}

// ─── 3. STORE ASSIGNMENT MUTATION WORKFLOW ────────────────────────────────────

/**
 * Updates Manager assignments with strict validation (BR-CM-03, BR-CM-04, BR-CM-07).
 *
 * Validation checks:
 * 1. Actor check: Only Company Admin (or admin / Marketing Manager) can assign groups.
 *    Employees and Managers/Leaders cannot perform assignments.
 * 2. Cross-company check: Groups must belong to the active company.
 * 3. Cross-workspace check: Groups must belong to the active workspace.
 * 4. Zero groups: Supported (clears assignments, enters unassigned state).
 */
export function updateManagerAssignments({
  managerId,
  managerEmail = '',
  groupIds = [],
  companyId = 'comp-acme-global',
  workspaceId = 'ws-acme-8920',
  performedBy = null,
}) {
  if (!managerId) {
    throw new Error('Manager ID is required for assignment.')
  }

  // 1. Authorization checks (BR-CM-03, BR-CM-07)
  if (performedBy) {
    const role = performedBy.role || performedBy.workspaceRole
    if (role === 'member' || role === 'employee') {
      throw new Error('Employees are not authorized to assign Managers to Marketing Groups.')
    }
    if (role === 'manager' || role === 'leader') {
      throw new Error('Managers are not authorized to configure group supervision assignments.')
    }
  }

  // 2. Cross-company and cross-workspace validation
  const activeGroups = getActiveMarketingGroups()
  for (const gId of groupIds) {
    const group = activeGroups.find(g => g.id === gId)
    if (!group) {
      throw new Error(`Invalid group ID: "${gId}" does not exist.`)
    }
    if (companyId && group.companyId !== companyId) {
      throw new Error(
        `Cross-company assignment rejected: Group "${group.name}" belongs to company "${group.companyId}", not "${companyId}".`
      )
    }
    if (workspaceId && group.workspaceId !== workspaceId) {
      throw new Error(
        `Cross-workspace assignment rejected: Group "${group.name}" belongs to workspace "${group.workspaceId}", not "${workspaceId}".`
      )
    }
  }

  // 3. Immutably update assignments in the authoritative store
  const activeAssignments = getActiveManagerAssignments()
  const withoutManager = activeAssignments.filter(a => a.managerId !== managerId)
  const newAssignments = groupIds.map(gId => ({
    id: `mga-${Date.now()}-${gId}`,
    managerId,
    managerEmail,
    groupId: gId,
    companyId: companyId || 'comp-acme-global',
    workspaceId: workspaceId || 'ws-acme-8920',
    assignedAt: new Date().toISOString(),
    assignedBy: performedBy?.id || performedBy?.email || 'admin',
  }))

  const updatedAssignments = [...withoutManager, ...newAssignments]
  setStoreManagerAssignments(updatedAssignments)

  return updatedAssignments
}

// ─── 4. OFFICIAL LEADER ALIAS EXPORTS (MIGRATION 1) ──────────────────────────
export const getAssignedGroupIdsForLeader = getAssignedGroupIdsForManager
export const getAssignedGroupsForLeader = getAssignedGroupsForManager
export const canLeaderAccessGroup = canManagerAccessGroup
export const canLeaderAccessProposal = canManagerAccessProposal
export const filterProposalsForLeader = filterProposalsForManager
export const updateLeaderAssignments = updateManagerAssignments
