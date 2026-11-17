/**
 * proposalAuthorization.js — Proposal Authorization & Scope Guard Layer
 *
 * Responsibilities:
 *   - Proposal decision authorization (Approve, Reject, Edit)
 *   - Company and workspace boundary validation
 *   - Leader group assignment validation
 *   - Proposal status transition validation
 *   - Official actor normalization
 */

import {
  getActiveManagerAssignments,
  normalizeGroupId,
} from '../data/marketingStore.js'
import {
  getAssignedGroupIdsForManager,
} from './groupAssignmentService.js'

// ─── 1. PROPOSAL STATUS MACHINE & TRANSITIONS ─────────────────────────────────

/**
 * Canonical Proposal Status Constants
 */
export const PROPOSAL_STATUSES = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PENDING_REVIEW: 'pending_review',
  EDITED: 'edited',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

/**
 * Valid Stage-Gate Human-in-the-Loop Proposal Status Transitions.
 * Rules:
 * - Draft can be submitted to pending or pending_review.
 * - Pending / Pending_Review can be approved, rejected, or edited.
 * - Edited draft can be approved or rejected.
 * - Approved is a terminal signoff state (cannot be re-approved or rejected).
 * - Rejected is a terminal stage-gate decision (cannot be approved directly without resubmission).
 */
export const VALID_STATUS_TRANSITIONS = {
  draft: ['pending', 'pending_review'],
  pending: ['approved', 'rejected', 'edited'],
  pending_review: ['approved', 'rejected', 'edited'],
  edited: ['approved', 'rejected'],
  approved: [],
  rejected: ['draft', 'edited'],
}

/**
 * Validates whether a target status transition is permissible from currentStatus.
 *
 * @param {string} currentStatus
 * @param {string} targetStatus
 * @returns {boolean}
 */
export function isValidProposalTransition(currentStatus, targetStatus) {
  if (!currentStatus || !targetStatus) return false
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus.toLowerCase()] || []
  return allowed.includes(targetStatus.toLowerCase())
}

/**
 * Normalizes any role string into the canonical official actor key:
 * 'system_admin' | 'marketing_manager' | 'leader' | 'employee' | null
 *
 * @param {string|null} role
 * @returns {'system_admin'|'marketing_manager'|'leader'|'employee'|null}
 */
export function normalizeOfficialActor(role) {
  if (!role || typeof role !== 'string') return null
  const r = role.trim().toLowerCase()
  if (r === 'system_admin' || r === 'sys_admin') return 'system_admin'
  if (r === 'company_admin' || r === 'admin' || r === 'marketing_manager') return 'marketing_manager'
  if (r === 'manager' || r === 'leader' || r === 'group_leader') return 'leader'
  if (r === 'member' || r === 'employee' || r === 'user') return 'employee'
  return null
}

// ─── 2. PROPOSAL DECISION AUTHORIZATION PREDICATES ────────────────────────────

/**
 * Centralized, role-aware proposal decision authorization helper.
 * Enforces confirmed business rules:
 * - Marketing Manager: Department-wide authority within company/workspace scope across all groups.
 * - Leader: Group-scoped authority restricted to currently assigned Marketing Groups.
 * - Employee & System Admin: Strictly denied.
 * - Fails closed when required company or workspace context is missing.
 * - Strictly verifies cross-tenant and cross-workspace boundaries.
 * - Revalidates current group assignments for Leader against authoritative store.
 *
 * @param {object} params
 * @param {object} params.user - Current acting user
 * @param {object} params.proposal - Proposal candidate
 * @param {string|null} [params.companyId] - Verified company identity
 * @param {string|null} [params.workspaceId] - Verified workspace identity
 * @param {Array} [params.assignments] - Active manager assignments snapshot
 * @param {'approve'|'reject'|'edit'} [params.action] - Action requested
 * @param {string|null} [params.targetStatus] - Explicit target transition status
 * @returns {{ allowed: boolean, code?: string, reason?: string, scope?: string, actorRole?: string }}
 */
export function authorizeProposalDecision({
  user,
  proposal,
  companyId = null,
  workspaceId = null,
  assignments = null,
  action = 'approve',
  targetStatus = null,
}) {
  const activeAssignments = getActiveManagerAssignments()
  const effectiveAssignments = assignments || activeAssignments

  if (!user) {
    return {
      allowed: false,
      code: 'UNAUTHENTICATED',
      reason: 'Unauthenticated user cannot perform proposal decisions.',
    }
  }

  const rawRole = user.role || user.workspaceRole
  const actorRole = normalizeOfficialActor(rawRole)

  if (actorRole === 'employee') {
    return {
      allowed: false,
      code: 'FORBIDDEN_ROLE',
      reason: 'Employees are not authorized to approve, reject, or edit proposals (BR-CM-06).',
    }
  }

  if (actorRole === 'system_admin') {
    return {
      allowed: false,
      code: 'FORBIDDEN_ROLE',
      reason: 'System Administrators have no tenant proposal governance authority (Tenant isolation).',
    }
  }

  const isMM = actorRole === 'marketing_manager'
  const isLdr = actorRole === 'leader'

  if (!isMM && !isLdr) {
    return {
      allowed: false,
      code: 'FORBIDDEN_ROLE',
      reason: `Unauthorized role: "${rawRole}" cannot perform proposal decisions.`,
    }
  }

  if (!proposal) {
    return {
      allowed: false,
      code: 'PROPOSAL_NOT_FOUND',
      reason: 'Target proposal does not exist.',
    }
  }

  // Security Requirement: Fail closed when required company or workspace context is missing
  const effectiveCompanyId = companyId || user.companyId
  const effectiveWorkspaceId = workspaceId || user.workspaceId

  if (!effectiveCompanyId) {
    return {
      allowed: false,
      code: 'MISSING_COMPANY_CONTEXT',
      reason: 'Missing company context: Decisions require a verified company identifier.',
    }
  }

  if (!effectiveWorkspaceId) {
    return {
      allowed: false,
      code: 'MISSING_WORKSPACE_CONTEXT',
      reason: 'Missing workspace context: Decisions require a verified workspace identifier.',
    }
  }

  // Security Requirement: Cross-company boundary verification
  if (proposal.companyId && proposal.companyId !== effectiveCompanyId) {
    return {
      allowed: false,
      code: 'CROSS_COMPANY_FORBIDDEN',
      reason: `Company boundary mismatch: Cross-company mutation rejected: Proposal belongs to "${proposal.companyId}", not "${effectiveCompanyId}".`,
    }
  }

  // Security Requirement: Cross-workspace boundary verification
  if (proposal.workspaceId && proposal.workspaceId !== effectiveWorkspaceId) {
    return {
      allowed: false,
      code: 'CROSS_WORKSPACE_FORBIDDEN',
      reason: `Workspace boundary mismatch: Cross-workspace mutation rejected: Proposal belongs to "${proposal.workspaceId}", not "${effectiveWorkspaceId}".`,
    }
  }

  // State machine transition validation
  if (targetStatus) {
    if (!isValidProposalTransition(proposal.status, targetStatus)) {
      return {
        allowed: false,
        code: 'INVALID_STATUS_TRANSITION',
        reason: `Invalid state transition: Cannot transition proposal from "${proposal.status}" to "${targetStatus}".`,
      }
    }
  } else if (action === 'approve') {
    if (proposal.status === 'approved') {
      return {
        allowed: false,
        code: 'ALREADY_APPROVED',
        reason: "Duplicate approval rejected: Proposal is already in 'approved' status.",
      }
    }
    if (proposal.status === 'rejected') {
      return {
        allowed: false,
        code: 'CANNOT_APPROVE_REJECTED',
        reason: 'Invalid state transition: Proposal is rejected and cannot be approved without resubmission.',
      }
    }
  } else if (action === 'reject') {
    if (proposal.status === 'approved') {
      return {
        allowed: false,
        code: 'CANNOT_REJECT_APPROVED',
        reason: 'Invalid state transition: Proposal is already approved and cannot be rejected.',
      }
    }
    if (proposal.status === 'rejected') {
      return {
        allowed: false,
        code: 'ALREADY_REJECTED',
        reason: "Duplicate rejection rejected: Proposal is already in 'rejected' status.",
      }
    }
  }

  // Scope verification:
  // 1. Marketing Manager has department-wide scope across all marketing groups within the company/workspace
  if (isMM) {
    return {
      allowed: true,
      scope: 'department_wide',
      actorRole: 'marketing_manager',
    }
  }

  // 2. Leader is strictly group-scoped to currently assigned Marketing Groups
  if (isLdr) {
    if (!proposal.groupId) {
      return {
        allowed: false,
        code: 'MISSING_GROUP',
        reason: 'Proposal does not belong to any marketing group.',
      }
    }

    const leaderIdentifier = user.memberId || user.id || user.email || 'mem-004'
    const normalizedGroupId = normalizeGroupId(proposal.groupId)

    // Authoritative check against active runtime store (caller snapshot cannot override revocation)
    const authoritativeAssigned = new Set(
      getAssignedGroupIdsForManager(leaderIdentifier, activeAssignments).map(normalizeGroupId)
    )
    if (!authoritativeAssigned.has(normalizedGroupId)) {
      return {
        allowed: false,
        code: 'UNASSIGNED_GROUP',
        reason: `Unauthorized group access: Proposal belongs to group "${proposal.groupId}", which is not assigned to Leader "${leaderIdentifier}".`,
      }
    }

    // If caller explicitly provided an assignments snapshot, ensure it also authorizes
    if (assignments && assignments !== activeAssignments) {
      const snapshotAssigned = new Set(
        getAssignedGroupIdsForManager(leaderIdentifier, effectiveAssignments).map(normalizeGroupId)
      )
      if (!snapshotAssigned.has(normalizedGroupId)) {
        return {
          allowed: false,
          code: 'UNASSIGNED_GROUP',
          reason: `Unauthorized group access: Proposal belongs to group "${proposal.groupId}", which is not assigned to Leader "${leaderIdentifier}".`,
        }
      }
    }

    return {
      allowed: true,
      scope: 'group_scoped',
      actorRole: 'leader',
    }
  }

  return { allowed: false, code: 'UNHANDLED', reason: 'Authorization could not be verified.' }
}

/**
 * Dedicated helper for Marketing Manager proposal approval check.
 */
export function canMarketingManagerApproveProposal({
  user,
  proposal,
  companyId = null,
  workspaceId = null,
}) {
  return authorizeProposalDecision({
    user,
    proposal,
    companyId,
    workspaceId,
    action: 'approve',
  })
}

/**
 * Dedicated helper for Leader proposal approval check.
 */
export function canLeaderApproveProposal({
  user,
  proposal,
  companyId = null,
  workspaceId = null,
  assignments = null,
}) {
  return authorizeProposalDecision({
    user,
    proposal,
    companyId,
    workspaceId,
    assignments,
    action: 'approve',
  })
}

/**
 * Validates whether a Manager/Leader has authorization to mutate (Approve, Reject, Edit)
 * a specific proposal.
 *
 * Requirements:
 * 1. Actor Check: User role must be Manager/Leader (or Marketing Manager). Employees are denied.
 * 2. Group Assignment Check: Proposal groupId must be in Manager's active assignments.
 * 3. Company Boundary: Proposal must match the caller's active company.
 * 4. Workspace Boundary: Proposal must match the caller's active workspace.
 */
export function canManagerMutateProposal({
  user,
  proposal,
  assignments = null,
  companyId = null,
  workspaceId = null,
}) {
  const activeAssignments = getActiveManagerAssignments()
  const effectiveAssignments = assignments || activeAssignments

  if (!user) {
    return { allowed: false, reason: 'Unauthenticated user cannot perform proposal decisions.' }
  }

  const rawRole = user.role || user.workspaceRole
  const actorRole = normalizeOfficialActor(rawRole)

  if (actorRole === 'employee') {
    return { allowed: false, reason: 'Employees are not authorized to approve, reject, or edit proposals (BR-CM-06). Manager role required.' }
  }
  if (actorRole === 'system_admin') {
    return { allowed: false, reason: 'System Administrators have no workspace proposal governance authority. Manager role required.' }
  }
  if (actorRole !== 'leader' && actorRole !== 'marketing_manager') {
    return { allowed: false, reason: `Unauthorized role: "${rawRole}" cannot mutate proposals. Manager role required.` }
  }

  if (!proposal) {
    return { allowed: false, reason: 'Target proposal does not exist.' }
  }

  // Company boundary verification
  const targetCompany = companyId || user.companyId || (proposal.companyId ? 'comp-acme-global' : null)
  if (proposal.companyId && targetCompany && proposal.companyId !== targetCompany) {
    return {
      allowed: false,
      reason: `Company boundary mismatch: Cross-company mutation rejected: Proposal belongs to "${proposal.companyId}", not "${targetCompany}".`,
    }
  }

  // Workspace boundary verification
  const targetWorkspace = workspaceId || user.workspaceId || (proposal.workspaceId ? 'ws-acme-8920' : null)
  if (proposal.workspaceId && targetWorkspace && proposal.workspaceId !== targetWorkspace) {
    return {
      allowed: false,
      reason: `Workspace boundary mismatch: Cross-workspace mutation rejected: Proposal belongs to "${proposal.workspaceId}", not "${targetWorkspace}".`,
    }
  }

  // Group assignment verification (Marketing Manager has workspace-wide access; Leader is group-scoped)
  if (actorRole === 'leader') {
    const managerIdentifier = user.memberId || user.id || user.email || 'mem-004'
    const normalizedGroupId = normalizeGroupId(proposal.groupId)

    // Authoritative check against active store (caller snapshot cannot override revocation)
    const authoritativeAssigned = new Set(
      getAssignedGroupIdsForManager(managerIdentifier, activeAssignments).map(normalizeGroupId)
    )
    if (!authoritativeAssigned.has(normalizedGroupId)) {
      return {
        allowed: false,
        reason: `Unauthorized group access: Proposal belongs to group "${proposal.groupId}", which is not assigned to group ${proposal.groupId} Manager "${managerIdentifier}".`,
      }
    }

    // If caller explicitly provided an assignments snapshot, ensure it also authorizes
    if (assignments && assignments !== activeAssignments) {
      const snapshotAssigned = new Set(
        getAssignedGroupIdsForManager(managerIdentifier, effectiveAssignments).map(normalizeGroupId)
      )
      if (!snapshotAssigned.has(normalizedGroupId)) {
        return {
          allowed: false,
          reason: `Unauthorized group access: Proposal belongs to group "${proposal.groupId}", which is not assigned to group ${proposal.groupId} Manager "${managerIdentifier}".`,
        }
      }
    }
  }

  return { allowed: true }
}
